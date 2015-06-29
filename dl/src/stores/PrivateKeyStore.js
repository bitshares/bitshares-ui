import Immutable from "immutable";
import alt from "../alt-instance";
import BaseStore from "./BaseStore";
import iDB from "../idb-instance";

import {PrivateKey} from "./tcomb_structs";

import hash from "common/hash"

class PrivateKeyStore extends BaseStore {
    
    constructor() {
        super();
        this.keys = Immutable.Map();
        /*this.bindListeners({
            onAddKey: PrivateKeyActions.addKey
        });*/
        this._export("loadDbData","onAddKey", "onDeleteByWalletId","onAddKey");
    }

    loadDbData() {
        var map = this.keys.asMutable()
        idb_helper.cursor("private_keys", cursor => {
            if( ! cursor) {
                this.keys = map.asImmutable()
                return
            }
            var private_key = PrivateKey(cursor.value)
            map.set(private_key.id, private_key)
            cursor.continue()
        });
    }
    
    onAddKey(private_key_object, transaction, callback) {
        return idb_helper.add(
            transaction.objectStore("private_keys"),
            private_key_object, private_key_object => {
                this.keys = this.keys.set(
                    private_key_object.id,
                    PrivateKeyTcomb(private_key_object)
                )
                return callback ?
                    callback(private_key_object) : 
                    private_key_object
            }
        )
    }
    
    onDeleteByWalletId(wallet_id, transaction, cascade = true) {
        var store = transaction.objectStore("private_keys")
        var delete_ids = [], promises = []
        for(let key of this.keys) {
            var private_key = key[1]
            if(private_key.wallet_id === wallet_id) {
                if(cascade){
                    promises.push(
                        PublicKeyStore.onDeleteByPublicId(
                            private_key.public_id,
                            transaction
                        )
                    )
                }
                promises.push(
                    new Promise((resolve, reject)=>{
                        let request = store.delete(private_key.id)
                        ((private_id, resolve)=>{
                            request.onsuccess = () => {
                                this.keys = this.keys.delete(private_id)
                                resolve()
                            }
                        })(private_key.id, resolve)
                        request.onerror = (e) => {
                            console.log("ERROR!!! onDeleteByWalletId - ", e.target.error.message, value);
                            reject(e.target.error.message)
                        }
                    })
                )
            }
        }
        return Promise.all(promises)
    }



}

module.exports = alt.createStore(PrivateKeyStore, "PrivateKeyStore");
