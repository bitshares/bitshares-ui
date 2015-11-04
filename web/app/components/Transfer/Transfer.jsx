import React from "react";
import BalanceComponent from "../Utility/BalanceComponent";
import AccountActions from "actions/AccountActions";
import Translate from "react-translate-component";
import AccountSelect from "../Forms/AccountSelect";
import AccountSelector from "../Account/AccountSelector";
import AccountStore from "stores/AccountStore";
import AmountSelector from "../Utility/AmountSelector";
import utils from "common/utils";
import counterpart from "counterpart";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import RecentTransactions from "../Account/RecentTransactions";
import Immutable from "immutable";

class Transfer extends React.Component {

    static contextTypes = {
        router: React.PropTypes.func.isRequired
    }

    constructor(props) {
        super(props);
        this.state = Transfer.getInitialState();
        if(props.query.from) this.state.from_name = props.query.from;
        if(props.query.to) this.state.to_name = props.query.to;
        if(props.query.amount) this.state.amount = props.query.amount;
        if(props.query.asset) this.state.asset_id = props.query.asset;
        if(props.query.memo) this.state.memo = props.query.memo;
        let currentAccount = AccountStore.getState().currentAccount;
        if (!this.state.from_name && props.query.to !== currentAccount) this.state.from_name = currentAccount;
        this.onTrxIncluded = this.onTrxIncluded.bind(this);
    }

    static getInitialState(){
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
    }
    
    fromChanged(from_name) {
        let asset = undefined
        let amount = undefined
        this.setState({from_name,asset,amount, error: null})
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

    onAmountChanged({amount, asset}) {
        this.setState({amount, asset, error: null})
    }

    onMemoChanged(e) {
        this.setState({memo: e.target.value});
    }

    onTrxIncluded(confirm_store_state) {
        if(confirm_store_state.included && confirm_store_state.broadcasted_transaction) {
            this.setState(Transfer.getInitialState());
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
            this.state.propose ? this.state.propose_account : null
        ).then( () => {
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.listen(this.onTrxIncluded);
        }).catch( e => {
            let msg = e.message ? e.message.split( '\n' )[1] : null;
            console.log( "error: ", e, msg)
            this.setState({error: msg})
        } );
    }

    render() {
        let from_error = null;
        let from_my_account = AccountStore.isMyAccount(this.state.from_account)
        let propose = this.state.propose
        if(this.state.from_account && ! from_my_account && ! propose ) {
            from_error = <span>
                {counterpart.translate("account.errors.not_yours")}
                &nbsp;(<a onClick={this.onPropose.bind(this, true)}>{counterpart.translate("propose")}</a>)
            </span>;
        }

        let asset_types = [];
        let balance = null;
        if (this.state.from_account && !from_error) {
            let account_balances = this.state.from_account.get("balances").toJS();
            asset_types = Object.keys(account_balances);
            if (asset_types.length > 0) {
                let current_asset_id = this.state.asset ? this.state.asset.get("id") : asset_types[0];
                balance = (<span><Translate component="span" content="transfer.available"/>: <BalanceComponent balance={account_balances[current_asset_id]}/></span>)
            } else {
                balance = "No funds";
            }
        }
        let propose_incomplete = this.state.propose && ! this.state.propose_account
        let submitButtonClass = "button";
        if(!this.state.from_account || !this.state.to_account || !this.state.amount || this.state.amount === "0"|| !this.state.asset || from_error || propose_incomplete)
            submitButtonClass += " disabled";

        let accountsList = Immutable.Set();
        accountsList = accountsList.add(this.state.from_account)
        let tabIndex = 1
        return (
            <div className="grid-block vertical medium-horizontal" style={{paddingTop: "2rem"}}>
            <form className="grid-block medium-6 full-width-content" onSubmit={this.onSubmit.bind(this)} noValidate>
                <div className="grid-content no-overflow">
                    {/*  F R O M  */}
                    <div className="content-block">
                        <AccountSelector label="transfer.from" ref="from"
                                         accountName={this.state.from_name}
                                         onChange={this.fromChanged.bind(this)}
                                         onAccountChanged={this.onFromAccountChanged.bind(this)}
                                         account={this.state.from_name}
                                         error={from_error}
                                         tabIndex={tabIndex++}/>
                    </div>
                    {/*  T O  */}
                    <div className="content-block">
                        <AccountSelector label="transfer.to"
                                         accountName={this.state.to_name}
                                         onChange={this.toChanged.bind(this)}
                                         onAccountChanged={this.onToAccountChanged.bind(this)}
                                         account={this.state.to_name}
                                         tabIndex={tabIndex++}/>
                    </div>
                    {/*  A M O U N T   */}
                    <div className="content-block">
                        <AmountSelector label="transfer.amount"
                                        amount={this.state.amount}
                                        onChange={this.onAmountChanged.bind(this)}
                                        asset={asset_types.length > 0 && this.state.asset ? this.state.asset.get("id") : ( this.state.asset_id ? this.state.asset_id : asset_types[0])}
                                        assets={asset_types}
                                        display_balance={balance}
                                        tabIndex={tabIndex++}/>
                    </div>
                    {/*  M E M O  */}
                    <div className="content-block">
                        <label><Translate component="span" content="transfer.memo"/></label>
                        <textarea rows="1" value={this.state.memo} tabIndex={tabIndex++} onChange={this.onMemoChanged.bind(this)}/>
                        {/*<div>{memo_error}</div>*/}
                    </div>
                    
                    {/* P R O P O S E  P A Y  F R O M */}
                    {this.state.propose ?
                    <div className="full-width-content form-group">
                        <label><Translate content="account.pay_from" /></label>
                        <AccountSelect account_names={AccountStore.getMyAccounts()}
                            onChange={this.onProposeAccount.bind(this)} tabIndex={tabIndex++}/>
                    </div>:null}

                    {/*  S E N D  B U T T O N  */}
                    {this.state.error ? <div className="content-block has-error">{this.state.error}</div> : null}
                    <div>
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

                </div>

            </form>
            <div className="grid-block medium-6 right-column">
                <div className="grid-content">
                    <h4><Translate content="account.recent" /></h4>
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
