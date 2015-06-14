var alt = require("../alt-instance");
var SettingsActions = require("../actions/SettingsActions");
var Immutable = require("immutable");

class SettingsStore {
    constructor() {
        this.settings = Immutable.Map({
            inverseMarket: true,
            unit: 0,
            locale: "en"
        });

        this.defaults = {
            currencies: [
                "$",
                "¥",
                "€",
                "£",
                "\u0243",
                "BTS"
            ],
            locales: [
                "en",
                "fr"
            ],
            orientation: [
                "USD/CORE",
                "CORE/USD"
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
