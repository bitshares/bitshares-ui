import alt from "alt-instance";
import SettingsActions from "actions/SettingsActions";
import IntlActions from "actions/IntlActions";
import Immutable, {fromJS} from "immutable";
import ls from "common/localStorage";
import {Apis} from "bitsharesjs-ws";
import {settingsAPIs} from "api/apiConfig";
import {
    getDefaultTheme,
    getDefaultLogin,
    getMyMarketsBases,
    getMyMarketsQuotes,
    getUnits
} from "branding";

const CORE_ASSET = "BTS"; // Setting this to BTS to prevent loading issues when used with BTS chain which is the most usual case currently

const STORAGE_KEY = "__graphene__";
let ss = new ls(STORAGE_KEY);

/**
 * SettingsStore takes care of maintaining user set settings values and notifies all listeners
 */
class SettingsStore {
    constructor() {
        this.exportPublicMethods({
            init: this.init.bind(this),
            getSetting: this.getSetting.bind(this),
            getLastBudgetObject: this.getLastBudgetObject.bind(this),
            setLastBudgetObject: this.setLastBudgetObject.bind(this),
            hasAnyPriceAlert: this.hasAnyPriceAlert.bind(this)
        });

        // bind actions to store
        this.bindListeners({
            onSetPriceAlert: SettingsActions.setPriceAlert,
            onSetExchangeLastExpiration:
                SettingsActions.setExchangeLastExpiration,
            onSetExchangeTutorialShown:
                SettingsActions.setExchangeTutorialShown,
            onChangeSetting: SettingsActions.changeSetting,
            onChangeViewSetting: SettingsActions.changeViewSetting,
            onChangeMarketDirection: SettingsActions.changeMarketDirection,
            onAddStarMarket: SettingsActions.addStarMarket,
            onRemoveStarMarket: SettingsActions.removeStarMarket,
            onClearStarredMarkets: SettingsActions.clearStarredMarkets,
            onAddWS: SettingsActions.addWS,
            onRemoveWS: SettingsActions.removeWS,
            onShowWS: SettingsActions.showWS,
            onHideWS: SettingsActions.hideWS,
            onHideAsset: SettingsActions.hideAsset,
            onHideMarket: SettingsActions.hideMarket,
            onClearSettings: SettingsActions.clearSettings,
            onSwitchLocale: IntlActions.switchLocale,
            onSetUserMarket: SettingsActions.setUserMarket,
            onUpdateLatencies: SettingsActions.updateLatencies,
            onModifyPreferedBases: SettingsActions.modifyPreferedBases,
            onUpdateUnits: SettingsActions.updateUnits,
            onHideNewsHeadline: SettingsActions.hideNewsHeadline,
            onAddChartLayout: SettingsActions.addChartLayout,
            onDeleteChartLayout: SettingsActions.deleteChartLayout
        });

        this.initDone = false;

        this.settings = Immutable.Map(this._getSetting());

        // deprecated to support existing code
        this.defaultSettings = Immutable.Map(this._getDefaultSetting());

        // this should be called choices, defaults is confusing
        this.defaults = this._getChoices();

        this.viewSettings = Immutable.Map(ss.get("viewSettings_v1"));
        this.marketDirections = Immutable.Map(ss.get("marketDirections"));

        this.hiddenAssets = Immutable.List(ss.get("hiddenAssets", []));
        this.hiddenMarkets = Immutable.List(ss.get("hiddenMarkets", []));

        this.apiLatencies = ss.get("apiLatencies", {});

        this.mainnet_faucet = ss.get(
            "mainnet_faucet",
            settingsAPIs.DEFAULT_FAUCET
        );
        this.testnet_faucet = ss.get(
            "testnet_faucet",
            settingsAPIs.TESTNET_FAUCET
        );

        this.exchange = fromJS(ss.get("exchange", {}));

        this.priceAlert = fromJS(ss.get("priceAlert", []));

        this.hiddenNewsHeadline = Immutable.List(
            ss.get("hiddenNewsHeadline", [])
        );

        this.chartLayouts = Immutable.List(ss.get("chartLayouts", []));
    }

