import alt from "alt-instance";
import { fetchCoins, fetchBridgeCoins, getBackedCoins, getActiveWallets } from "common/blockTradesMethods";

let inProgress = {};

class GatewayActions {

    fetchCoins({backer = "OPEN", url = undefined} = {}) {
        if (!inProgress["fetchCoins_" + backer]) {
            inProgress["fetchCoins_" + backer] = true;
            return (dispatch) => {
                Promise.all([
                    fetchCoins(url),
                    getActiveWallets(url)
                ]).then(result => {
                    delete inProgress["fetchCoins_" + backer];
                    let [coins, wallets] = result;
                    dispatch({
                        coins: coins,
                        backedCoins: getBackedCoins({allCoins: coins, backer: backer}).filter(a => {
                            return wallets.indexOf(a.walletType) !== -1;
                        }),
                        backer
                    });
                });
            };
        } else {
            dispatch({});
        }
    }

    fetchBridgeCoins(url = undefined) {
        if (!inProgress["fetchBridgeCoins"]) {
            inProgress["fetchBridgeCoins"] = true;
            return (dispatch) => {
                Promise.all([
                    fetchCoins(url),
                    fetchBridgeCoins(url),
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
            dispatch({});
        }
    }
}

export default alt.createActions(GatewayActions);
