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
import AssetTcomb from "stores/tcomb_structs"

var application_api = new ApplicationApi()
var api = Apis.instance()

let AssetTypeTcomb = t.struct({
    amount: t.Any, //string or number, TODO fix in c++
    asset_id: t.Str
}, 'AssetTypeTcomb')

export var BalanceClaimTcomb = t.struct({
    chain_balance_record: t.Obj,
    pubkey: t.Str,
    is_claimed: t.maybe(t.Bool),
    vested_balance: t.maybe(AssetTypeTcomb)
}, 'BalanceClaimTcomb')

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
        this.balances_saving = 0
        this.state = {
            balance_by_account_asset: [],
            my_accounts: [],
            my_accounts_loading: false,
            balance_claims: [],
            balance_ids: [],
            balances_saving: 0,
            balances_error: null
        }
    }
    
    onWillMount() {
        this.mounted = true
    }
    
    onWillUnmount() {
        this.mounted = false
    }
    
    /**
        No need to wait on the promises returned by this method as long
        as this.state.balances_error == null and this.state.balances_saving == 0
        are both true before performing any important operations.
    */
    onAdd({balance_claim, transaction}) {
        BalanceClaimTcomb(balance_claim)
        this.indexBalanceClaim(balance_claim)
        return idb_helper.add(
            transaction.objectStore("balance_claims"),
            balance_claim
        )
    }
    
    loadBalanceClaims() {
        if(this.loadBalanceClaimsLoaded) return Promise.resolve()
        return idb_helper.cursor("balance_claims", cursor => {
            if( ! cursor) return
            var balance_claim = cursor.value
            this.indexBalanceClaim(balance_claim)
            cursor.continue()
        }).then(()=>{
            this.loadBalanceClaimsLoaded = true
            this.forceUpdate()
        }).catch( balances_error => {
            this.setState({balances_error})
        })
    }
    
    indexBalanceClaim(balance_claim) {
        this.state.balance_claims.push( balance_claim )
        this.state.balance_ids.push( balance_claim.chain_balance_record.id )
    }
    
    /** Called both on initial import and display of balance claims and then
    again anytime the balance claim UI is mounted.  This is to ensure the data
    being viewed is accurate.  
    */
    onRefreshBalanceClaims() {
        if( ! this.mounted) return
        if(TRACE) console.log('... BalanceClaimStore.onRefreshBalanceClaims START')
        var balance_claims = this.state.balance_claims
        var balance_ids = this.state.balance_ids
        this.loadBalanceClaims().then( ()=> {
            //DEBUG console.log('... refresh')
            if( ! balance_claims.length) {
                this.setBalanceClaims(balance_claims)
                if(TRACE) console.log('... BalanceClaimStore.onRefreshBalanceClaims done, no claims import keys first')
                return
            }
            if(TRACE) console.log('... BalanceClaimStore.onRefreshBalanceClaims get_objects start')
            var db = api.db_api()
            
            //DEBUG console.log("get_vested_balances",result)
            return db.exec("get_objects", [balance_ids]).then( result => {
                if(TRACE) console.log('... BalanceClaimStore.onRefreshBalanceClaims get_objects DONE')
                var ps = []
                for(let i = 0; i < result.length; i++) {
                    var balance_claim = balance_claims[i]
                    var chain_balance_record = result[i]
                    //DEBUG console.log('... chain_balance_record',chain_balance_record)
                    if( ! chain_balance_record) {
                        balance_claims[i] = BalanceClaimTcomb.update(
                            BalanceClaimTcomb(balance_claim), {
                                is_claimed: { '$set': true }
                            }
                        )
                    } else {
                        balance_claims[i] = BalanceClaimTcomb.update(
                            BalanceClaimTcomb(balance_claim), {
                                chain_balance_record: { '$set': chain_balance_record }
                            }
                        )
                        if(chain_balance_record.vesting_policy) { i => {
                            ps.push(db.exec("get_vested_balances",
                                [[chain_balance_record.id]]).then( vested_balances => {
                                var vested_balance = vested_balances[0]
                                balance_claims[i] = BalanceClaimTcomb.update(
                                    BalanceClaimTcomb(balance_claims[i]), {
                                        vested_balance: {'$set': vested_balance}
                                    }
                                )
                            }))
                        }(i) }
                    }
                }
                var transaction = this.transaction_update()
                var store = transaction.objectStore("balance_claims")
                
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
        if( ! this.mounted) return
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
            var vested_balance = balance_claim.vested_balance
            
            var pubkey = balance_claim.pubkey
            var private_key_tcomb = PrivateKeyStore.getByPublicKey(pubkey)
            
            var import_account_names =
                private_key_tcomb.import_account_names
            
            var group_by =
                import_account_names.join("\t") +
                b.balance.asset_id + "\t"
            
            var total =
                asset_totals[group_by] || (
                asset_totals[group_by] = 
            {
                vesting: {claimed:0, unclaimed:0, total:0},
                unvested: {claimed:0, unclaimed:0},
                accounts: import_account_names,
                balance_claims: [],
                asset_id: b.balance.asset_id
            })
            if(b.vesting_policy) {
                if(balance_claim.is_claimed)
                    total.vesting.claimed += v.to_number(b.balance.amount)
                else {
                    //DEBUG console.log('... b.balance.amount',b.balance.amount,vested_balance.amount)
                    total.vesting.total += v.to_number(b.balance.amount)
                    total.vesting.unclaimed += v.to_number(vested_balance.amount)
                }
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
