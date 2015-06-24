import alt from "../alt-instance";
import iDB from "../idb-instance";
import key from "common/key_utils"
import idb_helper from "../idb-helper"

import {Wallet} from "./tcomb_structs";
import {PublicKey} from "./tcomb_structs";
import {PrivateKey} from "./tcomb_structs";

import Immutable from "immutable";
import BaseStore from "./BaseStore";
import PrivateKeyStore from 'stores/PrivateKeyStore'

class WalletStore extends BaseStore {
    
    constructor() {
        super();
        this.keys = Immutable.Map();
        this.bindListeners({
            onAddWallet: WalletActions.create
        });
        this._export(
            "loadDbData","lock","isLocked",
            "list","create","onDeleteWallet"
        )
    }
    
    loadDbData() {
        var map = this.keys.asMutable()
        idb_helper.cursor("wallets", cursor => {
            if( ! cursor) {
                this.keys = map.asImmutable()
                return
            }
            var wallet = cursor.value
            map.set(wallet.public_name, Wallet(wallet))
            cursor.continue()
        });
    }
    
    getWalletNames() {
        return this.keys.keySeq()
    }
    
    getWalletByName(wallet_public_name = "default") {
        return this.keys.get(wallet_public_name)
    }
    
    onAddWallet(result) {
        var wallet = result;
        if(this.keys.get(wallet.public_name))
            throw new Error("wallet exists")
        
        return new Promise((resolve, reject) => {
            let transaction = iDB.instance().db().transaction(
                ["wallets"], "readwrite"
            );
            transaction.onerror = error =>
                console.error( "----- transaction error -----", error )
            
            let store = transaction.objectStore("wallets")
            let request = store.add(wallet);
            request.onsuccess = (e) => { 
                console.log("[WalletStore.js] ----- key added -----");
                wallet.id = e.target.result
                this.keys = this.keys.set(wallet.public_name, Wallet(wallet))
                resolve(true)
            }
            request.onerror = (e) => {
                console.log("ERROR!!! add_to_store - can't store value in db. ", e.target.error.message);
                reject(e.target.error.message);
            };
        });
    }
    
    onDeleteWallet(wallet_public_name = "default") {
        var wallet = this.keys.get(wallet_public_name)
        return new Promise((resolve, reject) => {
            if(!wallet) {
                reject("no match")
                return
            }
            let transaction = iDB.instance().db().transaction(
                ["wallets","public_keys","private_keys"],
                "readwrite"
            );
            transaction.onerror = error =>
                console.error("----- transaction error -----", error)
            
            let store = transaction.objectStore("wallets");
            PrivateKeyStore.onDeleteByWalletId(wallet.id, transaction) 
            let request = store.delete(wallet.id);
            request.onsuccess = () => {
                delete aes_private_map[wallet_public_name]
                this.keys = this.keys.delete(wallet_public_name)
                if(this.keys.get(wallet_public_name))
                    throw new Error("DEBUG delete failed")
                resolve(true)
            };
            request.onerror = (e) => {
                console.log("ERROR!!! deleteWallet - ", e.target.error.message, value);
                reject(e.target.error.message);
            };
        });
    }
    
}

module.exports = alt.createStore(WalletStore, "WalletStore");
