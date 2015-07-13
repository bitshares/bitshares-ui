import WalletDb from "../stores/WalletDb"
import ApplicationApi from "../rpc_api/ApplicationApi"
import PrivateKey from "../ecc/key_private"
import Apis from "../rpc_api/ApiInstances"
import ops from "../chain/transaction_operations"
import chain_types from "../chain/chain_types"
import lookup from "chain/lookup" 

var alt = require("../alt-instance")
var application_api = new ApplicationApi()
var api = Apis.instance()

class WalletActions {

    constructor() {
        this.generateActions(
            'brainKeyAccountCreated',
            'brainKeyAccountCreateError'
        )
    }

    //re-factor WalletDb.onCreateWallet and this.createWallet 
    
    createBrainKeyAccount( account_name ) {
        if( WalletDb.isLocked()) {
            var error = "wallet locked"
            this.actions.brainKeyAccountCreateError( error )
            return Promise.reject( error )
        }
        var [owner_private, active_private] = WalletDb.generateKeys()
        return application_api.create_account_with_brain_key(
            owner_private.private_key.toPublicKey().toBtsPublic(),
            active_private.private_key.toPublicKey().toBtsPublic(),
            account_name,
            15, //registrar_id,
            0, //referrer_id,
            100, //referrer_percent,
            PrivateKey.fromSeed("nathan"), //signer_private_key,
            true //broadcast
        ).then(() => {
            var transaction = WalletDb.transaction_update_keys()
            WalletDb.saveKeys(
                [ owner_private, active_private ],
                transaction
            )
            WalletDb.incrementBrainKeySequence(transaction)
            
        }).then( ()=> {
            //DEBUG console.log('... brainKeyAccountCreated')
            this.actions.brainKeyAccountCreated()
        }).catch(  error => {
            //DEBUG console.log('WalletActions.createBrainKeyAccount',error)    
            this.actions.brainKeyAccountCreateError(error)
            throw error
        })
    }
    
    importBalance( account_name_or_id, wif_keys, broadcast ) {
        return new Promise((resolve, reject) => {
            
            var db = api.db_api()
            var address_privatekey_map = {}
            var address_publickey_map = {}
            
            var account_lookup = lookup.account_id(account_name_or_id)
            var p = lookup.resolve().then( ()=> {
                var account = account_lookup.resolve
                //DEBUG  console.log('... account',account)
                if(account == void 0)
                    return Promise.reject("unknown account " + account_name_or_id)
                
                var address_params = []
                for(let wif of wif_keys) {
                    var private_key = PrivateKey.fromWif(wif)
                    var public_key = private_key.toPublicKey()
                    var address_str = public_key.toBtsAddy()
                    address_privatekey_map[address_str] = private_key
                    address_publickey_map[address_str] = public_key
                    address_params.push( [address_str] )
                }
                //DEBUG 
                console.log('... get_balance_objects', address_params)
                
                return db.exec("get_balance_objects", address_params).then( result => {
                    //DEBUG 
                    console.log('... result',result)
                    var balance_claims = []
                    for(let b of result) {
                        
                        if(b.vesting_policy)
                            continue //todo
                        //var total_claimed = "0"
                        //if( ! b.vesting_policy)
                        //    total_claimed = b.balance
                        ////'else' Zero total_claimed is understood to mean that your
                        ////claiming the vesting balance on vesting terms.
                        
                        balance_claims.push({
                            //fee: { amount: "100000", asset_id: 0},
                            deposit_to_account: account.id,
                            balance_to_claim: b.id, //"1.15.0"
                            balance_owner_key: address_publickey_map[b.owner],
                            total_claimed: {
                                amount: b.balance,
                                asset_id: b.balance.asset_id
                            }
                        })
                    }
                    //DEBUG 
                    console.log('... balance_claims',balance_claims)
                    var tr = new ops.signed_transaction()
                    for(let balance_claim of balance_claims) {
                        tr.add_type_operation("balance_claim", balance_claim)
                    }
                    var keys = Object.keys(address_privatekey_map)
                    var signer_privates = keys.map(function(v) {
                        return address_privatekey_map[v]
                    })
                    //signer_privates.push(PrivateKey.fromSeed("nathan"))
                    return tr.finalize( signer_privates, broadcast )
                })
                    
            })
            resolve(p)
        })
    }
}

module.exports = alt.createActions(WalletActions)
