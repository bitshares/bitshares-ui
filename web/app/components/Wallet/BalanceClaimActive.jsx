
import React, {Component, PropTypes} from "react";
import alt from "alt-instance"
import connectToStores from "alt/utils/connectToStores"
import Immutable from "immutable"
import cname from "classnames"
import notify from "actions/NotificationActions"

import LoadingIndicator from "components/LoadingIndicator";
import WalletDb from "stores/WalletDb";
import AccountRefsStore from "stores/AccountRefsStore"
import BalanceClaimActiveStore from "stores/BalanceClaimActiveStore";
import BalanceClaimActiveActions from "actions/BalanceClaimActiveActions"
import BalanceClaimSelector from "components/Wallet/BalanceClaimSelector"
import WalletActions from "actions/WalletActions"
import WalletUnlock from "components/Wallet/WalletUnlock"
import MyAccounts from "components/Forms/MyAccounts"
import Translate from "react-translate-component";

@connectToStores
export default class BalanceClaimActive extends Component {
    
    static getStores() {
        return [BalanceClaimActiveStore, AccountRefsStore, WalletDb]
    }
    
    static getPropsFromStores() {
        var props = BalanceClaimActiveStore.getState()
        props.account_refs = AccountRefsStore.getState().account_refs
        return props
    }
    
    componentWillMount() {
        var keySeq = WalletDb.keys().keySeq()
        BalanceClaimActiveActions.setPubkeys( keySeq )
        this.existing_keys = keySeq
    }
    
    componentWillReceiveProps(nextProps) {
        var keySeq = WalletDb.keys().keySeq()
        if( ! keySeq.equals(this.existing_keys)) {
            this.existing_keys = keySeq
            BalanceClaimActiveActions.setPubkeys( keySeq )
        }
    }    
   
    render() {
        
        if( !this.props.account_refs.size) {
            return (
                <div>
                    <h5><WalletUnlock><Translate content="wallet.no_balance" /></WalletUnlock></h5>
                </div>
            );
        }

        if( this.props.loading) {
            return (
                <div className="center-content">
                    <br/>
                    <h5><Translate content="wallet.loading_balances"/>&hellip;</h5>
                    <br/>
                    <LoadingIndicator type="three-bounce"/>
                </div>
            );
        }

        if( !this.props.balances || !this.props.balances.size) {
            return (
                <div>
                    <h5><WalletUnlock><Translate content="wallet.no_balance" /></WalletUnlock></h5>
                </div>
            );
        }

        var import_ready = this.props.selected_balances.size && this.props.claim_account_name
        var claim_balance_label = import_ready ?
                ` (${this.props.claim_account_name})` :
                null;
        
        return (
            <div>
                <div className="content-block center-content">
                    <h3 className="no-border-bottom"><Translate content="wallet.claim_balances" /></h3>
                </div>
                <div className="grid-block vertical">
                    <div className="grid-content" style={{overflowY:'hidden !important'}}>
                        <div className="full-width-content center-content">
                            <MyAccounts 
                                key={this.props.balances}
                                accounts={Immutable.List(this.props.account_refs)}
                                onChange={this.onClaimAccountChange.bind(this)}/>
                        </div>
                        <br></br>
                    </div>
                    <br/>
                    <BalanceClaimSelector/>
                </div>
                <br/><br/>
                <div className={ cname("button success", {disabled: !import_ready}) }
                    onClick={this.onClaimBalance.bind(this)}>
                    <Translate content="wallet.claim_balance" />{claim_balance_label}</div>
                <div className="button cancel" onClick={this.onBack.bind(this)}><Translate content="wallet.cancel" /></div>
            </div>
        )
    }
    
    onBack(e) {
        e.preventDefault()
        window.history.back()
    }
    
    onClaimAccountChange(claim_account_name) {
        BalanceClaimActiveActions.claimAccountChange(claim_account_name)
    }
    
    onClaimBalance() {
        WalletActions.importBalance(
            this.props.claim_account_name,
            this.props.selected_balances, true //broadcast
        ).catch((error)=> {
            console.error("claimBalance", error, "stack", error.stack)
            var message = error
            try { message = error.data.message } catch(e) {}
            notify.error("Error claiming balance: " + message)
            throw error
        })
    }
    
}

