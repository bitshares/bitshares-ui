import {Apis, Manager} from "bitsharesjs-ws";
import {ChainStore} from "bitsharesjs/es";

// Stores
import iDB from "idb-instance";
import AccountRefsStore from "stores/AccountRefsStore";
import WalletManagerStore from "stores/WalletManagerStore";
import WalletDb from "stores/WalletDb";
import SettingsStore from "stores/SettingsStore";
import AccountStore from "stores/AccountStore";

import ls from "common/localStorage";
const STORAGE_KEY = "__graphene__";
const ss = new ls(STORAGE_KEY);
const latencyChecks = ss.get("latencyChecks", 1);

// Actions
import PrivateKeyActions from "actions/PrivateKeyActions";
import SettingsActions from "actions/SettingsActions";

ChainStore.setDispatchFrequency(20);

let connect = true;
let connectionManager;
let oldChain = "";

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

const willTransitionTo = (nextState, replaceState, callback, appInit=true) => { //appInit is true when called via router onEnter, and false when node is manually selected in access settings
    const apiLatencies = SettingsStore.getState().apiLatencies;
    let apiLatenciesCount = Object.keys(apiLatencies).length;

    if (connect) ss.set("latencyChecks", latencyChecks + 1); // Every 15 connect attempts we refresh the api latency list
    if (latencyChecks >= 15) {
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
    const autoSelection = connectionString.indexOf("fake.automatic-selection") !== -1;
    if (autoSelection) {
        connectionString = urls[0];
    }

    var onConnect = (res) => {
        if (res && res[1] && res[1].ws_rpc) {
            SettingsActions.changeSetting({setting: "activeNode", value: res[1].ws_rpc.ws.url});
            if (!autoSelection) SettingsActions.changeSetting({setting: "apiServer", value: res[1].ws_rpc.ws.url});
        }
        const currentChain = Apis.instance().chain_id;
        const chainChanged = oldChain && oldChain !== currentChain;
        oldChain = currentChain;
        var db;
        try {
            iDB.close();
            db = iDB.init_instance(window.openDatabase ? (shimIndexedDB || indexedDB) : indexedDB).init_promise;
        } catch(err) {
            console.log("db init error:", err);
            replaceState("/init-error");
            callback();
        }
        return Promise.all([db, SettingsStore.init()]).then(() => {
            return Promise.all([
                PrivateKeyActions.loadDbData().then(()=> {
                    AccountRefsStore.loadDbData();
                }),
                WalletDb.loadDbData().then(() => {
                    // if (!WalletDb.getWallet() && nextState.location.pathname === "/") {
                    //     replaceState("/dashboard");
                    // }
                    if (nextState.location.pathname.indexOf("/auth/") === 0) {
                        replaceState("/dashboard");
                    }
                }).then(() => {
                    if (chainChanged) {
                        ChainStore.clearCache();
                        ChainStore.subscribed = false;
                        ChainStore.init().then(() => {
                            AccountStore.reset();
                            AccountStore.loadDbData(currentChain);
                        });
                    } else {
                        AccountStore.reset();
                    }
                })
                .catch((error) => {
                    console.error("----- WalletDb.willTransitionTo error ----->", error);
                    replaceState("/init-error");
                }),
                WalletManagerStore.init()
            ]).then(()=> {
                SettingsActions.changeSetting({setting: "activeNode", value: connectionManager.url});
                callback();
            });
        });
    };

    var onResetError = (err) => {
        console.log("err:", err);
        return callback();
    };

    connectionManager = new Manager({url: connectionString, urls});
    if (nextState.location.pathname === "/init-error") {
        return Apis.reset(connectionString, true).init_promise
        .then(onConnect).catch(onResetError);

    }
    let connectionCheckPromise = !apiLatenciesCount ? connectionManager.checkConnections() : null;
    Promise.all([connectionCheckPromise]).then((res => {
        if (connectionCheckPromise && res[0]) {
            let [latencies] = res;
            urls = filterAndSortURLs(Object.keys(latencies).length, latencies);
            connectionManager.url = urls[0];
            connectionManager.urls = urls;
            /* Update the latencies object */
            SettingsActions.updateLatencies(latencies);
        }
        // let latencies = ss.get("apiLatencies", {});
        // let connectionStart = new Date().getTime();

        if(appInit){
            connectionManager.connectWithFallback(connect).then((res) => {
                if (!autoSelection) SettingsActions.changeSetting({setting: "apiServer", value: connectionManager.url});

                onConnect(res);
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
        } else {
            Apis.reset(connectionManager.url, true).init_promise.then(onConnect).catch(onResetError);
        }

        /* Only try initialize the API with connect = true on the first onEnter */
        connect = false;
    }));


    // Every 15 connections we check the latencies of the full list of nodes
    if (connect && !apiLatenciesCount && !connectionCheckPromise) connectionManager.checkConnections().then((res) => {
        console.log("Connection latencies:", res);
        SettingsActions.updateLatencies(res);
    });
};

export default willTransitionTo;
