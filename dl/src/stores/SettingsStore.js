var alt = require("../alt-instance");
var SettingsActions = require("../actions/SettingsActions");
var IntlActions = require("../actions/IntlActions");
var Immutable = require("immutable");
import {merge} from "lodash";
import ls from "common/localStorage";

const CORE_ASSET = "BTS"; // Setting this to BTS to prevent loading issues when used with BTS chain which is the most usual case currently

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

        // Default markets setup
        let topMarkets = [
            "MKR", "OPEN.MKR", "BTS", "OPEN.ETH", "ICOO", "BTC", "OPEN.LISK",
            "OPEN.STEEM", "OPEN.DAO", "PEERPLAYS", "USD", "CNY", "BTSR", "OBITS",
            "OPEN.DGD", "EUR", "TRADE.BTC", "CASH.BTC", "GOLD", "SILVER",
            "OPEN.USDT", "OPEN.EURT", "OPEN.BTC", "CADASTRAL"
        ];

        this.preferredBases = Immutable.List([CORE_ASSET, "OPEN.BTC", "USD", "CNY", "BTC"]);
        // Openledger
        // this.preferredBases = Immutable.List(["OPEN.BTC", "OPEN.ETH", "OPEN.USDT", "OPEN.EURT", CORE_ASSET]);

        function addMarkets(target, base, markets) {
            markets.filter(a => {
                return a !== base;
            }).forEach(market => {
                target.push([`${market}_${base}`, {"quote": market,"base": base}]);
            });
        }

        let defaultMarkets = [];
        this.preferredBases.forEach(base => {
            addMarkets(defaultMarkets, base, topMarkets);
        });

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

        this.settings = Immutable.Map(merge(this.defaultSettings.toJS(), ss.get("settings_v3")));

        this.marketsString = "markets";
        this.starredMarkets = Immutable.Map(ss.get(this.marketsString, defaultMarkets));

        this.starredAccounts = Immutable.Map(ss.get("starredAccounts"));

        this.defaults = merge({}, defaults, ss.get("defaults_v1"));

        this.viewSettings = Immutable.Map(ss.get("viewSettings_v1"));

        this.marketDirections = Immutable.Map(ss.get("marketDirections"));

        this.hiddenAssets = Immutable.List(ss.get("hiddenAssets", []));
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
        for (let key in payload) {
            this.viewSettings = this.viewSettings.set(key, payload[key]);
        }

        ss.set("viewSettings_v1", this.viewSettings.toJS());
    }

    onChangeMarketDirection(payload) {
        for (let key in payload) {
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

            ss.set(this.marketsString, this.starredMarkets.toJS());
        } else {
            return false;
        }
    }

    onRemoveStarMarket(market) {
        let marketID = market.quote + "_" + market.base;

        this.starredMarkets = this.starredMarkets.delete(marketID);

        ss.set(this.marketsString, this.starredMarkets.toJS());
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

    onSwitchLocale({locale}) {
        console.log("onSwitchLocale:", locale);

        this.onChangeSetting({setting: "locale", value: locale});
    }
}

module.exports = alt.createStore(SettingsStore, "SettingsStore");
