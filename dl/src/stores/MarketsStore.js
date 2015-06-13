var Immutable = require("immutable");
var alt = require("../alt-instance");
var MarketsActions = require("../actions/MarketsActions");
var market_utils = require("../common/market_utils");

console.log("market_utils:", market_utils);
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
        this.pendingCreateLimitOrders = {};
        this.pendingCancelLimitOrders = {};
        this.activeMarket = null;

        this.bindListeners({
            onSubscribeMarket: MarketsActions.subscribeMarket,
            onGetMarkets: MarketsActions.getMarkets,
            onCreateLimitOrder: MarketsActions.createLimitOrder,
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
                console.log("limit orders:", order);
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
                let o = newOrder[0][1];
                let orderType = market_utils.order_type(newOrder[1][1]);
                let order = {};
                console.log("parse:", market_utils.parse_order(newOrder));
                switch (orderType) {

                    case "limit_order":
                        o.expiration = new Date(o.expiration);
                        order = {
                            expiration: o.expiration,
                            for_sale: o.amount_to_sell.amount,
                            id: newOrder[1][1]


                        };
                        this.activeMarketLimits = this.activeMarketLimits.set(
                            newOrder.id,
                            LimitOrder(newOrder[0][1])
                        );
                        break;

                    case "short_order":
                        o.expiration = new Date(o.expiration);
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

    onCreateLimitOrder(e) {
        if (e.newOrderID) { // Optimistic update
            this.pendingCreateLimitOrders[e.newOrderID] = e.order;
            this.activeMarketLimits = this.activeMarketLimits.set(
                e.newOrderID,
                e.order
            );

        }

        if (e.failedOrderID) { // Undo order if failed
            this.activeMarketLimits = this.activeMarketLimits.delete(e.failedOrderID);

            delete this.pendingCancelLimitOrders[e.failedOrderID];
        }
    }

    onCancelLimitOrder(e) {
        if (e.newOrderID) { // Optimistic update
            this.pendingCancelLimitOrders[e.newOrderID] = this.activeMarketLimits.get(e.newOrderID);
            this.activeMarketLimits = this.activeMarketLimits.delete(e.newOrderID);
        }

        if (e.failedOrderID) { // Undo removal if cancel failed
            this.activeMarketLimits = this.activeMarketLimits.set(
                e.failedOrderID,
                this.pendingCancelLimitOrders[e.failedOrderID]
            );

            delete this.pendingCancelLimitOrders[e.failedOrderID];
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
