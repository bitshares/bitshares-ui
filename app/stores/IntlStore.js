import alt from "alt-instance";
import IntlActions from "actions/IntlActions";
import SettingsActions from "actions/SettingsActions";
import counterpart from "counterpart";

const locale_en = !__TEST__
    ? require("json-loader!assets/locales/locale-en.json")
    : require("assets/locales/locale-en.json");
import ls from "common/localStorage";
let ss = new ls("__graphene__");

counterpart.registerTranslations("en", locale_en);
counterpart.setFallbackLocale("en");

import {addLocaleData} from "react-intl";

import localeCodes from "assets/locales";
for (let localeCode of localeCodes) {
    addLocaleData(require(`react-intl/locale-data/${localeCode}`));
}

class IntlStore {
    constructor() {
        this.currentLocale = ss.has("settings_v3")
            ? ss.get("settings_v3").locale
            : "en";

        this.localesObject = {en: locale_en};

        this.bindListeners({
            onSwitchLocale: IntlActions.switchLocale,
            onClearSettings: SettingsActions.clearSettings
        });
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
                this.localesObject[locale] = localeData;
                counterpart.registerTranslations(locale, localeData);
                break;
        }

        counterpart.setLocale(locale);
        this.currentLocale = locale;
    }

    onClearSettings() {
        this.onSwitchLocale({locale: "en"});
    }
}

export default alt.createStore(IntlStore, "IntlStore");
