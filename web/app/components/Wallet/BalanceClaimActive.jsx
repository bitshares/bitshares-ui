
import React, {Component, PropTypes} from "react";
import alt from "alt-instance"
import connectToStores from "alt/utils/connectToStores"
import Immutable from "immutable"
import cname from "classnames"

import LoadingIndicator from "components/LoadingIndicator";
import PrivateKeyStore from "stores/PrivateKeyStore";
import AccountRefsStore from "stores/AccountRefsStore"
import BalanceClaimActiveStore from "stores/BalanceClaimActiveStore";
import BalanceClaimActiveActions from "actions/BalanceClaimActiveActions"
import BalanceClaimSelector from "components/Wallet/BalanceClaimSelector"
import WalletActions from "actions/WalletActions"
import MyAccounts from "components/Forms/MyAccounts"

@connectToStores
export default class BalanceClaimActive extends Component {
    
    static getStores() {
        return [BalanceClaimActiveStore, AccountRefsStore, PrivateKeyStore]
    }
    
    static getPropsFromStores() {
        var props = BalanceClaimActiveStore.getState()
        props.account_refs = AccountRefsStore.getState().account_refs
        return props
    }
    
    componentWillMount() {
        this.existing_keys = PrivateKeyStore.getState().keys
        BalanceClaimActiveActions.setPubkeys( this.existing_keys.keySeq().toArray() )
    }
    
    componentWillUnmount() {
        BalanceClaimActiveStore.clearCache()
    }
    
    componentWillReceiveProps(nextProps) {
        var keys = PrivateKeyStore.getState().keys
        if( ! keys.equals(this.existing_keys)) {
            this.existing_keys = keys
            BalanceClaimActiveActions.setPubkeys( keys.keySeq().toArray() )
        }
    }
    
    render() {
        if( this.props.loading) return <div className="center-content">
            <p></p>
            <h5>Loading balance claims&hellip;</h5>
            <LoadingIndicator type="circle"/>
        </div>
        
        if( ! this.props.balances.size) return <div>
            <hr/>
            <h5>No Balances</h5>
        </div>
        
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
                        <div className="full-width-content center-content">
                            <MyAccounts accounts={Immutable.List(this.props.account_refs)}
                                onChange={this.onClaimAccountChange.bind(this)}/>
                        </div>
                        <br></br>
                        <div>
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

