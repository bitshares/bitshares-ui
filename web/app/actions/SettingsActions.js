import alt from "alt-instance";

class SettingsActions {

    changeSetting(value) {
        return value;
    }

    changeViewSetting(value) {
        return value;
    }

    changeMarketDirection(value) {
        return value;
    }

    addStarMarket(quote, base) {
        return {quote, base};
    }

    removeStarMarket(quote, base) {
        return {quote, base};
    }

    addStarAccount(account) {
        return account;
    }

    removeStarAccount(account) {
        return account;
    }

    addWS(ws) {
        return ws;
    }

    removeWS(index) {
        return index;
    }

    hideAsset(id, status) {

        return {id, status};
    }

    clearSettings() {
        return true;
    }
    // changeBase(index, value) {
    //     this.dispatch({index, value});
    // }
}

export default alt.createActions(SettingsActions);
