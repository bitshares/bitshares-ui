var alt = require("../alt-instance");

var locales = {};
if (__ELECTRON__) {
    ["cn", "de", "es", "fr", "ko", "tr"].forEach(locale => {
        locales[locale] = require("json!assets/locales/locale-" + locale + ".json");
    });
}

class IntlActions {

    switchLocale(locale) {
        if (locale === "en") {
            return this.dispatch({locale});
        }
        if (__ELECTRON__) {
            this.dispatch({
                locale: locale,
                localeData: locales[locale]
            });
        } else {
        	fetch("/locale-" + locale + ".json").then( (reply) => {
                return reply.json().then(result => {
                    this.dispatch({
                    	locale: locale,
                    	localeData: result
                    });
            })})
            .catch(err => {
                console.log("fetch locale error:", err);
                this.dispatch({locale: "en"});
            });
        }

    }

    getLocale(locale) {
        this.dispatch(locale);
    }

}

module.exports = alt.createActions(IntlActions);
