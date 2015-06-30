import alt from "../alt-instance";
import iDB from "../idb-instance";
import key from "common/key_utils"
import idb_helper from "../idb-helper"

import Immutable from "immutable";

import BaseStore from "./BaseStore"
import PublicKeyStore from 'stores/PublicKeyStore'
import PrivateKeyStore from 'stores/PrivateKeyStore'

import {WalletTcomb, PublicKeyTcomb, PrivateKeyTcomb} from "./tcomb_structs";
import WalletActions from "actions/WalletActions"
import PrivateKey from "ecc/key_private"

var aes_private_map = {}

class WalletStore extends BaseStore {
    
    constructor() {
        super();
        this.secret_server_token = "secret_server_token";
        this.wallets = Immutable.Map();
        this.bindActions(WalletActions)
        this._export(
            "getCurrentWallet", "onLock", "isLocked",
            "validatePassword", "onCreate", "getNextPrivateKeyPair",
            "loadDbData"
        )
    }
    
    getCurrentWallet() {
        if( ! this.current_wallet) {
            if(this.wallets.count())
                this.current_wallet = this.wallets.first().public_name
        }
        return this.current_wallet
    }
    
    onLock(wallet_public_name) {
        delete aes_private_map[wallet_public_name]
    }
    
    isLocked(wallet_public_name) {
        return aes_private_map[wallet_public_name] ? false : true
    }
    
    validatePassword(
        wallet_public_name,
        password,
        unlock = false
    ) {
        var wallet = this.wallets.get(wallet_public_name)
        if ( ! wallet)
            return false
        
        try {
            var aes_private = key.aes_private(
                password + this.secret_server_token,
                wallet.password_checksum
            )
            if(unlock)
                aes_private_map[wallet_public_name] = aes_private
        } catch(e) {
            console.log('password error', e)
        }
    }
    
    getNextPrivateKeyPair(wallet_public_name) {
        return new Promise( (resolve, reject) => {
            var wallet = this.wallets.get(wallet_public_name)
            var aes_private = aes_private_map[wallet_public_name]
            if ( ! wallet) {
                reject("missing wallet " + wallet_public_name)
                return
            }
            if ( ! aes_private) {
                reject("wallet locked " + wallet_public_name)
                return
            }
            if ( ! wallet.encrypted_brainkey) {
                reject("wallet does not have a brainkey")
                return
            }
            
            var brainkey_plaintext = aes_private.decryptHexToText(
                wallet.encrypted_brainkey
            )
            try { // todo, validateBrainkey(wallet_public_name, brainkey_plaintext)
                key.aes_private(
                    brainkey_plaintext + this.secret_server_token,
                    wallet.brainkey_checksum
                )
            } catch(e) {
                reject('invalid wallet, brainkey checksum mis-match')
                return
            }
            
            var seq = 0
            if( wallet.brainkey_sequence != void 0)
                seq = wallet.brainkey_sequence + 1
            
            let transaction = iDB.instance().db().transaction(
                ["wallets", "public_keys", "private_keys"], "readwrite"
            )
            transaction.onerror = e => {
                reject(e.target.error.message)
            }
            var owner_private = key.get_owner_private(brainkey_plaintext, seq)
            var active_private = key.get_active_private(owner_private, 0)
            var trx_promise = (seq, wallet) => {
                return new Prommise((resolve, reject) => {
                    transaction.oncomplete = e => {
                        // Update the index in RAM
                        wallet.brainkey_sequence = seq
                    }
                })
            }(seq, wallet)
            
            // The idb_helper.promise does error logging.
            idb_helper.promise(
                transaction.objectStore("wallets").put(wallet)
            )
            var save_promise = saveKeys(
                owner_private,
                password_aes_private,
                null, //brainkey_owner_private_id
                seq, //brainkey_sequence
                transaction
            ).then( owner_private_object => {
                owner_private_object => {
                    return saveKeys(
                        active_private,
                        password_aes_private,
                        owner_private_object.id, //brainkey_owner_private_id
                        0, //brainkey_sequence (active always starts at 0)
                        transaction
                    ).then( active_private_object => {
                        resolve([
                            owner_private_object,
                            active_private_object
                        ])
                    })
                }(owner_private_object)
            })
            return Promise.all([save_promise, trx_promise])
        })
    }
    
