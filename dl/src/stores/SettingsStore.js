var alt = require("../alt-instance");
var SettingsActions = require("../actions/SettingsActions");
var Immutable = require("immutable");

class SettingsStore {
    constructor() {
        this.settings = Immutable.Map({
            inverseMarket: true,
            unit: 0,
            locale: "en",
            confirmMarketOrder: true
        });

        // If you want a default value to be translated, add the translation to settings in locale-xx.js
        // and use an object {translate: key} in the defaults array
        this.defaults = {
            unit: [
                "$",
                "¥",
                "€",
                "£",
                "\u0243",
                "BTS"
            ],
            locale: [
                "en",
                "cn",
                "fr",
                "ko",
                "de"
            ],
            inverseMarket: [
                "CORE/USD",
                "USD/CORE"
            ],
            confirmMarketOrder: [
                {translate: "confirm_yes"},
                {translate: "confirm_no"}
            ]
        };

        this.bindListeners({
            onChangeSetting: SettingsActions.changeSetting
        });

    }

    onChangeSetting(payload) {
        this.settings = this.settings.set(
            payload.setting,
            payload.value
        );
    }
}

module.exports = alt.createStore(SettingsStore, "SettingsStore");
