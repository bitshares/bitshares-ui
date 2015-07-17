import idb_helper from "./idb-helper"

const DB_VERSION = 3;

var iDB = (function () {

    var _instance;
    var idb;

    function openIndexedDB(indexedDBimpl) {

        return new Promise((resolve, reject) => {
            var openRequest = indexedDBimpl.open("graphene_db", DB_VERSION);

            openRequest.onupgradeneeded = function (e) {
                let db = e.target.result;
                if (e.oldVersion < 2) {
                    idb_helper.autoIncrement_unique(db, "wallets", "public_name")
                    idb_helper.autoIncrement_unique(db, "private_keys", "pubkey")
                }
                if (e.oldVersion < 3) {
                    db.createObjectStore("linked_accounts", { keyPath: "name" });
                    db.createObjectStore("payee_accounts", { keyPath: "name" });
                }
                
                idb_helper.set_graphene_db(db) //last
            };

            openRequest.onsuccess = function (e) {
                resolve(e.target.result);
            };

            openRequest.onerror = function (e) {
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
        }
    };

})();

module.exports = iDB;
