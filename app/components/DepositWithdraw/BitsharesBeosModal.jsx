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
import {checkFeeStatusAsync, checkBalance} from "common/trxHelper";
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
            account_exist_error: false,
            is_account_validation: false,
            account_validation_error: false,
            amount_to_send: "",
            creator: this.props.creator,
            owner_key: this.props.owner_key,
            ram: this.props.ram,
            is_account_creation: false,
            account_contract: this.props.account_contract,
            from_account: props.account,
            action: this.props.action,
            fee_amount_creation: 0,
            fee_asset_id: "1.3.0",
            from: this.props.from,
            empty_amount_to_send_error: false,
            balance_error: false,
            maintenance_error: false,
            memo: "",
            no_account_error: false
        };
    }

    componentWillMount() {
        this._updateFee();
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    componentWillReceiveProps(np) {
        if (
            np.account !== this.state.from_account &&
            np.account !== this.props.account
        ) {
            this.setState(
                {
                    from_account: np.account,
                    fee_asset_id: "1.3.0",
                    fee_amount: new Asset({amount: 0})
                },
                () => {
                    this._updateFee();
                }
            );
        }
    }

    _updateFee(state = this.state) {
        let {fee_asset_id, from_account} = state;
        let newMemo = "";

        if (this.state.is_account_creation) {
            newMemo =
                "beos:receiving_beos_account_name:" +
                this.state.memo +
                ":create";
        } else if (this.state.memo === "" && !this.state.is_account_creation) {
            newMemo = "beos:receiving_beos_account_name";
        } else if (this.state.memo !== "" && !this.state.is_account_creation) {
            newMemo = "beos:receiving_beos_account_name:" + this.state.memo;
        }

        if (!from_account) return null;
        checkFeeStatusAsync({
            accountID: from_account.get("id"),
            feeID: fee_asset_id,
            options: ["price_per_kbyte"],
            data: {
                type: "memo",
                content: newMemo
            }
        }).then(({fee}) => {
            if (this.unMounted) return;

            this.setState(
                {
                    fee_amount: fee
                },
                this._checkBalance
            );
        });
    }

    _checkBalance() {
        const {amount_to_send, fee_amount, fee_amount_creation} = this.state;
        const {asset, balance} = this.props;
        let fee_amount_amount = 0;
        if (fee_amount) {
            fee_amount_amount = fee_amount.amount;
        }
        let feeAmount = new Asset({
            amount: fee_amount_creation + fee_amount_amount,
            asset_id: asset.get("id"),
            precision: asset.get("precision")
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

    onAlternativeAccountValidation(url, account) {
        let validation_url =
            url +
            "/wallets/steem/address-validator?address=" +
            account +
            "&requestBalances=true";
        let validation_promise = fetch(validation_url, {
            method: "get",
            headers: new Headers({Accept: "application/json"})
        }).then(response => response.json());

        Promise.resolve(validation_promise)
            .then(result => {
                setTimeout(() => {
                    if (!result.isValid && !this.state.is_account_creation) {
                        this.setState({
                            no_account_error: true
                        });
                    }
                    if (result.isValid && this.state.is_account_creation) {
                        this.setState({
                            account_exist_error: true
                        });
                    }
                    this.setState({
                        is_account_validation: false
                    });
                }, 300);
            })
            .catch(() => {
                setTimeout(() => {
                    this.setState({
                        is_account_validation: false,
                        maintenance_error: true
                    });
                }, 300);
            });
    }

    onAccountValidation(url, account) {
        this.setState({
            is_account_validation: true
        });
        let validation_url =
            url +
            "/wallets/steem/address-validator?address=" +
            account +
            "&requestBalances=true";
        let validation_promise = fetch(validation_url, {
            method: "get",
            headers: new Headers({Accept: "application/json"})
        }).then(response => response.json());

        Promise.resolve(validation_promise)
            .then(result => {
                setTimeout(() => {
                    if (!result.isValid && !this.state.is_account_creation) {
                        this.setState({
                            no_account_error: true
                        });
                    }
                    if (result.isValid && this.state.is_account_creation) {
                        this.setState({
                            account_exist_error: true
                        });
                    }
                    this.setState({
                        is_account_validation: false
                    });
                }, 300);
            })
            .catch(() => {
                this.onAlternativeAccountValidation(
                    "https://api.blocktrades.info/v2",
                    account
                );
            });
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

            let fee_amount_amount = 0;

            if (this.state.fee_amount) {
                fee_amount_amount = this.state.fee_amount.amount;
            }

            let totalFeeAmount = new Asset({
                amount: this.state.fee_amount_creation + fee_amount_amount,
                asset_id: this.props.asset.get("id"),
                precision: this.props.asset.get("precision")
            });

            total.minus(totalFeeAmount);

            this.setState(
                {
                    amount_to_send: total.getAmount({real: true}),
                    empty_amount_to_send_error: false
                },
                this._checkBalance
            );
        }
    }

    onAccountChanged(e) {
        let re = /^[a-z1-5]+$/;
        this.setState({
            account_exist_error: false,
            is_account_validation: false,
            maintenance_error: false,
            no_account_error: false
        });
        if (e.target.value.length === 12 && re.test(e.target.value)) {
            this.onAccountValidation(
                "https://api.blocktrades.us/v2",
                e.target.value
            );
            this.setState({account_validation_error: false});
        } else {
            this.setState({account_validation_error: true});
        }
        this.setState({account: e.target.value}, this._updateFee);
    }

    onAmountToSendChange({amount}) {
        this.setState(
            {
                amount_to_send: amount,
                empty_amount_to_send_error:
                    amount !== undefined && !parseFloat(amount)
            },
            this._checkBalance
        );
    }

    onCreateAccountCheckbox() {
        if (this.state.is_account_creation) {
            let re = /^[a-z1-5]+$/;
            if (
                this.state.account.length === 12 &&
                re.test(this.state.account) &&
                this.state.account_exist_error
            ) {
                this.setState({account_exist_error: false});
            } else if (
                this.state.account.length === 12 &&
                re.test(this.state.account) &&
                !this.state.no_account_error
            ) {
                this.setState({no_account_error: true});
            }
        } else {
            let re = /^[a-z1-5]+$/;
            if (
                this.state.account.length === 12 &&
                re.test(this.state.account) &&
                this.state.no_account_error
            ) {
                this.setState({no_account_error: false});
            } else if (
                this.state.account.length === 12 &&
                re.test(this.state.account) &&
                !this.state.account_exist_error
            ) {
                this.setState({account_exist_error: true});
            }
        }
        if (this.state.is_account_creation) {
            this.setState(
                {
                    fee_amount_creation: 0,
                    is_account_creation: !this.state.is_account_creation
                },
                this._checkBalance
            );
        } else {
            this.setState(
                {
                    fee_amount_creation: 10000000,
                    is_account_creation: !this.state.is_account_creation
                },
                this._checkBalance
            );
        }
    }

    onMemoChanged(e) {
        this.setState({memo: e.target.value}, this._updateFee);
    }

    onSubmit() {
        let newMemo = "";
        let newAmountToSend = parseInt(
            this.state.amount_to_send *
                utils.get_asset_precision(this.props.asset.get("precision")),
            10
        );

        if (this.state.is_account_creation) {
            newMemo =
                "beos:receiving_beos_account_name:" +
                this.state.memo +
                ":create";
        } else if (this.state.memo === "" && !this.state.is_account_creation) {
            newMemo = "beos:receiving_beos_account_name";
        } else if (this.state.memo !== "" && !this.state.is_account_creation) {
            newMemo = "beos:receiving_beos_account_name:" + this.state.memo;
        }

        if (this.state.is_account_creation) {
            newAmountToSend = newAmountToSend + this.state.fee_amount_creation;
        }

        /*AccountActions.transfer(
            this.props.account.get("id"),
            this.props.issuer.get("id"),
            newAmountToSend,
            this.props.asset.get("id"),
            newMemo,
            null,
            this.state.fee_asset_id

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
            this.state.account_validation_error ||
            this.state.no_account_error ||
            this.state.account_exist_error ||
            this.state.is_account_validation ||
            this.state.maintenance_error;

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
                            {this.state.empty_amount_to_send_error ? (
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
                                    <Translate content="gateway.bitshares_beos.account_validation_error" />
                                </p>
                            ) : null}
                            {this.state.is_account_validation ? (
                                <p
                                    className="has-error no-margin"
                                    style={{paddingTop: 10}}
                                >
                                    <Translate content="gateway.bitshares_beos.account_validation_label" />
                                </p>
                            ) : null}
                            {this.state.maintenance_error ? (
                                <p
                                    className="has-error no-margin"
                                    style={{paddingTop: 10}}
                                >
                                    <Translate content="gateway.bitshares_beos.maintenance_error" />
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
                                                    this.state
                                                        .is_account_creation
                                                }
                                            />
                                            <label />
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        {this.state.account_exist_error ? (
                            <p
                                className="has-error no-margin"
                                style={{paddingBottom: 15}}
                            >
                                <Translate content="gateway.bitshares_beos.account_exist_error" />
                            </p>
                        ) : null}
                        {this.state.no_account_error ? (
                            <p
                                className="has-error no-margin"
                                style={{paddingBottom: 15}}
                            >
                                <Translate content="gateway.bitshares_beos.no_account_error" />
                            </p>
                        ) : null}
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
