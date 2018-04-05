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

    clearStarredMarkets() {
        return true;
    }

    setUserMarket(quote, base, value) {
        return {quote, base, value};
    }

    addWS(ws) {
        return ws;
    }

    removeWS(index) {
        return index;
    }

    hideWS(url) {
        return url;
    }

    showWS(url) {
        return url;
    }

    hideAsset(id, status) {
        return {id, status};
    }

    hideMarket(id, status) {
        return {id, status};
    }

    clearSettings() {
        return dispatch => {
            return new Promise(resolve => {
                dispatch(resolve);
            });
        };
    }

    updateLatencies(latencies) {
        return latencies;
    }

    setExchangeLastExpiration(value) {
        return value;
    }
}

export default alt.createActions(SettingsActions);
