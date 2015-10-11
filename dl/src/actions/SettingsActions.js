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

    addWS(ws) {
        this.dispatch(ws);
    }

    removeWS(index) {
        this.dispatch(index);
    }
}

module.exports = alt.createActions(SettingsActions);
