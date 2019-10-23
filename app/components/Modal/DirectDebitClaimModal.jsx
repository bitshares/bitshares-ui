import React from "react";
import Translate from "react-translate-component";
import {ChainStore, FetchChain} from "bitsharesjs";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";
import debounceRender from "react-debounce-render";
import AccountStore from "stores/AccountStore";
import AccountSelector from "../Account/AccountSelector";
import {isNaN} from "lodash-es";
import LimitToWithdraw from "../Utility/LimitToWithdraw";
import utils from "common/utils";
import counterpart from "counterpart";
import {
    Modal,
    Button,
    Tooltip,
    Icon,
    Form,
    Input
} from "bitshares-ui-style-guide";
import ApplicationApi from "../../api/ApplicationApi";
import FeeAssetSelector from "components/Utility/FeeAssetSelector";
import TranslateWithLinks from "../Utility/TranslateWithLinks";

class DirectDebitClaimModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
    }

    getInitialState() {
        return {
            to_name: "",
            from_account: null,
            from_account_balance: null,
            to_account: null,
            amount: "",
            asset_id: null,
            asset: null,
            memo: "",
            error: null,
            feeAsset: null, // will be filled by FeeAssetSelector
            maxAmount: false,
            permissionId: "",
            firstPeriodError: false,
            payerBalanceWarning: false,
            withdrawal_limit: this.props.operation.payload.withdrawal_limit,
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
            feeAsset.asset_id
        )
            .then(result => {
                this.props.hideModal();
            })
            .catch(err => {
                this.setState({errorMessage: err});
            });
    };

    async componentDidUpdate(prevProps, prevState) {
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

            const to = await FetchChain(
                "getAccount",
                operation.payload.authorized_account
            );
            const from = await FetchChain(
                "getAccount",
                operation.payload.withdraw_from_account
            );
            const asset = await FetchChain(
                "getAsset",
                operation.payload.withdrawal_limit.asset_id
            );
            const from_account_balance = await this._checkBalance(
                from,
                operation.payload.withdrawal_limit
            );
            this.setState({
                to_account: to,
                from_account: from,
                permissionId: operation.payload.id,
                withdrawal_limit: operation.payload.withdrawal_limit,
                claimedAmount: operation.payload.claimed_this_period,
                current_period_expires_date: currentPeriodExpires,
                asset: asset,
                from_account_balance
            });
        }
    }

    setTotalLimit = limit => () => {
        const {asset, claimedAmount} = this.state;
        let amount = utils.get_asset_amount(limit - claimedAmount, asset);
        this.setState({maxAmount: true, amount});
    };

    onAmountChanged = ({amount, asset}) => {
        if (!asset) {
            return;
        }

        this.setState({
            amount,
            asset,
            asset_id: asset.get("id"),
            error: null,
            maxAmount: false
        });
    };

    onFeeChanged(asset) {
        this.setState({feeAsset: asset});
    }

    onMemoChanged(e) {
        this.setState({memo: e.target.value});
    }

    async _checkBalance(from_account = null, withdrawal_limit = null) {
        let setState = false;
        if (from_account == null) {
            from_account = this.state.from_account;
            setState = true;
        }
        if (withdrawal_limit == null) {
            withdrawal_limit = this.state.withdrawal_limit;
            setState = true;
        }
        const balanceID = from_account.getIn([
            "balances",
            withdrawal_limit.asset_id
        ]);

        let from_account_balance = 0;
        if (!!balanceID) {
            from_account_balance = (await FetchChain(
                "getObject",
                balanceID
            )).get("balance");
        }
        if (setState) {
            this.setState({from_account_balance});
        }
        return from_account_balance;
    }

    render() {
        let {
            from_account,
            from_account_balance,
            to_account,
            asset,
            amount,
            memo,
            payerBalanceWarning,
            withdrawal_limit,
            current_period_expires_date
        } = this.state;

        let enteredMoreThanAvailable = false;
        let balanceError = false;
        let maximumToClaim = 0;
        if (withdrawal_limit) {
            maximumToClaim =
                from_account_balance !== null
                    ? Math.min(from_account_balance, withdrawal_limit.amount)
                    : withdrawal_limit.amount;
            if (asset && amount)
                enteredMoreThanAvailable =
                    utils.convert_typed_to_satoshi(amount, asset) >
                    maximumToClaim;
            if (
                from_account_balance !== null &&
                from_account_balance < withdrawal_limit.amount
            ) {
                balanceError = true;
            }
        }

        let balance = null;

        // balance
        if (from_account && from_account.get("balances")) {
            balance = (
                <span>
                    <Translate
                        component="span"
                        content="showcases.direct_debit.limit"
                    />
                    :{" "}
                    <span
                        className={enteredMoreThanAvailable ? "has-error" : ""}
                        style={{
                            borderBottom: "#A09F9F 1px dotted",
                            cursor: "pointer"
                        }}
                        onClick={this.setTotalLimit(maximumToClaim)}
                    >
                        <LimitToWithdraw
                            amount={maximumToClaim}
                            assetId={
                                withdrawal_limit && withdrawal_limit.asset_id
                            }
                        />
                    </span>
                    &nbsp;
                    {balanceError && (
                        <Tooltip
                            placement="topRight"
                            title={
                                <TranslateWithLinks
                                    string="showcases.direct_debit.payer_balance_not_sufficient"
                                    keys={[
                                        {
                                            type: "amount",
                                            value: withdrawal_limit,
                                            arg: "limit"
                                        }
                                    ]}
                                />
                            }
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
            enteredMoreThanAvailable ||
            payerBalanceWarning ||
            !current_period_expires_date ||
            from_account.get("id") == to_account.get("id");

        if (__DEV__) {
            console.log("DirectDebitClaimModal.render", this.props, this.state);
        }

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
                    <Form className="full-width" layout="vertical">
                        <AccountSelector
                            label="showcases.direct_debit.authorizing_account"
                            accountName={
                                !!to_account ? to_account.get("name") : ""
                            }
                            account={to_account}
                            size={60}
                            hideImage
                            disabled
                            noForm
                        />
                        <Form.Item
                            label={counterpart.translate(
                                "showcases.direct_debit.current_period_expires"
                            )}
                        >
                            <Input
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
                        </Form.Item>
                        <AmountSelector
                            label="showcases.direct_debit.amount_to_withdraw"
                            amount={amount}
                            onChange={this.onAmountChanged}
                            asset={
                                withdrawal_limit && withdrawal_limit.asset_id
                            }
                            assets={
                                withdrawal_limit && [withdrawal_limit.asset_id]
                            }
                            display_balance={balance}
                            allowNaN={true}
                        />
                        {memo && memo.length ? (
                            <label className="right-label">{memo.length}</label>
                        ) : null}
                        <Form.Item
                            label={
                                <Tooltip
                                    placement="top"
                                    title={counterpart.translate(
                                        "tooltip.memo_tip"
                                    )}
                                >
                                    {counterpart.translate("transfer.memo")}
                                </Tooltip>
                            }
                        >
                            <Input.TextArea
                                style={{marginBottom: 0}}
                                rows="3"
                                value={memo}
                                onChange={this.onMemoChanged.bind(this)}
                            />
                        </Form.Item>
                        <FeeAssetSelector
                            account={to_account}
                            transaction={{
                                type: "withdraw_permission_claim",
                                options: ["price_per_kbyte"],
                                data: {
                                    type: "memo",
                                    content: memo
                                }
                            }}
                            onChange={this.onFeeChanged.bind(this)}
                        />
                    </Form>
                </div>
            </Modal>
        );
    }
}

export default DirectDebitClaimModal;
