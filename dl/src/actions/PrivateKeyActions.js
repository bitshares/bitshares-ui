var alt = require("../alt-instance");
import iDB from "../idb-instance";

class PrivateKeyActions {

    addKey(key) {
        let idb = iDB.instance().db();
        let transaction = idb.transaction(["private_keys"], "readwrite");
        let store = transaction.objectStore("private_keys");
        let request = store.add(key,3);
        request.onsuccess = () => {
            console.log("[PrivateKeyActions.js:11] ----- PrivateKeyActions: key added ----->", key);
            this.dispatch(key);
        };
        request.onerror = (e) => {
            console.log("ERROR!!! PrivateKeyActions =- can't store key in db. ", e.target.error.message, key);
        };
    }

}

module.exports = alt.createActions(PrivateKeyActions);
