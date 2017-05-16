import alt from "alt-instance";
import { fetchCoins, fetchBridgeCoins, getBackedCoins, getActiveWallets } from "common/blockTradesMethods";
import {blockTradesAPIs} from "api/apiConfig";

let inProgress = {};

class GatewayActions {

    fetchCoins({backer = "OPEN", url = undefined} = {}) {
        if (!inProgress["fetchCoins_" + backer]) {
            inProgress["fetchCoins_" + backer] = true;
            return (dispatch) => {
                Promise.all([
                    fetchCoins(url),
                    fetchBridgeCoins(blockTradesAPIs.BASE_OL),
                    getActiveWallets(url)
                ]).then(result => {
                    delete inProgress["fetchCoins_" + backer];
                    let [coins, tradingPairs, wallets] = result;
                    dispatch({
                        coins: coins,
                        backedCoins: getBackedCoins({allCoins: coins, tradingPairs: tradingPairs, backer: backer}).filter(a => {
                            return wallets.indexOf(a.walletType) !== -1;
                        }),
                        backer
                    });
                });
            };
        } else {
            return {};
        }
    }

    fetchBridgeCoins(url = undefined) {
        if (!inProgress["fetchBridgeCoins"]) {
            inProgress["fetchBridgeCoins"] = true;
            return (dispatch) => {
                Promise.all([
                    fetchCoins(url),
                    fetchBridgeCoins(blockTradesAPIs.BASE),
                    getActiveWallets(url)
                ]).then(result => {
                    delete inProgress["fetchBridgeCoins"];
                    let [coins, bridgeCoins, wallets] = result;
                    dispatch({
                        coins,
                        bridgeCoins,
                        wallets
                    });
                });
            };
        } else {
            return {};
        }
    }
}

export default alt.createActions(GatewayActions);
