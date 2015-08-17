import t from "tcomb"
import alt from "alt-instance"
import iDB from "idb-instance"
import idb_helper from "../idb-helper"
import v from "chain/serializer_validation"

import Apis from "rpc_api/ApiInstances"
import WalletDb from "stores/WalletDb"
import AccountStore from "stores/AccountStore";
import PrivateKeyStore from "stores/PrivateKeyStore"
import ImportKeysActions from "actions/ImportKeysActions"
import BalanceClaimActions from "actions/BalanceClaimActions"
import WalletUnlockActions from "actions/WalletUnlockActions"

import chain_api from "api/chain"
import ApplicationApi from "rpc_api/ApplicationApi"
var application_api = new ApplicationApi()
var api = Apis.instance()

export var BalanceClaimTcomb = t.struct({
    chain_balance_record: t.Obj,
    private_key_id: t.Num,
    is_claimed: t.maybe(t.Bool)
})

var TRACE = true

class BalanceClaimStore {
    
    constructor() {
        this.bindActions(BalanceClaimActions)
        this.bindListeners({
            //onRefreshBalanceClaims: ImportKeysActions.saved,
            onLoadMyAccounts: [
                WalletUnlockActions.change//, ImportKeysActions.saved
            ]
        })
        this.state = {
            balances_loading: false,
            balance_claims: [],
            balance_by_account_asset: [],
            my_accounts: [],
            my_accounts_loading: false
        }
    }
    
    refresh() {
    }
        
    onAdd({balance_claim, transaction}) {
        BalanceClaimTcomb(balance_claim)
        return idb_helper.add(
            transaction.objectStore("balance_claims"),
            balance_claim
        )
    }
    
    onRefreshBalanceClaims() {
        if(TRACE) console.log('... BalanceClaimStore.onRefreshBalanceClaims START')
        this.setState({loading: true})
        var balance_claims = [], balance_ids = []
        var p = idb_helper.cursor("balance_claims", cursor => {
            if( ! cursor) return
            var balance_claim = cursor.value
            balance_claims.push( balance_claim )
            balance_ids.push(balance_claim.chain_balance_record.id)
            cursor.continue()
        }).then( ()=> {
            //DEBUG console.log('... refresh')
            if( ! balance_claims.length) {
                this.setBalanceClaims(balance_claims)
                if(TRACE) console.log('... BalanceClaimStore.onRefreshBalanceClaims done, no claims import keys first')
                return
            }
            if(TRACE) console.log('... BalanceClaimStore.onRefreshBalanceClaims get_objects start')
            var db = api.db_api()
            return db.exec("get_objects", [balance_ids]).then( result => {
                if(TRACE) console.log('... BalanceClaimStore.onRefreshBalanceClaims get_objects done')
                for(let i = 0; i < result.length; i++) {
                    var balance_claim = balance_claims[i]
                    var chain_balance_record = result[i]
                    //DEBUG console.log('... chain_balance_record',chain_balance_record)
                    if( ! chain_balance_record) {
                        balance_claims[i] = BalanceClaimTcomb.update(
                            BalanceClaimTcomb(balance_claim),
                            { is_claimed: { '$set': true } }
                        )
                    } else
                        balance_claims[i] = BalanceClaimTcomb.update(
                            BalanceClaimTcomb(balance_claim),
                            { chain_balance_record:
                                { '$set': chain_balance_record } }
                        )
                }
                var transaction = this.transaction_update()
                var store = transaction.objectStore("balance_claims")
                var ps = []
                for(let balance_claim of balance_claims) {
                    var request = store.put(balance_claim)
                    ps.push(idb_helper.on_request_end(request))
                }
                return Promise.all(ps).then( ()=> {
                    this.setBalanceClaims(balance_claims)
                    if(TRACE) console.log('... BalanceClaimStore.onRefreshBalanceClaims DONE')
                })
            })
        }).catch( balance_claim_error => this.setState({balance_claim_error}) )
    }
    
