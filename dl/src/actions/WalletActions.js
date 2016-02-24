import WalletDb from "stores/WalletDb"
import WalletUnlockActions from "actions/WalletUnlockActions"
import CachedPropertyActions from "actions/CachedPropertyActions"
import ApplicationApi from "../rpc_api/ApplicationApi"
import { PrivateKey, PublicKey, Address } from "@graphene/ecc"
import { TransactionBuilder, Apis, ops, chain_types, fetchChain } from "@graphene/chain"
import alt from "alt-instance"
import iDB from "idb-instance"
import Immutable from "immutable"
import SettingsStore from "stores/SettingsStore"

var application_api = new ApplicationApi()
//var fetch = require('node-fetch')

class WalletActions {

    /** Restore and make active a new wallet_object. */
    restore(wallet_name = "default", wallet_object, password) {
        wallet_name = wallet_name.toLowerCase()
        this.dispatch({wallet_name, wallet_object, password})
    }
    
    /** Make an existing wallet active or create a wallet (and make it active).
        If <b>wallet_name</b> does not exist, provide a <b>create_wallet_auth</b>.
    */
    setWallet(wallet_name, create_wallet_auth, brnkey) {
        WalletUnlockActions.lock()
        if( ! wallet_name) wallet_name = "default"
        return new Promise( resolve => {
            this.dispatch({wallet_name, create_wallet_auth, brnkey, resolve})
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
        
        let [ owner, active ] = WalletDb.getDeterministicKeys(2)
        let updateWallet = ()=> WalletDb.importKeys([ owner, active ])

        let create_account = () => {
            return application_api.create_account(
                owner.private_key.toPublicKey().toString(),
                active.private_key.toPublicKey().toString(),
                account_name,
                registrar, //registrar_id,
                referrer, //referrer_id,
                referrer_percent, //referrer_percent,
                true //broadcast
            )
            .then( () => updateWallet() )
        };

        if(registrar) {
            // using another user's account as registrar
            return create_account();
        } else {
            // using faucet
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
                        "owner_key": owner.private_key.toPublicKey().toString(),
                        "active_key": active.private_key.toPublicKey().toString(),
                        "memo_key": active.private_key.toPublicKey().toString(),
                        //"memo_key": memo.private_key.toPublicKey().toString(),
                        "refcode": refcode,
                        "referrer": window && window.BTSW ? BTSW.referrer : ""
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

    claimVestingBalance(account, cvb) {
        var tr = new TransactionBuilder();

        let balance = cvb.getIn(["balance", "amount"]),
            earned = cvb.getIn(["policy", 1, "coin_seconds_earned"]),
            vestingPeriod = cvb.getIn(["policy", 1, "vesting_seconds"]),
            availablePercent = earned / (vestingPeriod * balance);


        tr.add_type_operation("vesting_balance_withdraw", {
            fee: { amount: "0", asset_id: "1.3.0"},
            owner: account,
            vesting_balance: cvb.get("id"),
            amount: {
                amount: Math.floor(balance * availablePercent),
                asset_id: cvb.getIn(["balance", "asset_id"])
            }
        });

        return WalletDb.process_transaction(tr, null, true)
        .catch(err => {
            console.log("vesting_balance_withdraw err:", err);
        })
    }
    
    /** @parm balances is an array of balance objects with two
        additional values: {vested_balance, public_key_string}
    */
    importBalance( account_name_or_id, balances, broadcast) {
        return new Promise((resolve, reject) => {
            
            var db = Apis.instance().db_api()
            var address_publickey_map = {}
            var account_lookup = fetchChain("getAccount", account_name_or_id)

            var p = account_lookup.then( account => {
                //DEBUG console.log('... account',account)
                if(account == null)
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
                        deposit_to_account: account.get("id"),
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
                var tr = new TransactionBuilder();
                
                for(let balance_claim of balance_claims) {
                    tr.add_type_operation("balance_claim", balance_claim)
                }
                // With a lot of balance claims the signing can take so Long
                // the transaction will expire.  This will increase the timeout...
                tr.set_expire_seconds( (15 * 60) + balance_claims.length)
                
                return WalletDb.process_transaction(tr, Object.keys(signer_pubkeys), broadcast )
                .then( result=> { this.dispatch(); return result })
            })
            resolve(p)
        })
    }
}

export default alt.createActions(WalletActions)
