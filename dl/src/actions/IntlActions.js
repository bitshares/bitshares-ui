var alt = require("../alt-instance");

class IntlActions {

    switchLocale(locale) {
        this.dispatch(locale);
    }

    getLocale(locale) {
        this.dispatch(locale);   
    }

}

module.exports = alt.createActions(IntlActions);
