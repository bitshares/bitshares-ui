import alt from "alt-instance";

import localeCodes from "assets/locales";

var locales = {};
if (__ELECTRON__) {
    localeCodes.forEach(locale => {
        locales[locale] = require(`assets/locales/locale-${locale}.json`);
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
            return dispatch => {
                fetch(`${__BASE_URL__}locale-${locale}.json`)
                    .then(reply => {
                        return reply.json().then(result => {
                            dispatch({
                                locale,
                                localeData: result
                            });
                        });
                    })
                    .catch(err => {
                        console.log("fetch locale error:", err);
                        return dispatch => {
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
