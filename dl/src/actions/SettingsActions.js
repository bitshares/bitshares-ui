var alt = require("../alt-instance");

class SettingsActions {

    changeSetting(value) {
        this.dispatch(value);        
    }

    changeViewSetting(value) {
        this.dispatch(value);
    }

    changeMarketDirection(value) {
        this.dispatch(value);
    }

    addStarMarket(quote, base) {
        this.dispatch({quote, base});
    }

    removeStarMarket(quote, base) {
        this.dispatch({quote, base});
    }

    addStarAccount(account) {
        this.dispatch(account);
    }

    removeStarAccount(account) {
        this.dispatch(account);
    }

    addWS(ws) {
        this.dispatch(ws);
    }

    removeWS(index) {
        this.dispatch(index);
    }
}

module.exports = alt.createActions(SettingsActions);
