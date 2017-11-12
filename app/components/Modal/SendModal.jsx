import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import BaseModal from "./BaseModal";
import Translate from "react-translate-component";
import Immutable from "immutable";
import {ChainStore} from "bitsharesjs/es";
import AmountSelector from "../Utility/AmountSelector";
import AccountStore from "stores/AccountStore";
import AccountSelector from "../Account/AccountSelector";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import { Asset } from "common/MarketClasses";
import { debounce, isNaN } from "lodash";
import { checkFeeStatusAsync, checkBalance } from "common/trxHelper";

import BalanceComponent from "../Utility/BalanceComponent";
import AccountActions from "actions/AccountActions";
import utils from "common/utils";
import counterpart from "counterpart";
import { RecentTransactions } from "../Account/RecentTransactions";
import {connect} from "alt-react";
import classnames from "classnames";

/* Export functions from Transfer/Transfer.jsx */

export default class SendModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = SendModal.getInitialState();

        let currentAccount = AccountStore.getState().currentAccount;
        if (!this.state.from_name) this.state.from_name = currentAccount;
        this.onTrxIncluded = this.onTrxIncluded.bind(this);
        this._updateFee = debounce(this._updateFee.bind(this), 250);
        this._checkFeeStatus = this._checkFeeStatus.bind(this);
        this._checkBalance = this._checkBalance.bind(this);
    };

    static getInitialState() {
        return {
            from_name: "",
            to_name: "",
            from_account: null,
            to_account: null,
            amount: "",
            asset_id: null,
            asset: null,
            memo: "",
            error: null,
            propose: false,
            propose_account: "",
            feeAsset: null,
            fee_asset_id: "1.3.0",
            feeAmount: new Asset({amount: 0}),
            feeStatus: {}
        };
    };

    show() {
        ZfApi.publish("send_modal", "open");
    }

    _checkBalance() {
        const {feeAmount, amount, from_account, asset} = this.state;
        if (!asset) return;
        const balanceID = from_account.getIn(["balances", asset.get("id")]);
        const feeBalanceID = from_account.getIn(["balances", feeAmount.asset_id]);
        if (!asset || ! from_account) return;
        if (!balanceID) return this.setState({balanceError: true});
        let balanceObject = ChainStore.getObject(balanceID);
        let feeBalanceObject = feeBalanceID ? ChainStore.getObject(feeBalanceID) : null;
        if (!feeBalanceObject || feeBalanceObject.get("balance") === 0) {
            this.setState({fee_asset_id: "1.3.0"}, this._updateFee);
        }
        if (!balanceObject || !feeAmount) return;
        const hasBalance = checkBalance(amount, asset, feeAmount, balanceObject);
        if (hasBalance === null) return;
        this.setState({balanceError: !hasBalance});
    }

    _checkFeeStatus(account = this.state.from_account) {
        if (!account) return;

        const assets = Object.keys(account.get("balances").toJS()).sort(utils.sortID);
        let feeStatus = {};
        let p = [];
        assets.forEach(a => {
            p.push(checkFeeStatusAsync({
                accountID: account.get("id"),
                feeID: a,
                options: ["price_per_kbyte"],
                data: {
                    type: "memo",
                    content: this.state.memo
                }
            }));
        });
        Promise.all(p).then(status => {
            assets.forEach((a, idx) => {
                feeStatus[a] = status[idx];
            });
            if (!utils.are_equal_shallow(this.state.feeStatus, feeStatus)) {
                this.setState({
                    feeStatus
                });
            }
            this._checkBalance();
        }).catch(err => {
            console.error(err);
        });
    }
    
    _getAvailableAssets(state = this.state) {
        const { feeStatus } = this.state;
        function hasFeePoolBalance(id) {
            if (feeStatus[id] === undefined) return true;
            return feeStatus[id] && feeStatus[id].hasPoolBalance;
        }

        function hasBalance(id) {
            if (feeStatus[id] === undefined) return true;
            return feeStatus[id] && feeStatus[id].hasBalance;
        }

        const { from_account, from_error } = state;
        let asset_types = [], fee_asset_types = [];
        if (!(from_account && from_account.get("balances") && !from_error)) {
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
        let { fee_asset_id, from_account } = state;
        const { fee_asset_types } = this._getAvailableAssets(state);
        if ( fee_asset_types.length === 1 && fee_asset_types[0] !== fee_asset_id) {
            fee_asset_id = fee_asset_types[0];
        }
        if (!from_account) return null;
        checkFeeStatusAsync({
            accountID: from_account.get("id"),
            feeID: fee_asset_id,
            options: ["price_per_kbyte"],
            data: {
                type: "memo",
                content: state.memo
            }
        })
        .then(({fee, hasBalance, hasPoolBalance}) => {
            this.setState({
                feeAmount: fee,
                fee_asset_id: fee.asset_id,
                hasBalance,
                hasPoolBalance,
                error: (!hasBalance || !hasPoolBalance)
            });
        });
    }

    toChanged(to_name) {
        this.setState({to_name, error: null});
    }

    onToAccountChanged(to_account) {
        this.setState({to_account, error: null});
    }

    onAmountChanged({amount, asset}) {
        if (!asset) {
            return;
        }
        this.setState({amount, asset, asset_id: asset.get("id"), error: null}, this._checkBalance);
    }

    onMemoChanged(e) {
        this.setState({memo: e.target.value}, this._updateFee);
    }

    onTrxIncluded(confirm_store_state) {
        if(confirm_store_state.included && confirm_store_state.broadcasted_transaction) {
            // this.setState(Transfer.getInitialState());
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
        } else if (confirm_store_state.closed) {
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
        }
    }

    render() {
        const {account_name} = this.props;
        let {propose, from_account, to_account, asset, asset_id, propose_account, feeAmount,
            amount, error, to_name, from_name, memo, feeAsset, fee_asset_id, balanceError} = this.state;
        let from_my_account = AccountStore.isMyAccount(from_account) || from_name === this.props.passwordAccount;
            
        if(from_account && ! from_my_account && ! propose ) {
            from_error = <span>
                {counterpart.translate("account.errors.not_yours")}
                &nbsp;(<a onClick={this.onPropose.bind(this, true)}>{counterpart.translate("propose")}</a>)
            </span>;
        }
        
        let { asset_types, fee_asset_types } = this._getAvailableAssets();
        let balance = null;

        // Estimate fee
        let fee = this.state.feeAmount.getAmount({real: true});
        if (from_account && from_account.get("balances") && !from_error) {

            let account_balances = from_account.get("balances").toJS();
            if (asset_types.length === 1) asset = ChainStore.getAsset(asset_types[0]);
            if (asset_types.length > 0) {
                let current_asset_id = asset ? asset.get("id") : asset_types[0];
                let feeID = feeAsset ? feeAsset.get("id") : "1.3.0";
                balance = (<span style={{borderBottom: "#A09F9F 1px dotted", cursor: "pointer"}} onClick={this._setTotal.bind(this, current_asset_id, account_balances[current_asset_id], fee, feeID)}><Translate component="span" content="transfer.available"/>: <BalanceComponent balance={account_balances[current_asset_id]}/></span>);
            } else {
                balance = "No funds";
            }
        }

        let propose_incomplete = propose && ! propose_account;
        const amountValue = parseFloat(String.prototype.replace.call(amount, /,/g, ""));
        const isAmountValid = amountValue && !isNaN(amountValue);
        const isToAccountValid = to_account && to_account.get("name") === to_name;
        const isSendNotValid = !from_account || !isToAccountValid || !isAmountValid || !asset || from_error || propose_incomplete || balanceError;
        let accountsList = Immutable.Set();
        accountsList = accountsList.add(from_account);
        let tabIndex = 1;

        let logo = require("assets/logo-ico-blue.png");

        return (
            <BaseModal id="send_modal" overlay={true} ref="send_modal">
                <div className="grid-block vertical no-overflow">
                    <div style={{textAlign: "center", textTransform: "none"}}>
                        <img style={{margin: 0, height: 60, marginBottom: 10}} src={logo} /><br />
                        <div style={{whiteSpace: "nowrap", fontSize: "1.8rem", fontWeight: "bold", }}>Send from <span style={{color: "lightblue"}}>{account_name}</span></div>
                        <div style={{marginTop: 10, fontSize: "0.8rem", width: "40%", marginLeft: "auto", marginRight: "auto"}}>
                            Transfers are used for sending funds to other BitShares Account Holders
                        </div>
                    </div>
                    <div className="SimpleTrade__withdraw-row">
                        {/*  T O  */}
                        <div className="content-block">
                            <AccountSelector
                                label="transfer.to"
                                accountName={to_name}
                                account={to_name}
                                onChange={this.toChanged.bind(this)}
                                onAccountChanged={this.onToAccountChanged.bind(this)}
                                size={60}
                                tabIndex={tabIndex++}
                            />
                        </div>
                        {/*  A M O U N T   */}
                        <div className="content-block transfer-input">
                            <AmountSelector
                                label="transfer.amount"
                                amount={amount}
                                onChange={this.onAmountChanged.bind(this)}
                                asset={asset_types.length > 0 && asset ? asset.get("id") : ( asset_id ? asset_id : asset_types[0])}
                                assets={asset_types}
                                display_balance={balance}
                                tabIndex={tabIndex++}
                            />
                            {this.state.balanceError ? 
                                <p className="has-error no-margin" style={{paddingTop: 10}}>
                                    <Translate content="transfer.errors.insufficient" />
                                </p> : null}
                        </div>
                        {/*  M E M O  */}
                        <div className="content-block transfer-input">
                            {memo && memo.length ? <label className="right-label">{memo.length}</label> : null}
                            <Translate className="left-label tooltip" component="label" content="transfer.memo" data-place="top" data-tip={counterpart.translate("tooltip.memo_tip")}/>
                            <textarea style={{marginBottom: 0}} rows="1" value={memo} tabIndex={tabIndex++} onChange={this.onMemoChanged.bind(this)} />
                            {/* warning */}
                            { this.state.propose ?
                                <div className="error-area" style={{position: "absolute"}}>
                                    <Translate content="transfer.warn_name_unable_read_memo" name={this.state.from_name} />
                                </div>
                            :null}
                        </div>
                    </div>
                </div>
            </BaseModal>
        );
    }
}
