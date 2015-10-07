var alt = require("../alt-instance");
var SettingsActions = require("../actions/SettingsActions");
var MarketsActions = require("../actions/MarketsActions");

var Immutable = require("immutable");

class SettingsStore {
    constructor() {
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
            ]
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
                "es"
            ],
            // confirmMarketOrder: [
            //     {translate: "confirm_yes"},
            //     {translate: "confirm_no"}
            // ]
        };

        this.bindListeners({
            onChangeSetting: SettingsActions.changeSetting,
            onAddMarket: MarketsActions.addMarket,
            onRemoveMarket: MarketsActions.removeMarket
        });

        console.log("-- SettingsStore.constructor -->", localStorage.settings_v3);
        if (localStorage.settings_v3) {
            let settings = Immutable.Map(JSON.parse(localStorage.settings_v3));
            this.settings = settings;
        }

    }

    onChangeSetting(payload) {
        this.settings = this.settings.set(
            payload.setting,
            payload.value
        );

        localStorage.settings_v3 = JSON.stringify(this.settings.toJS());
    }

    onAddMarket(market) {
        console.log("addMarket:", market);
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
            localStorage.settings_v3 = JSON.stringify(this.settings.toJS());
        } else {
            return false;
        }
    }

    onRemoveMarket(market) {
        let defaultMarkets = this.settings.get("defaultMarkets");
        for (var i = 0; i < defaultMarkets.length; i++) {
            if (defaultMarkets[i].quote === market.quote && defaultMarkets[i].base === market.base) {
                defaultMarkets.splice(i, 1);
                localStorage.settings_v3 = JSON.stringify(this.settings.toJS());
                break;
            }
        }

        this.settings = this.settings.set(
                "defaultMarkets",
                defaultMarkets);
        }
}

module.exports = alt.createStore(SettingsStore, "SettingsStore");