    /**
     * Returns the default selected values that the user can reset to
     * @returns dictionary
     * @private
     */
    _getDefaultSetting() {
        return {
            locale: "en",
            apiServer: settingsAPIs.DEFAULT_WS_NODE,
            faucet_address: settingsAPIs.DEFAULT_FAUCET,
            unit: CORE_ASSET,
            showSettles: false,
            showAssetPercent: false,
            walletLockTimeout: 60 * 10,
            themes: getDefaultTheme(),
            passwordLogin: getDefaultLogin() == "password",
            browser_notifications: {
                allow: true,
                additional: {
                    transferToMe: true
                }
            },
            rememberMe: true,
            viewOnlyMode: true
        };
    }

    /**
     * All possible choices for the settings
     * @returns dictionary
     * @private
     */
    _getDefaultChoices() {
        return {
            locale: [
                "en",
                "zh",
                "fr",
                "ko",
                "de",
                "es",
                "it",
                "tr",
                "ru",
                "ja"
            ],
            apiServer: settingsAPIs.WS_NODE_LIST.slice(0), // clone all default servers as configured in apiConfig.js
            unit: getUnits(),
            showSettles: [{translate: "yes"}, {translate: "no"}],
            showAssetPercent: [{translate: "yes"}, {translate: "no"}],
            themes: ["darkTheme", "lightTheme", "midnightTheme"],
            passwordLogin: [
                {translate: "cloud_login"},
                {translate: "local_wallet"}
            ],
            browser_notifications: {
                allow: [true, false],
                additional: {
                    transferToMe: [true, false]
                }
            },
            rememberMe: [true, false],
            viewOnlyMode: [{translate: "show"}, {translate: "hide"}]
        };
    }

    /**
     * Checks if an object is actually empty (no keys or only empty keys)
     * @param object
     * @returns {boolean}
     * @private
     */
    _isEmpty(object) {
        let isEmpty = true;
        Object.keys(object).forEach(key => {
            if (object.hasOwnProperty(key) && object[key] !== null)
                isEmpty = false;
        });
        return isEmpty;
    }

    /**
     * Ensures that defauls are not stored in local storage, only changes, and when reading inserts all defaults.
     *
     * @param mode
     * @param settings
     * @param defaultSettings
     * @returns {{}}
     * @private
     */
    _replaceDefaults(mode = "saving", settings, defaultSettings = null) {
        if (defaultSettings == null) {
            // this method might be called recursively, so not always use the whole defaults
            defaultSettings = this._getDefaultSetting();
        }

        let excludedKeys = ["activeNode"];

        // avoid copy by reference
        let returnSettings = {};
        if (mode === "saving") {
            // remove every setting that is default
            Object.keys(settings).forEach(key => {
                if (excludedKeys.includes(key)) {
                    return;
                }
                // must be of same type to be compatible
                if (typeof settings[key] === typeof defaultSettings[key]) {
                    // incompatible settings, dont store
                    if (typeof settings[key] == "object") {
                        let newSetting = this._replaceDefaults(
                            "saving",
                            settings[key],
                            defaultSettings[key]
                        );
                        if (!this._isEmpty(newSetting)) {
                            returnSettings[key] = newSetting;
                        }
                    } else if (settings[key] !== defaultSettings[key]) {
                        // only save if its not the default
                        returnSettings[key] = settings[key];
                    }
                }
                // all other cases are defaults, do not put the value in local storage
            });
        } else {
            Object.keys(defaultSettings).forEach(key => {
                let setDefaults = false;
                if (settings[key] !== undefined) {
                    // exists in saved settings, check value
                    if (typeof settings[key] !== typeof defaultSettings[key]) {
                        // incompatible types, use default
                        setDefaults = true;
                    } else if (typeof settings[key] == "object") {
                        // check all subkeys
                        returnSettings[key] = this._replaceDefaults(
                            "loading",
                            settings[key],
                            defaultSettings[key]
                        );
                    } else {
                        returnSettings[key] = settings[key];
                    }
                } else {
                    setDefaults = true;
                }
                if (setDefaults) {
                    if (typeof settings[key] == "object") {
                        // use defaults, deep copy
                        returnSettings[key] = JSON.parse(
                            JSON.stringify(defaultSettings[key])
                        );
                    } else {
                        returnSettings[key] = defaultSettings[key];
                    }
                }
            });
            // copy all the rest as well
            Object.keys(settings).forEach(key => {
                if (returnSettings[key] == undefined) {
                    // deep copy
                    returnSettings[key] = JSON.parse(
                        JSON.stringify(settings[key])
                    );
                }
            });
        }
        return returnSettings;
    }

