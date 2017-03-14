import Immutable from "immutable";
import alt from "alt-instance";
import GatewayActions from "actions/GatewayActions";
import ls from "common/localStorage";

const STORAGE_KEY = "__graphene__";
let ss = new ls(STORAGE_KEY);

class GatewayStore {
    constructor() {
        this.coins = Immutable.Map();
        this.backedCoins = Immutable.Map(ss.get("backedCoins", {}));

        this.bindListeners({
            onFetchCoins: GatewayActions.fetchCoins
        });
    }

    onFetchCoins({backer, coins, backedCoins}) {
        this.coins = this.coins.set(backer, coins);
        this.backedCoins = this.backedCoins.set(backer, backedCoins);

        ss.set("backedCoins", this.backedCoins.toJS());
    }
}

export default alt.createStore(GatewayStore, "GatewayStore");
