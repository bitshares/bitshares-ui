import alt from "alt-instance";

import {cryptoBridgeAPIs} from "../api/apiConfig";

const API_MARKET_URL = cryptoBridgeAPIs.BASE + cryptoBridgeAPIs.MARKETS;
const API_NEWS_URL = "https://crypto-bridge.org/news.json";

let news = null;
let newsTTL = 60 * 60 * 1000; // 60 minutes

const defaultMarkets = [
    {
        id: "BRIDGE.BCO_BRIDGE.BTC",
        quote: "BRIDGE.BCO",
        base: "BRIDGE.BTC"
    }
];

let markets = {
    data: null
};
let marketsTTL = 60 * 60 * 1000; // 60 minutes

class CryptoBridgeActions {
    getMarkets() {
        return dispatch => {
            const now = new Date();

            if (markets.lastFetched) {
                if (now - markets.lastFetched < marketsTTL) {
                    return; // we just fetched the results, no need to update...
                }
            } else {
                dispatch(defaultMarkets);
            }

            markets.lastFetched = new Date();

            fetch(API_MARKET_URL)
                .then(reply =>
                    reply.json().then(result => {
                        markets = {
                            lastFetched: new Date(),
                            data: result.filter(m => m.blacklisted !== true)
                        };

                        dispatch(markets.data);
                    })
                )
                .catch(err => {
                    markets.lastFetched = null;
                });
        };
    }

    getAssets() {
        return this.getMarkets();
    }

    getNews() {
        return dispatch => {
            const now = new Date();

            if (news && now - news.lastFetched < newsTTL) {
                return;
            }

            news = {
                lastFetched: new Date(),
                data: null
            };

            fetch(API_NEWS_URL)
                .then(reply =>
                    reply.json().then(news => {
                        news = {
                            lastFetched: new Date(),
                            data: news.content
                        };

                        dispatch(news.data);
                    })
                )
                .catch(err => {
                    news = null;
                });
        };
    }
}

export default alt.createActions(CryptoBridgeActions);
