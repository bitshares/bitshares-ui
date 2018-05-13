import alt from "alt-instance";

import localeCodes from "assets/locales";

var locales = {};
if (__ELECTRON__) {
    localeCodes.forEach(locale => {
        locales[
            locale
        ] = require(`json-loader!assets/locales/locale-${locale}.json`);
    });
} else if (__TEST__) {
    localeCodes.forEach(locale => {
        locales[locale] = require(`../assets/locales/locale-${locale}.json`);
    });
}

class IntlActions {
    switchLocale(locale) {
        if (locale === "en") {
            return {locale};
        }
        if (__ELECTRON__ || __TEST__) {
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
}

export default alt.createActions(IntlActions);
