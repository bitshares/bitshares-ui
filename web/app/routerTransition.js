import {Apis} from "bitsharesjs-ws";
import {ChainStore} from "bitsharesjs/es";

// Stores
import iDB from "idb-instance";
import AccountRefsStore from "stores/AccountRefsStore";
import WalletManagerStore from "stores/WalletManagerStore";
import WalletDb from "stores/WalletDb";
import SettingsStore from "stores/SettingsStore";

// Actions
import PrivateKeyActions from "actions/PrivateKeyActions";

let connect = true;
const willTransitionTo = (nextState, replaceState, callback) => {
    console.log("willTransitionTo", connect, nextState);
    let connectionString = SettingsStore.getSetting("apiServer");

    if (nextState.location.pathname === "/init-error") {

        return Apis.reset(connectionString, true).init_promise
        .then(() => {
            var db = iDB.init_instance(window.openDatabase ? (shimIndexedDB || indexedDB) : indexedDB).init_promise;
            return Promise.all([db, ChainStore.init()]).then(() => {
                return callback();
            }).catch((err) => {
                console.log("err:", err);
                return callback();
            });
        }).catch((err) => {
            console.log("err:", err);
            return callback();
        });

    }
    Apis.instance(connectionString, !!connect).init_promise.then(() => {
        var db;
        try {
            db = iDB.init_instance(window.openDatabase ? (shimIndexedDB || indexedDB) : indexedDB).init_promise;
        } catch(err) {
            console.log("db init error:", err);
        }
        return Promise.all([db, ChainStore.init()]).then(() => {
            return Promise.all([
                PrivateKeyActions.loadDbData().then(()=> AccountRefsStore.loadDbData()),
                WalletDb.loadDbData().then(() => {
                    if (!WalletDb.getWallet() && nextState.location.pathname === "/") {
                        replaceState("/dashboard");
                    }
                    if (nextState.location.pathname.indexOf("/auth/") === 0) {
                        replaceState("/dashboard");
                    }
                }).catch((error) => {
                    console.error("----- WalletDb.willTransitionTo error ----->", error);
                }),
                WalletManagerStore.init()
            ]).then(()=> {
                callback();
            });
        });
    }).catch( error => {
        console.error("----- App.willTransitionTo error ----->", error, (new Error).stack);
        if(error.name === "InvalidStateError") {
            if (__ELECTRON__) {
                replaceState("/dashboard");
            } else {
                alert("Can't access local storage.\nPlease make sure your browser is not in private/incognito mode.");
            }
        } else {
            replaceState("/init-error");
            callback();
        }
    });
    /* Only try initialize the API with connect = true on the first onEnter */
    connect = false;
};

export default willTransitionTo;
