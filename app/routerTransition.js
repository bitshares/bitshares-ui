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
import {Notification} from "bitshares-ui-style-guide";

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

            let latencyChecks = this._getLatencyChecks(1);
            if (latencyChecks >= 8) {
                // every x connect attempts we refresh the api latency list
                // automatically
                this._setLatencyChecks(0);
                latenciesEstablished = false;
            } else {
                // otherwise increase the counter
                if (appInit) this._setLatencyChecks(latencyChecks + 1);
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
                this.doLatencyUpdate()
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
        return (
            !!this._willTransitionToInProgress &&
            typeof this._willTransitionToInProgress !== "object"
        );
    }

    isBackgroundPingingInProgress() {
        return (
            !!this._willTransitionToInProgress &&
            typeof this._willTransitionToInProgress === "object"
        );
    }

    getBackgroundPingingTarget() {
        if (this.isBackgroundPingingInProgress())
            return this._willTransitionToInProgress.key;
        return null;
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
     * @param discardOldLatencies boolean if true drop all old latencies and reping
     * @param pingAll boolean if true, resolve promise after all nodes are pinged, if false resolve when sufficiently small latency has been found
     * @param pingInBackground integer if > 0, pinging will continue in background after promise is resolved, Integer value will be used as delay to start background ping
     * @returns {Promise}
     */
    doLatencyUpdate(
        discardOldLatencies = false,
        pingAll = false,
        pingInBackground = 5000
    ) {
        this.updateTransitionTarget(
            counterpart.translate("app_init.check_latency")
        );

        let thiz = this;

        return new Promise((resolve, reject) => {
            // if for some reason this method is called before connections are setup via willTransitionTo,
            // initialize the manager
            if (thiz._connectionManager == null) {
                thiz._initConnectionManager();
            }
            let nodeList = thiz._getNodesToConnectTo(true, null, true);
            if (discardOldLatencies) {
                this._clearLatencies();
            }

            let originalURL = this._connectionManager.url;

            function done_pinging() {
                // resort the api nodes with the new pings
                let _nodes = thiz._getNodesToConnectTo(false, null, true);
                thiz._connectionManager.urls = _nodes.map(a => a.url);
                // update preferences
                thiz._setLatencyPreferences({
                    region: _nodes[0].region,
                    country: _nodes[0].country
                });

                if (
                    thiz.isAutoSelection() &&
                    originalURL !== thiz._connectionManager.urls[0]
                ) {
                    thiz._connectionManager.url =
                        thiz._connectionManager.urls[0];
                    console.log(
                        "auto selecting to " +
                            thiz._connectionManager.url +
                            " after latency update"
                    );
                } else {
                    thiz._connectionManager.url = originalURL;
                }
                thiz._transitionDone(resolve);

                if (pingInBackground > 0) {
                    let _func = function() {
                        // wait for transition to be completed
                        if (!thiz._willTransitionToInProgress) {
                            pinger.enableBackgroundPinging();
                            pinger.pingNodes(() => {
                                let _nodes = thiz._getNodesToConnectTo(
                                    false,
                                    null,
                                    true
                                );
                                thiz._connectionManager.urls = _nodes.map(
                                    a => a.url
                                );
                                thiz._transitionDone();
                            });
                        } else {
                            setTimeout(_func, 2000);
                        }
                    };
                    setTimeout(_func, pingInBackground);
                }
            }

            let pinger = new Pinger(
                thiz._connectionManager,
                thiz._updateLatencies.bind(thiz),
                thiz.updateTransitionTarget.bind(thiz),
                pingAll
            );
            let strategy = new PingStrategy(
                nodeList,
                pinger,
                done_pinging,
                thiz.getNodes.bind(thiz)
            );

            strategy.ping(
                this.isAutoSelection() ? null : this._getLastNode(),
                this._getLatencyPreferences()
            );
        });
    }

    _getLatencyPreferences() {
        // those settings are not used anywhere in the UI and thus do not need a store
        return ss.get("latency_preferences", {});
    }

    _setLatencyPreferences(preferences) {
        ss.set("latency_preferences", preferences);
    }

    _getLatencyChecks() {
        if (ss.has("latencyChecks")) {
            ss.remove("latencyChecks");
        }
        return ss.get("latency_checks", 0);
    }

    _setLatencyChecks(number) {
        ss.set("latency_checks", number);
    }

    _clearLatencies() {
        SettingsActions.updateLatencies({});
    }

    _updateLatencies(mapOfPings, force = true, container = null) {
        let apiLatencies = SettingsStore.getState().apiLatencies;

        for (let node in mapOfPings) {
            if (!force && node in apiLatencies) {
                continue;
            }
            apiLatencies[node] = mapOfPings[node];
            if (container != null) {
                container[node] = mapOfPings[node];
            }
        }
        SettingsActions.updateLatencies(apiLatencies);
    }

    /**
     * Called when connection to a node has been established
     *
     * @param resolveOrReject
     * @private
     */
    _transitionDone(resolveOrReject = null) {
        if (resolveOrReject != null) {
            resolveOrReject();
        }
        this._willTransitionToInProgress = false;
        this._statusCallback = null;
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
            a.hidden = !!a.hidden;
            a.name = a.location || "Unknown";
            if (latenciesMap != null && a.url in latenciesMap) {
                a.latency = latenciesMap[a.url];
            } else {
                a.latency = null;
            }
            return a;
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
     * @param keepObject (default false) either returns only the url or full node object
     * @returns list of strings or list of objects
     */
    _getNodesToConnectTo(all = false, latenciesMap = null, keepObject = false) {
        let nodeList = this.getNodes(latenciesMap, !all); // drop location, only urls in list
        if (!keepObject) {
            return nodeList.map(a => a.url);
        } else {
            return nodeList;
        }
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

        console.log("Connecting to " + this._connectionManager.url);

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
            // in case switches manually, reset the settings so we don't connect to
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
        this._statusCallback = false;
        this._oldChain = "old";
        Notification.error({
            message: counterpart.translate("settings.connection_error", {
                url: failingNodeUrl || "",
                error: err
            })
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

/**
 * FIXME should be taken out of routerTransition
 *
 * Helper class to manage the latency check of all nodes.
 * When pinging is done, the given callback is executed.
 *
 */
class Pinger {
    /**
     * @param connectionManager bitsharesjs connectionmanager
     * @param updateLatencies callback to update the settings object
     * @param updateTransitionTarget callback to update the message displayed to the user
     * @param pingAll if true, resolve after pinging all
     */
    constructor(
        connectionManager,
        updateLatencies,
        updateTransitionTarget,
        pingAll = true
    ) {
        this._connectionManager = connectionManager;
        this._updateLatencies = updateLatencies;
        this._updateTransitionTarget = updateTransitionTarget;
        if (pingAll) {
            this._beSatisfiedWith = {instant: 0, low: 0, medium: 0};
        } else {
            this._beSatisfiedWith = {instant: 200, low: 400, medium: 800};
        }
    }

    /**
     * Adds the given nodes to this pinger. Duplicates are ignored.
     *
     * @param nodes given list of node urls
     * @param reset if true, reset the internal node list before adding new nodes
     * @param translationKey key to display to the user (updateTransitionTarget)
     */
    addNodes(nodes, reset = true, translationKey = null) {
        this._translationKey = translationKey;
        if (reset || this._nodeURLs === undefined) {
            this._nodeURLs = nodes;
            this._current = 0;
            this._counter = {instant: 0, low: 0, medium: 0};
            this._localLatencyCache = {};

            this._suitableNodeFound = false;
            this._pingInBackGround = false;
        } else {
            nodes.forEach(node => {
                if (this._nodeURLs.indexOf(node) === -1) {
                    this._nodeURLs.push(node);
                }
            });
        }
    }

    /**
     * The pinger constructs its own latencyMap in addition to what is saved in localStorage
     * @returns {}
     */
    getLocalLatencyMap() {
        return this._localLatencyCache;
    }

    /**
     * This call enables background pinging (all nodes are pinged)
     */
    enableBackgroundPinging() {
        this._beSatisfiedWith = {instant: 0, low: 0, medium: 0};
        this._counter = {instant: 0, low: 0, medium: 0};
        this._suitableNodeFound = false;
        this._pingInBackGround = true;
    }

    /**
     * This call enables background pinging (all nodes are pinged)
     */
    doCallbackAndEnableBackgroundPinging() {
        this._beSatisfiedWith = {instant: 0, low: 0, medium: 0};
        this._counter = {instant: 0, low: 0, medium: 0};
        this._suitableNodeFound = true;
        this._pingInBackGround = true;
    }

    /**
     * Ping the currently stored nodes and call the callback when done.
     *
     * @param callbackFunc function handle callback when pinging is done
     * @param nodes optional, add to internal node list before pinging
     */
    pingNodes(callbackFunc, nodes = null) {
        if (nodes != null) {
            this.addNodes(nodes, true);
        }

        this._callbackWasCalled = false;
        this._callback = callbackFunc;

        // defaults
        this._range = 1;

        this._pingNodesInBatches();
    }

    _continueToPing() {
        return (
            this._current < this._nodeURLs.length &&
            (!this._suitableNodeFound || this._pingInBackGround)
        );
    }

    _notifyCallback() {
        if (this._callbackWasCalled) {
            return false;
        } else {
            return (
                this._suitableNodeFound ||
                this._current == this._nodeURLs.length
            );
        }
    }

    _pingNodesInBatches() {
        // cache the value, callback might change something
        let continueToPing = this._continueToPing();

        if (this._notifyCallback()) {
            this._callbackWasCalled = true;
            if (this._continueToPing()) {
                console.log(
                    "Node with sufficient latency found, continueing to ping the rest in background"
                );
            }
            if (this._callback != null) {
                this._callback();
            }
        }
        if (continueToPing) {
            this._connectionManager.url = this._nodeURLs[this._current];
            this._connectionManager.urls = this._nodeURLs.slice(
                this._current + 1,
                this._current + this._range
            );
            let key =
                this._translationKey == null
                    ? "app_init.check_latency_feedback"
                    : this._translationKey;
            if (!this._pingInBackGround) {
                this._updateTransitionTarget(
                    counterpart.translate(key, {
                        pinged: this._current,
                        totalToPing: this._nodeURLs.length
                    })
                );
            } else {
                this._updateTransitionTarget({
                    background: true,
                    key: counterpart.translate(key, {
                        pinged: this._current,
                        totalToPing: this._nodeURLs.length
                    })
                });
            }
            this._connectionManager
                .checkConnections()
                .then(this._handlePingResult.bind(this))
                .catch(err => {
                    console.log("doLatencyUpdate error", err);
                })
                .finally(() => {
                    this._current = this._current + this._range;
                    setTimeout(this._pingNodesInBatches.bind(this), 50);
                });
        }
    }

    _updateSuitabilityCounter(res = null) {
        for (var nodeUrl in res) {
            if (this._beSatisfiedWith != null) {
                if (res[nodeUrl] < this._beSatisfiedWith.instant) {
                    this._counter.instant = this._counter.instant + 1;
                } else if (res[nodeUrl] < this._beSatisfiedWith.low) {
                    this._counter.low = this._counter.low + 1;
                } else if (res[nodeUrl] < this._beSatisfiedWith.medium) {
                    this._counter.medium = this._counter.medium + 1;
                }
            }
        }
        this._checkIfSuitableFound();
    }

    _checkIfSuitableFound() {
        if (
            this._counter.instant > 0 ||
            this._counter.low >= 2 ||
            this._counter.medium >= 3
        ) {
            this._suitableNodeFound = true;
        }
    }

    _handlePingResult(res) {
        if (!!res && Object.keys(res).length > 0) {
            console.log("Latency result:", res);
            this._updateSuitabilityCounter(res);
            // build additional ping cache
            this._updateLatencies(res, true, this._localLatencyCache);
        }
    }
}

/**
 * Ping Strategy that leverages the hardcoded location of the nodes.
 *
 * Order:
 *  - ping last connected node
 *  - ping 2 nodes in each region, then continue with best country (lowest latency)
 *  - ping all nodes in best country, then all from region
 *  - if preferences are given, ping those in the preferred country and region first
 *
 * Pinging will stop according to the underlying pinger, this class merely adjusts the order of pinging.
 *
 */
class PingStrategy {
    constructor(nodesToPing, pinger, callback, getNodes) {
        this._nodesToPing = nodesToPing;
        this._pinger = pinger;
        this._callback = callback;
        this._getNodes = getNodes;
        this._sortNodesToTree();
    }

    ping(firstURL, preferences = {}) {
        // if background pinging is active this needs some more attention due to race pinging
        function ping_the_rest() {
            this._pinger.addNodes(
                this._nodesToPing.map(a => a.url),
                false,
                "app_init.check_latency_feedback_rest"
            );
            this._pinger.pingNodes(this._callback);
        }

        function ping_all_from_one_region(region = null) {
            if (region == null) {
                let bestOne = this._getNodes(this._pinger.getLocalLatencyMap());
                region = bestOne[0].region;
            }
            this._pinger.addNodes(
                this.getFromRegion(region).map(a => a.url),
                false,
                "app_init.check_latency_feedback_region"
            );
            this._pinger.pingNodes(ping_the_rest.bind(this));
        }

        function ping_all_from_one_country(region = null, country = null) {
            if (region == null) {
                let bestOne = this._getNodes(this._pinger.getLocalLatencyMap());
                region = bestOne[0].region;
                country = bestOne[0].country;
            }
            this._pinger.addNodes(
                this.getFromRegion(region, country).map(a => a.url),
                false,
                "app_init.check_latency_feedback_country"
            );
            this._pinger.pingNodes(ping_all_from_one_region.bind(this));
        }

        function ping_the_world() {
            this._pinger.addNodes(
                this.getFromEachRegion().map(a => a.url),
                false,
                "app_init.check_latency_feedback_world"
            );
            this._pinger.pingNodes(ping_all_from_one_country.bind(this));
        }

        function decideNext() {
            if (!!preferences.region && !!preferences.country) {
                ping_all_from_one_country.bind(this)(
                    preferences.region,
                    preferences.country
                );
            } else if (!!preferences.region) {
                ping_all_from_one_region.bind(this)(preferences.region);
            } else {
                ping_the_world.bind(this)();
            }
        }

        if (!!firstURL) {
            this._pinger.addNodes(
                [firstURL],
                false,
                "app_init.check_latency_feedback_last"
            );
            this._pinger.pingNodes(decideNext.bind(this));
        } else {
            decideNext.bind(this)();
        }
    }

    getFromEachRegion(amount = 2, randomOrder = true) {
        let filtered = [];

        Object.keys(this._nodeTree).forEach(regionKey => {
            let allFromRegion = this._nodeTree[regionKey]["all"];
            let i;
            for (i = 1; i <= amount; i++) {
                if (allFromRegion.length >= i)
                    filtered.push(allFromRegion[i - 1]);
            }
        });

        console.log("Node tree", filtered);

        if (randomOrder) {
            return this._getShuffleArray(filtered);
        } else {
            return filtered;
        }
    }

    getFromRegion(
        regionKey,
        countryKey = null,
        amount = 10,
        randomOrder = true
    ) {
        let filtered = [];

        let countryKeys = null;
        if (!countryKey) {
            countryKeys = ["all"];
        } else {
            countryKeys = [countryKey];
        }

        countryKeys.forEach(_countryKey => {
            let allFromRegion = this._nodeTree[regionKey][_countryKey];

            let shuffled = randomOrder
                ? this._getShuffleArray(allFromRegion)
                : allFromRegion;

            let i;
            for (i = 1; i <= amount; i++) {
                if (shuffled.length >= i) filtered.push(shuffled[i - 1]);
            }
        });

        return filtered;
    }

    _getShuffleArray(array) {
        array = array.slice(0);
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    _sortNodesToTree() {
        let nodeTree = {};

        this._nodesToPing.forEach(_node => {
            if (nodeTree[_node.region] === undefined) {
                nodeTree[_node.region] = {};
                nodeTree[_node.region]["all"] = [];
            }
            if (nodeTree[_node.region][_node.country] === undefined) {
                nodeTree[_node.region][_node.country] = [];
            }

            nodeTree[_node.region]["all"].push(_node);
            nodeTree[_node.region][_node.country].push(_node);
        });

        this._nodeTree = nodeTree;
    }
}
