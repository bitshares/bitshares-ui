import alt from "alt-instance";
import IntlActions from "actions/IntlActions";
import SettingsActions from "actions/SettingsActions";
import counterpart from "counterpart";
var locale_en = require("json-loader!assets/locales/locale-en");
import ls from "common/localStorage";
let ss = new ls("__graphene__");

counterpart.registerTranslations("en", locale_en);
counterpart.setFallbackLocale("en");

import {addLocaleData} from "react-intl";

import en from "react-intl/locale-data/en";
import es from "react-intl/locale-data/es";
import fr from "react-intl/locale-data/fr";
import ko from "react-intl/locale-data/ko";
import zh from "react-intl/locale-data/zh";
import de from "react-intl/locale-data/de";
import tr from "react-intl/locale-data/tr";

addLocaleData(en);
addLocaleData(es);
addLocaleData(fr);
addLocaleData(ko);
addLocaleData(zh);
addLocaleData(de);
addLocaleData(tr);

class IntlStore {
    constructor() {
        this.currentLocale = ss.has("settings_v3") ? ss.get("settings_v3").locale : "en";

        this.locales = ["en"];
        this.localesObject = {en: locale_en};

        this.bindListeners({
            onSwitchLocale: IntlActions.switchLocale,
            onGetLocale: IntlActions.getLocale,
            onClearSettings: SettingsActions.clearSettings
        });
    }

    hasLocale(locale) {
        return this.locales.indexOf(locale) !== -1;
    }

    getCurrentLocale() {
        return this.currentLocale;
    }

    onSwitchLocale({locale, localeData}) {
        switch (locale) {
        case "en":
            counterpart.registerTranslations("en", this.localesObject.en);
            break;

        default:
            counterpart.registerTranslations(locale, localeData);
            break;
        }

        counterpart.setLocale(locale);
        this.currentLocale = locale;
    }

    onGetLocale(locale) {
        if (this.locales.indexOf(locale) === -1) {
            this.locales.push(locale);
        }
    }

    onClearSettings() {
        this.onSwitchLocale({locale: "en"});
    }
}

export default alt.createStore(IntlStore, "IntlStore");
