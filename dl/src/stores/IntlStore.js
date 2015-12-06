var alt = require("../alt-instance");
var IntlActions = require("../actions/IntlActions");
var BaseStore = require("./BaseStore");
var counterpart = require("counterpart-instance");
var locale_en = require("assets/locales/locale-en");
var cookies = require("cookies-js");
counterpart.registerTranslations("en", locale_en);

class IntlStore extends BaseStore {
    constructor() {
        super();
        this.currentLocale = cookies.locale || "en";
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