    onCreate(
        wallet_public_name, 
        password_plaintext,
        brainkey_plaintext,
        private_wifs,
        unlock = false
    ) {
        return new Promise( (resolve, reject) => {
            if(this.wallets.get(wallet_public_name)) {
                reject("wallet exists")
                return
            }
            let transaction = iDB.instance().db().transaction(
                ["wallets", "public_keys", "private_keys"], "readwrite"
            )
            transaction.onerror = e => {
                reject(e.target.error.message)
            }
            transaction.oncomplete = e => {
                resolve()
            }
            var password = key.aes_checksum(
                password_plaintext + this.secret_server_token
            )
            
            // When deleting then re-adding a brainkey this checksum
            // is used to ensure it is the correct brainkey.
            var brainkey_checksum = key.aes_checksum(
                brainkey_plaintext + this.secret_server_token
            ).checksum
            
            var brainkey_cipherhex = password.aes_private.encryptToHex(
                brainkey_plaintext
            )
            
            let wallet = {
                public_name: wallet_public_name,
                password_checksum: password.checksum,
                encrypted_brainkey: brainkey_cipherhex,
                brainkey_checksum
            }
            WalletTcomb(wallet) // validate early
            return (wallet, unlock, password_aes_private, private_wifs) => {
                return idb_helper.add(
                    transaction.objectStore("wallets"), wallet, () => {
                        
                        var promises = []
                        for(let wif of private_wifs) {
                            var private_key = PrivateKey.fromWif(wif)
                            var promise = saveKeys(
                                private_key,
                                password_aes_private,
                                null, //brainkey_owner_private_id
                                null, //brainkey_sequence
                                transaction
                            )
                            promises.push(promise)
                        }
                        
                        return Promise.all(promises).then( ()=> {
                            this.wallets = this.wallets.set(
                                wallet.public_name,
                                wallet
                            )
                            if(unlock)
                                aes_private_map[wallet_public_name] =
                                    password_aes_private
                        })
                    }
                )
            }(wallet, unlock, password.aes_private, private_wifs)
        })
    }
    
    saveKeys(
        private_key,
        password_aes_private,
        brainkey_owner_private_id,
        brainkey_sequence,
        transaction
    ) {
        var private_cipherhex =
            password_aes_private.encryptToHex(
                private_key.toBuffer()
            )
        
        var public_key = private_key.toPublic()
        return PublicKeyStore.onAddKey(
            {
                pubkey: public_key.toBtsPublic(),
                addy: public_key.toBtsAddy()
            },
            transaction, public_key_object => {
                var private_key_object = {
                    wallet_id: wallet.id,
                    public_id: public_key_object.id,
                    brainkey_owner_private_id: null,
                    brainkey_sequence: null,
                    encrypted_key: private_cipherhex
                }
                return PrivateKeyStore.onAddKey(
                    private_key_object,
                    transaction
                )
            }
        )
    }
    
    
    
    /*
    onDeleteWallet(wallet_public_name = "default") {
        var wallet = this.wallets.get(wallet_public_name)
        if(!wallet) {
            reject("no match")
            return false
        }
        let transaction = iDB.instance().db().transaction(
            ["wallets","public_keys","private_keys"],
            "readwrite"
        );
        transaction.onerror = e => {
            reject(e.target.error.message)
        }
        PrivateKeyStore.deleteByWalletId(wallet.id, transaction).then(()=>{
            let wallet_store = transaction.objectStore("wallets");
            let request = wallet_store.delete(wallet.id);
            request.onsuccess = () => {
                delete aes_private_map[wallet_public_name]
                this.wallets = this.wallets.delete(wallet_public_name)
                if(this.wallets.get(wallet_public_name))
                    console.log("DEBUG delete failed")
                
                eventEmitter.emitChange()
            }
            request.onerror = (e) => {
                console.log("ERROR!!! deleteWallet - ", e.target.error.message, value);
                reject(e.target.error.message);
            }
        }).catch( error => {reject(error)})
        return false
    }*/
    

    /*
    validateBrainkey(
        wallet,
        brain_key
    ) {
        if ( ! wallet)
            throw new Error("wrong password")
        
        if(! brain_key || typeof brain_key != 'string')
            throw new Error("required: brain_key")
        
        if(! secret_server_token || typeof password != 'string')
            throw new Error("required: secret_server_token")
        
        if ( ! wallet.brainkey_checksum)
            throw new Error("wrong password")
        
        var aes_private = key.aes_private(
            brain_key + secret_server_token,
            wallet.brainkey_checksum
        )
    }
    */
    // delete_brainkey
    
    loadDbData() {
        var map = this.wallets.asMutable()
        return idb_helper.cursor("wallets", cursor => {
            if( ! cursor) {
                this.wallets = map.asImmutable()
                return
            }
            var wallet = cursor.value
            map.set(wallet.public_name, wallet)
            cursor.continue()
        });
    }
    
}

var WrappedWalletStore = alt.createStore(WalletStore, "WalletStore");
module.exports = WrappedWalletStore
var eventEmitter = WrappedWalletStore.getEventEmitter()
console.log('... eventEmitter',eventEmitter)

function reject(error) {
    console.error( "----- WalletStore reject error -----", error)
    eventEmitter.emit({action:'reject', data: error});
}   