    /**
     * Returns the currently active settings, either default or from local storage
     * @returns {*}
     * @private
     */
    _getSetting() {
        // migrate to new settings
        // - v3  defaults are stored as values which makes it impossible to react on changed defaults
        // - v4  refactored complete settings handling. defaults are no longer stored in local storage and
        //       set if not present on loading
        let support_v3_until = new Date("2018-10-20T00:00:00Z");

        if (!ss.has("settings_v4") && new Date() < support_v3_until) {
            // ensure backwards compatibility of settings version
            let settings_v3 = ss.get("settings_v3");
            if (!!settings_v3) {
                if (settings_v3["themes"] === "olDarkTheme") {
                    settings_v3["themes"] = "midnightTheme";
                }
            }
            this._saveSettings(settings_v3, this._getDefaultSetting());
        }

        return this._loadSettings();
    }

    /**
     * Overwrite configuration while utilizing call-by-reference
     * @param apiTarget
     * @param apiSource
     * @private
     */
    _injectApiConfiguration(apiTarget, apiSource) {
        // any defaults in the apiConfig are to be maintained!
        apiTarget.hidden = apiSource.hidden;
    }

    /**
     * Save settings to local storage after checking for defaults
     * @param settings
     * @private
     */
    _saveSettings(settings = null) {
        if (settings == null) {
            settings = this.settings.toJS();
        }
        ss.set("settings_v4", this._replaceDefaults("saving", settings));
    }

    /**
     * Load settings from local storage and fill in details
     * @returns {{}}
     * @private
     */
    _loadSettings() {
        let userSavedSettings = ss.get("settings_v4");
        // if (!!userSavedSettings) {
        //     console.log("User settings have been loaded:", userSavedSettings);
        // }
        return this._replaceDefaults("loading", userSavedSettings);
    }

    /**
     * Returns the currently active choices for settings, either default or from local storage
     * @returns {*}
     * @private
     */
    _getChoices() {
        // default choices the user can select from
        let choices = this._getDefaultChoices();
        // get choices stored in local storage
        let savedChoices = this._ensureBackwardsCompatibilityChoices(
            ss.get("defaults_v1", {apiServer: []})
        );

        // merge choices by hand (do not use merge as the order in the apiServer list may change)
        let mergedChoices = Object.assign({}, savedChoices);
        Object.keys(choices).forEach(key => {
            if (key != "apiServer") {
                mergedChoices[key] = choices[key];
            }
        });
        mergedChoices.apiServer = this._getApiServerChoices(
            choices,
            savedChoices
        );
        return mergedChoices;
    }

    /**
     * Get all apiServer choices and mark the ones that are in the default choice as default
     * @param choices
     * @param savedChoices
     * @returns {string}
     * @private
     */
    _getApiServerChoices(choices, savedChoices) {
        let apiServer = choices.apiServer.slice(0); // maintain order in apiConfig.js
        // add any apis that the user added and update changes
        savedChoices.apiServer.forEach(api => {
            let found = apiServer.find(a => a.url == api.url);
            if (!!found) {
                this._injectApiConfiguration(found, api);
            } else {
                if (!api.default) {
                    // always add personal nodes at end of existing nodes, arbitrary decision
                    apiServer.push(api);
                }
            }
        });
        apiServer = apiServer.map(node => {
            let found = choices.apiServer.find(a => a.url == node.url);
            node.default = !!found;
            node.hidden = !!node.hidden; // make sure this flag exists
            return node;
        });
        return apiServer;
    }

