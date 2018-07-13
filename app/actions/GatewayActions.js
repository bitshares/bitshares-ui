import alt from "alt-instance";
import {
    fetchCoins,
    fetchTradingPairs,
    fetchCoinsSimple,
    getBackedCoins,
    getActiveWallets
} from "common/gatewayMethods";
import {blockTradesAPIs} from "api/apiConfig";

let inProgress = {};

const GATEWAY_TIMEOUT = 10000;

const onGatewayTimeout = (dispatch, gateway) => {
    dispatch({down: gateway});
};

class GatewayActions {
    fetchCoins({
        backer = "OPEN",
        url = undefined,
        urlBridge = undefined,
        urlWallets = undefined
    } = {}) {
        if (!inProgress["fetchCoins_" + backer]) {
            inProgress["fetchCoins_" + backer] = true;
            return dispatch => {
                let fetchCoinsTimeout = setTimeout(
                    onGatewayTimeout.bind(null, dispatch, backer),
                    GATEWAY_TIMEOUT
                );
                Promise.all([
                    fetchCoins(url),
                    fetchTradingPairs(urlBridge),
                    getActiveWallets(urlWallets)
                ])
                    .then(result => {
                        clearTimeout(fetchCoinsTimeout);
                        delete inProgress["fetchCoins_" + backer];
                        let [coins, tradingPairs, wallets] = result;
                        let backedCoins = getBackedCoins({
                            allCoins: coins,
                            tradingPairs: tradingPairs,
                            backer: backer
                        }).filter(a => !!a.walletType);
                        backedCoins.forEach(a => {
                            a.isAvailable =
                                wallets.indexOf(a.walletType) !== -1;
                        });
                        dispatch({
                            coins,
                            backedCoins,
                            backer
                        });
                    })
                    .catch(() => {
                        clearTimeout(fetchCoinsTimeout);
                        delete inProgress["fetchCoins_" + backer];
                        dispatch({
                            coins: [],
                            backedCoins: [],
                            backer
                        });
                    });
            };
        } else {
            return {};
        }
    }

    fetchCoinsSimple({backer = "RUDEX", url = undefined} = {}) {
        if (!inProgress["fetchCoinsSimple_" + backer]) {
            inProgress["fetchCoinsSimple_" + backer] = true;
            return dispatch => {
                let fetchCoinsTimeout = setTimeout(
                    onGatewayTimeout.bind(null, dispatch, backer),
                    GATEWAY_TIMEOUT
                );
                fetchCoinsSimple(url)
                    .then(coins => {
                        clearTimeout(fetchCoinsTimeout);
                        delete inProgress["fetchCoinsSimple_" + backer];
                        dispatch({
                            coins: coins,
                            backer
                        });
                    })
                    .catch(() => {
                        clearTimeout(fetchCoinsTimeout);
                        delete inProgress["fetchCoinsSimple_" + backer];

                        dispatch({
                            coins: [],
                            backer
                        });
                    });
            };
        } else {
            return {};
        }
    }

    fetchPairs() {
        if (!inProgress["fetchTradingPairs"]) {
            inProgress["fetchTradingPairs"] = true;
            return dispatch => {
                let fetchCoinsTimeout = setTimeout(
                    onGatewayTimeout.bind(null, dispatch, "TRADE"),
                    GATEWAY_TIMEOUT
                );
                Promise.all([
                    fetchCoins(
                        blockTradesAPIs.BASE + blockTradesAPIs.COINS_LIST
                    ),
                    fetchTradingPairs(
                        blockTradesAPIs.BASE + blockTradesAPIs.TRADING_PAIRS
                    ),
                    getActiveWallets(
                        blockTradesAPIs.BASE + blockTradesAPIs.ACTIVE_WALLETS
                    )
                ])
                    .then(result => {
                        clearTimeout(fetchCoinsTimeout);
                        delete inProgress["fetchTradingPairs"];
                        let [coins, bridgeCoins, wallets] = result;
                        dispatch({
                            coins,
                            bridgeCoins,
                            wallets
                        });
                    })
                    .catch(() => {
                        delete inProgress["fetchTradingPairs"];
                        dispatch({
                            coins: [],
                            bridgeCoins: [],
                            wallets: []
                        });
                    });
            };
        } else {
            return {};
        }
    }
}

export default alt.createActions(GatewayActions);
