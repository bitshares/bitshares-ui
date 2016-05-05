var alt = require("../alt-instance");
var SettingsActions = require("../actions/SettingsActions");
var IntlActions = require("../actions/IntlActions");
var Immutable = require("immutable");
var _ =require("lodash");

const CORE_ASSET = "BTS"; // Setting this to BTS to prevent loading issues when used with BTS chain which is the most usual case currently

import ls from "common/localStorage";
const STORAGE_KEY = "__graphene__";
let ss = new ls(STORAGE_KEY);

class SettingsStore {
    constructor() {
        this.exportPublicMethods({getSetting: this.getSetting.bind(this)});

        this.defaultSettings = Immutable.Map({
            locale: "en",
            connection: "wss://bitshares.openledger.info/ws",
            faucet_address: "https://bitshares.openledger.info",
            unit: CORE_ASSET,
            showSettles: false,
            walletLockTimeout: 60 * 10,
            themes: "darkTheme",
            disableChat: false
        });

        this.baseOptions = [CORE_ASSET, "BTC", "USD", "CNY", "OPEN.BTC", "OPEN.USD"];

        let defaultMarkets = [
            // BTS BASE
            ["OPEN.MUSE_"+ CORE_ASSET, {"quote": "OPEN.MUSE","base": CORE_ASSET}],
            ["OPEN.EMC_"+ CORE_ASSET, {"quote": "OPEN.EMC","base": CORE_ASSET}],
            ["TRADE.MUSE_"+ CORE_ASSET, {"quote": "TRADE.MUSE","base": CORE_ASSET}],
            ["OPEN.BTC_"+ CORE_ASSET, {"quote": "OPEN.BTC","base": CORE_ASSET}],
            ["USD_"+ CORE_ASSET, {"quote": "USD","base": CORE_ASSET}],
            ["BTC_"+ CORE_ASSET, {"quote": "BTC","base": CORE_ASSET}],
            ["CNY_"+ CORE_ASSET, {"quote": "CNY","base": CORE_ASSET}],
            ["EUR_"+ CORE_ASSET, {"quote": "EUR","base": CORE_ASSET}],
            ["GOLD_"+ CORE_ASSET, {"quote": "GOLD","base": CORE_ASSET}],
            ["SILVER_"+ CORE_ASSET, {"quote": "SILVER","base": CORE_ASSET}],
            ["METAEX.BTC_"+ CORE_ASSET, {"quote": "METAEX.BTC","base": CORE_ASSET}],
            ["METAEX.ETH_"+ CORE_ASSET, {"quote": "METAEX.ETH","base": CORE_ASSET}],
            ["METAFEES_"+ CORE_ASSET, {"quote": "METAFEES","base": CORE_ASSET}],
            ["OBITS_"+ CORE_ASSET, {"quote": "OBITS","base": CORE_ASSET}],
            ["OPEN.ETH_"+ CORE_ASSET, {"quote": "OPEN.ETH","base": CORE_ASSET}],
            ["MKR_"+ CORE_ASSET, {"quote": "MKR","base": CORE_ASSET}],

            // BTC BASE
            ["TRADE.BTC_BTC", {"quote":"TRADE.BTC","base": "BTC"} ],
            ["METAEX.BTC_BTC", {"quote":"METAEX.BTC","base": "BTC"} ],
            ["OPEN.BTC_BTC", {"quote":"OPEN.BTC","base": "BTC"} ],
            ["OPEN.STEEM_BTC", {"quote":"OPEN.STEEM","base": "BTC"} ],
            ["OPEN.ETH_BTC", {"quote":"OPEN.ETH","base": "BTC"} ],
            ["USD_BTC", {"quote":"USD","base": "BTC"} ],
            [CORE_ASSET + "_BTC", {"quote": CORE_ASSET,"base": "BTC"}],

            // USD BASE
            ["OPEN.USD_USD", {"quote": "OPEN.USD","base": "USD"}],
            [CORE_ASSET + "_USD", {"quote": CORE_ASSET,"base": "USD"}],

            // CNY BASE
            ["TCNY_CNY", {"quote": "TCNY","base": "CNY"}],
            ["BOTSCNY_CNY", {"quote": "BOTSCNY","base": "CNY"}],
            ["OPEN.CNY_CNY", {"quote": "OPEN.CNY","base": "CNY"}],
            [CORE_ASSET + "_CNY", {"quote": CORE_ASSET,"base": "CNY"}],

            // OTHERS
            ["OPEN.EUR_EUR", {"quote": "OPEN.EUR","base": "EUR"}],
            ["METAEX.ETH_OPEN.ETH", {"quote": "METAEX.ETH","base": "OPEN.ETH"}]
            ["MKR_OPEN.BTC", {"quote": "MKR","base": "OPEN.BTC"}]

        ];

        // If you want a default value to be translated, add the translation to settings in locale-xx.js
        // and use an object {translate: key} in the defaults array
        let defaults = {
            locale: [
                "en",
                "cn",
                "fr",
                "ko",
                "de",
                "es",
                "tr"
            ],
            connection: [
                "wss://bitshares.openledger.info/ws",
                "wss://bitshares.dacplay.org:8089/ws",
                "wss://dele-puppy.com/ws",
                "wss://valen-tin.fr:8090/ws"
            ],
            unit: [
                CORE_ASSET,
                "USD",
                "CNY",
                "BTC",
                "EUR",
                "GBP"
            ],
            showSettles: [
                {translate: "yes"},
                {translate: "no"}
            ],
            disableChat: [
                {translate: "yes"},
                {translate: "no"}
            ],
            themes: [
                "darkTheme",
                "lightTheme",
                "olDarkTheme"
            ]
            // confirmMarketOrder: [
            //     {translate: "confirm_yes"},
            //     {translate: "confirm_no"}
            // ]
        };

        this.bindListeners({
            onChangeSetting: SettingsActions.changeSetting,
            onChangeViewSetting: SettingsActions.changeViewSetting,
            onChangeMarketDirection: SettingsActions.changeMarketDirection,
            onAddStarMarket: SettingsActions.addStarMarket,
            onRemoveStarMarket: SettingsActions.removeStarMarket,
            onAddStarAccount: SettingsActions.addStarAccount,
            onRemoveStarAccount: SettingsActions.removeStarAccount,
            onAddWS: SettingsActions.addWS,
            onRemoveWS: SettingsActions.removeWS,
            onHideAsset: SettingsActions.hideAsset,
            onClearSettings: SettingsActions.clearSettings,
            onSwitchLocale: IntlActions.switchLocale
        });

        this.settings = Immutable.Map(_.merge(this.defaultSettings.toJS(), ss.get("settings_v3")));

        this.starredMarkets = Immutable.Map(ss.get("starredMarkets", defaultMarkets));

        this.starredAccounts = Immutable.Map(ss.get("starredAccounts"));

        this.defaults = _.merge({}, defaults, ss.get("defaults_v1"));

        this.viewSettings = Immutable.Map(ss.get("viewSettings_v1"));

        this.marketDirections = Immutable.Map(ss.get("marketDirections"));

        this.hiddenAssets = Immutable.List(ss.get("hiddenAssets", []));

        this.preferredBases = Immutable.List(ss.get("preferredBases", [CORE_ASSET, "BTC", "USD", "CNY", "OPEN.BTC"]));

    }

