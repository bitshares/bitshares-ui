import iDB from "../idb-instance";
import key from "../common/key_utils"
import idb_helper from "../idb-helper"

import Immutable from "immutable";

import PrivateKeyStore from "./PrivateKeyStore"
import {WalletTcomb, PrivateKeyTcomb} from "./tcomb_structs";
import PrivateKey from "../ecc/key_private"
import ApplicationApi from "../rpc_api/ApplicationApi"

var application_api = new ApplicationApi()
var wallet_public_name = "default"
var aes_private_map = {}
var transaction

class WalletDb {
    
    constructor() {
        this.secret_server_token = "secret_server_token";
        this.wallets = Immutable.Map();
    }
    
    getWallet() {
        return this.wallets.get(wallet_public_name)
    }
    
    getCurrentWalletName() {
        return wallet_public_name
    }
    
    setCurrentWalletName(public_name) {
        wallet_public_name = public_name
    }
    
    getBrainKey() {
        var wallet = this.wallets.get(wallet_public_name)
        if ( ! wallet)
            throw new Error("missing wallet " + wallet_public_name)
        
        var aes_private = aes_private_map[wallet_public_name]
        if ( ! aes_private)
            throw new Error("wallet locked " + wallet_public_name)
        
        if ( ! wallet.encrypted_brainkey)
            throw new Error("missing brainkey")
        
        var brainkey_plaintext = aes_private.decryptHexToText(
            wallet.encrypted_brainkey
        )
        try {
            key.aes_private(
                brainkey_plaintext + this.secret_server_token,
                wallet.brainkey_checksum
            )
        } catch(e) {
            throw new Error('Brainkey checksum mis-match')
        }
        return brainkey_plaintext
    }
    
    onLock() {
        delete aes_private_map[wallet_public_name]
    }
    
    isLocked() {
        return aes_private_map[wallet_public_name] ? false : true
    }
    
    validatePassword( password, unlock = false ) {
        var wallet = this.wallets.get(wallet_public_name)
        if ( ! wallet)
            return false
        
        try {
            var aes_private = key.aes_private(
                password + this.secret_server_token,
                wallet.password_checksum
            )
            if(unlock) {
                aes_private_map[wallet_public_name] = aes_private
            }
        } catch(e) {
            console.log('password error', e)
        }
    }
    
    transaction_update() {
        var transaction = iDB.instance().db().transaction(
            ["wallets"], "readwrite"
        )
        transaction.onerror = error =>
            console.log(error, new Error().stack)
        
        return transaction
    }
    
    transaction_update_keys() {
        var transaction = iDB.instance().db().transaction(
            ["wallets", "private_keys"], "readwrite"
        )
        transaction.onerror = error =>
            console.log(error, new Error().stack)
        
        return transaction
    }
    
    onCreateWallet(
        password_plaintext,
        brainkey_plaintext,
        unlock = false
    ) {
        return new Promise( (resolve, reject) => {
            if(this.wallets.get(wallet_public_name)) {
                reject("wallet exists")
                return
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
                brainkey_checksum,
                brainkey_sequence: 0
            }
            WalletTcomb(wallet)
            var transaction = this.transaction_update()
            var add = idb_helper.add(
                transaction.objectStore("wallets"),
                wallet
            )
            var end = idb_helper.on_transaction_end(transaction).then( () => {
                this.wallets = this.wallets.set(
                    wallet.public_name,
                    wallet//WalletTcomb(wallet)
                )
                if(unlock) {
                    aes_private_map[wallet_public_name] =
                        password.aes_private
                }
            })
            resolve( Promise.all([ add, end ]) )
        })
    }
    
    generateKeys() {
        var wallet = this.wallets.get(wallet_public_name)
        if( ! wallet)
            throw new Error("missing wallet " + wallet_public_name)
        
        var brainkey = this.getBrainKey()
        if( ! brainkey)
            throw new Error("missing brainkey")
        
        var owner_privkey = key.get_owner_private(
            brainkey, wallet.brainkey_sequence
        )
        var active_privkey = key.get_active_private(owner_privkey);

        return [
            {
                private_key: owner_privkey,
                sequence: wallet.brainkey_sequence + ""
            },{
                private_key: active_privkey,
                sequence: wallet.brainkey_sequence + ".0"
            }
        ]
    }
    
    saveKeys(private_keys, transaction) {
        //private_keys = [{private_key, sequence}]
        for(let private_key_record of private_keys) {
            this.saveKey(
                private_key_record.private_key,
                private_key_record.sequence,
                transaction
            )
        }
    }
    
    saveKey(
        private_key,
        brainkey_pos,
        transaction
    ) {
        var password_aes_private = aes_private_map[
            wallet_public_name
        ]
        var private_cipherhex =
            password_aes_private.encryptToHex(
                private_key.toBuffer()
            )
        var wallet = this.getWallet()
        var public_key = private_key.toPublicKey()
        var private_key_object = {
            wallet_id: wallet.id,
            encrypted_key: private_cipherhex,
            brainkey_pos: brainkey_pos,
            pubkey: public_key.toBtsPublic()
        }
        PrivateKeyTcomb(private_key_object)
        PrivateKeyStore.onAddKey(
            private_key_object, transaction
        )
    }
        
    incrementBrainKeySequence(transaction) {
        return new Promise((resolve, reject) => {
            var wallet = this.wallets.get(wallet_public_name)
            if ( ! wallet) {
                reject("missing wallet " + wallet_public_name)
                return
            }
            // https://github.com/gcanti/tcomb/issues/110
            //var new_wallet = WalletTcomb.update(wallet, {
            //    brainkey_sequence: {'$set': wallet.brainkey_sequence + 1}
            //})
            var new_wallet = wallet
            wallet.brainkey_sequence = wallet.brainkey_sequence + 1
            var wallet_store = transaction.objectStore("wallets")
            wallet_store.put(new_wallet)
            var promise = idb_helper.on_transaction_end(
                transaction 
            ).then( () => {
                // Update RAM
                this.wallets.set(
                    new_wallet.public_name,
                    new_wallet
                )
            })
            resolve(promise)
        })
    }
    
    /*
    onDeleteWallet(wallet_public_name = "default") {
        var wallet = this.wallets.get(wallet_public_name)
        if(!wallet) {
            reject("no match")
            return false
        }
        let transaction = iDB.instance().db().transaction(
            ["wallets", "private_keys"],
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
            var wallet = cursor.value//WalletTcomb(cursor.value)
            map.set(wallet.public_name, wallet)
            cursor.continue()
        });
    }
    
}

module.exports = new WalletDb()

function reject(error) {
    console.error( "----- WalletDb reject error -----", error)
    throw new Error(error)
}   

