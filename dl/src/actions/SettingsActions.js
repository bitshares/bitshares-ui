var alt = require("../alt-instance");

class SettingsActions {

    changeSetting(value) {
        this.dispatch(value);        
    }

    addMarket(quote, base) {
        this.dispatch({quote, base});
    }

    removeMarket(quote, base) {
        this.dispatch({quote, base});
    }
}

module.exports = alt.createActions(SettingsActions);
