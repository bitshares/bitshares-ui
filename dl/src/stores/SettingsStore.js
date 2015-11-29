var alt = require("../alt-instance");
var SettingsActions = require("../actions/SettingsActions");

var Immutable = require("immutable");
var _ =require("lodash");

const STORAGE_KEY = "__graphene__";
const CORE_ASSET = "BTS"; // Setting this to BTS to prevent loading issues when used with BTS chain which is the most usual case currently

var ls = typeof localStorage === "undefined" ? null : localStorage;

class SettingsStore {
    constructor() {
        this.exportPublicMethods({getSetting: this.getSetting.bind(this)});

        this.settings = Immutable.Map({
            locale: "en",
            connection: "wss://bitshares.openledger.info/ws",
            faucet_address: "https://bitshares.openledger.info",
            unit: CORE_ASSET,
            showSettles: false
        });

        this.viewSettings =  Immutable.Map({
            cardView: true
        });

        this.starredMarkets = Immutable.Map([
            [CORE_ASSET + "_BTC", {"quote": CORE_ASSET,"base": "BTC"}],
            [CORE_ASSET + "_CNY", {"quote": CORE_ASSET,"base": "CNY"}],
            [CORE_ASSET + "_EUR", {"quote": CORE_ASSET,"base": "EUR"}],
            [CORE_ASSET + "_GOLD", {"quote": CORE_ASSET,"base": "GOLD"}],
            [CORE_ASSET + "_SILVER", {"quote": CORE_ASSET,"base": "SILVER"}],
            [CORE_ASSET + "_USD", {"quote": CORE_ASSET,"base": "USD"}],
            ["BTC_USD", {"quote":"BTC","base":"USD"}],
            ["BTC_CNY", {"quote":"BTC","base":"CNY"}],
            [CORE_ASSET + "_OPENBTC", {"quote": CORE_ASSET,"base": "OPENBTC"} ],
            [CORE_ASSET + "_OPENMUSE", {"quote": CORE_ASSET,"base": "OPENMUSE"} ],
            [CORE_ASSET + "_TRADE.BTC", {"quote": CORE_ASSET,"base": "TRADE.BTC"} ],
            ["TRADE.BTC_BTC", {"quote":"TRADE.BTC","base": "BTC"} ],
            [CORE_ASSET + "_METAFEES", {"quote": CORE_ASSET,"base": "METAFEES"} ],
            [CORE_ASSET + "_OBITS", {"quote": CORE_ASSET,"base": "OBITS"} ],
            [CORE_ASSET + "_TRADE.MUSE", {"quote": CORE_ASSET,"base": "TRADE.MUSE"} ],
            ["METAEX.BTC_BTC", {"quote":"METAEX.BTC","base": "BTC"} ],
            [CORE_ASSET + "_METAEX.BTC", {"quote": CORE_ASSET,"base": "METAEX.BTC" } ]
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
            ],
            unit: [
                CORE_ASSET,
                "USD",
                "CNY",
                "BTC",
                "EUR"
            ],
            showSettles: [
                {translate: "yes"},
                {translate: "no"}
            ]
            // confirmMarketOrder: [
            //     {translate: "confirm_yes"},
            //     {translate: "confirm_no"}
            // ]
        };

        this.bindListeners({
            onChangeSetting: SettingsActions.changeSetting,
            onChangeViewSetting: SettingsActions.changeViewSetting,
            onAddStarMarket: SettingsActions.addStarMarket,
            onRemoveStarMarket: SettingsActions.removeStarMarket,
            onAddWS: SettingsActions.addWS,
            onRemoveWS: SettingsActions.removeWS
        });

        if (this._lsGet("settings_v3")) {
            console.log("assign:", _.merge(this.settings.toJS(), JSON.parse(this._lsGet("settings_v3"))));
            this.settings = Immutable.Map(_.merge(this.settings.toJS(), JSON.parse(this._lsGet("settings_v3"))));
        }

        if (this._lsGet("starredMarkets")) {
            this.starredMarkets = Immutable.Map(JSON.parse(this._lsGet("starredMarkets")));
        }

        if (this._lsGet("defaults_v1")) {
            this.defaults = _.merge(this.defaults, JSON.parse(this._lsGet("defaults_v1")));
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

        this._lsSet("settings_v3", this.settings.toJS());
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
        this._lsSet("defaults_v1", this.defaults);
    }

    onRemoveWS(index) {
        if (index !== 0) { // Prevent removing the default connection
            this.defaults.connection.splice(index, 1);
            this._lsSet("defaults_v1", this.defaults);
        }
    }
}

module.exports = alt.createStore(SettingsStore, "SettingsStore");
