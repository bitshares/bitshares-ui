var Immutable = require("immutable");
var alt = require("../alt-instance");
var MarketsActions = require("../actions/MarketsActions");
import {
    LimitOrder,
    ShortOrder
}
from "./tcomb_structs";

class MarketsStore {
    constructor() {
        this.markets = Immutable.Map();
        this.asset_symbol_to_id = {};
        this.activeMarketShorts = Immutable.Map();
        this.activeMarketLimits = Immutable.Map();

        this.bindListeners({
            onSubscribeMarket: MarketsActions.subscribeMarket,
            onGetMarkets: MarketsActions.getMarkets
        });
    }


    onSubscribeMarket(result) {
        console.log("onSubscribeMarket:", result);
        if (result.limits) {
            result.limits.forEach(order => {
                order.expiration = new Date(order.expiration);
                this.activeMarketLimits = this.activeMarketLimits.set(
                    order.id,
                    LimitOrder(order)
                );
            });
        }

        if (result.shorts) {
            result.shorts.forEach(short => {
                short.expiration = new Date(short.expiration);
                this.activeMarketLimits = this.activeMarketLimits.set(
                    short.id,
                    ShortOrder(short)
                );
            });
        }
    }

    onGetMarkets(markets) {
        markets.forEach(market => {
            this.markets = this.markets.set(
                market.id,
                market);
        });
    }
}

module.exports = alt.createStore(MarketsStore, "MarketsStore");
