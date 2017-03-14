import {Apis, Manager} from "bitsharesjs-ws";
import {ChainStore} from "bitsharesjs/es";

// Stores
import iDB from "idb-instance";
import AccountRefsStore from "stores/AccountRefsStore";
import WalletManagerStore from "stores/WalletManagerStore";
import WalletDb from "stores/WalletDb";
import SettingsStore from "stores/SettingsStore";

import ls from "common/localStorage";
const STORAGE_KEY = "__graphene__";
const ss = new ls(STORAGE_KEY);
const apiLatencies = ss.get("apiLatencies", {});
const latencyChecks = ss.get("latencyChecks", 1);
let apiLatenciesCount = Object.keys(apiLatencies).length;
// Actions
import PrivateKeyActions from "actions/PrivateKeyActions";

ChainStore.setDispatchFrequency(20);

let connect = true;
let connectionManager;

const filterAndSortURLs = (count, latencies) => {
    let urls = SettingsStore.getState().defaults.apiServer
    .filter(a => {
        /*
        * Since we don't want users accidentally connecting to the testnet,
        * we filter out the testnet address from the fallback list
        */
        if (!__TESTNET__ && a.url.indexOf("testnet") !== -1) return false;
        /* Also remove the automatic fallback dummy url */
        if (a.url.indexOf("fake.automatic-selection") !== -1) return false;
        /* Use all the remaining urls if count = 0 */
        if (!count) return true;

        /* Only keep the nodes we were able to connect to */
        return !!latencies[a.url];
    })
    .sort((a, b) => {
        return latencies[a.url] - latencies[b.url];
    }).map(a => a.url);
    return urls;
};

const willTransitionTo = (nextState, replaceState, callback) => {
    if (connect) ss.set("latencyChecks", latencyChecks + 1); // Every 25 connect attempts we refresh the api latency list
    if (latencyChecks >= 25) {
        apiLatenciesCount = 0;
        ss.set("latencyChecks", 0);
    }

    let urls = filterAndSortURLs(apiLatenciesCount, apiLatencies);

    /*
    * We use a fake connection url to force a fallback to the best of
    * the pre-defined URLs, ranked by latency
    */
    let connectionString = SettingsStore.getSetting("apiServer");
    if (!connectionString) connectionString = urls[0].url;
    if (connectionString.indexOf("fake.automatic-selection") !== -1) connectionString = urls[0];

    if (!connectionManager) connectionManager = new Manager({url: connectionString, urls});
    if (nextState.location.pathname === "/init-error") {
        return Apis.reset(connectionString, true).init_promise
        .then(() => {
            var db = iDB.init_instance(window.openDatabase ? (shimIndexedDB || indexedDB) : indexedDB).init_promise;
            return Promise.all([db, SettingsStore.init()]).then(() => {
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
    let connectionCheckPromise = !apiLatenciesCount ? connectionManager.checkConnections() : null;
    Promise.all([connectionCheckPromise]).then((res => {
        if (connectionCheckPromise && res[0]) {
            let [latencies] = res;
            console.log("Connection latencies:", latencies);
            urls = filterAndSortURLs(0, latencies);
            ss.set("apiLatencies", latencies);
            connectionManager.urls = urls;
        }
        connectionManager.connectWithFallback(connect).then(() => {
            var db;
            try {
                db = iDB.init_instance(window.openDatabase ? (shimIndexedDB || indexedDB) : indexedDB).init_promise;
            } catch(err) {
                console.log("db init error:", err);
            }
            return Promise.all([db, SettingsStore.init(), ChainStore.init("willTransitionTo !init-error")]).then(() => {
                return Promise.all([
                    PrivateKeyActions.loadDbData().then(()=> AccountRefsStore.loadDbData()),
                    WalletDb.loadDbData().then(() => {
                        // if (!WalletDb.getWallet() && nextState.location.pathname === "/") {
                        //     replaceState("/dashboard");
                        // }
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
    }));


    // Every 25 connections we check the latencies of the full list of nodes
    if (connect && !apiLatenciesCount && !connectionCheckPromise) connectionManager.checkConnections().then((res) => {
        console.log("Connection latencies:", res);
        ss.set("apiLatencies", res);
    });
};

export default willTransitionTo;
