import {Map, OrderedMap} from "immutable";
import alt from "alt-instance";
import CryptoBridgeActions from "actions/CryptoBridgeActions";

class CryptoBridgeStore {
    constructor() {
        this.markets = OrderedMap();
        this.assets = Map();
        this.news = null;

        this.bindListeners({
            onGetCryptoBridgeMarkets: CryptoBridgeActions.getMarkets,
            onGetCryptoBridgeNews: CryptoBridgeActions.getNews
        });
    }

    onGetCryptoBridgeMarkets(markets) {
        if (markets) {
            markets.map(m => {
                this.markets = this.markets.set(m.id, m);
            });
        }
    }

    onGetCryptoBridgeNews(news) {
        if (news) {
            this.news = news;
        }
    }
}

export default alt.createStore(CryptoBridgeStore, "CryptoBridgeStore");