    getSetting(setting) {
        return this.settings.get(setting);
    }

    onChangeSetting(payload) {
        this.settings = this.settings.set(
            payload.setting,
            payload.value
        );

        ss.set("settings_v3", this.settings.toJS());
        if (payload.setting === "walletLockTimeout") {
            ss.set("lockTimeout", payload.value);
        }
    }

    onChangeViewSetting(payload) {
        for (key in payload) {
            this.viewSettings = this.viewSettings.set(key, payload[key]);
        }

        ss.set("viewSettings_v1", this.viewSettings.toJS());
    }

    onChangeMarketDirection(payload) {
        for (key in payload) {
            this.marketDirections = this.marketDirections.set(key, payload[key]);
        }

        ss.set("marketDirections", this.marketDirections.toJS());
    }

    onHideAsset(payload) {
        if (payload.id) {
            if (!payload.status) {
                this.hiddenAssets = this.hiddenAssets.delete(this.hiddenAssets.indexOf(payload.id));
            } else {
                this.hiddenAssets = this.hiddenAssets.push(payload.id);
            }
        }

        ss.set("hiddenAssets", this.hiddenAssets.toJS());
    }

    onAddStarMarket(market) {
        let marketID = market.quote + "_" + market.base;

        if (!this.starredMarkets.has(marketID)) {
            this.starredMarkets = this.starredMarkets.set(marketID, {quote: market.quote, base: market.base});

            ss.set("starredMarkets", this.starredMarkets.toJS());
        } else {
            return false;
        }
    }

    onRemoveStarMarket(market) {
        let marketID = market.quote + "_" + market.base;

        this.starredMarkets = this.starredMarkets.delete(marketID);

        ss.set("starredMarkets", this.starredMarkets.toJS());
    }

    onAddStarAccount(account) {
        if (!this.starredAccounts.has(account)) {
            this.starredAccounts = this.starredAccounts.set(account, {name: account});

            ss.set("starredAccounts", this.starredAccounts.toJS());
        } else {
            return false;
        }
    }

    onRemoveStarAccount(account) {

        this.starredAccounts = this.starredAccounts.delete(account);

        ss.set("starredAccounts", this.starredAccounts.toJS());
    }

    onAddWS(ws) {
        this.defaults.connection.push(ws);
        ss.set("defaults_v1", this.defaults);
    }

    onRemoveWS(index) {
        if (index !== 0) { // Prevent removing the default connection
            this.defaults.connection.splice(index, 1);
            ss.set("defaults_v1", this.defaults);
        }
    }

    onClearSettings() {
        ss.remove("settings_v3");
        this.settings = this.defaultSettings;

        ss.set("settings_v3", this.settings.toJS());

        if (window && window.location) {
            // window.location.reload();
        }
    }

    onSwitchLocale(locale) {
        console.log("onSwitchLocale:", locale);

        this.onChangeSetting({setting: "locale", value: locale});
    }

    // onChangeBase(payload) {
    //     if (payload.index && payload.value) {
    //         this.preferredBases = this.preferredBases.set(payload.index, payload.value);
    //         ss.set("preferredBases", this.preferredBases.toArray);                    
    //     }
    // }
}

module.exports = alt.createStore(SettingsStore, "SettingsStore");
