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
        this.bridgeCoins = Immutable.Map(Immutable.fromJS(ss.get("bridgeCoins", {})));
        this.bridgeInputs = ["btc", "dash", "eth", "steem"];

        this.bindListeners({
            onFetchCoins: GatewayActions.fetchCoins,
            onFetchBridgeCoins: GatewayActions.fetchBridgeCoins
        });
    }

    onFetchCoins({backer, coins, backedCoins}) {
        this.coins = this.coins.set(backer, coins);
        this.backedCoins = this.backedCoins.set(backer, backedCoins);

        ss.set("backedCoins", this.backedCoins.toJS());
    }

    onFetchBridgeCoins({coins, bridgeCoins, wallets}) {
        let coins_by_type = {};
        coins.forEach(coin_type => coins_by_type[coin_type.coinType] = coin_type);
        bridgeCoins = bridgeCoins.filter(a => {
            return a && (
                wallets.indexOf(coins_by_type[a.outputCoinType].walletType) !== -1 && // Remove inactive wallets
                coins_by_type[a.outputCoinType].walletType === "bitshares2" && // Only use bitshares2 wallet types
                this.bridgeInputs.indexOf(a.inputCoinType) !== -1 // Only use coin types defined in bridgeInputs
            );
        }).forEach(coin => {
            this.bridgeCoins = this.bridgeCoins.setIn([coins_by_type[coin.outputCoinType].walletSymbol, coin.inputCoinType], coin);
        });
        ss.set("bridgeCoins", this.bridgeCoins.toJS());
    }
}

export default alt.createStore(GatewayStore, "GatewayStore");
