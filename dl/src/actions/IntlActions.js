var alt = require("../alt-instance");

class IntlActions {

    switchLocale(locale) {
        if (locale === "en") {
            return this.dispatch({locale});
        }
    	fetch("/locale-" + locale + ".json").then( (reply) => {
            return reply.json().then(result => {
            	console.log("locale data:", result);
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

    getLocale(locale) {
        this.dispatch(locale);
    }

}

module.exports = alt.createActions(IntlActions);
