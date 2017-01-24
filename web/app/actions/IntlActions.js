import alt from "alt-instance";

var locales = {};
if (__ELECTRON__) {
    ["cn", "de", "es", "fr", "ko", "tr"].forEach(locale => {
        locales[locale] = require("json-loader!assets/locales/locale-" + locale + ".json");
    });
}

class IntlActions {

    switchLocale(locale) {
        if (locale === "en") {
            return {locale};
        }
        if (__ELECTRON__) {
            return {
                locale: locale,
                localeData: locales[locale]
            };
        } else {
            return (dispatch) => {
                fetch("locale-" + locale + ".json").then( (reply) => {
                    return reply.json().then(result => {
                        dispatch({
                            locale,
                            localeData: result
                        });
                    });
                }).catch(err => {
                    console.log("fetch locale error:", err);
                    return (dispatch) => {
                        dispatch({locale: "en"});
                    };
                });
            };

        }
    }

    getLocale(locale) {
        return locale;
    }
}

export default alt.createActions(IntlActions);
