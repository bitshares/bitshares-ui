var alt = require("../alt-instance");
var SettingsActions = require("../actions/SettingsActions");
var MarketsActions = require("../actions/MarketsActions");

var Immutable = require("immutable");

class SettingsStore {
    constructor() {
        this.settings = Immutable.Map({
            // inverseMarket: true,
            // unit: 0,
            locale: "en",
            // confirmMarketOrder: true,
            defaultMarkets: [
                {quote: "1.3.1", base: "1.3.0"},
                {quote: "1.3.626", base: "1.3.0"},
                {quote: "1.3.379", base: "1.3.0"},
                {quote: "1.3.424", base: "1.3.0"},
                {quote: "1.3.520", base: "1.3.0"},
                {quote: "1.3.312", base: "1.3.0"},
                {quote: "1.3.316", base: "1.3.0"},
                {quote: "1.3.460", base: "1.3.0"}
            ]
        });



        // If you want a default value to be translated, add the translation to settings in locale-xx.js
        // and use an object {translate: key} in the defaults array
        this.defaults = {
            // unit: [
            //     "$",
            //     "¥",
            //     "€",
            //     "£",
            //     "\u0243",
            //     "BTS"
            // ],
            locale: [
                "en",
                "cn",
                "fr",
                "ko",
                "de",
                "es"
            ],
            // inverseMarket: [
            //     "CORE/USD",
            //     "USD/CORE"
            // ],
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
