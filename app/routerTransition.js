import {Apis, Manager, ChainConfig} from "bitsharesjs-ws";
import {ChainStore} from "bitsharesjs/es";
import chainIds from "chain/chainIds";

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

import counterpart from "counterpart";

// Actions
import PrivateKeyActions from "actions/PrivateKeyActions";
import SettingsActions from "actions/SettingsActions";
import notify from "actions/NotificationActions";

ChainStore.setDispatchFrequency(60);

/** RouterTransitioner is a helper class that facilitates connecting, switching and reconnecting
 *  to nodes.
 *
 *  @author Stefan Schiessl <stefan.schiessl@blockchainprojectsbv.com>
 */
class RouterTransitioner {
    constructor() {
        this._connectionManager;

        this._oldChain = null;

        // boolean flag if the lowest latency node should be autoselected
        this._autoSelection = null;

        this._connectInProgress = false;
        this._connectionStart = null;
    }

    /**
     * Is called once when router is initialized, and then if a connection error occurs or user manually
     * switches nodes
     *
     * @param nextState argument as given by Route onEnter
     * @param replaceState argument as given by Route onEnter
     * @param callback argument as given by Route onEnter
     * @param appInit true when called via router, false false when node is manually selected in access settings
     * @returns {*}
     */
    willTransitionTo(nextState, replaceState, callback, appInit = true) {
        console.log(
            new Date().getTime(),
            "nextState",
            nextState,
            "replaceState",
            replaceState,
            "callback",
            callback,
            "appInit",
            appInit
        );

        // Bypass the app init chain for the migration path which is only used at bitshares.org/wallet
        if (__DEPRECATED__) {
            ChainConfig.setChainId(chainIds.MAIN_NET);
            let dbPromise = iDB.init_instance(this._getIndexDBImpl())
                .init_promise;
            return dbPromise.then(() => {
                Promise.all([
                    WalletDb.loadDbData().then(() => {
                        // console.log("wallet init done");
                        callback();
                    }),
                    WalletManagerStore.init()
                ]);
            });
        }

        // on init-error dont attempt connecting
        if (nextState.location.pathname === "/init-error") {
            return callback();
        }

        // dict of apiServer url as key and the latency as value
        const apiLatencies = SettingsStore.getState().apiLatencies;
        let latenciesEstablished = Object.keys(apiLatencies).length > 0;

        let latencyChecks = ss.get("latencyChecks", 1);
        console.log("latencyChecks " + latencyChecks);
        if (latencyChecks >= 5) {
            // every x connect attempts we refresh the api latency list
            // automtically
            ss.set("latencyChecks", 0);
            latenciesEstablished = false;
        } else {
            // otherwise increase the counter
            if (appInit) ss.set("latencyChecks", latencyChecks + 1);
        }

        let urls = this.getFilteredAndSortedNodes(false, apiLatencies);
        console.log(urls);

        // set auto selection flag
        this._autoSelection =
            SettingsStore.getSetting("apiServer").indexOf(
                "fake.automatic-selection"
            ) !== -1;

        this._initConnectionManager(urls);

        if (!latenciesEstablished) {
            console.log("doLatencyUpdate initial");
            this.doLatencyUpdate(true)
                .then(
                    this._initiateConnection.bind(
                        this,
                        nextState,
                        replaceState,
                        callback,
                        appInit
                    )
                )
                .catch(() => {
                    console.log("catch doLatency");
                });
        } else {
            this._initiateConnection(
                nextState,
                replaceState,
                callback,
                appInit
            );
        }
    }

