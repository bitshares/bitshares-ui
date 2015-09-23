import WalletDb from "stores/WalletDb";
import FormattedAsset from "components/Utility/FormattedAsset";
import LoadingIndicator from "components/LoadingIndicator";
import ExistingAccountsAccountSelect from "components/Forms/ExistingAccountsAccountSelect";
import notify from "actions/NotificationActions";
import cname from "classnames";
import lookup from "chain/lookup";
import v from "chain/serializer_validation";
import BalanceClaimActions from "actions/BalanceClaimActions"

import Immutable from "immutable"
import alt from "alt-instance"
import React, {Component, PropTypes} from "react";
import connectToStores from "alt/utils/connectToStores"
import BalanceClaimActiveStore from "stores/BalanceClaimActiveStore";
import PrivateKeyStore from "stores/PrivateKeyStore";
import BalanceClaimActiveActions from "actions/BalanceClaimActiveActions"
import BalanceClaimSelector from "components/Wallet/BalanceClaimSelector"

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
        return [BalanceClaimActiveStore]
    }
    
    static getPropsFromStores() {
        var props = BalanceClaimActiveStore.getState()
        return props
    }
    
    componentWillMount() {
        BalanceClaimActiveActions.setPubkeys(
            PrivateKeyStore.getState().keys.keySeq().toArray()
        )
    }
    
    render() {
        if( ! this.props.balances.size) return <div></div>
        return (
            <div>
                <hr/>
                <div className="content-block center-content">
                    <h3 className="no-border-bottom">Claim balances</h3>
                </div>
                <div>
                    <div className="center-content">
                        <div className="center-content">
                            {/*<MyAccountsSelect
                                account_names={this.props.my_accounts}
                                onChange={this._claimAccountSelect.bind(this)}
                                list_size={5}
                            />*/}
                        </div>{/*
                        {
                            this.props.my_accounts_loading ||
                            this.props.balances_loading ||
                            import_keys_loading ? 
                            <LoadingIndicator type="circle"/> : <div/>}
                        <br></br>
                        <div className="button-group">
                            <div className={ cname("button success", {disabled: !import_ready}) }
                                onClick={this._claimBalances.bind(this, claim_account_name)}
                            >
                                {claim_balance_label}
                            </div>
                        </div>*/}
                    </div>
                    <br/>
                    <BalanceClaimSelector/>
                </div>
            </div>
        )
    }
    
    _claimAccountSelect(claim_account_name) {
        this.setState({claim_account_name})
        
        var checked = new Map()
        var index = -1
        for(let asset_balance of this.props.balance_by_account_asset) {
            index++
            var {accounts} = asset_balance
            if(accounts.length > 1)
                //Don't automate this case, let the user decide which account
                continue
            
            var account_name = accounts[0]
            if(account_name === claim_account_name) {
                var {balance} = asset_balance
                if(balance.unvested.unclaimed || balance.vesting.unclaimed) {
                    checked.set(index, true)
                }
            }
        }
        this.setState({checked})
    }
    
    _claimBalances(claim_account_name) {
        
        var selected_balance_claims = this.state.selected_balance_claims
        var wif_to_balances = this.getWifToBalance(selected_balance_claims)
        var private_key_tcombs = BalanceClaimStore.getState().my_account_private_key_tcombs[claim_account_name]
        
        WalletActions.importBalance(
            claim_account_name,
            wif_to_balances,
            true, //broadcast
            private_key_tcombs
        ).catch((error)=> {
            console.log("_claimBalances", error)
            var message = error
            try { message = error.data.message } catch(e) {}
            notify.error("Error claiming balance: " + message)
            throw error
        })
    }
    
    getWifToBalance(balance_claims) {
        var pubkey_to_balances = {}
        for(let balance_claim of balance_claims) {
            if(balance_claim.is_claimed) continue
            var chain_balance_record = balance_claim.chain_balance_record
            
            if(chain_balance_record.vesting) continue //TODO get_vested_balances
            var balences =
                pubkey_to_balances[balance_claim.pubkey] || []
            
            //vested_balance kept up-to-date in the BalanceStore on refresh
            var vested_balance = balance_claim.vested_balance
            balences.push({chain_balance_record, vested_balance})
            pubkey_to_balances[balance_claim.pubkey] = balences
        }
        var wif_to_balances = {}
        var keys = PrivateKeyStore.getState().keys
        for(let pubkey of Object.keys(pubkey_to_balances)) {
            var balances = pubkey_to_balances[pubkey]
            var private_key_tcomb = PrivateKeyStore.getTcomb_byPubkey(pubkey)
            var public_key_string = private_key_tcomb.pubkey
            var private_key = WalletDb.decryptTcomb_PrivateKey(private_key_tcomb)
            wif_to_balances[private_key.toWif()] = {balances, public_key_string}
        }
        return wif_to_balances
    }
}
