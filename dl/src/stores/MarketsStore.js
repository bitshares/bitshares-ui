var Immutable = require("immutable");
var alt = require("../alt-instance");
var MarketsActions = require("../actions/MarketsActions");
// var market_utils = require("../common/market_utils");

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
        this.baseMarket = "CORE";

        this.bindListeners({
            onSubscribeMarket: MarketsActions.subscribeMarket,
            onGetMarkets: MarketsActions.getMarkets,
            onCreateLimitOrder: MarketsActions.createLimitOrder,
            onCancelLimitOrder: MarketsActions.cancelLimitOrder,
            onChangeBase: MarketsActions.changeBase
        });

    }

    onChangeBase(market) {
        this.baseMarket = market;
    }

    onSubscribeMarket(result) {
        console.log("onSubscribeMarket:", result);

        if (result.market && (result.market !== this.activeMarket)) {
            console.log("switch active market:", this.activeMarket, "to", result.market);
            this.activeMarket = result.market;
            this.activeMarketLimits = this.activeMarketLimits.clear();
            this.activeMarketShorts = this.activeMarketShorts.clear();
        }

        if (result.limits) {
            result.limits.forEach(order => {
                order.for_sale = parseInt(order.for_sale, 10);
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

        // if (result.sub) {
        //     result.sub.forEach(newOrder => {
        //         let {order, orderType} = market_utils.parse_order(newOrder);
                
        //         switch (orderType) {
        //             case "limit_order":
        //                 this.activeMarketLimits = this.activeMarketLimits.set(
        //                     order.id,
        //                     LimitOrder(order)
        //                 );
        //                 break;

        //             case "short_order":
        //                 this.activeMarketShorts = this.activeMarketShorts.set(
        //                     order.id,
        //                     ShortOrder(order)
        //                 );
        //                 break;

        //             default:
        //                 break;
        //         }

        //     });

        // }
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