    /**
     * Updates the latency of all target nodes
     *
     * @param refresh boolean true reping all existing nodes
     *                        false only reping all reachable nodes
     * @returns {Promise}
     */
    doLatencyUpdate(refresh = true) {
        return new Promise((resolve, reject) => {
            console.log("doLatencyUpdate begin");
            // if for some reason this method is called before connections are setup via willTransitionTo,
            // initialize the manager
            if (this._connectionManager == null) {
                this._initConnectionManager();
            }
            if (refresh) {
                console.log("doLatencyUpdate refresh");
                this._connectionManager.urls = this.getFilteredAndSortedNodes(
                    true
                );
            }
            console.log(SettingsStore.getState().apiLatencies);
            this._connectionManager
                .checkConnections()
                .then(res => {
                    console.log("doLatencyUpdate ping done");
                    // resort the api nodes with the new pings
                    this._connectionManager.urls = this.getFilteredAndSortedNodes(
                        false,
                        res
                    );
                    // update the latencies object
                    SettingsActions.updateLatencies(res);
                    resolve();
                })
                .catch(err => {
                    console.log("doLatencyUpdate error");
                    console.log(err);
                    reject(err);
                });
        });
    }

    _initConnectionManager(urls = null) {
        if (urls == null) {
            urls = this.getFilteredAndSortedNodes(true);
        }
        // decide where to connect to first
        let connectionString = this._getFirstToTry(urls);

        this._connectionManager = new Manager({
            url: connectionString,
            urls: []
        });
        // don't give urls in constructor of Manager, it removes the entry given with url.
        // .. downside of this approach is that on error it is likely to first retry the same node again
        //    (in case of autoSelection url == url[0]
        // .. upside is that the urls list is still the same sorted list with lowest to highest latency
        this._connectionManager.urls = urls;
    }

    _isAutoSelection() {
        return this._autoSelection;
    }

    /**
     *
     * @param apiNodeUrl the url of the target node, e.g. wss://eu.nodes.bitshares.ws
     * @returns {boolean} true the security matches, meaning that we either have:
     *                              - user connected via http to the wallet and target node is ws:// or wss://
     *                         - user connected via https and target node is wss://
     *                    false user tries to connect to ws:// node via a wallet opened in https
     * @private
     */
    _apiUrlSecuritySuitable(apiNodeUrl) {
        if (window.location.protocol === "https:") {
            return apiNodeUrl.indexOf("ws://") == -1;
        } else {
            return true;
        }
    }

    /**
     * Returns a list of all configured api nodes
     *
     * @returns list of dictionaries with keys: url, hidden, location
     */
    getAllApiServers() {
        return SettingsStore.getState().defaults.apiServer;
    }

    /**
     * Returns a list of viable api nodes that we consider connecting to
     *
     * @param all default false
     * @param latencies default null. if given
     * @returns list of viable api nodes (not hidden, not testnet if mainnet, not autoselect and with suitable security)
     *          if latencies is given, the nodes are sorted with descending latency (index 0 fasted one)
     *          if all is true, all nodes are returned, otherwise only the once that are pinged
     */
    getFilteredAndSortedNodes(all = false, latencies = null) {
        if (!all) {
            // in case user only wants pinged nodes we need to ensure
            // that we have the latency list
            latencies = SettingsStore.getState().apiLatencies;
            if (Object.keys(latencies).length == 0) {
                // force all
                all = true;
            }
        }
        let filtered = this.getAllApiServers().filter(a => {
            // Skip hidden nodes
            if (a.hidden) return false;

            // do not automatically connect to TESTNET
            if (!__TESTNET__ && a.url.indexOf("testnet") !== -1) return false;

            // remove the automatic fallback dummy url
            if (a.url.indexOf("fake.automatic-selection") !== -1) return false;

            // Remove insecure websocket urls when using secure protocol
            if (!this._apiUrlSecuritySuitable(a.url)) {
                return false;
            }
            // we don't know any latencies, return all
            if (all) return true;

            // only keep the ones we were able to connect to
            return !!latencies[a.url];
        });
        if (latencies) {
            filtered = filtered.sort((a, b) => {
                // sort according to pink
                return latencies[a.url] - latencies[b.url];
            });
        }
        return filtered.map(a => a.url); // drop location, only urls in list
    }

