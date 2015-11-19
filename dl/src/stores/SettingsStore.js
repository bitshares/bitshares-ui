var alt = require("../alt-instance");
var SettingsActions = require("../actions/SettingsActions");

var Immutable = require("immutable");
const STORAGE_KEY = "__graphene__";
const CORE_ASSET = "CORE";

var ls = typeof localStorage === "undefined" ? null : localStorage;

class SettingsStore {
    constructor() {
        this.exportPublicMethods({getSetting: this.getSetting.bind(this)});

        this.settings = Immutable.Map({
            locale: "en",
            connection: "wss://bitshares.openledger.info/ws",
            faucet_address: "https://bitshares.openledger.info"
        });

        this.viewSettings =  Immutable.Map({
            cardView: true
        });

        this.defaultMarkets = Immutable.Map([
            ["BTC_" + CORE_ASSET, {"quote":"BTC","base":CORE_ASSET}],
            ["CNY_" + CORE_ASSET, {"quote":"CNY","base":CORE_ASSET}],
            ["EUR_" + CORE_ASSET, {"quote":"EUR","base":CORE_ASSET}],
            ["GOLD_" + CORE_ASSET, {"quote":"GOLD","base":CORE_ASSET}],
            ["SILVER_" + CORE_ASSET, {"quote":"SILVER","base":CORE_ASSET}],
            ["USD_" + CORE_ASSET, {"quote":"USD","base":CORE_ASSET}],
            ["BTC_USD", {"quote":"BTC","base":"USD"}],
            ["BTC_CNY", {"quote":"BTC","base":"CNY"}],
            ["OPENBTC_" + CORE_ASSET, {"quote":"OPENBTC","base":CORE_ASSET} ],
            ["OPENMUSE_" + CORE_ASSET, {"quote":"OPENMUSE","base":CORE_ASSET} ],
            ["TRADE.BTC_" + CORE_ASSET, {"quote":"TRADE.BTC","base":CORE_ASSET} ]
        ]);

        this.starredMarkets = Immutable.Map([
        ]);

        // If you want a default value to be translated, add the translation to settings in locale-xx.js
        // and use an object {translate: key} in the defaults array
        this.defaults = {
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
                "wss://bitshares.openledger.info/ws"
            ]
            // confirmMarketOrder: [
            //     {translate: "confirm_yes"},
            //     {translate: "confirm_no"}
            // ]
        };

        this.bindListeners({
            onChangeSetting: SettingsActions.changeSetting,
            onChangeViewSetting: SettingsActions.changeViewSetting,
            onAddMarket: SettingsActions.addMarket,
            onRemoveMarket: SettingsActions.removeMarket,
            onAddStarMarket: SettingsActions.addStarMarket,
            onRemoveStarMarket: SettingsActions.removeStarMarket,
            onAddWS: SettingsActions.addWS,
            onRemoveWS: SettingsActions.removeWS
        });

        if (this._lsGet("settings_v2")) {
            this.settings = Immutable.Map(JSON.parse(this._lsGet("settings_v2")));
        }

        if (this._lsGet("defaultMarkets")) {
            this.defaultMarkets = Immutable.Map(JSON.parse(this._lsGet("defaultMarkets")));
        }

        if (this._lsGet("starredMarkets")) {
            this.starredMarkets = Immutable.Map(JSON.parse(this._lsGet("starredMarkets")));
        }

        if (this._lsGet("defaults")) {
            this.defaults = JSON.parse(this._lsGet("defaults"));
        }

        if (this._lsGet("viewSettings_v1")) {
            this.viewSettings = Immutable.Map(JSON.parse(this._lsGet("viewSettings_v1")));
        }
    }

    getSetting(setting) {
        return this.settings.get(setting);
    }

    onChangeSetting(payload) {
        this.settings = this.settings.set(
            payload.setting,
            payload.value
        );

        this._lsSet("settings_v2", this.settings.toJS());
    }

    onChangeViewSetting(payload) {
        for (key in payload) {
            this.viewSettings = this.viewSettings.set(key, payload[key]);
        }

        this._lsSet("viewSettings_v1", this.viewSettings.toJS());
    }

    _lsGet(key) {
        if (ls) {
            return ls.getItem(STORAGE_KEY + key);
        }
    }

    _lsSet(key, object) {
        if (ls) {
            ls.setItem(STORAGE_KEY + key, JSON.stringify(object));
        }

    }

    onAddMarket(market) {
        let marketID = market.quote + "_" + market.base;

        if (!this.defaultMarkets.has(marketID)) {
            this.defaultMarkets = this.defaultMarkets.set(marketID, {quote: market.quote, base: market.base});

            this._lsSet("defaultMarkets", this.defaultMarkets.toJS());
        } else {
            return false;
        }
    }

    onRemoveMarket(market) {
        let marketID = market.quote + "_" + market.base;

        this.defaultMarkets = this.defaultMarkets.delete(marketID);

        this._lsSet("defaultMarkets", this.defaultMarkets.toJS());
    }

    onAddStarMarket(market) {
        let marketID = market.quote + "_" + market.base;

        if (!this.starredMarkets.has(marketID)) {
            this.starredMarkets = this.starredMarkets.set(marketID, {quote: market.quote, base: market.base});

            this._lsSet("starredMarkets", this.starredMarkets.toJS());
        } else {
            return false;
        }
    }

    onRemoveStarMarket(market) {
        let marketID = market.quote + "_" + market.base;

        this.starredMarkets = this.starredMarkets.delete(marketID);

        this._lsSet("starredMarkets", this.starredMarkets.toJS());
    }

    onAddWS(ws) {
        this.defaults.connection.push(ws);
        this._lsSet("defaults", this.defaults);
    }

    onRemoveWS(index) {
        if (index !== 0) { // Prevent removing the default connection
            this.defaults.connection.splice(index, 1);
            this._lsSet("defaults", this.defaults);
        }
    }
}

module.exports = alt.createStore(SettingsStore, "SettingsStore");
