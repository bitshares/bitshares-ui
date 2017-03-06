import alt from "alt-instance";
import { fetchCoins, getBackedCoins } from "common/blockTradesMethods";

class GatewayActions {

    fetchCoins({backer = "OPEN", url = undefined} = {}) {
        return (dispatch) => {
            fetchCoins(url).then(result => {
                dispatch({
                    coins: result,
                    backedCoins: getBackedCoins({allCoins: result, backer: backer}),
                    backer
                });
            });
        };
    }
}

export default alt.createActions(GatewayActions);
