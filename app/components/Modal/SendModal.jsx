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
import ChainTypes from "../Utility/ChainTypes";
import BalanceComponent from "../Utility/BalanceComponent";
import AccountActions from "actions/AccountActions";
import utils from "common/utils";
import counterpart from "counterpart";
import { RecentTransactions } from "../Account/RecentTransactions";
import {connect} from "alt-react";
import classnames from "classnames";

export default class SendModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = SendModal.getInitialState();
        
        if(this.props.to_name) {
            console.log("Got Prop Name");
            this.state.to_name = this.props.to_name;
            this.state.to_account = ChainStore.getAccount(this.props.to_name);
        }

        if(this.props.from_name) {
            console.log("Got Prop From");
            this.state.from_name = this.props.from_name;
            this.state.from_account = ChainStore.getAccount(this.props.from_name);
        }

        let currentAccount = AccountStore.getState().currentAccount;
        if (!this.state.from_name) this.state.from_name = currentAccount;
        
        console.log("From Name: " + this.state.from_name);
        console.log(ChainStore.getAccount(this.props.to_name));
        console.log("To Name: " + this.state.to_name);
        console.log(this.state.to_account);

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
        this.setState({open: true}, () => {
            ZfApi.publish("send_modal", "open");
        });
    }

    onClose() {
        this.setState({open: false});
        this._emptyForm();
    }

    _exmptyForm() {
        this.setState({
            from_name: "",
            from_account: null,
            to_name: "",
            to_account: null,
            amount: "",
            memo: ""
        });
    }

    componentWillMount() {
        console.log("componentWillMount");
        this.nestedRef = null;
        this._updateFee();
        this._checkFeeStatus();
    }

    shouldComponentUpdate(np, ns) {
        console.log("shouldComponentUpdate");
        let { asset_types: current_types } = this._getAvailableAssets();
        let { asset_types: next_asset_types } = this._getAvailableAssets(ns);

        if (next_asset_types.length === 1) {
            let asset = ChainStore.getAsset(next_asset_types[0]);
            if (current_types.length !== 1) {
                this.onAmountChanged({amount: ns.amount, asset});
            }

            if (next_asset_types[0] !== this.state.fee_asset_id) {
                if (asset && this.state.fee_asset_id !== next_asset_types[0]) {
                    this.setState({
                        feeAsset: asset,
                        fee_asset_id: next_asset_types[0]
                    });
                }
            }
        }
        return true;
    }

    componentWillReceiveProps(np) {
        console.log("componentWillReceiveProps");
        console.log(np);
        this.setState({
            from_name: np.from_name,
            from_account: ChainStore.getAccount(np.from_name),
            to_name: (np.to_name ? np.to_name : ""),
            to_account: (np.to_name ? ChainStore.getAccount(np.to_name) : null),
            feeStatus: {},
            fee_asset_id: "1.3.0",
            feeAmount: new Asset({amount: 0})
        }, () => {this._updateFee(); this._checkFeeStatus(ChainStore.getAccount(np.from_name));});
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
        if (!amount) return this.setState({balanceError: false});
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
    
    _setTotal(asset_id, balance_id) {
        const {feeAmount} = this.state;
        let balanceObject = ChainStore.getObject(balance_id);
        let transferAsset = ChainStore.getObject(asset_id);

        let balance = new Asset({amount: balanceObject.get("balance"), asset_id: transferAsset.get("id"), precision: transferAsset.get("precision")});

        if (balanceObject) {
            if (feeAmount.asset_id === balance.asset_id) {
                balance.minus(feeAmount);
            }
            this.setState({amount: balance.getAmount({real: true})}, this._checkBalance);
        }
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

    setNestedRef(ref) {
        this.nestedRef = ref;
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

    onFeeChanged({asset}) {
        this.setState({feeAsset: asset, fee_asset_id: asset.get("id"), error: null}, this._updateFee);
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
        let from_error = null;
        let {propose, from_account, to_account, asset, asset_id, propose_account, feeAmount, amount, error, to_name, from_name, memo, feeAsset, fee_asset_id, balanceError} = this.state;
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
                let _insufficientFundsError = this.state.balanceError ? "red" : "";

                balance = (<span><Translate component="span" content="transfer.available"/>: <span style={{borderBottom: "#A09F9F 1px dotted", cursor: "pointer", color: _insufficientFundsError}} onClick={this._setTotal.bind(this, current_asset_id, account_balances[current_asset_id], fee, feeID)}><BalanceComponent balance={account_balances[current_asset_id]}/></span></span>);
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

        const logo = require("assets/logo-ico-blue.png");
        let tabIndex = 1;

        return (
            <BaseModal id="send_modal" overlay={true} ref="send_modal">
                <div className="grid-block vertical no-overflow">
                    <div style={{textAlign: "center", textTransform: "none"}}>
                        <img style={{margin: 0, height: 60, marginBottom: 10}} src={logo} /><br />
                        <div style={{whiteSpace: "nowrap", fontSize: "1.8rem", fontWeight: "bold", }}>Send from <span style={{color: "lightblue"}}>{from_name}</span></div>
                        <div style={{marginTop: 10, fontSize: "0.8rem", width: "40%", marginLeft: "auto", marginRight: "auto"}}>
                            Transfers are used for sending funds to other BitShares Account Holders
                        </div>
                    </div>
                    <div>
                        {/* T O */}
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
                        
                        <div className="content-block transfer-input">
                            <div className="no-margin no-padding">
                                {/*  A M O U N T  */}
                                <div className="small-6">
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
                                {/*  F E E   */}
                                <div className="small-6">
                                    <AmountSelector
                                        label="transfer.fee"
                                        disabled={true}
                                        amount={fee}
                                        onChange={this.onFeeChanged.bind(this)}
                                        asset={fee_asset_types.length && feeAmount ? feeAmount.asset_id : ( fee_asset_types.length === 1 ? fee_asset_types[0] : fee_asset_id ? fee_asset_id : fee_asset_types[0])}
                                        assets={fee_asset_types}
                                        tabIndex={tabIndex++}
                                        error={this.state.hasPoolBalance === false ? "transfer.errors.insufficient" : null}
                                    />
                                </div>
                            </div>
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
                        
                       
                        <div className="SimpleTrade__withdraw-row">
                            <div className="no-margin no-padding">
                                <div className="small-6"  style={{paddingRight: 10}}>
                                    <button className={classnames("button no-margin")} type="submit" value="Cancel" tabIndex={tabIndex++}>
                                        <Translate component="span" content="transfer.cancel" />
                                    </button>
                                    {propose ?
                                        <button className={classnames("button no-margin", {disabled: isSendNotValid})} type="submit" value="Submit" tabIndex={tabIndex++}>
                                            <Translate component="span" content="propose" />
                                        </button> :
                                        <button className={classnames("button no-margin", {disabled: isSendNotValid})} type="submit" value="Submit" tabIndex={tabIndex++}>
                                            <Translate component="span" content="transfer.send" />
                                        </button>
                                    }
                                </div>
                                <div className="small-6"  style={{paddingLeft: 10}}>
                                    <label style={{paddingTop: "0.5rem", paddingRight: "0.5rem"}}><Translate content="propose" />:</label>
                                    <div className="switch">
                                        <input type="checkbox" />
                                        <label />
                                    </div>
                                </div>
                            </div> 
                        </div>
                    </div>
                </div>
            </BaseModal>
        );
    }
};

SendModal = connect(SendModal, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        
        return {
            currentAccount: AccountStore.getState().currentAccount,
            passwordAccount: AccountStore.getState().passwordAccount
        };
    }
});

/* Export functions from Transfer/Transfer.jsx */