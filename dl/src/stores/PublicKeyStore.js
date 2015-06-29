import Immutable from "immutable";
import alt from "../alt-instance";
import BaseStore from "./BaseStore";
import PrivateKeyActions from "../actions/PublicKeyActions";
import Utils from "../common/utils";
import {PublicKeyTcomb} from "./tcomb_structs";
import iDB from "../idb-instance";

import hash from "common/hash"

class PublicKeyStore extends BaseStore {
    
    constructor() {
        super();
        this.keys = Immutable.Map();
        this.bindListeners({
            onAddKey: PublicKeyActions.addKey
        });
        this._export("loadDbData","onAddKey", "onDeleteByPublicId");
    }

    loadDbData() {
        var map = this.keys.asMutable()
        idb_helper.cursor("public_keys", cursor => {
            if( ! cursor) {
                this.keys = map.asImmutable()
                return
            }
            var public_key = PublicKeyTcomb(cursor.value)
            map.set(public_key.id, public_key)
            cursor.continue()
        });
    }
    
    onAddKey(public_key_object, transaction, callback) {
        return idb_helper.add(
            transaction.objectStore("public_keys"),
            public_key_object, public_key_object => {
                this.keys = this.keys.set(
                    public_key_object.id,
                    PublicKeyTcomb(public_key_object)
                )
                return callback ?
                    callback(public_key_object) : 
                    public_key_object
            }
        )
    }
    
    onDeleteByPublicId(public_id, transaction) {
        return new Promise((resolve, reject) => {
            var store = transaction.objectStore("public_keys")
            var request = store.delete(public_id)
            ((public_id, resolve) => {
                request.onsuccess = () => {
                    this.keys = this.keys.delete(public_id)
                    resolve()
                }
            })(public_id, resolve)
            request.onerror = (e) => {
                console.log("ERROR!!! onDeleteByPublicId - ", e.target.error.message);
                reject(e.target.error.message)
            }
        })
    }

}

module.exports = alt.createStore(PublicKeyStore, "PublicKeyStore");
