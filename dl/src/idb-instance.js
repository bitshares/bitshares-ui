var iDB = (function () {

    var _instance;
    var idb;

    function openIndexedDB(indexedDBimpl) {
        //var WebSocketClient = typeof (WebSocket) !== "undefined" ? WebSocket : require("websocket").w3cwebsocket;

        return new Promise((resolve, reject) => {
            var openRequest = indexedDBimpl.open("graphene_db", 1);

            openRequest.onupgradeneeded = function (e) {
                let db = e.target.result;
                if (db.objectStoreNames.length === 0) {
                    db.createObjectStore("private_keys");
                }
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
        }
    };

})();

module.exports = iDB;
