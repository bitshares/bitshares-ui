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
var fetch = require('node-fetch')

class WalletActions {

    constructor() {
        this.generateActions(
            'brainKeyAccountCreated',
            'brainKeyAccountCreateError'
        )
    }

    createBrainKeyAccount( account_name ) {
        if( WalletDb.isLocked()) {
            var error = "wallet locked"
            this.actions.brainKeyAccountCreateError( error )
            return Promise.reject( error )
        }
        
        var [owner_private, active_private] = WalletDb.generateKeys();
        let hostname = "localhost";
        try { hostname = window.location.hostname } catch(e) {};
        let port = hostname === "localhost" ? ":3000" : "";
        let create_account_promise = fetch("http://" + hostname + port + "/api/v1/accounts", {
            method: 'post',
            mode: 'cors',
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json"
            },
            body: JSON.stringify({"account": {
                "name": account_name,
                "owner_key": owner_private.private_key.toPublicKey().toBtsPublic(),
                "active_key": active_private.private_key.toPublicKey().toBtsPublic()
            }})
        }).then(r => r.json());
        
        var updateWallet = ()=> {
            //DEBUG console.log('... brainKeyAccountCreated')
            var transaction = WalletDb.transaction_update_keys()
            var p = WalletDb.saveKeys(
                [ owner_private, active_private ],
                transaction
            )
            var p2 = WalletDb.incrementBrainKeySequence(transaction)
            return Promise.all([p,p2]).catch( error => transaction.abort() )
        }
        
        return create_account_promise.then( result => {
            if(result.error) {
                this.actions.brainKeyAccountCreateError(result.error);
                throw result.error;
            }
            return updateWallet().then(()=> 
                this.actions.brainKeyAccountCreated())
            
        }).catch(  error => {
            if(
                error instanceof TypeError || 
                error.toString().indexOf('ECONNREFUSED') != -1
            ) {
                console.log("Warning! faucet registration failed, falling back to direct application_api.create_account_with_brain_key..");
                return application_api.create_account_with_brain_key(
                    owner_private.private_key.toPublicKey().toBtsPublic(),
                    active_private.private_key.toPublicKey().toBtsPublic(),
                    account_name,
                    15, //registrar_id,
                    0, //referrer_id,
                    100, //referrer_percent,
                    PrivateKey.fromSeed("nathan"), //signer_private_key,
                    true //broadcast
                ).then( () => {
                    return updateWallet().then(()=> 
                        this.actions.brainKeyAccountCreated())
                }).catch(  error => {
                    this.actions.brainKeyAccountCreateError(error)
                    throw error
                });
            }
            this.actions.brainKeyAccountCreateError(error)
            throw error
        })
    }
    
    findAccountsByBrainKey(brainkey) {
        var privates = []
        for(let sequence = 0; sequence < 10; sequence++) {
            var owner_privkey = key.get_owner_private(
                this.state.brainkey, sequence
            )
            //var active_privkey = key.get_active_private(owner_privkey)
            privates.push([owner_privkey, sequence])
        }
        //var db = api.db_api()
        //return db.exec("get_key_references", public_keyaddress_params).then( result => {
    }
    
    importBalance( account_name_or_id, wifs_to_balances, broadcast ) {
        return new Promise((resolve, reject) => {
            
            var db = api.db_api()
            var address_privatekey_map = {}
            var address_publickey_map = {}
            
            var account_lookup = lookup.account_id(account_name_or_id)
            var p = lookup.resolve().then( ()=> {
                var account = account_lookup.resolve
                //DEBUG console.log('... account',account)
                if(account == void 0)
                    return Promise.reject("Unknown account " + account_name_or_id)
                
                var balance_claims = []
                for(let wif of Object.keys(wifs_to_balances)) {
                    var private_key = PrivateKey.fromWif(wif)
                    var public_key = private_key.toPublicKey()
                    var address_str = public_key.toBtsAddy()
                    address_privatekey_map[address_str] = private_key
                    address_publickey_map[address_str] = public_key
                }
                for(let wif of Object.keys(wifs_to_balances)) {
                    for(let b of wifs_to_balances[wif]) {
                        //DEBUG console.log('... balance',b)
                        var total_claimed = "0"
                        if( ! b.vesting_policy)
                            total_claimed = b.balance.amount
                        //'else' Zero total_claimed is understood to mean that your
                        //claiming the vesting balance on vesting terms.
                        balance_claims.push({
                            fee: { amount: "0", asset_id: "1.3.0"},
                            deposit_to_account: account,
                            balance_to_claim: b.id, //"1.15.0"
                            balance_owner_key: address_publickey_map[b.owner],
                            total_claimed: {
                                amount: total_claimed,
                                asset_id: b.balance.asset_id
                            }
                        })
                    }
                }
                if( ! balance_claims.length) {
                    throw new Error("No balances to claim")
                }
                
                //DEBUG console.log('... balance_claims',balance_claims)
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
            resolve(p)
        })
    }
}

module.exports = alt.createActions(WalletActions)