    /**
     * Adjust loaded choices for backwards compatibility if any key names or values change
     * @param savedChoices
     * @returns {*}
     * @private
     */
    _ensureBackwardsCompatibilityChoices(savedChoices) {
        /* Fix for old clients after changing cn to zh */
        if (savedChoices && savedChoices.locale) {
            let cnIdx = savedChoices.locale.findIndex(a => a === "cn");
            if (cnIdx !== -1) savedChoices.locale[cnIdx] = "zh";
        }
        if (savedChoices && savedChoices.themes) {
            let olIdx = savedChoices.themes.findIndex(a => a === "olDarkTheme");
            if (olIdx !== -1) savedChoices.themes[olIdx] = "midnightTheme";
        }
        if (savedChoices && savedChoices.apiServer) {
            savedChoices.apiServer = savedChoices.apiServer.map(api => {
                // might be only a string, be backwards compatible
                if (typeof api === "string") {
                    api = {
                        url: api,
                        location: null
                    };
                }
                return api;
            });
        }
        return savedChoices;
    }

    init() {
        return new Promise(resolve => {
            if (this.initDone) resolve();
            this.starredKey = this._getChainKey("markets");
            this.marketsKey = this._getChainKey("userMarkets");
            this.basesKey = this._getChainKey("preferredBases");
            // Default markets setup
            let topMarkets = {
                markets_4018d784: getMyMarketsQuotes(),
                markets_39f5e2ed: [
                    // TESTNET
                    "PEG.FAKEUSD",
                    "BTWTY"
                ]
            };

            let bases = {
                markets_4018d784: getMyMarketsBases(),
                markets_39f5e2ed: [
                    // TESTNET
                    "TEST"
                ]
            };

            let coreAssets = {
                markets_4018d784: "BTS",
                markets_39f5e2ed: "TEST"
            };
            let coreAsset = coreAssets[this.starredKey] || "BTS";
            /*
             * Update units depending on the chain, also make sure the 0 index
             * asset is always the correct CORE asset name
             */
            this.onUpdateUnits();
            this.defaults.unit[0] = coreAsset;

            let defaultBases = bases[this.starredKey] || bases.markets_4018d784;
            let storedBases = ss.get(this.basesKey, []);
            this.preferredBases = Immutable.List(
                storedBases.length ? storedBases : defaultBases
            );

            this.chainMarkets = topMarkets[this.starredKey] || [];

            let defaultMarkets = this._getDefaultMarkets();
            this.defaultMarkets = Immutable.Map(defaultMarkets);
            this.starredMarkets = Immutable.Map(ss.get(this.starredKey, []));
            this.userMarkets = Immutable.Map(ss.get(this.marketsKey, {}));

            this.initDone = true;
            resolve();
        });
    }

    _getDefaultMarkets() {
        let markets = [];

        this.preferredBases.forEach(base => {
            addMarkets(markets, base, this.chainMarkets);
        });

        function addMarkets(target, base, markets) {
            markets
                .filter(a => {
                    return a !== base;
                })
                .forEach(market => {
                    target.push([
                        `${market}_${base}`,
                        {quote: market, base: base}
                    ]);
                });
        }

        return markets;
    }

    getSetting(setting) {
        return this.settings.get(setting);
    }

    onChangeSetting(payload) {
        let save = true;
        switch (payload.setting) {
            case "faucet_address":
                if (payload.value.indexOf("testnet") === -1) {
                    this.mainnet_faucet = payload.value;
                    ss.set("mainnet_faucet", payload.value);
                } else {
                    this.testnet_faucet = payload.value;
                    ss.set("testnet_faucet", payload.value);
                }
                break;

            case "walletLockTimeout":
                ss.set("lockTimeout", payload.value);
                break;

            case "activeNode":
                // doesnt need to be saved in local storage
                save = true;

            default:
                break;
        }

        // check current settings
        if (this.settings.get(payload.setting) !== payload.value) {
            this.settings = this.settings.set(payload.setting, payload.value);
            if (save) {
                this._saveSettings();
            }
        }
        // else {
        //     console.warn(
        //         "Trying to save unchanged value (" +
        //             payload.setting +
        //             ": " +
        //             payload.value +
        //             "), consider refactoring to avoid this"
        //     );
        // }
    }

