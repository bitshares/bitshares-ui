import WalletDb from "stores/WalletDb"
import WalletUnlockActions from "actions/WalletUnlockActions"
import CachedPropertyActions from "actions/CachedPropertyActions"
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
import config from "chain/config"
import SettingsStore from "stores/SettingsStore"

var application_api = new ApplicationApi()
//var fetch = require('node-fetch')

class WalletActions {

    /** Restore and make active a new wallet_object. */
    restore(wallet_name = "default", wallet_object) {
        wallet_name = wallet_name.toLowerCase()
        this.dispatch({wallet_name, wallet_object})
    }
    
    /** Make an existing wallet active or create a wallet (and make it active).
        If <b>wallet_name</b> does not exist, provide a <b>create_wallet_password</b>.
    */
    setWallet(wallet_name, create_wallet_password, brnkey) {
        if( ! wallet_name) wallet_name = "default"
        return new Promise( resolve => {
            this.dispatch({wallet_name, create_wallet_password, brnkey, resolve})
        })
    }
    
    setBackupDate() {
        CachedPropertyActions.set("backup_recommended", false)
        this.dispatch()
    }
    
    setBrainkeyBackupDate() {
        this.dispatch()
    }
    
    createAccount( account_name, registrar, referrer, referrer_percent, refcode ) {
        if( WalletDb.isLocked()) {
            var error = "wallet locked"
            //this.actions.brainKeyAccountCreateError( error )
            return Promise.reject( error )
        }
        var owner_private = WalletDb.generateNextKey()
        var active_private = WalletDb.generateNextKey()
        //var memo_private = WalletDb.generateNextKey()
        var updateWallet = ()=> {
            var transaction = WalletDb.transaction_update_keys()
            var p = WalletDb.saveKeys(
                [ owner_private, active_private],
                //[ owner_private, active_private, memo_private ],
                transaction
            )
            return p.catch( error => transaction.abort() )
        };

        let create_account = () => {
            return application_api.create_account(
                owner_private.private_key.toPublicKey().toPublicKeyString(),
                active_private.private_key.toPublicKey().toPublicKeyString(),
                account_name,
                registrar, //registrar_id,
                referrer, //referrer_id,
                referrer_percent, //referrer_percent,
                true //broadcast
            ).then( () => updateWallet() )
        };

        if(registrar) {
            // using another user's account as registrar
            return create_account();
        } else {
            // using faucet
          /*
            let hostname = "localhost", protocol;
            try {
                hostname = window.location.hostname;
                protocol = window.location.protocol === "https:" ? "https://" : "http://";
            } catch(e) {}
            let port = (hostname === "localhost" || hostname.indexOf("192.168.") === 0) ? ":3000" : "";
            */
            let create_account_promise = fetch(SettingsStore.getSetting("faucet_address") + "/api/v1/accounts", {
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
                        "active_key": active_private.private_key.toPublicKey().toPublicKeyString()//,
                        //"memo_key": memo_private.private_key.toPublicKey().toPublicKeyString(),
                        //"refcode": refcode
                    }
                })
            }).then(r => r.json());

            return create_account_promise.then(result => {
                if (result.error) {
                    throw result.error;
                }
                return updateWallet()
            }).catch(error => {
                if (
                    error instanceof TypeError ||
                    error.toString().indexOf('ECONNREFUSED') != -1
                ) {
                    console.log("Warning! faucet registration failed, falling back to direct application_api.create_account..");
                    return create_account();
                }
                throw error;
            })
        }
    }
    
    /** @parm balances is an array of balance objects with two
        additional values: {vested_balance, public_key_string}
    */
    importBalance( account_name_or_id, balances, broadcast) {
        return new Promise((resolve, reject) => {
            
            var db = Apis.instance().db_api()
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
                for(let balance of balances) {
                    var {vested_balance, public_key_string} = balance
                    
                    //DEBUG console.log('... balance',b)
                    var total_claimed
                    if( vested_balance ) {
                        if(vested_balance.amount == 0)
                            // recently claimed 
                            continue
                        
                        total_claimed = vested_balance.amount
                    } else
                        total_claimed = balance.balance.amount
                    
                    //assert
                    if(vested_balance && vested_balance.asset_id != balance.balance.asset_id)
                        throw new Error("Vested balance record and balance record asset_id missmatch",
                            vested_balance.asset_id,
                            balance.balance.asset_id
                        )
                    
                    signer_pubkeys[public_key_string] = true
                    balance_claims.push({
                        fee: { amount: "0", asset_id: "1.3.0"},
                        deposit_to_account: account,
                        balance_to_claim: balance.id,
                        balance_owner_key: public_key_string,
                        total_claimed: {
                            amount: total_claimed,
                            asset_id: balance.balance.asset_id
                        }
                    })
                }
                if( ! balance_claims.length) {
                    throw new Error("No balances to claim")
                }
                
                //DEBUG console.log('... balance_claims',balance_claims)
                var tr = new ops.signed_transaction()
                
                for(let balance_claim of balance_claims) {
                    tr.add_type_operation("balance_claim", balance_claim)
                }
                // With a lot of balance claims the signing can take so Long
                // the transaction will expire.  This will increase the timeout...
                tr.set_expire_seconds(config.expire_in_secs + balance_claims.length)
                
                return WalletDb.process_transaction(
                    tr, Object.keys(signer_pubkeys), broadcast ).then(
                        result=> { this.dispatch(); return result })
            })
            resolve(p)
        })
    }
}

module.exports = alt.createActions(WalletActions)