    /**
     * Returns the the one last url node connected to, with fallback the lowest latency one if
     *    > there was no last connection
     *    > if security is not suitable fallback to the lowest latency one
     *    > if autoSelection is true
     *
     * @param urls list of string, list of node urls suitable for connecting to
     * @returns connectionString
     * @private
     */
    _getFirstToTry(urls) {
        let connectionString = SettingsStore.getSetting("apiServer");
        console.log("SettingsStore url: " + connectionString);
        // fallback to the best of the pre-defined URLs ...

        // ... if there is no preset connectionString fallback to lowest latency
        if (!connectionString) connectionString = urls[0];

        // ... if auto selection is one (is also ensured in initConnection, but we don't want to ping
        //     a unreachable url)
        if (this._isAutoSelection()) connectionString = urls[0];

        // ... if insecure websocket url is used when using secure protocol
        //    (the list urls only contains matching ones)
        if (!this._apiUrlSecuritySuitable(connectionString))
            connectionString = urls[0];

        console.log("getFirstToTry url: " + connectionString);
        return connectionString;
    }

    /**
     * Returns the implementation of the db as loaded by indexeddbshim node module
     *
     * @returns indexedDB instance
     * @private
     */
    _getIndexDBImpl() {
        return window.openDatabase ? shimIndexedDB || indexedDB : indexedDB;
    }

    /**
     * Does the actual connection to the node, with fallback if appInit, otherwise attempts reconnect
     *
     * @param nextState  see willTransitionTo
     * @param replaceState  see willTransitionTo
     * @param callback  see willTransitionTo
     * @param appInit  see willTransitionTo
     * @private
     */
    _initiateConnection(nextState, replaceState, callback, appInit) {
        if (this._autoSelection) {
            this._connectionManager.url = this._connectionManager.urls[0];
            console.log("auto selecting to " + this._connectionManager.url);
        }

        this._connectionStart = new Date().getTime();

        if (appInit) {
            // only true is app is initialized
            this._connectionManager
                .connectWithFallback(true)
                .then(() => {
                    if (!this._autoSelection) {
                        SettingsActions.changeSetting({
                            setting: "apiServer",
                            value: this._connectionManager.url
                        });
                    }
                    this._onConnect(nextState, replaceState, callback);
                })
                .catch(error => {
                    console.error(
                        "----- App.willTransitionTo error ----->",
                        error,
                        new Error().stack
                    );
                    if (error.name === "InvalidStateError") {
                        if (__ELECTRON__) {
                            replaceState("/dashboard");
                        } else {
                            alert(
                                "Can't access local storage.\nPlease make sure your browser is not in private/incognito mode."
                            );
                        }
                    } else {
                        replaceState("/init-error");
                        callback();
                    }
                });
        } else {
            // in case switches manually, reset the settings so we dont connect to
            // a faulty node twice. If connection is established, onConnect sets the settings again
            if (!this._autoSelection) {
                SettingsActions.changeSetting({
                    setting: "apiServer",
                    value: ""
                });
            }
            console.log(this._connectionManager.url);
            this._attemptReconnect(nextState, replaceState, callback);
        }
    }

    /**
     * Reconnect on error
     *
     * @param failingNodeUrl string url of node that failed
     * @param nextState see willTransitionTo
     * @param replaceState see willTransitionTo
     * @param callback see willTransitionTo
     * @param err exception that occured
     * @private
     */
    _onResetError(failingNodeUrl, nextState, replaceState, callback, err) {
        console.error("onResetError:", err);
        this._oldChain = "old";
        notify.addNotification({
            message: counterpart.translate("settings.connection_error", {
                url: failingNodeUrl
            }),
            level: "error",
            autoDismiss: 10
        });
        return Apis.close().then(() => {
            return this.willTransitionTo(
                nextState,
                replaceState,
                callback,
                true
            );
        });
    }

