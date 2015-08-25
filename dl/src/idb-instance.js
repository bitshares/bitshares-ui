import idb_helper from "./idb-helper"

const DB_VERSION = 4;

var BACKUP_STORE_NAMES = [
    "wallets", "private_keys",
    "linked_accounts", "payee_accounts"
]

module.exports = (function () {

    var _instance;
    var idb;

    function upgrade(db, oldVersion) {
        if (oldVersion < 2) {
            idb_helper.autoIncrement_unique(db, "wallet", "public_name")
            idb_helper.autoIncrement_unique(db,
                "private_keys", "encrypted_key")
        }
        if (oldVersion < 3) {
            db.createObjectStore("linked_accounts", { keyPath: "name" });
            db.createObjectStore("payee_accounts", { keyPath: "name" });
        }
        if (oldVersion < 4) {
            db.createObjectStore("balance_claims", {
                keyPath: "chain_balance_record.id" })
        }
        idb_helper.set_graphene_db(db); //last
    }

    function openIndexedDB(indexedDBimpl) {
        return new Promise((resolve, reject) => {
            var openRequest = indexedDBimpl.open("graphene_db", DB_VERSION);

            openRequest.onupgradeneeded = function (e) {
                upgrade(e.target.result, e.oldVersion);
            };

            openRequest.onsuccess = function (e) {
                if(e.target.result.objectStoreNames.length === 0) upgrade(e.target.result, 0);
                resolve(e.target.result);
            };

            openRequest.onerror = function (e) {
                console.log("indexedDB open",e)
                reject(e.target.error);
            };

        });
    }

    function init(indexedDBimpl) {
        let instance;
        let promise = openIndexedDB(indexedDBimpl);
        promise.then(db => {
            idb = db;
            idb_helper.set_graphene_db(db);
        });
        return {
            init_promise: promise,
            db: () => idb
        };
    }

    return {
        init_instance: function (indexedDBimpl) {
            this.impl = indexedDBimpl
            if (!_instance) {
                _instance = init(indexedDBimpl);
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
        backup: function (store_names = BACKUP_STORE_NAMES) {
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
