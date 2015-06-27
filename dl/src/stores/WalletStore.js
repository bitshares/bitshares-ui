import alt from "../alt-instance";
import iDB from "../idb-instance";
import key from "common/key_utils"
import idb_helper from "../idb-helper"

import Immutable from "immutable";

import BaseStore from "./BaseStore";
import PrivateKeyStore from 'stores/PrivateKeyStore'
import {Wallet, PublicKey, PrivateKey} from "./tcomb_structs";
import WalletActions from "actions/WalletActions"

var aes_private_map = {}

class WalletStore extends BaseStore {
    
    constructor() {
        super();
        this.secret_server_token = "secret_server_token";
        this.wallets = Immutable.Map();
        this.bindActions(WalletActions)
        this._export(
            "loadDbData"//, "create"
        )
    }
    
    onLock({wallet_public_name}) {
        delete aes_private_map[wallet_public_name]
    }
    
    isLocked(wallet_public_name) {
        return aes_private_map[wallet_public_name] ? false : true
    }
    
    loadDbData() {
        var map = this.wallets.asMutable()
        return idb_helper.cursor("wallets", cursor => {
            if( ! cursor) {
                this.wallets = map.asImmutable()
                return
            }
            var wallet = cursor.value
            map.set(wallet.public_name, Wallet(wallet))
            cursor.continue()
        });
    }
    
    onCreate([
        wallet_public_name, 
        password_plaintext,
        brainkey_plaintext,
        unlock = false
    ]) {
        if(this.wallets.get(wallet_public_name)) {
            reject("wallet exists")
        }
        let transaction = iDB.instance().db().transaction(
            ["wallets"], "readwrite"
        )
        transaction.onerror = e => {
            reject(e.target.error.message)
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
        
        let store = transaction.objectStore("wallets")
        let wallet = {
            public_name: wallet_public_name,
            password_checksum: password.checksum,
            encrypted_brainkey: brainkey_cipherhex,
            brainkey_checksum
        }
        let request = store.add(wallet)
        request.onsuccess = (e) => { 
            console.log("[WalletStore.js] ----- key added -----");
            wallet.id = e.target.result
            this.wallets = this.wallets.set(
                wallet_public_name,
                Wallet(wallet)
            )
            if(unlock) {
                aes_private_map[wallet_public_name] = password.aes_private
            }
            //eventEmitter.emitChange()
        }
        request.onerror = (e) => {
            reject(e.target.error.message);
        }
        return false
    }
    
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
            let store = transaction.objectStore("wallets");
            let request = store.delete(wallet.id);
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
    }
    /*
    validatePassword(
        wallet,
        password,
        unlock = false
    ) {
        if(! password || typeof password != 'string')
            throw new Error("required: password")
        
        if(! secret_server_token || typeof password != 'string')
            throw new Error("required: secret_server_token")
        
        var wallet = this.keys.get(wallet_public_name)
        if ( ! wallet)
            throw new Error("wrong password")
        
        var aes_private = key.aes_private(
            password + secret_server_token,
            wallet.password_checksum
        )
        if(unlock)
            aes_private_map[wallet_public_name] = aes_private
    }
    
    validateBrainkey(
        wallet,
        brain_key,
        secret_server_token
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
}

var WrappedWalletStore = alt.createStore(WalletStore, "WalletStore");
module.exports = WrappedWalletStore
var eventEmitter = WrappedWalletStore.getEventEmitter()
console.log('... eventEmitter',eventEmitter)

function reject(error) {
    console.error( "----- WalletStore reject error -----", error)
    eventEmitter.emit({action:'reject', data: error});
}   

