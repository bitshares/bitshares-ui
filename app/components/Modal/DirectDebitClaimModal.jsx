import React from "react";
import Translate from "react-translate-component";
import {ChainStore, FetchChain} from "tuscjs";
import AmountSelector from "../Utility/AmountSelector";
import AccountStore from "stores/AccountStore";
import AccountSelector from "../Account/AccountSelector";
import {Asset} from "common/MarketClasses";
import {debounce, isNaN} from "lodash-es";
import {
    checkFeeStatusAsync,
    shouldPayFeeWithAssetAsync
} from "common/trxHelper";
import LimitToWithdraw from "../Utility/LimitToWithdraw";
import utils from "common/utils";
import counterpart from "counterpart";
import {connect} from "alt-react";
import {Modal, Button, Tooltip, Icon} from "bitshares-ui-style-guide";
import moment from "moment";
import ApplicationApi from "../../api/ApplicationApi";

class DirectDebitClaimModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
        this._updateFee = debounce(this._updateFee.bind(this), 250);
        this._checkFeeStatus = this._checkFeeStatus.bind(this);
        this._checkBalance = this._checkBalance.bind(this);
    }

    getInitialState() {
        return {
            to_name: "",
            from_account: null,
            to_account: null,
            amount: "",
            asset_id: null,
            asset: null,
            memo: "",
            error: null,
            feeAsset: null,
            fee_asset_id: "1.3.0",
            feeAmount: new Asset({amount: 0}),
            feeStatus: {},
            maxAmount: false,
            permissionId: "",
            balanceError: false,
            limitError: false,
            firstPeriodError: false,
            payerBalanceWarning: false,
            withdrawal_limit: null,
            current_period_expires: "",
            claimedAmount: "",
            errorMessage: null
        };
    }

    onSubmit = e => {
        e.preventDefault();
        const {
            from_account,
            to_account,
            feeAsset,
            permissionId,
            amount,
            asset,
            asset_id,
            memo
        } = this.state;
        ApplicationApi.claimWithdrawPermission(
            permissionId,
            from_account,
            to_account,
            asset_id,
            utils.convert_typed_to_satoshi(amount, asset),
            memo ? new Buffer(memo, "utf-8") : memo,
            feeAsset ? feeAsset.get("id") : "1.3.0"
        )
            .then(result => {
                this.props.hideModal();
            })
            .catch(err => {
                this.setState({errorMessage: err});
            });
    };

    componentDidUpdate(prevProps, prevState) {
        const {operation, isModalVisible} = this.props;

        if (
            isModalVisible &&
            operation &&
            prevState.permissionId !== operation.payload.id
        ) {
            const timeStart = new Date(
                operation.payload.period_start_time + "Z"
            ).getTime();

            const timePassed = new Date().getTime() - timeStart;

            let currentPeriodNum;
            let currentPeriodExpires = "";

            const periodMs = operation.payload.withdrawal_period_sec * 1000;
            if (timePassed < 0) {
                console.log("first period is not started");
            } else {
                currentPeriodNum = Math.ceil(timePassed / periodMs);
                currentPeriodExpires = timeStart + periodMs * currentPeriodNum;
            }

            const to = ChainStore.getAccount(
                operation.payload.authorized_account,
                false
            );
            const from = ChainStore.getAccount(
                operation.payload.withdraw_from_account,
                false
            );

            this.setState(
                {
                    to_account: to,
                    from_account: from,
                    permissionId: operation.payload.id,
                    withdrawal_limit: operation.payload.withdrawal_limit,
                    claimedAmount: operation.payload.claimed_this_period,
                    current_period_expires_date: currentPeriodExpires,
                    asset: ChainStore.getAsset(
                        operation.payload.withdrawal_limit.asset_id
                    )
                },
                this._checkFeeStatus
            );
        }
    }

    _checkBalance() {
        const {feeAmount, from_account, asset} = this.state;
        if (!asset || !from_account) return;
        this._updateFee();
        const balanceID = from_account.getIn(["balances", asset.get("id")]);
        const feeBalanceID = from_account.getIn([
            "balances",
            feeAmount.asset_id
        ]);
        if (!asset || !from_account) return;
        if (!balanceID) return this.setState({balanceError: true});
        let balanceObject = ChainStore.getObject(balanceID);
        let feeBalanceObject = feeBalanceID
            ? ChainStore.getObject(feeBalanceID)
            : null;
        if (!feeBalanceObject || feeBalanceObject.get("balance") === 0) {
            this.setState({fee_asset_id: "1.3.0"}, this._updateFee);
        }
        if (!balanceObject || !feeAmount) return;

        const balanceAmount = new Asset({
            real: balanceObject.get("balance"),
            asset_id: asset.get("id"),
            precision: asset.get("precision")
        });
        balanceAmount.minus(feeAmount);
        const hasBalance = balanceAmount.getAmount({real: true}) > 0;
        if (hasBalance === null) return;
        this.setState({balanceError: !hasBalance});
    }

    _checkFeeStatus(state = this.state) {
        const {from_account} = state;
        const {isModalVisible} = this.props;
        if (!from_account || !isModalVisible) return;

        const assets = Object.keys(from_account.get("balances").toJS()).sort(
            utils.sortID
        );
        let feeStatus = {};
        let p = [];
        assets.forEach(a => {
            p.push(
                checkFeeStatusAsync({
                    accountID: from_account.get("id"),
                    feeID: a,
                    type: "withdraw_permission_claim",
                    options: ["price_per_kbyte"],
                    data: {
                        type: "memo",
                        content: state.memo
                    }
                })
            );
        });
        Promise.all(p)
            .then(status => {
                assets.forEach((a, idx) => {
                    feeStatus[a] = status[idx];
                });
                if (!utils.are_equal_shallow(this.state.feeStatus, feeStatus)) {
                    this.setState({
                        feeStatus
                    });
                }
                this._checkBalance();
            })
            .catch(err => {
                console.error(err);
            });
    }

    setTotalLimit = limit => () => {
        const {asset, claimedAmount} = this.state;
        let amount = utils.get_asset_amount(limit - claimedAmount, asset);
        this.setState({maxAmount: true, amount}, this.checkLimit);
    };

    checkLimit() {
        const {
            withdrawal_limit,
            amount,
            limitError,
            asset,
            claimedAmount
        } = this.state;
        const limit = utils.get_asset_amount(
            withdrawal_limit.amount - claimedAmount,
            asset
        );

        if (amount > limit && !limitError) {
            this.setState({limitError: true});
        } else if (amount <= limit && limitError) {
            this.setState({limitError: false});
        }
    }

    _getAvailableAssets(state = this.state) {
        const {feeStatus} = this.state;
        function hasFeePoolBalance(id) {
            if (feeStatus[id] === undefined) return true;
            return feeStatus[id] && feeStatus[id].hasPoolBalance;
        }

        function hasBalance(id) {
            if (feeStatus[id] === undefined) return true;
            return feeStatus[id] && feeStatus[id].hasBalance;
        }
        const {from_account} = state;
        let asset_types = [],
            fee_asset_types = [];
        if (!(from_account && from_account.get("balances"))) {
            return {asset_types, fee_asset_types};
        }
        let account_balances = state.from_account.get("balances").toJS();
        asset_types = Object.keys(account_balances).sort(utils.sortID);
        fee_asset_types = Object.keys(account_balances).sort(utils.sortID);
        for (let key in account_balances) {
            let balanceObject = ChainStore.getObject(account_balances[key]);
            if (balanceObject && balanceObject.get("balance") === 0) {
                asset_types.splice(asset_types.indexOf(key), 1);
                if (fee_asset_types.indexOf(key) !== -1) {
                    fee_asset_types.splice(fee_asset_types.indexOf(key), 1);
                }
            }
        }

        fee_asset_types = fee_asset_types.filter(a => {
            return hasFeePoolBalance(a) && hasBalance(a);
        });

        return {asset_types, fee_asset_types};
    }

    _updateFee(state = this.state) {
        if (!this.props.isModalVisible) return;
        let {fee_asset_id, from_account, asset_id} = state;
        const {fee_asset_types} = this._getAvailableAssets(state);
        if (
            fee_asset_types.length === 1 &&
            fee_asset_types[0] !== fee_asset_id
        ) {
            fee_asset_id = fee_asset_types[0];
        }
        if (!from_account) return null;
        checkFeeStatusAsync({
            accountID: from_account.get("id"),
            feeID: fee_asset_id,
            type: "withdraw_permission_claim",
            options: ["price_per_kbyte"],
            data: {
                type: "memo",
                content: state.memo
            }
        }).then(({fee, hasBalance, hasPoolBalance}) => {
            shouldPayFeeWithAssetAsync(from_account, fee).then(should =>
                should
                    ? this.setState({fee_asset_id: asset_id}, this._updateFee)
                    : this.setState({
                          feeAmount: fee,
                          fee_asset_id: fee.asset_id,
                          hasBalance,
                          hasPoolBalance,
                          error: !hasBalance || !hasPoolBalance
                      })
            );
        });
    }

    onAmountChanged = ({amount, asset}) => {
        if (!asset) {
            return;
        }

        this.setState(
            {
                amount,
                asset,
                asset_id: asset.get("id"),
                error: null,
                maxAmount: false
            },
            this.checkLimit
        );
    };

    onFeeChanged({asset}) {
        this.setState(
            {feeAsset: asset, fee_asset_id: asset.get("id"), error: null},
            this._updateFee
        );
    }

    onMemoChanged(e) {
        this.setState({memo: e.target.value}, this._checkBalance);
    }

    isPayerBalanceWarning() {
        const {
            withdrawal_limit,
            asset,
            to_account,
            payerBalanceWarning,
            claimedAmount
        } = this.state;
        const limitAmount = utils.get_asset_amount(
            withdrawal_limit.amount,
            asset
        );

        const balanceID = to_account.getIn([
            "balances",
            withdrawal_limit.asset_id
        ]);
        if (!balanceID) {
            if (!payerBalanceWarning) {
                this.setState({payerBalanceWarning: true});
            }
            return;
        }
        const payerBalance = ChainStore.getObject(balanceID).get("balance");

        if (
            payerBalance < limitAmount - claimedAmount &&
            !payerBalanceWarning
        ) {
            this.setState({payerBalanceWarning: true});
        } else if (
            payerBalance >= limitAmount - claimedAmount &&
            payerBalanceWarning
        ) {
            this.setState({payerBalanceWarning: false});
        }
    }

    render() {
        let {
            from_account,
            to_account,
            asset,
            asset_id,
            feeAmount,
            amount,
            error,
            memo,
            feeAsset,
            fee_asset_id,
            balanceError,
            limitError,
            payerBalanceWarning,
            withdrawal_limit,
            current_period_expires_date,
            claimedAmount
        } = this.state;

        let {asset_types, fee_asset_types} = this._getAvailableAssets();

        let balance = null;
        let balance_fee = null;

        // Estimate fee
        let fee = this.state.feeAmount.getAmount({real: true});

        // balance
        if (from_account && from_account.get("balances")) {
            let _error = this.state.balanceError ? "has-error" : "";
            if (asset_types.length === 1)
                asset = ChainStore.getAsset(asset_types[0]);
            if (asset_types.length > 0) {
                let current_asset_id = asset ? asset.get("id") : asset_types[0];
                let feeID = feeAsset ? feeAsset.get("id") : "1.3.0";
                // const assetToWithdraw =
                //     withdrawal_limit &&
                //     ChainStore.getAsset(withdrawal_limit.asset_id);
                // const assetToWithdrawPrecision = assetToWithdraw.get(
                //     "precision"
                // );
                // const limitAmount =
                //     withdrawal_limit &&
                //     Math.pow(10, assetToWithdrawPrecision) *
                //         withdrawal_limit.amount;
                this.isPayerBalanceWarning();

                balance = (
                    <span>
                        <Translate
                            component="span"
                            content="showcases.direct_debit.limit"
                        />
                        :{" "}
                        <span
                            className={limitError ? "has-error" : ""}
                            style={{
                                borderBottom: "#A09F9F 1px dotted",
                                cursor: "pointer"
                            }}
                            onClick={this.setTotalLimit(
                                withdrawal_limit.amount
                            )}
                        >
                            <LimitToWithdraw
                                amount={withdrawal_limit.amount - claimedAmount}
                                assetId={
                                    withdrawal_limit &&
                                    withdrawal_limit.asset_id
                                }
                            />
                        </span>
                        &nbsp;
                        {payerBalanceWarning && (
                            <Tooltip
                                placement="top"
                                title="Limit > payer balance!"
                            >
                                <Icon
                                    type="exclamation-circle"
                                    theme="filled"
                                    style={{color: "#fe8c00"}}
                                />
                            </Tooltip>
                        )}
                    </span>
                );

                if (feeID == current_asset_id && this.state.balanceError) {
                    balance_fee = (
                        <span>
                            <span className={_error}>
                                <Translate content="transfer.errors.insufficient" />
                            </span>
                        </span>
                    );
                }
            } else {
                balance = (
                    <span>
                        <span className={_error}>
                            <Translate content="transfer.errors.noFunds" />
                        </span>
                    </span>
                );
                balance_fee = (
                    <span>
                        <span className={_error}>
                            <Translate content="transfer.errors.noFunds" />
                        </span>
                    </span>
                );
            }
        }

        const amountValue = parseFloat(
            String.prototype.replace.call(amount, /,/g, "")
        );
        const isAmountValid = amountValue && !isNaN(amountValue);
        const isSubmitNotValid =
            !from_account ||
            !to_account ||
            !isAmountValid ||
            !asset ||
            balanceError ||
            limitError ||
            payerBalanceWarning ||
            !current_period_expires_date ||
            from_account.get("id") == to_account.get("id");
        return (
            <Modal
                title={counterpart.translate(
                    "showcases.direct_debit.claim_funds"
                )}
                visible={this.props.isModalVisible}
                overlay={true}
                onCancel={this.props.hideModal}
                footer={[
                    this.state.errorMessage && (
                        <span className={"red"} style={{marginRight: "10px"}}>
                            {this.state.errorMessage}
                        </span>
                    ),
                    <Button
                        key={"send"}
                        disabled={isSubmitNotValid}
                        onClick={
                            !isSubmitNotValid ? this.onSubmit.bind(this) : null
                        }
                    >
                        {counterpart.translate("showcases.direct_debit.claim")}
                    </Button>,
                    <Button key="Cancel" onClick={this.props.hideModal}>
                        <Translate component="span" content="transfer.cancel" />
                    </Button>
                ]}
            >
                <div className="grid-block vertical no-overflow">
                    <form noValidate>
                        <div>
                            {/* AUTHORIZED ACCOUNT */}
                            <div className="content-block">
                                <AccountSelector
                                    label="showcases.direct_debit.authorizing_account"
                                    accountName={
                                        !!from_account
                                            ? from_account.get("name")
                                            : ""
                                    }
                                    account={from_account}
                                    size={60}
                                    hideImage
                                    disabled
                                />
                            </div>
                        </div>
                        <div className="content-block transfer-input">
                            {/*  CURRENT PERIOD EXPIRES  */}
                            <label className="left-label">
                                {counterpart.translate(
                                    "showcases.direct_debit.current_period_expires"
                                )}
                            </label>
                            <input
                                type="text"
                                value={
                                    current_period_expires_date
                                        ? counterpart.localize(
                                              new Date(
                                                  current_period_expires_date
                                              ),
                                              {
                                                  type: "date",
                                                  format: "full"
                                              }
                                          )
                                        : counterpart.translate(
                                              "showcases.direct_debit.first_period_not_started"
                                          )
                                }
                                disabled
                                className={
                                    current_period_expires_date
                                        ? ""
                                        : "error-area"
                                }
                            />
                        </div>
                        <div className="content-block transfer-input">
                            {/*  AMOUNT TO WITHDRAW */}
                            <AmountSelector
                                label="showcases.direct_debit.amount_to_withdraw"
                                amount={amount}
                                onChange={this.onAmountChanged}
                                asset={
                                    withdrawal_limit &&
                                    withdrawal_limit.asset_id
                                }
                                assets={
                                    withdrawal_limit && [
                                        withdrawal_limit.asset_id
                                    ]
                                }
                                display_balance={balance}
                                allowNaN={true}
                            />
                        </div>

                        {/*  M E M O  */}
                        <div className="content-block transfer-input">
                            {memo && memo.length ? (
                                <label className="right-label">
                                    {memo.length}
                                </label>
                            ) : null}
                            <Tooltip
                                placement="top"
                                title={counterpart.translate(
                                    "tooltip.memo_tip"
                                )}
                            >
                                <Translate
                                    className="left-label tooltip"
                                    component="label"
                                    content="transfer.memo"
                                />
                            </Tooltip>
                            <textarea
                                style={{marginBottom: 0}}
                                rows="3"
                                value={memo}
                                onChange={this.onMemoChanged.bind(this)}
                            />
                        </div>

                        <div className="content-block transfer-input">
                            <div className="no-margin no-padding">
                                {/*  F E E  */}
                                <div id="txFeeSelector" className="small-12">
                                    <AmountSelector
                                        label="transfer.fee"
                                        disabled={true}
                                        amount={fee}
                                        onChange={this.onFeeChanged.bind(this)}
                                        asset={
                                            fee_asset_types.length && feeAmount
                                                ? feeAmount.asset_id
                                                : fee_asset_types.length === 1
                                                ? fee_asset_types[0]
                                                : fee_asset_id
                                                ? fee_asset_id
                                                : fee_asset_types[0]
                                        }
                                        assets={fee_asset_types}
                                        display_balance={balance_fee}
                                        // tabIndex={tabIndex++}
                                        error={
                                            this.state.hasPoolBalance === false
                                                ? "transfer.errors.insufficient"
                                                : null
                                        }
                                        scroll_length={1}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </Modal>
        );
    }
}

export default connect(
    DirectDebitClaimModal,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps() {
            return {
                currentAccount: AccountStore.getState().currentAccount,
                passwordAccount: AccountStore.getState().passwordAccount
            };
        }
    }
);
