import Immutable from "immutable";
import alt from "alt-instance";
import GatewayActions from "actions/GatewayActions";
import ls from "common/localStorage";

const STORAGE_KEY = "__graphene__";
let ss = new ls(STORAGE_KEY);

class GatewayStore {
    constructor() {
        this.backedCoins = Immutable.Map(ss.get("backedCoins", {}));
        this.bridgeCoins = Immutable.Map(
            Immutable.fromJS(ss.get("bridgeCoins", {}))
        );
        this.bridgeInputs = ["btc", "dash", "eth", "steem"];
        this.down = Immutable.Map({});

        this.bindListeners({
            onFetchCoins: GatewayActions.fetchCoins,
            onFetchCoinsSimple: GatewayActions.fetchCoinsSimple,
            onFetchBridgeCoins: GatewayActions.fetchBridgeCoins
        });
    }

    onFetchCoins({backer, coins, backedCoins, down} = {}) {
        if (backer && coins) {
            this.backedCoins = this.backedCoins.set(backer, backedCoins);
            
            ss.set("backedCoins", this.backedCoins.toJS());

            this.down = this.down.set(backer, false);
        }

        if (down) {
            this.down = this.down.set(down, true);
        }
    }

    onFetchCoinsSimple({backer, coins, down} = {}) {
        if (backer && coins) {
            this.backedCoins = this.backedCoins.set(backer, coins);

            ss.set("backedCoins", this.backedCoins.toJS());

            this.down = this.down.set(backer, false);
        }

        if (down) {
            this.down = this.down.set(down, true);
        }
    }

    onFetchBridgeCoins({coins, bridgeCoins, wallets, down} = {}) {
        if (coins && bridgeCoins && wallets) {
            let coins_by_type = {};
            coins.forEach(
                coin_type => (coins_by_type[coin_type.coinType] = coin_type)
            );
            bridgeCoins = bridgeCoins
                .filter(a => {
                    return (
                        a &&
                        coins_by_type[a.outputCoinType] &&
                        (coins_by_type[a.outputCoinType].walletType ===
                            "bitshares2" && // Only use bitshares2 wallet types
                            this.bridgeInputs.indexOf(a.inputCoinType) !== -1) // Only use coin types defined in bridgeInputs
                    );
                })
                .forEach(coin => {
                    coin.isAvailable =
                        wallets.indexOf(
                            coins_by_type[coin.outputCoinType].walletType
                        ) !== -1;
                    this.bridgeCoins = this.bridgeCoins.setIn(
                        [
                            coins_by_type[coin.outputCoinType].walletSymbol,
                            coin.inputCoinType
                        ],
                        Immutable.fromJS(coin)
                    );
                });
            ss.set("bridgeCoins", this.bridgeCoins.toJS());
        }
        if (down) {
            this.down = this.down.set(down, true);
        }
    }
}

export default alt.createStore(GatewayStore, "GatewayStore");