    /** Populate this.state.my_accounts with only account where the wallet
    has full transaction signing authority.  This needs to be done until 
    the user needs more flexibility and can be warned that they could not spend
    the claimed balance in this wallet.
    
    Blocks the case where the import file may have an account name registered to
    someone else.
    */
    onLoadMyAccounts() {
        if(TRACE) console.log('... BalanceClaimStore.onLoadMyAccounts')
        
        if( WalletDb.isLocked()) return
        if(TRACE) console.log('... BalanceClaimStore.loadMyAccounts START')
        this.setState({my_accounts_loading:true})
        var account_names = AccountStore.getState().linkedAccounts.toArray()
        var promises = []
        for(let account_name of account_names) {
            
            var found = false
            for(let account of this.state.my_accounts)
                if(account_name == account)
                    found = true
            if(found)
                continue
            
            if(TRACE) console.log('... BalanceClaimStore.onLoadMyAccounts lookupAccountByName')
            var p = chain_api.lookupAccountByName(account_name).then ( account => {
                //DEBUG console.log('... account lookupAccountByName',account.get("id"),account.get("name"))
                
                // the fake transfer will check for required auths
                return application_api.transfer(
                    account.get("id"),
                    account.get("id"),
                    1,//amount
                    0,//asset
                    null,//memo
                    false,//broadcast
                    false,//encrypt_memo
                    null, //nonce
                    false//sign
                ).then( fake_transfer => {
                    //DEBUG
                    if(TRACE) console.log('... BalanceClaimStore my account',account.get("name"))
                    return account.get("name")
                }).catch( error => {
                    //DEBUG
                    if(TRACE) console.log('... BalanceClaimStore NOT my account',account.get("name"),error)
                    return null
                })
            }).catch( error => {
                //DEBUG Account not found console.log('... error1',error)
            })
            
            promises.push(p)
        }
        Promise.all(promises).then( account_names => {
            var my_accounts = this.state.my_accounts
            for(let account_name of account_names) {
                if( ! account_name) continue
                my_accounts.push(account_name)
            }
            //DEBUG console.log('... my_accounts',my_accounts)    
            this.setState({my_accounts, my_accounts_loading:false})
            if(TRACE) console.log('... BalanceClaimStore.onLoadMyAccounts DONE')
        }).catch( balance_claim_error => this.setState({balance_claim_error}) )
    }
    
    setBalanceClaims(balance_claims) {
        var balance_by_account_asset = this.balanceByAssetName(balance_claims)
        this.setState({balance_claims, balance_by_account_asset, loading: false,
            balance_claim_error:null})
    }
    
    transaction_update() {
        var transaction = iDB.instance().db().transaction(
            ["balance_claims"], "readwrite"
        )
        return transaction
    }

    /** group things for reporting purposes */
    balanceByAssetName(balance_claims) {
        var asset_totals = {}
        var keys = PrivateKeyStore.getState().keys
        //DEBUG console.log("... balanceByAssetName balance_claims",balance_claims,keys)
        for(let balance_claim of balance_claims) {
            var b = balance_claim.chain_balance_record
            
            var private_key_id = balance_claim.private_key_id
            var private_key_tcomb = keys.get(private_key_id)
            
            var import_account_names =
                private_key_tcomb.import_account_names
            
            var group_by =
                import_account_names.join("\t") +
                b.balance.asset_id + "\t"
            
            var total =
                asset_totals[group_by] || (
                asset_totals[group_by] = 
            {
                vesting: {claimed:0, unclaimed:0},
                unvested: {claimed:0, unclaimed:0},
                accounts: import_account_names,
                balance_claims: [],
                asset_id: b.balance.asset_id
            })
            if(b.vesting) {
                if(balance_claim.is_claimed)
                    total.vesting.claimed += v.to_number(b.balance.amount)
                else
                    total.vesting.unclaimed += v.to_number(b.balance.amount)
            } else {
                if(balance_claim.is_claimed)
                    total.unvested.claimed += v.to_number(b.balance.amount)
                else
                    total.unvested.unclaimed += v.to_number(b.balance.amount)
            }
            total.balance_claims.push(balance_claim)
        }
        var balance_by_account_asset = []
        for(let key of Object.keys(asset_totals).sort()) {
            var total_record = asset_totals[key]
            var accounts = total_record.accounts
            var balance = {
                vesting: total_record.vesting,
                unvested: total_record.unvested
            }
            var balance_claims = total_record.balance_claims
            balance_by_account_asset.push({
                accounts, asset_id:total_record.asset_id,
                balance, balance_claims})
        }
        return balance_by_account_asset
    }

}

export var BalanceClaimStoreWrapped = alt.createStore(BalanceClaimStore)
export default BalanceClaimStoreWrapped
