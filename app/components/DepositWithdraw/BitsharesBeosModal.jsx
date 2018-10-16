import React from "react";
import AmountSelector from "components/Utility/AmountSelector";
import Modal from "react-foundation-apps/src/modal";
import Translate from "react-translate-component";
import Trigger from "react-foundation-apps/src/trigger";
import ChainTypes from "components/Utility/ChainTypes";
import BalanceComponent from "components/Utility/BalanceComponent";
import BindToChainState from "components/Utility/BindToChainState";
import PropTypes from "prop-types";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import {checkBalance} from "common/trxHelper";
import {Asset} from "common/MarketClasses";
import AccountActions from "actions/AccountActions";
import utils from "common/utils";

class BitsharesBeosModal extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        asset: ChainTypes.ChainAsset.isRequired,
        creator: PropTypes.string.isRequired,
        issuer: ChainTypes.ChainAccount.isRequired,
        owner_key: PropTypes.string.isRequired,
        ram: PropTypes.string.isRequired,
        account_contract: PropTypes.string.isRequired,
        action: PropTypes.string.isRequired,
        from: PropTypes.string.isRequired,
        balance: ChainTypes.ChainObject
    };

    constructor(props) {
        super(props);

        this.state = {
            account: "",
            account_validation_error: false,
            amount_to_send: "",
            create_account: 0,
            creator: this.props.creator,
            owner_key: this.props.owner_key,
            ram: this.props.ram,
            isAccountCreation: false,
            account_contract: this.props.account_contract,
            action: this.props.action,
            fee_amount: 10000,
            from: this.props.from,
            empty_amount_to_send_value: false,
            balance_error: false,
            memo: ""
        };
    }

    _checkBalance() {
        const {amount_to_send} = this.state;
        const {asset, balance} = this.props;
        let feeAmount = new Asset({
            amount: this.state.fee_amount,
            asset_id: this.props.asset.get("id"),
            precision: this.props.asset.get("precision")
        });
        if (!balance || !feeAmount) return;
        const hasBalance = checkBalance(
            amount_to_send,
            asset,
            feeAmount,
            balance
        );
        if (hasBalance === null) return;
        this.setState({balance_error: !hasBalance});
        return hasBalance;
    }

    getMaintenanceId() {
        return "maintenance";
    }

    onMaintenance() {
        ZfApi.publish(this.getMaintenanceId(), "open");
    }

    onAccountBalance() {
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

            let totalFeeAmount = new Asset({
                amount: this.state.fee_amount,
                asset_id: this.props.asset.get("id"),
                precision: this.props.asset.get("precision")
            });

            total.minus(totalFeeAmount);

            this.setState(
                {
                    amount_to_send: total.getAmount({real: true}),
                    empty_amount_to_send_value: false
                },
                this._checkBalance
            );
        }
    }

    onAccountChanged(e) {
        let re = /^[a-z1-5]+$/;
        if (e.target.value.length === 12 && re.test(e.target.value)) {
            this.setState({account_validation_error: false});
        } else {
            this.setState({account_validation_error: true});
        }
        this.setState({account: e.target.value});
    }

    onAmountToSendChange({amount}) {
        this.setState(
            {
                amount_to_send: amount,
                empty_amount_to_send_value:
                    amount !== undefined && !parseFloat(amount)
            },
            this._checkBalance
        );
    }

    onCreateAccountCheckbox() {
        if (this.state.isAccountCreation) {
            this.setState(
                {
                    fee_amount: 0,
                    isAccountCreation: !this.state.isAccountCreation
                },
                this._checkBalance
            );
        } else {
            this.setState(
                {
                    fee_amount: 10000,
                    isAccountCreation: !this.state.isAccountCreation
                },
                this._checkBalance
            );
        }
    }

    onMemoChanged(e) {
        this.setState({memo: e.target.value});
    }

    onSubmit() {
        let newMemo = "";
        let newAmountToSend = parseInt(
            this.state.amount_to_send *
                utils.get_asset_precision(this.props.asset.get("precision")),
            10
        );

        if (this.state.isAccountCreation) {
            newMemo =
                "beos:receiving_beos_account_name:" +
                this.state.memo +
                ":create";
        } else if (this.state.memo === "" && !this.state.isAccountCreation) {
            newMemo = "beos:receiving_beos_account_name";
        } else if (this.state.memo !== "" && !this.state.isAccountCreation) {
            newMemo = "beos:receiving_beos_account_name:" + this.state.memo;
        }

        if (this.state.isAccountCreation) {
            newAmountToSend = newAmountToSend + this.state.fee_amount;
        }

        /*AccountActions.transfer(
            this.props.account.get("id"),
            this.props.issuer.get("id"),
            newAmountToSend,
            this.props.asset.get("id"),
            newMemo
        ).catch(() => {
            this.onMaintenance();
        });*/
    }

    render() {
        let balance = null;
        let account_balances = this.props.account.get("balances").toJS();
        let asset_types = Object.keys(account_balances);
        let maintenanceId = this.getMaintenanceId();

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
            !this.state.amount_to_send ||
            this.state.balance_error ||
            this.state.account === "" ||
            this.state.account_validation_error;

        return (
            <div>
                <form className="grid-block vertical full-width-content">
                    <div className="grid-container">
                        <div className="content-block">
                            <h3>
                                <Translate content="gateway.bitshares_beos.modal_title" />
                            </h3>
                        </div>
                        {/* Amount to send to BEOS account */}
                        <div className="content-block">
                            <AmountSelector
                                label="gateway.bitshares_beos.amount_to_send_label"
                                amount={this.state.amount_to_send}
                                asset={this.props.asset.get("id")}
                                assets={[this.props.asset.get("id")]}
                                placeholder="0.0"
                                onChange={this.onAmountToSendChange.bind(this)}
                                display_balance={balance}
                            />
                            {this.state.empty_amount_to_send_value ? (
                                <p
                                    className="has-error no-margin"
                                    style={{paddingTop: 10}}
                                >
                                    <Translate content="transfer.errors.valid" />
                                </p>
                            ) : null}
                            {this.state.balance_error ? (
                                <p
                                    className="has-error no-margin"
                                    style={{paddingTop: 10}}
                                >
                                    <Translate content="transfer.errors.insufficient" />
                                </p>
                            ) : null}
                        </div>
                        {/* Bitshares EOS account */}
                        <div className="content-block">
                            <label className="left-label">
                                <Translate
                                    component="span"
                                    content="gateway.bitshares_beos.account_label"
                                />
                            </label>
                            <div className="inline-label">
                                <input
                                    type="text"
                                    value={this.state.account}
                                    autoComplete="off"
                                    onChange={this.onAccountChanged.bind(this)}
                                />
                            </div>
                            {this.state.account_validation_error ? (
                                <p
                                    className="has-error no-margin"
                                    style={{paddingTop: 10}}
                                >
                                    <Translate content="gateway.bitshares_beos.bitshares_eos_account_error" />
                                </p>
                            ) : null}
                        </div>
                        {/* Memo */}
                        <div className="content-block">
                            <label className="left-label">
                                <Translate
                                    component="span"
                                    content="gateway.bitshares_beos.memo_label"
                                />
                            </label>
                            <textarea
                                rows="3"
                                value={this.state.memo}
                                onChange={this.onMemoChanged.bind(this)}
                            />
                        </div>
                        {/* Create account enabled/disabled */}
                        <table className="table" style={{width: "inherit"}}>
                            <tbody>
                                <tr>
                                    <td style={{border: "none"}}>
                                        <Translate
                                            content={
                                                "gateway.bitshares_beos.create_account_checkbox"
                                            }
                                        />
                                        :
                                    </td>
                                    <td style={{border: "none"}}>
                                        <div
                                            className="switch"
                                            style={{
                                                marginBottom: "10px"
                                            }}
                                            onClick={this.onCreateAccountCheckbox.bind(
                                                this
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={
                                                    this.state.isAccountCreation
                                                }
                                            />
                                            <label />
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        {/* Send/Cancel buttons */}
                        <div className="button-group">
                            <div
                                onClick={this.onSubmit.bind(this)}
                                className={
                                    "button" +
                                    (disableSubmit ? " disabled" : "")
                                }
                            >
                                <Translate content="gateway.bitshares_beos.send_button_label" />
                            </div>

                            <Trigger close={this.props.modal_id}>
                                <div className="button">
                                    <Translate content="account.perm.cancel" />
                                </div>
                            </Trigger>
                        </div>
                    </div>
                </form>
                <Modal id={maintenanceId} overlay={true}>
                    <Trigger close={maintenanceId}>
                        <a href="#" className="close-button">
                            &times;
                        </a>
                    </Trigger>
                    <br />
                    <label>
                        <Translate content="gateway.bitshares_beos.maintenance_modal_label" />
                    </label>
                    <br />
                    <div className="content-block">
                        <Trigger close={maintenanceId}>
                            <a className="button">
                                <Translate content="gateway.bitshares_beos.maintenance_button_label" />
                            </a>
                        </Trigger>
                    </div>
                </Modal>
            </div>
        );
    }
}

export default BindToChainState(BitsharesBeosModal);