    /**
     * Resets the api and attempts a reconnect
     *
     * @param nextState see willTransitionTo
     * @param replaceState see willTransitionTo
     * @param callback see willTransitionTo
     * @private
     */
    _attemptReconnect(nextState, replaceState, callback) {
        this._oldChain = "old";
        Apis.reset(this._connectionManager.url, true).then(instance => {
            console.log(instance);
            instance.init_promise
                .then(
                    this._onConnect.bind(
                        this,
                        nextState,
                        replaceState,
                        callback
                    )
                )
                .catch(
                    this._onResetError.bind(
                        this,
                        this._connectionManager.url,
                        nextState,
                        replaceState,
                        callback
                    )
                );
        });
    }

    /**
     * Called when a connection has been established
     *
     * @param nextState see willTransitionTo
     * @param replaceState see willTransitionTo
     * @param callback see willTransitionTo
     * @returns
     * @private
     */
    _onConnect(nextState, replaceState, callback) {
        // console.log(new Date().getTime(), "routerTransition onConnect", caller, "_connectInProgress", _connectInProgress);
        if (this._connectInProgress) return callback();
        this._connectInProgress = true;
        if (Apis.instance()) {
            let currentUrl = Apis.instance().url;
            SettingsActions.changeSetting({
                setting: "activeNode",
                value: currentUrl
            });
            if (!this._autoSelection)
                SettingsActions.changeSetting({
                    setting: "apiServer",
                    value: currentUrl
                });
            const apiLatencies = SettingsStore.getState().apiLatencies;

            //if (!(currentUrl in apiLatencies)) {
            // we always update ping for now
            apiLatencies[currentUrl] =
                new Date().getTime() - this._connectionStart;
            SettingsActions.updateLatencies(apiLatencies);
            //}
        }
        const currentChain = Apis.instance().chain_id;
        const chainChanged = this._oldChain !== currentChain;
        this._oldChain = currentChain;
        var dbPromise = Promise.resolve();
        try {
            if (chainChanged) {
                iDB.close();
                dbPromise = iDB.init_instance(this._getIndexDBImpl())
                    .init_promise;
            }
        } catch (err) {
            console.error("db init error:", err);
            replaceState("/init-error");
            this._connectInProgress = false;
            return callback();
        }

        return Promise.all([dbPromise, SettingsStore.init()])
            .then(() => {
                let chainStoreResetPromise = chainChanged
                    ? ChainStore.resetCache()
                    : Promise.resolve();
                return chainStoreResetPromise.then(() => {
                    return Promise.all([
                        PrivateKeyActions.loadDbData().then(() => {
                            return AccountRefsStore.loadDbData();
                        }),
                        WalletDb.loadDbData()
                            .then(() => {
                                // if (!WalletDb.getWallet() && nextState.location.pathname === "/") {
                                //     replaceState("/dashboard");
                                // }
                                if (
                                    nextState.location.pathname.indexOf(
                                        "/auth/"
                                    ) === 0
                                ) {
                                    replaceState("/dashboard");
                                }
                            })
                            .then(() => {
                                if (chainChanged) {
                                    // ChainStore.clearCache();
                                    // ChainStore.subscribed = false;
                                    // return ChainStore.resetCache().then(() => {
                                    AccountStore.reset();
                                    return AccountStore.loadDbData(
                                        currentChain
                                    ).catch(err => {
                                        console.error(err);
                                    });
                                    // });
                                }
                            })
                            .catch(error => {
                                console.error(
                                    "----- WalletDb.willTransitionTo error ----->",
                                    error
                                );
                                replaceState("/init-error");
                            }),
                        WalletManagerStore.init()
                    ]).then(() => {
                        this._connectInProgress = false;
                        SettingsActions.changeSetting({
                            setting: "activeNode",
                            value: this._connectionManager.url
                        });
                        callback();
                    });
                });
            })
            .catch(err => {
                console.error(err);
                replaceState("/init-error");
                this._connectInProgress = false;
                callback();
            });
    }
}

// this makes routerTransitioner a Singleton
export let routerTransitioner = new RouterTransitioner();
export default routerTransitioner.willTransitionTo.bind(routerTransitioner);