    onChangeViewSetting(payload) {
        for (let key in payload) {
            this.viewSettings = this.viewSettings.set(key, payload[key]);
        }

        ss.set("viewSettings_v1", this.viewSettings.toJS());
    }

    onChangeMarketDirection(payload) {
        for (let key in payload) {
            if (payload[key]) {
                this.marketDirections = this.marketDirections.set(
                    key,
                    payload[key]
                );
            } else {
                this.marketDirections = this.marketDirections.delete(key);
            }
        }
        ss.set("marketDirections", this.marketDirections.toJS());
    }

    onHideAsset(payload) {
        if (payload.id) {
            if (!payload.status) {
                this.hiddenAssets = this.hiddenAssets.delete(
                    this.hiddenAssets.indexOf(payload.id)
                );
            } else {
                this.hiddenAssets = this.hiddenAssets.push(payload.id);
            }
        }

        ss.set("hiddenAssets", this.hiddenAssets.toJS());
    }

    onHideMarket(payload) {
        if (payload.id) {
            if (!payload.status) {
                this.hiddenMarkets = this.hiddenMarkets.delete(
                    this.hiddenMarkets.indexOf(payload.id)
                );
            } else {
                this.hiddenMarkets = this.hiddenMarkets.push(payload.id);
            }
        }

        ss.set("hiddenMarkets", this.hiddenMarkets.toJS());
    }

    onAddStarMarket(market) {
        let marketID = market.quote + "_" + market.base;
        if (!this.starredMarkets.has(marketID)) {
            this.starredMarkets = this.starredMarkets.set(marketID, {
                quote: market.quote,
                base: market.base
            });

            ss.set(this.starredKey, this.starredMarkets.toJS());
        } else {
            return false;
        }
    }

    onSetUserMarket(payload) {
        let marketID = payload.quote + "_" + payload.base;
        if (payload.value) {
            this.userMarkets = this.userMarkets.set(marketID, {
                quote: payload.quote,
                base: payload.base
            });
        } else {
            this.userMarkets = this.userMarkets.delete(marketID);
        }
        ss.set(this.marketsKey, this.userMarkets.toJS());
    }

    onRemoveStarMarket(market) {
        let marketID = market.quote + "_" + market.base;

        this.starredMarkets = this.starredMarkets.delete(marketID);

        ss.set(this.starredKey, this.starredMarkets.toJS());
    }

    onClearStarredMarkets() {
        this.starredMarkets = Immutable.Map({});
        ss.set(this.starredKey, this.starredMarkets.toJS());
    }

    onAddWS(ws) {
        if (typeof ws === "string") {
            ws = {url: ws, location: null};
        }
        this.defaults.apiServer.push(ws);
        ss.set("defaults_v1", this.defaults);
    }

    onRemoveWS(index) {
        this.defaults.apiServer.splice(index, 1);
        ss.set("defaults_v1", this.defaults);
    }

    onHideWS(url) {
        let node = this.defaults.apiServer.find(node => node.url === url);
        node.hidden = true;
        ss.set("defaults_v1", this.defaults);
    }

    onShowWS(url) {
        let node = this.defaults.apiServer.find(node => node.url === url);
        node.hidden = false;
        ss.set("defaults_v1", this.defaults);
    }

    onClearSettings(resolve) {
        ss.remove("settings_v3");
        ss.remove("settings_v4");
        this.settings = this.defaultSettings;

        this._saveSettings();

        if (resolve) {
            resolve();
        }
    }

    onSwitchLocale({locale}) {
        this.onChangeSetting({setting: "locale", value: locale});
    }

    _getChainId() {
        return (Apis.instance().chain_id || "4018d784").substr(0, 8);
    }

    _getChainKey(key) {
        const chainId = this._getChainId();
        return key + (chainId ? `_${chainId.substr(0, 8)}` : "");
    }

