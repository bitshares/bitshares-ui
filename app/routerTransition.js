import {Apis, Manager} from "bitsharesjs-ws";
import {ChainStore} from "bitsharesjs";

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

        this._willTransitionToInProgress = false;

        // transitionDone is called within Promises etc., rebind it to always reference to RouterTransitioner object as
        // this
        this._transitionDone = this._transitionDone.bind(this);

        // function that can be provided to willTransitionTo
        this._statusCallback = null;
    }

    /**
     * Is called once when router is initialized, and then if a connection error occurs or user manually
     * switches nodes
     *
     * @param appInit true when called via router, false false when node is manually selected in access settings
     * @param statusCallback null function  can be given by the requesting component to notify the user of status changes
     * @returns {Promise}
     */
    willTransitionTo(appInit = true, statusCallback = () => {}) {
        if (this.isTransitionInProgress())
            return new Promise((resolve, reject) => {
                resolve();
            });
        this._statusCallback = statusCallback;
        this._willTransitionToInProgress = true;

        return new Promise((resolve, reject) => {
            // dict of apiServer url as key and the latency as value
            const apiLatencies = SettingsStore.getState().apiLatencies;
            let latenciesEstablished = Object.keys(apiLatencies).length > 0;

            let latencyChecks = ss.get("latencyChecks", 1);
            if (latencyChecks >= 5) {
                // every x connect attempts we refresh the api latency list
                // automatically
                ss.set("latencyChecks", 0);
                latenciesEstablished = false;
            } else {
                // otherwise increase the counter
                if (appInit) ss.set("latencyChecks", latencyChecks + 1);
            }

            let urls = this._getNodesToConnectTo(false, apiLatencies);

            // set auto selection flag
            this._autoSelection =
                this._getLastNode().indexOf("fake.automatic-selection") !== -1;

            this._initConnectionManager(urls);

            if (
                !latenciesEstablished ||
                Object.keys(apiLatencies).length == 0
            ) {
                this.doLatencyUpdate(true)
                    .then(
                        this._initiateConnection.bind(
                            this,
                            appInit,
                            resolve,
                            reject
                        )
                    )
                    .catch(err => {
                        console.log("catch doLatency", err);
                    });
            } else {
                this._initiateConnection(appInit, resolve, reject);
            }
        });
    }

    isAutoSelection() {
        return this._autoSelection;
    }

    isTransitionInProgress() {
        return !!this._willTransitionToInProgress;
    }

    getTransitionTarget() {
        if (this.isTransitionInProgress())
            return this._willTransitionToInProgress;
        return null;
    }

    updateTransitionTarget(update) {
        this._willTransitionToInProgress = update;
        if (this._statusCallback != null) {
            this._statusCallback(update);
        }
    }

    /**
     * Updates the latency of all target nodes
     *
     * @param nodeUrls list of string nodes to update
     * @returns {Promise}
     */
    doQuickLatencyUpdate(nodeUrls) {
        return new Promise((resolve, reject) => {
            let url = this._connectionManager.url;
            let urls = this._connectionManager.urls;

            if (typeof nodeUrls === "string") {
                nodeUrls = [nodeUrls];
            }
            this._connectionManager.url = nodeUrls[0];
            this._connectionManager.urls = nodeUrls.slice(1, nodeUrls.length);

            this._connectionManager
                .checkConnections()
                .then(res => {
                    console.log("Following nodes have been pinged:", res);
                    // update the latencies object
                    const apiLatencies = SettingsStore.getState().apiLatencies;
                    for (var nodeUrl in res) {
                        apiLatencies[nodeUrl] = res[nodeUrl];
                    }
                    SettingsActions.updateLatencies(apiLatencies);
                })
                .catch(err => {
                    console.log("doLatencyUpdate error", err);
                })
                .finally(() => {
                    this._connectionManager.url = url;
                    this._connectionManager.urls = urls;
                    resolve();
                });
        });
    }

    /**
     * Updates the latency of all target nodes
     *
     * @param refresh boolean true reping all existing nodes
     *                        false only reping all reachable nodes
     * @param beSatisfiedWith integer if appropriate number of nodes for each of the keys in this latency map are found, pinging is stopped.
     *                                Values correspond to AccessSettings display (low, medium latency)
     * @param range integer ping range amount of nodes at the same time, default 5
     * @returns {Promise}
     */
    doLatencyUpdate(
        refresh = true,
        beSatisfiedWith = {instant: 200, low: 400, medium: 800},
        range = 5
    ) {
        this.updateTransitionTarget(
            counterpart.translate("app_init.check_latency")
        );

        return new Promise((resolve, reject) => {
            // if for some reason this method is called before connections are setup via willTransitionTo,
            // initialize the manager
            if (this._connectionManager == null) {
                this._initConnectionManager();
            }
            if (refresh) {
                this._connectionManager.urls = this._getNodesToConnectTo(true);
            }
            let url = this._connectionManager.url;
            let urls = this._connectionManager.urls;
            let current = 0;

            if (range == null) {
                range = this._connectionManager.urls.length;
            } else {
                this._clearLatencies();
            }

            function local_ping(thiz, range = null) {
                let counter = {instant: 0, low: 0, medium: 0};
                let selectedOneWasPinged = false;
                if (current < urls.length) {
                    thiz._connectionManager.url = urls[current];
                    thiz._connectionManager.urls = urls.slice(
                        current + 1,
                        current + range
                    );
                    thiz.updateTransitionTarget(
                        counterpart.translate(
                            "app_init.check_latency_feedback",
                            {
                                pinged: current,
                                totalToPing: urls.length
                            }
                        )
                    );
                    thiz._connectionManager
                        .checkConnections()
                        .then(res => {
                            console.log(
                                "Following nodes have been pinged:",
                                res
                            );
                            // update the latencies object
                            const apiLatencies = SettingsStore.getState()
                                .apiLatencies;
                            for (var nodeUrl in res) {
                                if (nodeUrl == url) {
                                    selectedOneWasPinged = true;
                                }
                                apiLatencies[nodeUrl] = res[nodeUrl];
                                // we stop the pinging if
                                //  - not autoselection and the selcted node has been pinged
                                //  - a node that has low_latency (less than beSatisfiedWith ms) is found
                                //  - at least 3 nodes with medium_latency have been found
                                if (beSatisfiedWith != null) {
                                    if (
                                        res[nodeUrl] < beSatisfiedWith.instant
                                    ) {
                                        counter.instant = counter.instant + 1;
                                    } else if (
                                        res[nodeUrl] < beSatisfiedWith.low
                                    ) {
                                        counter.low = counter.low + 1;
                                    } else if (
                                        res[nodeUrl] < beSatisfiedWith.medium
                                    ) {
                                        counter.medium = counter.medium + 1;
                                    }
                                    if (
                                        thiz.isAutoSelection() ||
                                        selectedOneWasPinged
                                    ) {
                                        // only stop pinging if the selected one was pinged, if not autoSelect
                                        if (
                                            counter.instant > 0 ||
                                            counter.low >= 2 ||
                                            counter.medium >= 3
                                        ) {
                                            console.log(
                                                "Found nodes with sufficient latency, stopping latency update"
                                            );
                                            current = urls.length;
                                            break;
                                        }
                                    }
                                }
                            }
                            thiz._updateLatencies(res);
                        })
                        .catch(err => {
                            console.log("doLatencyUpdate error", err);
                        })
                        .finally(() => {
                            current = current + range;
                            setTimeout(() => {
                                local_ping(thiz, range);
                            }, 50);
                        });
                } else {
                    done_pinging(thiz);
                }
            }

            function done_pinging(thiz) {
                // resort the api nodes with the new pings
                thiz._connectionManager.urls = thiz._getNodesToConnectTo();
                if (
                    thiz.isAutoSelection() &&
                    url !== thiz._connectionManager.urls[0]
                ) {
                    thiz._connectionManager.url =
                        thiz._connectionManager.urls[0];
                    console.log(
                        "auto selecting to " +
                            thiz._connectionManager.url +
                            " after latency update"
                    );
                } else {
                    thiz._connectionManager.url = url;
                }
                thiz._transitionDone(resolve);
            }
            local_ping(this, range);
        });
    }

    _clearLatencies() {
        SettingsActions.updateLatencies({});
    }

    _updateLatencies(mapOfPings, force = true) {
        const apiLatencies = SettingsStore.getState().apiLatencies;
        for (let node in mapOfPings) {
            if (!force && node in apiLatencies) {
                continue;
            }
            apiLatencies[node] = mapOfPings[node];
        }
        SettingsActions.updateLatencies(apiLatencies);
    }

    /**
     * Called when connection to a node has been established
     *
     * @param resolveOrReject
     * @private
     */
    _transitionDone(resolveOrReject) {
        resolveOrReject();
        this._willTransitionToInProgress = false;
    }

    _initConnectionManager(urls = null) {
        if (urls == null) {
            urls = this._getNodesToConnectTo(true);
        }
        // decide where to connect to first
        let connectionString = this._getFirstToTry(urls);
        this._willTransitionToInProgress = connectionString;

        this._connectionManager = new Manager({
            url: connectionString,
            urls: urls,
            closeCb: this._onConnectionClose.bind(this),
            optionalApis: {enableOrders: true},
            urlChangeCallback: url => {
                console.log("fallback to new url:", url);
                if (!!url) {
                    // Update connection status
                    this.updateTransitionTarget(
                        counterpart.translate("app_init.connecting", {
                            server: url
                        })
                    );
                }
                SettingsActions.changeSetting({
                    setting: "activeNode",
                    value: url
                });
            }
        });
    }

    _onConnectionClose() {
        // Possibly do something about auto reconnect attempts here
    }

    /**
     *
     * @param apiNodeUrl the url of the target node, e.g. wss://eu.nodes.bitshares.ws
     * @returns {boolean} true the security matches, meaning that we either have:
     *                         - user connected via http to the wallet and target node is ws:// or wss://
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

    _isTestNet(url) {
        return !__TESTNET__ && url.indexOf("testnet") !== -1;
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
     * Returns a list of all nodes as given by the flags, always sorted
     *
     * @param latenciesMap (default null) map of all latencies, if null taken from settings
     * @param latencies (default true) if true, and latenciesMap has entries, then filter out all without latency
     * @param hidden (default false) if false, filter out all hidden nodes
     * @param unsuitableSecurity (default false) if false, filter out all with unsuitable security
     * @param testNet (default false) if false, filter out all testnet nodes
     *
     * @returns list of viable api nodes (with above filters applied)
     *          if latencies is given, the nodes are sorted with descending latency (index 0 fasted one)
     */
    getNodes(
        latenciesMap = null,
        latencies = true,
        hidden = false,
        unsuitableSecurity = false,
        testNet = false
    ) {
        if (latenciesMap == null) {
            latenciesMap = SettingsStore.getState().apiLatencies;
        }
        if (latencies) {
            // if there are no latencies, return all that are left after filtering
            latencies = Object.keys(latenciesMap).length > 0;
        }
        let filtered = this.getAllApiServers().filter(a => {
            // Skip hidden nodes
            if (!hidden && a.hidden) return false;

            // do not automatically connect to TESTNET
            if (!testNet && this._isTestNet(a.url)) return false;

            // remove the automatic fallback dummy url
            if (a.url.indexOf("fake.automatic-selection") !== -1) return false;

            // Remove insecure websocket urls when using secure protocol
            if (!unsuitableSecurity && !this._apiUrlSecuritySuitable(a.url)) {
                return false;
            }
            // we don't know any latencies, return all
            if (!latencies) return true;

            // only keep the ones we were able to connect to
            return !!latenciesMap[a.url];
        });
        // create more info in the entries
        filtered = filtered.map(a => {
            let newEntry = {
                name: a.location || "Unknown location",
                url: a.url,
                hidden: !!a.hidden
            };
            if (latenciesMap != null && a.url in latenciesMap) {
                newEntry.latency = latenciesMap[a.url];
            } else {
                newEntry.latency = null;
            }
            return newEntry;
        });
        // now sort
        filtered = filtered.sort((a, b) => {
            // if both have latency, sort according to that
            if (a.latency != null && b.latency != null) {
                return a.latency - b.latency;
                // sort testnet to the bottom
            } else if (a.latency == null && b.latency == null) {
                if (this._isTestNet(a.url)) return -1;
                return 1;
                // otherwise prefer the pinged one
            } else if (a.latency != null && b.latency == null) {
                return -1;
            } else if (b.latency != null && a.latency == null) {
                return 1;
            }
            return 0;
        });

        /*
        * We've somehow filtered out all nodes, revert to the full list of
        * nodes in that case
        */
        if (!filtered.length) {
            console.warn("No nodes length, returning all of them");
            return this.getAllApiServers();
        }
        return filtered;
    }

    /**
     * Returns a list of viable api nodes that we consider connecting to
     *
     * @param all (default false) if true, all nodes are returned
     * @param latenciesMap (default null)
     * @returns see getNodes
     */
    _getNodesToConnectTo(all = false, latenciesMap = null) {
        return this.getNodes(latenciesMap, !all).map(a => a.url); // drop location, only urls in list
    }

    /**
     * Get the node that the user has chosen to connect to / has been able to connect to through fallback
     *
     * @returns {*}
     * @private
     */
    _getLastNode() {
        return SettingsStore.getSetting("apiServer");
    }

    /**
     * Set the node that the user wants to connect to / has fallen back to due to connection error
     *
     * @param url
     * @private
     */
    _setLastNode(url) {
        // only update settings if changed
        if (SettingsStore.getSetting("apiServer") !== url) {
            SettingsActions.changeSetting({
                setting: "apiServer",
                value: url
            });
        }
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
        let tryThisNode = this._getLastNode();
        // fallback to the best of the pre-defined URLs ...

        // ... if there is no preset connectionString fallback to lowest latency
        if (!tryThisNode) tryThisNode = urls[0];

        // ... if auto selection is on (is also ensured in initConnection, but we don't want to ping
        //     a unreachable url)
        if (this.isAutoSelection()) {
            tryThisNode = urls[0];
            console.log("auto selecting to " + tryThisNode);
        }

        // ... if insecure websocket url is used when using secure protocol
        //    (the list urls only contains matching ones)
        if (!this._apiUrlSecuritySuitable(tryThisNode)) tryThisNode = urls[0];

        return tryThisNode;
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
     * @param appInit  see willTransitionTo
     * @private
     */
    _initiateConnection(appInit, resolve, reject) {
        this._willTransitionToInProgress = this._connectionManager.url;
        this._connectionStart = new Date().getTime();

        if (appInit) {
            // only true if app is initialized
            this.updateTransitionTarget(
                counterpart.translate("app_init.connecting", {
                    server: this._connectionManager.url
                })
            );
            this._connectionManager
                .connectWithFallback(true)
                .then(() => {
                    if (!this.isAutoSelection()) {
                        this._setLastNode(this._connectionManager.url);
                    }
                    this._onConnect(resolve, reject);
                })
                .catch(error => {
                    console.error(
                        "----- App.willTransitionTo error ----->",
                        error,
                        new Error().stack
                    );
                    if (error.name === "InvalidStateError") {
                        alert(
                            "Can't access local storage.\nPlease make sure your browser is not in private/incognito mode."
                        );
                    } else {
                        this._transitionDone(reject);
                    }
                });
        } else {
            // in case switches manually, reset the settings so we dont connect to
            // a faulty node twice. If connection is established, onConnect sets the settings again
            if (!this.isAutoSelection()) {
                this._setLastNode("");
            }
            this._attemptReconnect(resolve, reject);
        }
    }

    /**
     * Reconnect on error
     *
     * @param failingNodeUrl string url of node that failed
     * @param err exception that occured
     * @private
     */
    _onResetError(failingNodeUrl, err) {
        console.error("onResetError:", err, failingNodeUrl);
        this._willTransitionToInProgress = false;
        this._oldChain = "old";
        notify.addNotification({
            message: counterpart.translate("settings.connection_error", {
                url: failingNodeUrl || "",
                error: err
            }),
            level: "error",
            autoDismiss: 10
        });
        let apiLatencies = SettingsStore.getState().apiLatencies;
        delete apiLatencies[failingNodeUrl];
        SettingsActions.updateLatencies(apiLatencies);
        return Apis.close().then(() => {
            return this.willTransitionTo(true);
        });
    }

    /**
     * Resets the api and attempts a reconnect
     *
     * @private
     */
    _attemptReconnect(resolve, reject) {
        this._oldChain = "old";
        Apis.reset(this._connectionManager.url, true, undefined, {
            enableOrders: true
        }).then(instance => {
            instance.init_promise
                .then(this._onConnect.bind(this, resolve, reject))
                .catch(
                    this._onResetError.bind(this, this._connectionManager.url)
                );
        });
    }

    /**
     * Called when a connection has been established
     *
     * @returns
     * @private
     */
    _onConnect(resolve, reject) {
        if (this._connectInProgress) {
            console.error("MULTIPLE CONNECT IN PROGRESS");
            return;
        }
        this.updateTransitionTarget(counterpart.translate("app_init.database"));
        this._connectInProgress = true;
        if (Apis.instance()) {
            if (!Apis.instance().orders_api())
                console.log(
                    `${Apis.instance().url} does not support the orders api`
                );
            let currentUrl = Apis.instance().url;
            if (!this.isAutoSelection()) this._setLastNode(currentUrl);

            // the ping calculated here does not reflect the same ping as in checkConnection from ConnectionManager,
            // thus always updating would be "unfair" and also is confusing in UI
            let mapOfPings = {};
            mapOfPings[currentUrl] =
                new Date().getTime() - this._connectionStart;
            this._updateLatencies(mapOfPings, false);
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
            this._connectInProgress = false;
            return this._transitionDone(reject);
        }

        return Promise.all([dbPromise, SettingsStore.init()])
            .then(() => {
                let chainStoreResetPromise = chainChanged
                    ? ChainStore.resetCache(false)
                    : Promise.resolve();
                return chainStoreResetPromise
                    .then(() => {
                        return Promise.all([
                            PrivateKeyActions.loadDbData().then(() => {
                                return AccountRefsStore.loadDbData();
                            }),
                            WalletDb.loadDbData()
                                .then(() => {
                                    if (chainChanged) {
                                        AccountStore.reset();
                                        return AccountStore.loadDbData(
                                            currentChain
                                        ).catch(err => {
                                            console.error(err);
                                        });
                                    }
                                })
                                .catch(error => {
                                    console.error(
                                        "----- WalletDb.willTransitionTo error ----->",
                                        error
                                    );
                                    this._transitionDone(reject);
                                }),
                            WalletManagerStore.init()
                        ]).then(() => {
                            this._connectInProgress = false;
                            SettingsActions.changeSetting({
                                setting: "activeNode",
                                value: this._connectionManager.url
                            });
                            this._transitionDone(resolve);
                        });
                    })
                    .catch(err => {
                        this._connectInProgress = false;
                        this._transitionDone(reject.bind(this, err));
                    });
            })
            .catch(err => {
                console.error(err);
                this._connectInProgress = false;
                this._transitionDone(reject);
            });
    }
}

// this makes routerTransitioner a Singleton
export let routerTransitioner = new RouterTransitioner();
export default routerTransitioner.willTransitionTo.bind(routerTransitioner);
