var alt = require("../alt-instance");
var IntlActions = require("../actions/IntlActions");
var BaseStore = require("./BaseStore");
var counterpart = require("counterpart-instance");
var locale_en = require("assets/locales/locale-en");
var cookies = require("cookies-js");
counterpart.registerTranslations("en", locale_en);
counterpart.setFallbackLocale("en");

import {addLocaleData} from 'react-intl';
import en from 'react-intl/lib/locale-data/en';
import es from 'react-intl/lib/locale-data/es';
import fr from 'react-intl/lib/locale-data/fr';

import ko from 'react-intl/lib/locale-data/ko';
import zh from 'react-intl/lib/locale-data/zh';
import de from 'react-intl/lib/locale-data/de';
import tr from 'react-intl/lib/locale-data/tr';

addLocaleData(en);
addLocaleData(es);
addLocaleData(fr);
addLocaleData(ko);
addLocaleData(zh);
addLocaleData(de);
addLocaleData(tr);

class IntlStore extends BaseStore {
    constructor() {
        super();
        this.currentLocale = cookies.get("graphene_locale") || "en";
        this.locales = ["en"];
        this.localesObject = {en: locale_en};

        this.bindListeners({
            onSwitchLocale: IntlActions.switchLocale,
            onGetLocale: IntlActions.getLocale
        });

        this._export("getCurrentLocale", "hasLocale");
    }

    hasLocale(locale) {
        console.log("hasLocale:", this.locales.indexOf(locale));
        return this.locales.indexOf(locale) !== -1;
    }

    getCurrentLocale() {
        return this.currentLocale;
    }

    onSwitchLocale(locale) {
        switch (locale) {
            case "en":
                counterpart.registerTranslations("en", this.localesObject.en);
                break;

            default:
                let newLocale = this.localesObject[locale];
                if (!newLocale) {
                    newLocale = require("assets/locales/locale-" + locale);
                    this.localesObject[locale] = newLocale;
                }
                counterpart.registerTranslations(locale, newLocale);
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
}

module.exports = alt.createStore(IntlStore, "IntlStore");
