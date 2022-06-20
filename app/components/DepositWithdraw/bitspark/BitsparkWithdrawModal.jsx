import React from "react";
import Translate from "react-translate-component";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import utils from "common/utils";
import BalanceComponent from "components/Utility/BalanceComponent";
import counterpart from "counterpart";
import AmountSelector from "components/Utility/AmountSelector";
import AccountActions from "actions/AccountActions";
import {validateAddress, WithdrawAddresses} from "common/gatewayMethods";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import {ChainStore} from "bitsharesjs";
import {checkFeeStatusAsync, checkBalance} from "common/trxHelper";
import {debounce} from "lodash-es";
import {Price, Asset} from "common/MarketClasses";
import {Button, Modal} from "bitshares-ui-style-guide";

import PropTypes from "prop-types";

class BitsparkWithdrawModal extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        issuer: ChainTypes.ChainAccount.isRequired,
        asset: ChainTypes.ChainAsset.isRequired,
        output_coin_name: PropTypes.string.isRequired,
        output_coin_symbol: PropTypes.string.isRequired,
        output_coin_type: PropTypes.string.isRequired,
        url: PropTypes.string,
        output_wallet_type: PropTypes.string,
        output_supports_memos: PropTypes.bool.isRequired,
        amount_to_withdraw: PropTypes.string,
        balance: ChainTypes.ChainObject
    };

    constructor(props) {
        super(props);

        this.state = {
            isConfirmationModalVisible: false,
            withdraw_amount: this.props.amount_to_withdraw,
            withdraw_address: WithdrawAddresses.getLast(
                props.output_wallet_type
            ),
            withdraw_address_check_in_progress: true,
            withdraw_address_is_valid: null,
            options_is_valid: false,
            confirmation_is_valid: false,
            withdraw_address_selected: WithdrawAddresses.getLast(
                props.output_wallet_type
            ),
            memo: "",
            withdraw_address_first: true,
            empty_withdraw_value: false,
            from_account: props.account,
            fee_asset_id:
                ChainStore.assets_by_symbol.get(props.fee_asset_symbol) ||
                "1.3.0",
            feeStatus: {}
        };

        this._validateAddress(this.state.withdraw_address, props);

        this._checkBalance = this._checkBalance.bind(this);
        this._updateFee = debounce(this._updateFee.bind(this), 250);

        this.showConfirmationModal = this.showConfirmationModal.bind(this);
        this.hideConfirmationModal = this.hideConfirmationModal.bind(this);
    }

    showConfirmationModal() {
        this.setState({
            isConfirmationModalVisible: true
        });
    }

    hideConfirmationModal() {
        this.setState({
            isConfirmationModalVisible: false
        });
    }

    UNSAFE_componentWillMount() {
        this._updateFee();
        this._checkFeeStatus();
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    UNSAFE_componentWillReceiveProps(np) {
        if (
            np.account !== this.state.from_account &&
            np.account !== this.props.account
        ) {
            this.setState(
                {
                    from_account: np.account,
                    feeStatus: {},
                    fee_asset_id: "1.3.0",
                    feeAmount: new Asset({amount: 0})
                },
                () => {
                    this._updateFee();
                    this._checkFeeStatus();
                }
            );
        }
    }

    _updateFee(state = this.state) {
        let {fee_asset_id, from_account} = state;
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
            options: ["price_per_kbyte"],
            data: {
                type: "memo",
                content:
                    this.props.output_coin_type +
                    ":" +
                    state.withdraw_address +
                    (state.memo ? ":" + state.memo : "")
            }
        }).then(({fee, hasBalance, hasPoolBalance}) => {
            if (this.unMounted) return;

            this.setState(
                {
                    feeAmount: fee,
                    hasBalance,
                    hasPoolBalance,
                    error: !hasBalance || !hasPoolBalance
                },
                this._checkBalance
            );
        });
    }

    _checkFeeStatus(state = this.state) {
        let account = state.from_account;
        if (!account) return;

        const {fee_asset_types: assets} = this._getAvailableAssets(state);
        // const assets = ["1.3.0", this.props.asset.get("id")];
        let feeStatus = {};
        let p = [];
        assets.forEach(a => {
            p.push(
                checkFeeStatusAsync({
                    accountID: account.get("id"),
                    feeID: a,
                    options: ["price_per_kbyte"],
                    data: {
                        type: "memo",
                        content:
                            this.props.output_coin_type +
                            ":" +
                            state.withdraw_address +
                            (state.memo ? ":" + state.memo : "")
                    }
                })
            );
        });
        Promise.all(p)
            .then(status => {
                assets.forEach((a, idx) => {
                    feeStatus[a] = status[idx];
                });
                if (!utils.are_equal_shallow(state.feeStatus, feeStatus)) {
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

    onMemoChanged(e) {
        this.setState({memo: e.target.value}, this._updateFee);
    }

    onWithdrawAmountChange({amount}) {
        this.setState(
            {
                withdraw_amount: amount,
                empty_withdraw_value:
                    amount !== undefined && !parseFloat(amount)
            },
            this._checkBalance
        );
    }

    onSelectChanged(index) {
        let new_withdraw_address = WithdrawAddresses.get(
            this.props.output_wallet_type
        )[index];
        WithdrawAddresses.setLast({
            wallet: this.props.output_wallet_type,
            address: new_withdraw_address
        });

        this.setState(
            {
                withdraw_address_selected: new_withdraw_address,
                options_is_valid: false,
                withdraw_address: new_withdraw_address,
                withdraw_address_check_in_progress: true,
                withdraw_address_is_valid: null
            },
            this._updateFee
        );
        this._validateAddress(new_withdraw_address);
    }

    onWithdrawAddressChanged(e) {
        let new_withdraw_address = e.target.value.trim();

        this.setState(
            {
                withdraw_address: new_withdraw_address,
                withdraw_address_check_in_progress: true,
                withdraw_address_selected: new_withdraw_address,
                withdraw_address_is_valid: null
            },
            this._updateFee
        );
        this._validateAddress(new_withdraw_address);
    }

    _validateAddress(new_withdraw_address, props = this.props) {
        validateAddress({
            url: props.url,
            walletType: props.output_wallet_type,
            newAddress: new_withdraw_address
        }).then(isValid => {
            if (this.state.withdraw_address === new_withdraw_address) {
                this.setState({
                    withdraw_address_check_in_progress: false,
                    withdraw_address_is_valid: isValid
                });
            }
        });
    }

    _checkBalance() {
        const {feeAmount, withdraw_amount} = this.state;
        const {asset, balance} = this.props;
        if (!balance || !feeAmount) return;
        const hasBalance = checkBalance(
            withdraw_amount,
            asset,
            feeAmount,
            balance
        );
        if (hasBalance === null) return;
        this.setState({balanceError: !hasBalance});
        return hasBalance;
    }

    onSubmit() {
        if (
            !this.state.withdraw_address_check_in_progress &&
            this.state.withdraw_address && this.state.withdraw_address.length &&
            this.state.withdraw_amount !== null
        ) {
            if (!this.state.withdraw_address_is_valid) {
                this.showConfirmationModal();
            } else if (parseFloat(this.state.withdraw_amount) > 0) {
                if (!WithdrawAddresses.has(this.props.output_wallet_type)) {
                    let withdrawals = [];
                    withdrawals.push(this.state.withdraw_address);
                    WithdrawAddresses.set({
                        wallet: this.props.output_wallet_type,
                        addresses: withdrawals
                    });
                } else {
                    let withdrawals = WithdrawAddresses.get(
                        this.props.output_wallet_type
                    );
                    if (
                        withdrawals.indexOf(this.state.withdraw_address) == -1
                    ) {
                        withdrawals.push(this.state.withdraw_address);
                        WithdrawAddresses.set({
                            wallet: this.props.output_wallet_type,
                            addresses: withdrawals
                        });
                    }
                }
                WithdrawAddresses.setLast({
                    wallet: this.props.output_wallet_type,
                    address: this.state.withdraw_address
                });
                let asset = this.props.asset;

                const {feeAmount} = this.state;

                const amount = parseFloat(
                    String.prototype.replace.call(
                        this.state.withdraw_amount,
                        /,/g,
                        ""
                    )
                );
                const gateFee =
                    typeof this.props.gateFee != "undefined"
                        ? parseFloat(
                              String.prototype.replace.call(
                                  this.props.gateFee,
                                  /,/g,
                                  ""
                              )
                          )
                        : 0.0;

                let sendAmount = new Asset({
                    asset_id: asset.get("id"),
                    precision: asset.get("precision"),
                    real: amount
                });

                let balanceAmount = new Asset({
                    asset_id: asset.get("id"),
                    precision: asset.get("precision"),
                    real: 0
                });

                if (typeof this.props.balance != "undefined") {
                    balanceAmount = sendAmount.clone(
                        this.props.balance.get("balance")
                    );
                }

                const gateFeeAmount = new Asset({
                    asset_id: asset.get("id"),
                    precision: asset.get("precision"),
                    real: gateFee
                });

                sendAmount.plus(gateFeeAmount);

                /* Insufficient balance */
                if (balanceAmount.lt(sendAmount)) {
                    sendAmount = balanceAmount;
                }

                AccountActions.transfer(
                    this.props.account.get("id"),
                    this.props.issuer.get("id"),
                    sendAmount.getAmount(),
                    asset.get("id"),
                    this.props.output_coin_type +
                        ":" +
                        this.state.withdraw_address +
                        (this.state.memo
                            ? ":" + new Buffer(this.state.memo, "utf-8")
                            : ""),
                    null,
                    feeAmount ? feeAmount.asset_id : "1.3.0"
                );

                this.setState({
                    empty_withdraw_value: false
                });
            } else {
                this.setState({
                    empty_withdraw_value: true
                });
            }
        }
    }

    onSubmitConfirmation() {
        this.hideConfirmationModal();

        if (!WithdrawAddresses.has(this.props.output_wallet_type)) {
            let withdrawals = [];
            withdrawals.push(this.state.withdraw_address);
            WithdrawAddresses.set({
                wallet: this.props.output_wallet_type,
                addresses: withdrawals
            });
        } else {
            let withdrawals = WithdrawAddresses.get(
                this.props.output_wallet_type
            );
            if (withdrawals.indexOf(this.state.withdraw_address) == -1) {
                withdrawals.push(this.state.withdraw_address);
                WithdrawAddresses.set({
                    wallet: this.props.output_wallet_type,
                    addresses: withdrawals
                });
            }
        }
        WithdrawAddresses.setLast({
            wallet: this.props.output_wallet_type,
            address: this.state.withdraw_address
        });
        let asset = this.props.asset;
        let precision = utils.get_asset_precision(asset.get("precision"));
        let amount = String.prototype.replace.call(
            this.state.withdraw_amount,
            /,/g,
            ""
        );

        const {feeAmount} = this.state;

        AccountActions.transfer(
            this.props.account.get("id"),
            this.props.issuer.get("id"),
            parseInt(amount * precision, 10),
            asset.get("id"),
            this.props.output_coin_type +
                ":" +
                this.state.withdraw_address +
                (this.state.memo
                    ? ":" + new Buffer(this.state.memo, "utf-8")
                    : ""),
            null,
            feeAmount ? feeAmount.asset_id : "1.3.0"
        );
    }

    onDropDownList() {
        if (WithdrawAddresses.has(this.props.output_wallet_type)) {
            if (this.state.options_is_valid === false) {
                this.setState({options_is_valid: true});
                this.setState({withdraw_address_first: false});
            }

            if (this.state.options_is_valid === true) {
                this.setState({options_is_valid: false});
            }
        }
    }

    getWithdrawModalId() {
        return "confirmation";
    }

    onAccountBalance() {
        const {feeAmount} = this.state;
        if (
            Object.keys(this.props.account.get("balances").toJS()).includes(
                this.props.asset.get("id")
            )
        ) {
            let total = new Asset({
                amount: this.props.balance.get("balance"),
                asset_id: this.props.asset.get("id"),
                precision: this.props.asset.get("precision")
            });

            // Subtract the fee if it is using the same asset
            if (total.asset_id === feeAmount.asset_id) {
                total.minus(feeAmount);
            }

            this.setState(
                {
                    withdraw_amount: total.getAmount({real: true}),
                    empty_withdraw_value: false
                },
                this._checkBalance
            );
        }
    }

    setNestedRef(ref) {
        this.nestedRef = ref;
    }

    onFeeChanged({asset}) {
        this.setState(
            {
                fee_asset_id: asset.get("id")
            },
            this._updateFee
        );
    }

    _getAvailableAssets(state = this.state) {
        const {from_account, feeStatus} = state;
        function hasFeePoolBalance(id) {
            if (feeStatus[id] === undefined) return true;
            return feeStatus[id] && feeStatus[id].hasPoolBalance;
        }

        function hasBalance(id) {
            if (feeStatus[id] === undefined) return true;
            return feeStatus[id] && feeStatus[id].hasBalance;
        }

        let fee_asset_types = [];
        if (!(from_account && from_account.get("balances"))) {
            return {fee_asset_types};
        }
        let account_balances = state.from_account.get("balances").toJS();
        fee_asset_types = Object.keys(account_balances).sort(utils.sortID);
        for (let key in account_balances) {
            let asset = ChainStore.getObject(key);
            let balanceObject = ChainStore.getObject(account_balances[key]);
            if (balanceObject && balanceObject.get("balance") === 0) {
                if (fee_asset_types.indexOf(key) !== -1) {
                    fee_asset_types.splice(fee_asset_types.indexOf(key), 1);
                }
            }

            if (asset) {
                // Remove any assets that do not have valid core exchange rates
                let priceIsValid = false,
                    p;
                try {
                    p = new Price({
                        base: new Asset(
                            asset
                                .getIn([
                                    "options",
                                    "core_exchange_rate",
                                    "base"
                                ])
                                .toJS()
                        ),
                        quote: new Asset(
                            asset
                                .getIn([
                                    "options",
                                    "core_exchange_rate",
                                    "quote"
                                ])
                                .toJS()
                        )
                    });
                    priceIsValid = p.isValid();
                } catch (err) {
                    priceIsValid = false;
                }

                if (asset.get("id") !== "1.3.0" && !priceIsValid) {
                    fee_asset_types.splice(fee_asset_types.indexOf(key), 1);
                }
            }
        }

        fee_asset_types = fee_asset_types.filter(a => {
            return hasFeePoolBalance(a) && hasBalance(a);
        });

        return {fee_asset_types};
    }

    render() {
        let {withdraw_address_selected, memo} = this.state;
        let storedAddress = WithdrawAddresses.get(
            this.props.output_wallet_type
        );
        let balance = null;

        let account_balances = this.props.account.get("balances").toJS();
        let asset_types = Object.keys(account_balances);

        let withdrawModalId = this.getWithdrawModalId();
        let invalid_address_message = null;
        let options = null;
        let confirmation = null;

        if (this.state.options_is_valid) {
            options = (
                <div
                    className={
                        !storedAddress.length
                            ? "blocktrades-disabled-options"
                            : "blocktrades-options"
                    }
                >
                    {storedAddress.map(function(name, index) {
                        return (
                            <a
                                key={index}
                                onClick={this.onSelectChanged.bind(this, index)}
                            >
                                {name}
                            </a>
                        );
                    }, this)}
                </div>
            );
        }

        if (
            !this.state.withdraw_address_check_in_progress &&
            this.state.withdraw_address && this.state.withdraw_address.length
        ) {
            if (!this.state.withdraw_address_is_valid) {
                invalid_address_message = (
                    <div className="has-error" style={{paddingTop: 10}}>
                        <Translate
                            content="gateway.valid_address"
                            coin_type={this.props.output_coin_type}
                        />
                    </div>
                );
                confirmation = (
                    <Modal
                        closable={false}
                        footer={[
                            <Button
                                key="submit"
                                type="primary"
                                onClick={this.onSubmitConfirmation.bind(this)}
                            >
                                {counterpart.translate(
                                    "modal.confirmation.accept"
                                )}
                            </Button>,
                            <Button
                                key="cancel"
                                style={{marginLeft: "8px"}}
                                onClick={this.hideConfirmationModal}
                            >
                                {counterpart.translate(
                                    "modal.confirmation.cancel"
                                )}
                            </Button>
                        ]}
                        visible={this.state.isConfirmationModalVisible}
                        onCancel={this.hideConfirmationModal}
                    >
                        <label>
                            <Translate content="modal.confirmation.title" />
                        </label>
                    </Modal>
                );
            }
            // if (this.state.withdraw_address_is_valid)
            //   invalid_address_message = <Icon name="checkmark-circle" title="icons.checkmark_circle.operation_succeed" className="success" />;
            // else
            //   invalid_address_message = <Icon name="cross-circle" title="icons.cross_circle.operation_failed" className="alert" />;
        }

        let tabIndex = 1;
        let withdraw_memo = null;

        if (this.props.output_supports_memos) {
            withdraw_memo = (
                <div className="content-block">
                    <label>
                        <Translate component="span" content="transfer.memo" />
                    </label>
                    <textarea
                        rows="3"
                        value={memo}
                        tabIndex={tabIndex++}
                        onChange={this.onMemoChanged.bind(this)}
                    />
                </div>
            );
        }

        // Estimate fee VARIABLES
        let {fee_asset_types} = this._getAvailableAssets();

        if (asset_types.length > 0) {
            let current_asset_id = this.props.asset.get("id");
            if (current_asset_id) {
                let current = account_balances[current_asset_id];
                balance = (
                    <span
                        style={{
                            borderBottom: "#A09F9F 1px dotted",
                            cursor: "pointer"
                        }}
                    >
                        <Translate
                            component="span"
                            content="transfer.available"
                        />
                        &nbsp;:&nbsp;
                        <span
                            className="set-cursor"
                            onClick={this.onAccountBalance.bind(this)}
                        >
                            {current ? (
                                <BalanceComponent
                                    balance={account_balances[current_asset_id]}
                                />
                            ) : (
                                0
                            )}
                        </span>
                    </span>
                );
            } else balance = "No funds";
        } else {
            balance = "No funds";
        }

        const disableSubmit =
            this.state.error ||
            this.state.balanceError ||
            !this.state.withdraw_amount;

        return (
            <form
                className="grid-block vertical full-width-content"
                style={{paddingTop: 0}}
            >
                <div className="grid-container">
                    {/* Withdraw amount */}
                    <div className="content-block">
                        <AmountSelector
                            label="modal.withdraw.amount"
                            amount={this.state.withdraw_amount}
                            asset={this.props.asset.get("id")}
                            assets={[this.props.asset.get("id")]}
                            placeholder="0.0"
                            onChange={this.onWithdrawAmountChange.bind(this)}
                            display_balance={balance}
                        />
                        {this.state.empty_withdraw_value ? (
                            <p
                                className="has-error no-margin"
                                style={{paddingTop: 10}}
                            >
                                <Translate content="transfer.errors.valid" />
                            </p>
                        ) : null}
                        {this.state.balanceError ? (
                            <p
                                className="has-error no-margin"
                                style={{paddingTop: 10}}
                            >
                                <Translate content="transfer.errors.insufficient" />
                            </p>
                        ) : null}
                    </div>

                    {/* Fee selection */}
                    {this.state.feeAmount ? (
                        <div className="content-block gate_fee">
                            <AmountSelector
                                refCallback={this.setNestedRef.bind(this)}
                                disabled={true}
                                amount={this.state.feeAmount.getAmount({
                                    real: true
                                })}
                                onChange={this.onFeeChanged.bind(this)}
                                asset={this.state.feeAmount.asset_id}
                                assets={fee_asset_types}
                                tabIndex={tabIndex++}
                            />
                            {!this.state.hasBalance ? (
                                <p
                                    className="has-error no-margin"
                                    style={{paddingTop: 10}}
                                >
                                    <Translate content="transfer.errors.noFeeBalance" />
                                </p>
                            ) : null}
                            {!this.state.hasPoolBalance ? (
                                <p
                                    className="has-error no-margin"
                                    style={{paddingTop: 10}}
                                >
                                    <Translate content="transfer.errors.noPoolBalance" />
                                </p>
                            ) : null}
                        </div>
                    ) : null}

                    {/* Gate fee */}
                    {this.props.gateFee ? (
                        <div
                            className="amount-selector right-selector"
                            style={{paddingBottom: 20}}
                        >
                            <label className="left-label">
                                <Translate content="gateway.fee" />
                            </label>
                            <div className="inline-label input-wrapper">
                                <input
                                    type="text"
                                    disabled
                                    value={this.props.gateFee}
                                />

                                <div className="form-label select floating-dropdown">
                                    <div className="dropdown-wrapper inactive">
                                        <div>
                                            {this.props.output_coin_symbol}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                    <div className="content-block">
                        <label className="left-label">
                            <Translate
                                component="span"
                                content="modal.withdraw.address"
                            />
                        </label>
                        <div className="blocktrades-select-dropdown">
                            <div className="inline-label">
                                <input
                                    type="text"
                                    value={withdraw_address_selected}
                                    tabIndex="4"
                                    onChange={this.onWithdrawAddressChanged.bind(
                                        this
                                    )}
                                    autoComplete="off"
                                />
                                <span onClick={this.onDropDownList.bind(this)}>
                                    &#9660;
                                </span>
                            </div>
                        </div>
                        <div className="blocktrades-position-options">
                            {options}
                        </div>
                        {invalid_address_message}
                    </div>

                    {/* Memo input */}
                    {withdraw_memo}

                    {/* Withdraw/Cancel buttons */}
                    <div>
                        <Button
                            type="primary"
                            disabled={disableSubmit}
                            onClick={this.onSubmit.bind(this)}
                        >
                            {counterpart.translate("modal.withdraw.submit")}
                        </Button>

                        <Button
                            onClick={this.props.hideModal}
                            style={{marginLeft: "8px"}}
                        >
                            {counterpart.translate("account.perm.cancel")}
                        </Button>
                    </div>
                    {confirmation}
                </div>
            </form>
        );
    }
}

BitsparkWithdrawModal = BindToChainState(BitsparkWithdrawModal);

export default connect(BitsparkWithdrawModal, {
    listenTo() {
        return [SettingsStore];
    },
    getProps(props) {
        return {
            fee_asset_symbol: SettingsStore.getState().settings.get("fee_asset")
        };
    }
});
