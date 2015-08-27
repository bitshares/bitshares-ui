import Apis from "rpc_api/ApiInstances"
import idb_helper from "idb-helper"
import iDBRoot from "idb-root"

const DB_VERSION = 1
const DB_PREFIX = "graphene_db"
const WALLET_BACKUP_STORES = [
    "wallet", "private_keys", "linked_accounts"
]

var iDB
module.exports = iDB = (function () {

    var _instance;
    var idb;

    function upgrade(db, oldVersion) {
        // DEBUG console.log('... oldVersion',oldVersion)
        if (oldVersion === 0) {
            db.createObjectStore("wallet", { keyPath: "public_name" })
            idb_helper.autoIncrement_unique(db, "private_keys", "pubkey")
            db.createObjectStore("linked_accounts", { keyPath: "name" })
            db.createObjectStore("balance_claims", { keyPath: "chain_balance_record.id" })
        }
        // if (oldVersion < 2) {
        //     
        // }
    }
    
    function openIndexedDB() {
        return iDB.root.getProperty("current_wallet", "default").then( current_wallet => {
            return new Promise((resolve, reject) => {

                var chain_id = Apis.instance().chain_id
                iDB.database_name = [
                    DB_PREFIX,
                    chain_id ? chain_id.substring(0, 6) : "",
                    current_wallet
                ].join("_")

                // DEBUG
                console.log('... iDB.database_name',iDB.database_name)

                var openRequest = iDB.impl.open(iDB.database_name, DB_VERSION);

                openRequest.onupgradeneeded = function (e) {
                    // DEBUG console.log('... openRequest.onupgradeneeded')
                    upgrade(e.target.result, e.oldVersion)
                };

                openRequest.onsuccess = function (e) {
                    // DEBUG console.log('... openRequest.onsuccess', e.target.result)
                    var db = e.target.result
                    idb_helper.set_graphene_db(db)
                    resolve(db);
                };

                openRequest.onerror = function (e) {
                    // DEBUG console.log("indexedDB open",e.target.error, e)
                    reject(e.target.error);
                };
            })
        })
    }

    function init() {
        let instance;
        let promise = openIndexedDB();
        promise.then(db => {
            idb = db;
        });
        return {
            init_promise: promise,
            db: () => idb
        };
    }

    return {
        WALLET_BACKUP_STORES,
        deleteDatabase: function(are_you_sure = false) {
            if( ! are_you_sure) return "Are you sure?"
            console.log("deleting", this.database_name)
            var req = iDB.impl.deleteDatabase(this.database_name)
            return req.result
        },
        init_instance: function (indexedDBimpl) {
            if (!_instance) {
                //if("__useShim" in indexedDBimpl) {
                //    console.log('... iDB.impl.__useShim()')
                //    this.impl.__useShim() //always use shim
                //}
                this.impl = indexedDBimpl
                var chain_id = Apis.instance().chain_id
                var chain_substring = chain_id ? chain_id.substring(0, 6) : ""
                this.root = new iDBRoot(this.impl, "_" + chain_substring)
                _instance = init()
            }
            return _instance;
        },
        instance: function () {
            if (!_instance) {
                throw new Error("Internal Database instance is not initialized");
            }
            return _instance;
        },
        add_to_store: function (store_name, value) {
            return new Promise((resolve, reject) => {
                let transaction = this.instance().db().transaction([store_name], "readwrite");
                let store = transaction.objectStore(store_name);
                let request = store.add(value);
                request.onsuccess = () => { resolve(value); };
                request.onerror = (e) => {
                    console.log("ERROR!!! add_to_store - can't store value in db. ", e.target.error.message, value);
                    reject(e.target.error.message);
                };
            });
        },
        remove_from_store: function (store_name, value) {
            return new Promise((resolve, reject) => {
                let transaction = this.instance().db().transaction([store_name], "readwrite");
                let store = transaction.objectStore(store_name);
                let request = store.delete(value);
                request.onsuccess = () => { resolve(); };
                request.onerror = (e) => {
                    console.log("ERROR!!! remove_from_store - can't remove value from db. ", e.target.error.message, value);
                    reject(e.target.error.message);
                };
            });
        },
        load_data: function (store_name) {
            return new Promise((resolve, reject) => {
                let data = [];
                let transaction = this.instance().db().transaction([store_name], "readonly");
                let store = transaction.objectStore(store_name);
                let request = store.openCursor();
                //request.oncomplete = () => { resolve(data); };
                request.onsuccess = e => {
                    let cursor = e.target.result;
                    if (cursor) {
                        data.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(data);
                    }
                };
                request.onerror = (e) => {
                    console.log("ERROR!!! open_store - can't get '`${store_name}`' cursor. ", e.target.error.message);
                    reject(e.target.error.message);
                };
            });
        },
        backup: function (store_names = WALLET_BACKUP_STORES) {
            var promises = []
            for (var store_name of store_names) {
                promises.push(this.load_data(store_name))
            }
            //Add each store name
            return Promise.all(promises).then( results => {
                var obj = {}
                for (let i = 0; i < store_names.length; i++) {
                    var store_name = store_names[i]
                    obj[store_name] = results[i]
                }
                return obj
            })
        }
    };

})();

