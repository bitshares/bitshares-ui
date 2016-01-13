import React from "react";
import BalanceComponent from "../Utility/BalanceComponent";
import AccountActions from "actions/AccountActions";
import Translate from "react-translate-component";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountSelect from "../Forms/AccountSelect";
import AccountSelector from "../Account/AccountSelector";
import AccountStore from "stores/AccountStore";
import AmountSelector from "../Utility/AmountSelector";
import utils from "common/utils";
import counterpart from "counterpart";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import RecentTransactions from "../Account/RecentTransactions";
import Immutable from "immutable";
import ChainStore from "api/ChainStore";
import TransferReceiptModal from "../Stealth/TransferReceiptModal";

class Transfer extends React.Component {

    constructor(props) {
        super(props);
        this.state = Transfer.getInitialState();
        let {query} = this.props.location;

        if(query.from) this.state.from_name = query.from;
        if(query.to) this.state.to_name = query.to;
        if(query.amount) this.state.amount = query.amount;
        if(query.asset) this.state.asset_id = query.asset;
        if(query.memo) this.state.memo = query.memo;
        let currentAccount = AccountStore.getState().currentAccount;
        if (!this.state.from_name && query.to !== currentAccount) this.state.from_name = currentAccount;
        this.onTrxIncluded = this.onTrxIncluded.bind(this);
    }

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
            propose_account: ""
        };
    };

    componentWillMount() {
        this.nestedRef = null;
    }
    
    fromChanged(from_name) {
        let asset = undefined
        let amount = undefined
        this.setState({from_name,asset,amount, error: null, propose: false, propose_account: ""})
    }

    toChanged(to_name) {
        this.setState({to_name, error: null})
    }

    onFromAccountChanged(from_account) {
        this.setState({from_account, error: null})
    }

    onToAccountChanged(to_account) {
        this.setState({to_account, error: null})
    }

    onAmountChanged(fee_asset_types, {amount, asset}) {
        this.setState({amount, asset, error: null});

        if (this.state.asset !== asset && fee_asset_types.indexOf(asset.get("id")) !== -1) {
            this.setState({feeAsset: asset});
            this.nestedRef.onChange({target: {value: asset.get("id")}});
        }
    }

    onFeeChanged({amount, asset}) {
        this.setState({feeAsset: asset, error: null})
    }

    onMemoChanged(e) {
        this.setState({memo: e.target.value});
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
    
    onPropose(propose, e) {
        e.preventDefault()
        this.setState({ propose, propose_account: null })
    }
    
    onProposeAccount(propose_account) {
        this.setState({ propose_account });
    }

    onSubmit(e) {
        e.preventDefault();
        this.setState({error: null});
        let asset = this.state.asset;
        let precision = utils.get_asset_precision(asset.get("precision"));
        let amount = this.state.amount.replace( /,/g, "" )
        AccountActions.transfer(
            this.state.from_account.get("id"),
            this.state.to_account.get("id"),
            parseInt(amount * precision, 10),
            asset.get("id"),
            this.state.memo,
            this.state.propose ? this.state.propose_account : null,
            this.state.feeAsset ? this.state.feeAsset.get("id") : "1.3.0"
        ).then( () => {
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.listen(this.onTrxIncluded);
        }).catch( e => {
            let msg = e.message ? e.message.split( '\n' )[1] : null;
            console.log( "error: ", e, msg)
            this.setState({error: msg})
        } );
    }

    setNestedRef(ref) {
        this.nestedRef = ref;
    }

    _setTotal(asset_id, balance_id, fee, fee_asset_id, e) {
        let balanceObject = ChainStore.getObject(balance_id);
        let transferAsset = ChainStore.getObject(asset_id);
        let feeAsset = ChainStore.getObject(fee_asset_id);
        if (balanceObject) {
            let amount = (utils.get_asset_amount(balanceObject.get("balance"), transferAsset) - (asset_id === fee_asset_id ? fee : 0)).toString();
            this.setState({amount});
        }
    }

    render() {
        let from_error = null;
        let {propose, from_account, to_account, asset, asset_id, propose_account,
            amount, error, to_name, from_name, memo, feeAsset} = this.state;

        let from_my_account = AccountStore.isMyAccount(from_account)
        if(from_account && ! from_my_account && ! propose ) {
            from_error = counterpart.translate("account.errors.not_yours");
        }

        let asset_types = [], fee_asset_types = [];
        let balance = null;

        // Estimate fee
        let globalObject = ChainStore.getObject("2.0.0");
        let fee = utils.estimateFee("transfer", null, globalObject);
        if (from_account && !from_error) {
            let account_balances = from_account.get("balances").toJS();
            asset_types = Object.keys(account_balances).sort(utils.sortID);
            fee_asset_types = Object.keys(account_balances).sort(utils.sortID);
            for (let key in account_balances) {
                let asset = ChainStore.getObject(key);
                let balanceObject = ChainStore.getObject(account_balances[key]);
                if (balanceObject && balanceObject.get("balance") === 0) {
                    asset_types.splice(asset_types.indexOf(key), 1);
                    fee_asset_types.splice(fee_asset_types.indexOf(key), 1);
                } if (asset) {
                    if (asset.get("id") !== "1.3.0" && !utils.isValidPrice(asset.getIn(["options", "core_exchange_rate"]))) {
                        fee_asset_types.splice(fee_asset_types.indexOf(key), 1);
                    }
                }
            }

            // Finish fee estimation
            let core = ChainStore.getObject("1.3.0");
            if (feeAsset && feeAsset.get("id") !== "1.3.0") {
                let price = utils.convertPrice(core, feeAsset);
                fee = utils.convertValue(price, fee, core, feeAsset);
            }
            if (core) {
                fee = utils.limitByPrecision(utils.get_asset_amount(fee, feeAsset || core), feeAsset ? feeAsset.get("precision") : core.get("precision"));
            }

            if (asset_types.length > 0) {
                let current_asset_id = asset ? asset.get("id") : asset_types[0];
                let feeID = feeAsset ? feeAsset.get("id") : "1.3.0";
                balance = (<span style={{borderBottom: "#A09F9F 1px dotted", cursor: "pointer"}} onClick={this._setTotal.bind(this, current_asset_id, account_balances[current_asset_id], fee, feeID)}><Translate component="span" content="transfer.available"/>: <BalanceComponent balance={account_balances[current_asset_id]}/></span>)
            } else {
                balance = "No funds";
            }
        }
        let propose_incomplete = propose && ! propose_account
        let submitButtonClass = "button";
        if(!from_account || !to_account || !amount || amount === "0"|| !asset || from_error || propose_incomplete)
            submitButtonClass += " disabled";

        let accountsList = Immutable.Set();
        accountsList = accountsList.add(from_account)
        let tabIndex = 1

        return (
            <div className="grid-block vertical medium-horizontal" style={{paddingTop: "2rem"}}>
            <form className="grid-content medium-6 full-width-content" onSubmit={this.onSubmit.bind(this)} noValidate>
                <div className="grid-content no-overflow">
                    {/*  F R O M  */}
                    <div className="content-block">
                        <AccountSelector label="transfer.from" ref="from"
                                         accountName={from_name}
                                         onChange={this.fromChanged.bind(this)}
                                         onAccountChanged={this.onFromAccountChanged.bind(this)}
                                         account={from_name}
                                         error={from_error}
                                         tabIndex={tabIndex++}/>
                    </div>
                    {/*  T O  */}
                    <div className="content-block">
                        <AccountSelector label="transfer.to"
                                         accountName={to_name}
                                         onChange={this.toChanged.bind(this)}
                                         onAccountChanged={this.onToAccountChanged.bind(this)}
                                         account={to_name}
                                         tabIndex={tabIndex++}/>
                    </div>
                    {/*  A M O U N T   */}
                    <div className="content-block" style={{paddingLeft: "96px"}}>
                        <AmountSelector label="transfer.amount"
                                        amount={amount}
                                        onChange={this.onAmountChanged.bind(this, fee_asset_types)}
                                        asset={asset_types.length > 0 && asset ? asset.get("id") : ( asset_id ? asset_id : asset_types[0])}
                                        assets={asset_types}
                                        display_balance={balance}
                                        tabIndex={tabIndex++}/>
                    </div>
                    {/*  M E M O  */}
                    <div className="content-block" style={{paddingLeft: "96px"}}>
                        <label><Translate component="span" content="transfer.memo"/></label>
                        <textarea rows="1" value={memo} tabIndex={tabIndex++} onChange={this.onMemoChanged.bind(this)}/>
                        {/*<div>{memo_error}</div>*/}
                    </div>

                    {/*  F E E   */}
                    <div className="content-block" style={{paddingLeft: "96px"}}>
                        <AmountSelector refCallback={this.setNestedRef.bind(this)}
                                        label="transfer.fee"
                                        disabled={true}
                                        amount={fee}
                                        onChange={this.onFeeChanged.bind(this)}
                                        asset={fee_asset_types.length > 0 && feeAsset ? feeAsset.get("id") : ( asset_id ? asset_id : fee_asset_types[0])}
                                        assetValue={feeAsset ? feeAsset.get("id") : "1.3.0"}
                                        assets={fee_asset_types}
                                        tabIndex={tabIndex++}                                        
                                        />
                    </div>
                    
                    {/* P R O P O S E   F R O M */}
                    {propose ?
                    <div className="full-width-content form-group" style={{paddingLeft: "96px"}}>
                        <label><Translate content="account.propose_from" /></label>
                        <AccountSelect account_names={AccountStore.getMyAccounts()}
                            onChange={this.onProposeAccount.bind(this)} tabIndex={tabIndex++}/>
                    </div>:null}

                    {/*  S E N D  B U T T O N  */}
                    {error ? <div className="content-block has-error">{error}</div> : null}
                    <div style={{paddingLeft: "96px"}}>
                        {propose ?
                        <span>
                            <button className={submitButtonClass} type="submit" value="Submit" tabIndex={tabIndex++}>
                                <Translate component="span" content="propose" />
                            </button>
                            <button className="secondary button" onClick={this.onPropose.bind(this, false)} tabIndex={tabIndex++}>
                                <Translate component="span" content="cancel" />
                            </button>
                        </span>:<span>
                            <button className={submitButtonClass} type="submit" value="Submit" tabIndex={tabIndex++}>
                                <Translate component="span" content="transfer.send" />
                            </button>
                        </span>}
                    </div>

                    {/* TODO: show remaining balance */}

                    <a className="float-right" href onClick={(e) => {e.preventDefault(); ZfApi.publish("transfer_receipt_modal", "open")} }>Show Transfer Receipt</a>

                </div>
                <TransferReceiptModal value="fdlksjf ldksjflkdsjflkdsj dslkjf lksdjflksd fkljsd klsdl"/>
            </form>
            <div className="grid-content medium-6 right-column">
                <div className="grid-content">
                    <RecentTransactions
                        accountsList={accountsList}
                        limit={25}
                        compactView={true}
                        filter="transfer"
                    />
                </div>
            </div>
            </div>
        );
    }
}

export default Transfer;
