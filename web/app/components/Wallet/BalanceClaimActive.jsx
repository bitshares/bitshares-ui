import WalletDb from "stores/WalletDb";
import FormattedAsset from "components/Utility/FormattedAsset";
import LoadingIndicator from "components/LoadingIndicator";
import ExistingAccountsAccountSelect from "components/Forms/ExistingAccountsAccountSelect";
import lookup from "chain/lookup";
import v from "chain/serializer_validation";
import BalanceClaimActions from "actions/BalanceClaimActions"

import notify from "actions/NotificationActions";
import cname from "classnames";
import Immutable from "immutable"
import alt from "alt-instance"
import React, {Component, PropTypes} from "react";
import connectToStores from "alt/utils/connectToStores"
import BalanceClaimActiveStore from "stores/BalanceClaimActiveStore";
import PrivateKeyStore from "stores/PrivateKeyStore";
import AccountRefsStore from "stores/AccountRefsStore"
import BalanceClaimActiveActions from "actions/BalanceClaimActiveActions"
import BalanceClaimSelector from "components/Wallet/BalanceClaimSelector"
import WalletActions from "actions/WalletActions"

@connectToStores
export default class BalanceClaimActive extends Component {
    
    constructor() {
        super();
        this.state = this._getInitialState();
    }
    
    _getInitialState() {
        return {
            claim_account_name: null
        };
    }
    
    reset() {
        this.setState(this._getInitialState())
        BalanceClaimActiveStore.clearCache()
    }
    
    static getStores() {
        return [BalanceClaimActiveStore, AccountRefsStore, PrivateKeyStore]
    }
    
    static getPropsFromStores() {
        var props = BalanceClaimActiveStore.getState()
        props.account_refs = AccountRefsStore.getState().account_refs
        return props
    }
    
    componentWillMount() {
        BalanceClaimActiveActions.setPubkeys(
            PrivateKeyStore.getState().keys.keySeq().toArray()
        )
    }
    
    componentWillUnmount() {
        // console.log("bal componentWillUnmount");
        BalanceClaimActiveStore.clearCache()// TODO does not rerender
    }
    
    render() {
        if( ! this.props.balances.size) return <div></div>
        var import_ready = this.props.selected_balances.size && this.props.claim_account_name
        var claim_balance_label = import_ready ?
                `Claim Balance to account: ${this.props.claim_account_name}` :
                "Claim Balance"
        return (
            <div>
                <hr/>
                <div className="content-block center-content">
                    <h3 className="no-border-bottom">Claim balances</h3>
                </div>
                <div className="grid-block vertical">
                    <div className="grid-content">
                        <div className="full-width-content center-content">{/* TODO fix center */}
                            <MyAccounts accounts={Immutable.List(this.props.account_refs)}
                                onChange={this.onClaimAccountChange.bind(this)}/>
                        </div>{/*{
                        this.props.my_accounts_loading ||
                        this.props.balances_loading ||
                        import_keys_loading ? 
                        <LoadingIndicator type="circle"/> : <div/>}*/}
                        <br></br>
                        <div className="button-group">
                            <div className={ cname("button success", {disabled: !import_ready}) }
                                onClick={this.onClaimBalance.bind(this)}>
                                {claim_balance_label}
                            </div>
                        </div>
                    </div>
                    <br/>
                    <BalanceClaimSelector/>
                </div>
            </div>
        )
    }
    
    onClaimAccountChange(claim_account_name) {
        BalanceClaimActiveActions.claimAccountChange(claim_account_name)
    }
    
    onClaimBalance() {
        WalletActions.importBalance(
            this.props.claim_account_name,
            this.props.selected_balances,
            true //broadcast
        ).catch((error)=> {
            console.error("claimBalance", error)
            var message = error
            try { message = error.data.message } catch(e) {}
            notify.error("Error claiming balance: " + message)
            throw error
        })
    }
    
}

import AccountStore from "stores/AccountStore"
import ChainTypes from "components/Utility/ChainTypes"
import AccountSelect from "components/Forms/AccountSelect"
import BindToChainState from "components/Utility/BindToChainState"

@BindToChainState({keep_updating: true})
class MyAccounts extends Component {

    static propTypes = {
        accounts: ChainTypes.ChainAccountsList.isRequired,
        onChange: React.PropTypes.func.isRequired
    }
    
    render() {
        var account_names = this.props.accounts
            .filter( account => !!account )
            .filter( account => AccountStore.getMyAuthorityForAccount(account) === "full" )
            .map( account => account.get("name") ).sort()
        
        return <span>
            <AccountSelect onChange={this.onAccountSelect.bind(this)}
                account_names={account_names} center={true}/>
        </span>
    }
    
    onAccountSelect(account_name) {
        this.props.onChange(account_name)
    }

}