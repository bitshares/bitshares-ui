var alt = require("../alt-instance");
var SettingsActions = require("../actions/SettingsActions");

var Immutable = require("immutable");
const STORAGE_KEY = "graphene_settings_v5";

class SettingsStore {
    constructor() {
        this.exportPublicMethods({getSetting: this.getSetting.bind(this)});
        this.settings = Immutable.Map({
            locale: "en",
            defaultMarkets: [
                {"quote":"1.3.536","base":"1.3.0"},
                {"quote":"1.3.285","base":"1.3.0"},
                {"quote":"1.3.218","base":"1.3.0"},
                {"quote":"1.3.366","base":"1.3.0"},
                {"quote":"1.3.330","base":"1.3.0"},
                {"quote":"1.3.481","base":"1.3.0"},
                {"quote":"1.3.427","base":"1.3.0"},
                {"quote":"1.3.218","base":"1.3.536"},
                {"quote":"1.3.218","base":"1.3.285"}
            ],
            connection: "wss://graphene.bitshares.org:443/ws"
        });

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
            // confirmMarketOrder: [
            //     {translate: "confirm_yes"},
            //     {translate: "confirm_no"}
            // ]
        };

        this.bindListeners({
            onChangeSetting: SettingsActions.changeSetting,
            onAddMarket: SettingsActions.addMarket,
            onRemoveMarket: SettingsActions.removeMarket
        });

        if (this._lsGet()) {
            this.settings = Immutable.Map(JSON.parse(this._lsGet()));
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

        this._lsSet(this.settings.toJS());
    }

    _lsGet() {
        return localStorage.getItem(STORAGE_KEY);
    }

    _lsSet(settings) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    onAddMarket(market) {
        let defaultMarkets = this.settings.get("defaultMarkets");
        let exists = false;
        for (var i = 0; i < defaultMarkets.length; i++) {
            if (defaultMarkets[i].quote === market.quote && defaultMarkets[i].base === market.base) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            defaultMarkets.push({quote: market.quote, base: market.base});
            this.settings = this.settings.set(
                "defaultMarkets",
                defaultMarkets);
            this._lsSet(this.settings.toJS());
        } else {
            return false;
        }
    }

    onRemoveMarket(market) {
        let defaultMarkets = this.settings.get("defaultMarkets");
        for (var i = 0; i < defaultMarkets.length; i++) {
            if (defaultMarkets[i].quote === market.quote && defaultMarkets[i].base === market.base) {
                defaultMarkets.splice(i, 1);
                this._lsSet(this.settings.toJS());
                break;
            }
        }

        this.settings = this.settings.set(
                "defaultMarkets",
                defaultMarkets);
        }
}

module.exports = alt.createStore(SettingsStore, "SettingsStore");
