var Immutable = require("immutable");
var alt = require("../alt-instance");
var MarketsActions = require("../actions/MarketsActions");
var market_utils = require("../common/market_utils");

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
        this.limitCancel = {};
        this.activeMarket = null;

        this.bindListeners({
            onSubscribeMarket: MarketsActions.subscribeMarket,
            onGetMarkets: MarketsActions.getMarkets,
            onCancelLimitOrder: MarketsActions.cancelLimitOrder
        });

    }


    onSubscribeMarket(result) {
        console.log("onSubscribeMarket:", result);

        if (result.market && (result.market !== this.activeMarket)) {
            console.log("switch active market:", this.activeMarket, "to", result.market);
            this.activeMarket = result.market;
            this.activeMarketLimits.clear();
            this.activeMarketShorts.clear();

            console.log(this.activeMarketLimits.toJS(), this.activeMarketShorts.toJS());
        }

        if (result.limits) {
            result.limits.forEach(order => {
                // console.log("limit orders:", order);
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
                let {order, orderType} = market_utils.parse_order(newOrder);
                // console.log("parsed order:", order);
                switch (orderType) {

                    case "limit_order":

                        this.activeMarketLimits = this.activeMarketLimits.set(
                            order.id,
                            LimitOrder(order)
                        );
                        break;

                    case "short_order":
                        this.activeMarketShorts = this.activeMarketShorts.set(
                            order.id,
                            ShortOrder(order)
                        );
                        break;

                    default:
                        break;
                }

            });

        }
    }

    onCancelLimitOrder(cancel) {
        if (cancel.init) { // Optimistic update
            this.limitCancel[cancel.init] = this.activeMarketLimits.get(cancel.init);
            this.activeMarketLimits = this.activeMarketLimits.delete(cancel.init);
        }

        if (cancel.failed) { // Undo removal if cancel failed
            this.activeMarketLimits = this.activeMarketLimits.set(
                cancel.failed,
                this.limitCancel[cancel.failed]
            );

            delete this.limitCancel[cancel.failed];
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
