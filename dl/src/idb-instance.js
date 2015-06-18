const DB_VERSION = 1;

var iDB = (function () {

    var _instance;
    var idb;

    function openIndexedDB(indexedDBimpl) {

        return new Promise((resolve, reject) => {
            var openRequest = indexedDBimpl.open("graphene_db", DB_VERSION);

            openRequest.onupgradeneeded = function (e) {
                let db = e.target.result;
                if (!db.objectStoreNames.contains("private_keys")) { db.createObjectStore("private_keys", { keyPath: "id" }); }
                if (!db.objectStoreNames.contains("my_accounts")) { db.createObjectStore("my_accounts", { keyPath: "name" }); }
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
        promise.then(db => { idb = db; });
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
                throw "Instance is not initialized";
            }
            return _instance;
        },
        add_to_store: function (store_name, value) {
            return new Promise((resolve, reject) => {
                let transaction = this.instance().db().transaction([store_name], "readwrite");
                let store = transaction.objectStore(store_name);
                let request = store.add(value);
                request.onsuccess = () => { resolve(true); };
                request.onerror = (e) => {
                    console.log("ERROR!!! add_to_store - can't store value in db. ", e.target.error.message, value);
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
