import WalletDb from "stores/WalletDb"
import WalletUnlockActions from "actions/WalletUnlockActions"
import ApplicationApi from "../rpc_api/ApplicationApi"
import PrivateKey from "../ecc/key_private"
import Apis from "../rpc_api/ApiInstances"
import ops from "../chain/signed_transaction"
import chain_types from "../chain/chain_types"
import lookup from "chain/lookup"
import PublicKey from "ecc/key_public"
import Address from "ecc/address"
import alt from "alt-instance"
import iDB from "idb-instance"
import Immutable from "immutable"

var application_api = new ApplicationApi()
var api = Apis.instance()
//var fetch = require('node-fetch')

class WalletActions {

    restore(wallet_name, wallet_object) {
        return iDB.root.getProperty("wallet_names", []).then(
            wallet_names => {
            if(Immutable.Set(wallet_names).has(wallet_name))
                throw new Error("Wallet exists")
            
            wallet_names.push(wallet_name)
            return iDB.restore(wallet_name, wallet_object).then( () => {
                return iDB.root.setProperty("wallet_names", wallet_names).then(
                    ()=> { this.dispatch(wallet_name) })
            })
        }).catch( event => {
            var error = event.target ? event.target.error : event
            console.error("Error saving wallet to database",
                error.name, error.message, error)
            throw new Error("Error saving wallet to database")
        })
    }
    
    createBrainKeyAccount(
        account_name,
        registrar,
        referrer,
        referrer_percent = 100
    ) {
        if( WalletDb.isLocked()) {
            var error = "wallet locked"
            //this.actions.brainKeyAccountCreateError( error )
            return Promise.reject( error )
        }
        
        var [owner_private, active_private] = WalletDb.generateKeys();

        var updateWallet = ()=> {
            var transaction = WalletDb.transaction_update_keys()
            var p = WalletDb.saveKeys(
                [ owner_private, active_private ],
                transaction
            )
            return p.catch( error => transaction.abort() )
        };

        let create_account_with_brain_key = () => {
            return application_api.create_account_with_brain_key(
                owner_private.private_key.toPublicKey().toPublicKeyString(),
                active_private.private_key.toPublicKey().toPublicKeyString(),
                account_name,
                registrar, //registrar_id,
                referrer, //referrer_id,
                referrer_percent, //referrer_percent,
                true //broadcast
            ).then( () => updateWallet() )
            // {
            //     return updateWallet().then(()=> {
            //         //this.actions.brainKeyAccountCreated())
            //     }).catch(  error => {
            //         //this.actions.brainKeyAccountCreateError(error);
            //         throw error;
            //     });
            // })
        };

        if(registrar) {
            // using another user's account as registrar
            return create_account_with_brain_key();
        } else {
            // using faucet
            let hostname = "localhost", protocol;
            try {
                hostname = window.location.hostname;
                protocol = window.location.protocol === "https:" ? "https://" : "http://";
            } catch(e) {}
            let port = (hostname === "localhost" || hostname.indexOf("192.168.") === 0) ? ":3000" : "";
            let create_account_promise = fetch(protocol + hostname + port + "/api/v1/accounts", {
                method: 'post',
                mode: 'cors',
                headers: {
                    "Accept": "application/json",
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    "account": {
                        "name": account_name,
                        "owner_key": owner_private.private_key.toPublicKey().toPublicKeyString(),
                        "active_key": active_private.private_key.toPublicKey().toPublicKeyString()
                    }
                })
            }).then(r => r.json());

            return create_account_promise.then(result => {
                if (result.error) {
                    //this.actions.brainKeyAccountCreateError(result.error);
                    throw result.error;
                }
                return updateWallet()//.then(() => this.actions.brainKeyAccountCreated());
            }).catch(error => {
                if (
                    error instanceof TypeError ||
                    error.toString().indexOf('ECONNREFUSED') != -1
                ) {
                    console.log("Warning! faucet registration failed, falling back to direct application_api.create_account_with_brain_key..");
                    return create_account_with_brain_key();
                }
                //this.actions.brainKeyAccountCreateError(error);
                throw error;
            })
        }
    }
    
    importBalance( account_name_or_id, wifs_to_balances, broadcast, private_key_tcombs) {
        return new Promise((resolve, reject) => {
            
            var db = api.db_api()
            var address_publickey_map = {}
            
            var account_lookup = lookup.account_id(account_name_or_id)
            var unlock = WalletUnlockActions.unlock()
            var plookup = lookup.resolve()
            
            var p = Promise.all([ unlock, plookup ]).then( ()=> {
                var account = account_lookup.resolve
                //DEBUG console.log('... account',account)
                if(account == void 0)
                    return Promise.reject("Unknown account " + account_name_or_id)
                
                var balance_claims = []
                var signer_pubkeys = {}
                for(let wif of Object.keys(wifs_to_balances)) {
                    var {balances, public_key_string} = wifs_to_balances[wif]
                    for(let {chain_balance_record, vested_balance} of balances) {
                        //DEBUG console.log('... balance',b)
                        var total_claimed
                        if( vested_balance ) {
                            if(vested_balance.amount == 0)
                                // recently claimed 
                                continue
                            
                            total_claimed = vested_balance.amount
                        } else
                            total_claimed = chain_balance_record.balance.amount
                        
                        //assert
                        if(vested_balance && vested_balance.asset_id != chain_balance_record.balance.asset_id)
                            throw new Error("Vested balance record and balance record asset_id missmatch",
                                vested_balance.asset_id,
                                chain_balance_record.balance.asset_id
                            )
                        
                        signer_pubkeys[public_key_string] = true
                        balance_claims.push({
                            fee: { amount: "0", asset_id: "1.3.0"},
                            deposit_to_account: account,
                            balance_to_claim: chain_balance_record.id,
                            balance_owner_key: public_key_string,
                            total_claimed: {
                                amount: total_claimed,
                                asset_id: chain_balance_record.balance.asset_id
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
                return WalletDb.process_transaction(
                    tr, Object.keys(signer_pubkeys), broadcast )
            })
            resolve(p)
        })
    }
}

module.exports = alt.createActions(WalletActions)