    onUpdateLatencies(latencies) {
        ss.set("apiLatencies", latencies);
        this.apiLatencies = latencies;
    }

    getLastBudgetObject() {
        return ss.get(this._getChainKey("lastBudgetObject"), "2.13.1");
    }

    setLastBudgetObject(value) {
        ss.set(this._getChainKey("lastBudgetObject"), value);
    }

    setExchangeSettings(key, value) {
        this.exchange = this.exchange.set(key, value);

        ss.set("exchange", this.exchange.toJS());
    }

    getPriceAlert() {
        return this.priceAlert.toJS();
    }

    onSetPriceAlert(value) {
        this.priceAlert = fromJS(value);

        ss.set("priceAlert", value);
    }

    hasAnyPriceAlert(quoteAssetSymbol, baseAssetSymbol) {
        return this.priceAlert.some(
            priceAlert =>
                priceAlert.get("quoteAssetSymbol") === quoteAssetSymbol &&
                priceAlert.get("baseAssetSymbol") === baseAssetSymbol
        );
    }

    getExchangeSettings(key) {
        return this.exchange.get(key);
    }

    onSetExchangeLastExpiration(value) {
        this.setExchangeSettings("lastExpiration", fromJS(value));
    }

    onSetExchangeTutorialShown(value) {
        this.setExchangeSettings("tutorialShown", value);
    }

    getExhchangeLastExpiration() {
        return this.getExchangeSettings("lastExpiration");
    }

    onModifyPreferedBases(payload) {
        if ("newIndex" in payload && "oldIndex" in payload) {
            /* Reorder */
            let current = this.preferredBases.get(payload.newIndex);
            this.preferredBases = this.preferredBases.set(
                payload.newIndex,
                this.preferredBases.get(payload.oldIndex)
            );
            this.preferredBases = this.preferredBases.set(
                payload.oldIndex,
                current
            );
        } else if ("remove" in payload) {
            /* Remove */
            this.preferredBases = this.preferredBases.delete(payload.remove);
            let defaultMarkets = this._getDefaultMarkets();
            this.defaultMarkets = Immutable.Map(defaultMarkets);
        } else if ("add" in payload) {
            /* Add new */
            this.preferredBases = this.preferredBases.push(payload.add);
            let defaultMarkets = this._getDefaultMarkets();
            this.defaultMarkets = Immutable.Map(defaultMarkets);
        }

        ss.set(this.basesKey, this.preferredBases.toArray());
    }

    onUpdateUnits() {
        this.defaults.unit = getUnits();
        if (this.defaults.unit.indexOf(this.settings.get("unit")) === -1) {
            this.settings = this.settings.set("unit", this.defaults.unit[0]);
        }
    }

    onHideNewsHeadline(payload) {
        if (payload && this.hiddenNewsHeadline.indexOf(payload)) {
            this.hiddenNewsHeadline = this.hiddenNewsHeadline.push(payload);
            ss.set("hiddenNewsHeadline", this.hiddenNewsHeadline.toJS());
        }
    }

    onAddChartLayout(value) {
        if (value.name) {
            value.enabled = true;
            const index = this.chartLayouts.findIndex(
                item => item.name === value.name && item.symbol === value.symbol
            );
            if (index !== -1) {
                this.chartLayouts = this.chartLayouts.delete(index);
            }
            this.chartLayouts = this.chartLayouts.map(item => {
                if (item.symbol === value.symbol) item.enabled = false;
                return item;
            });
            this.chartLayouts = this.chartLayouts.push(value);
            ss.set("chartLayouts", this.chartLayouts.toJS());
        }
    }

    onDeleteChartLayout(name) {
        if (name) {
            const index = this.chartLayouts.findIndex(
                item => item.name === name
            );
            if (index !== -1) {
                this.chartLayouts = this.chartLayouts.delete(index);
            }
            ss.set("chartLayouts", this.chartLayouts.toJS());
        }
    }
}

export default alt.createStore(SettingsStore, "SettingsStore");
