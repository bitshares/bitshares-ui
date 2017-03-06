import Immutable from "immutable";
import alt from "alt-instance";
import GatewayActions from "actions/GatewayActions";

class GatewayStore {
    constructor() {
        this.coins = Immutable.Map();
        this.backedCoins = Immutable.Map();

        this.bindListeners({
            onFetchCoins: GatewayActions.fetchCoins
        });
    }

    onFetchCoins({backer, coins, backedCoins}) {
        this.coins = this.coins.set(backer, coins);
        this.backedCoins = this.backedCoins.set(backer, backedCoins);
    }
}

export default alt.createStore(GatewayStore, "GatewayStore");
