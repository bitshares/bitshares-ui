var Immutable = require("immutable");
var alt = require("../alt-instance");
var MarketsActions = require("../actions/MarketsActions");
var utils = require("../common/utils");

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
        this.activeMarket = null;
        this.bindListeners({
            onSubscribeMarket: MarketsActions.subscribeMarket,
            onGetMarkets: MarketsActions.getMarkets
        });
    }


    onSubscribeMarket(result) {
        console.log("onSubscribeMarket:", result);

        if (result.market !== this.activeMarket) {
            console.log("switch active market:", this.activeMarket, "to", result.market);
            console.log(this.activeMarketLimits.toJS(), this.activeMarketShorts.toJS());
            this.activeMarket = result.market;
            this.activeMarketLimits.clear();
            this.activeMarketShorts.clear();

            console.log(this.activeMarketLimits.toJS(), this.activeMarketShorts.toJS());
        }

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
                this.activeMarketShorts = this.activeMarketShorts.set(
                    short.id,
                    ShortOrder(short)
                );
            });
        }

        if (result.sub) {
            result.sub.forEach(newOrder => {
                let orderType = utils.order_type(newOrder[1][1]);

                switch (orderType) {

                    case "limit_order":
                        newOrder.expiration = new Date(newOrder.expiration);
                        this.activeMarketLimits = this.activeMarketLimits.set(
                            newOrder.id,
                            LimitOrder(newOrder[0][1])
                        );
                        break;                    

                    case "short_order":
                        newOrder.expiration = new Date(newOrder.expiration);
                        this.activeMarketShorts = this.activeMarketShorts.set(
                            newOrder.id,
                            ShortOrder(newOrder[0][1])
                        );
                        break;

                    default:
                        break;
                }

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
