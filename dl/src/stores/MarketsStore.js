var Immutable = require("immutable");
var alt = require("../alt-instance");
var MarketsActions = require("../actions/MarketsActions");
var SettingsActions = require("../actions/SettingsActions");
var market_utils = require("../common/market_utils");
import ChainStore from "api/ChainStore";
import utils from "common/utils";

import {
    LimitOrder,
    ShortOrder,
    CallOrder,
    SettleOrder
}
from "./tcomb_structs";

class MarketsStore {
    constructor() {
        this.markets = Immutable.Map();
        this.asset_symbol_to_id = {};
        this.pendingOrders = Immutable.Map();
        this.activeMarketLimits = Immutable.Map();
        this.activeMarketCalls = Immutable.Map();
        this.activeMarketSettles = Immutable.Map();
        this.activeMarketHistory = Immutable.Map();
        this.bids = [];
        this.asks = [];
        this.calls = [];
        this.flat_bids = [];
        this.totalBids = 0;
        this.totalCalls = 0;
        this.flat_asks = [];
        this.priceData = [];
        this.volumeData = [];
        this.pendingCreateLimitOrders = [];
        this.activeMarket = null;
        this.inverseMarket = true;
        this.quoteAsset = null;
        this.pendingCounter = 0;
        this.buckets = [15,60,300,3600,86400];
        this.bucketSize = 300;
        this.priceHistory = [];
        this.lowestCallPrice = null;
        this.marketBase = "BTS";

        this.baseAsset = {
            id: "1.3.0",
            symbol: "BTS",
            precision: 5
        };

        this.coreAsset = {
            id: "1.3.0",
            symbol: "CORE",
            precision: 5
        };

        this.bindListeners({
            onSubscribeMarket: MarketsActions.subscribeMarket,
            onUnSubscribeMarket: MarketsActions.unSubscribeMarket,
            onGetMarkets: MarketsActions.getMarkets,
            onChangeBase: MarketsActions.changeBase,
            onInverseMarket: SettingsActions.changeSetting,
            onChangeBucketSize: MarketsActions.changeBucketSize,
            onCancelLimitOrderSuccess: MarketsActions.cancelLimitOrderSuccess,
            onCloseCallOrderSuccess: MarketsActions.closeCallOrderSuccess,
            onCallOrderUpdate: MarketsActions.callOrderUpdate
        });
    }

    onGetCollateralPositions(payload) {
        this.borrowMarketState = {
            totalDebt: payload.totalDebt,
            totalCollateral: payload.totalCollateral
        };
    }

    onInverseMarket(payload) {
        if (payload.setting === "inverseMarket") {
            this.inverseMarket = payload.value;

            // TODO: Handle market inversion
        } else {
            return false;
        }
    }

    onChangeBase(market) {
        this.marketBase = market;
    }

    onChangeBucketSize(size) {
        this.bucketSize = size;
    }

    onUnSubscribeMarket(payload) {

        // Optimistic removal of activeMarket
        if (payload.unSub) {
            this.activeMarket = null;
        } else { // Unsub failed, restore activeMarket
            this.activeMarket = payload.market;
        }
    }

    onSubscribeMarket(result) {
        // console.log("onSubscribeMarket:", result, this.activeMarket);
        this.invertedCalls = result.inverted;

        // Get updated assets every time for updated feed data
        this.quoteAsset = ChainStore.getAsset(result.quote.get("id"));
        this.baseAsset = ChainStore.getAsset(result.base.get("id"));

        if (result.market && (result.market !== this.activeMarket)) {
            // console.log("switch active market from", this.activeMarket, "to", result.market);
            this.activeMarket = result.market;
            this.activeMarketLimits = this.activeMarketLimits.clear();
            this.activeMarketCalls = this.activeMarketCalls.clear();
            this.activeMarketSettles = this.activeMarketSettles.clear();
            this.activeMarketHistory = this.activeMarketHistory.clear();
            this.bids = [];
            this.asks = [];
            this.calls = [];
            this.pendingCreateLimitOrders = [];
            this.flat_bids = [];
            this.flat_asks = [];
            this.flat_calls = [];
            this.priceHistory =[];
        }

        if (result.buckets) {
            this.buckets = result.buckets;
        }

        if (result.limits) {
            // Keep an eye on this as the number of orders increases, it might not scale well
            let limitStart = new Date();
            this.activeMarketLimits = this.activeMarketLimits.clear();
            result.limits.forEach(order => {
                ChainStore._updateObject(order, false, false);
                if (typeof order.for_sale !== "number") {
                    order.for_sale = parseInt(order.for_sale, 10);
                }
                order.expiration = new Date(order.expiration);
                this.activeMarketLimits = this.activeMarketLimits.set(
                    order.id,
                    LimitOrder(order)
                );
            });

            // Loop over pending orders to remove temp order from orders map and remove from pending
            for (let i = this.pendingCreateLimitOrders.length - 1; i >= 0; i--) {
                let myOrder = this.pendingCreateLimitOrders[i];
                let order = this.activeMarketLimits.find((order, key) => {
                    return myOrder.seller === order.seller && myOrder.expiration === order.expiration;
                });

                // If the order was found it has been confirmed, delete it from pending
                if (order) {
                    this.pendingCreateLimitOrders.splice(i, 1);
                }
            }

            if (this.pendingCreateLimitOrders.length === 0) {
                this.pendingCounter = 0;
            }

            console.log("time to process limit orders:", new Date() - limitStart, "ms");
        }

        if (result.calls) {
            this.activeMarketCalls = this.activeMarketCalls.clear();

            result.calls.forEach(call => {
                ChainStore._updateObject(call, false, false);
                if (typeof call.collateral !== "number") {
                    call.collateral = parseInt(call.collateral, 10);
                }
                if (typeof call.debt !== "number") {
                    call.debt = parseInt(call.debt, 10);
                }
                this.activeMarketCalls = this.activeMarketCalls.set(
                    call.id,
                    CallOrder(call)
                );
            });

        }

        if (result.settles) {
            result.settles.forEach(settle => {
                settle.settlement_date = new Date(settle.settlement_date);
                this.activeMarketSettles = this.activeMarketSettles.set(
                    settle.id,
                    SettleOrder(settle)
                );
            });
        }

        if (result.fillOrders) {
            result.fillOrders.forEach(fill => {
                // console.log("fill:", fill);
                this.activeMarketHistory = this.activeMarketHistory.set(
                    fill[0][1].order_id,
                    fill[0][1]
                );
            });
        }

        // Update orderbook
        this._orderBook();

        // Update depth chart data
        this._depthChart();

        // Update pricechart data
        if (result.price) {
            this.priceHistory = result.price;
            this._priceChart();
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

    // onCreateLimitOrder(e) {
    //     this.pendingCounter++;
    //     if (e.newOrder) { // Optimistic update
    //         e.newOrder.id = `${e.newOrder.seller}_${this.pendingCounter}`;
    //         this.pendingCreateLimitOrders.push({id: e.newOrder.id, seller: e.newOrder.seller, expiration: e.newOrder.expiration});
    //         e.newOrder.for_sale = parseInt(e.newOrder.for_sale, 10);
    //         e.newOrder.expiration = new Date(e.newOrder.expiration);
    //         this.activeMarketLimits = this.activeMarketLimits.set(
    //             e.newOrder.id,
    //             LimitOrder(e.newOrder)
    //         );
    //     }

    //     if (e.failedOrder) { // Undo order if failed
    //         let uid;
    //         for (var i = this.pendingCreateLimitOrders.length - 1; i >= 0; i--) {
    //             if (this.pendingCreateLimitOrders[i].expiration === e.failedOrder.expiration) {
    //                 console.log("found failed order to remove", this.pendingCreateLimitOrders[i]);
    //                 uid = this.pendingCreateLimitOrders[i].id;
    //                 this.pendingCreateLimitOrders.splice(i, 1);
    //                 this.activeMarketLimits = this.activeMarketLimits.delete(uid);
    //                 break;
    //             }
    //         }

    //         if (this.pendingCreateLimitOrders.length === 0) {
    //             this.pendingCounter = 0;
    //         }
    //     }

    //     // Update orderbook
    //     this._orderBook();

    //     // Update depth chart data
    //     this._depthChart();

    // }

    onCancelLimitOrderSuccess(orderID) {
        if (orderID && this.activeMarketLimits.has(orderID)) {
            this.activeMarketLimits = this.activeMarketLimits.delete(orderID);
            if (this.activeMarketLimits.size === 0) {
                this.bids = [];
                this.flat_bids = [];
                this.asks = [];
                this.flat_asks = [];
            }
            // Update orderbook
            this._orderBook();

            // Update depth chart data
            this._depthChart();
        }
    }

    onCloseCallOrderSuccess(orderID) {
        if (orderID && this.activeMarketCalls.has(orderID)) {
            this.activeMarketCalls = this.activeMarketCalls.delete(orderID);
            if (this.activeMarketCalls.size === 0) {
                this.calls = [];
                this.flat_calls = [];
            }
            // Update orderbook
            this._orderBook();

            // Update depth chart data
            this._depthChart();
        }
    }

    onCallOrderUpdate(call_order) {
        if (call_order && this.quoteAsset && this.baseAsset) {
            if (call_order.call_price.quote.asset_id === this.quoteAsset.get("id") || call_order.call_price.quote.asset_id === this.baseAsset.get("id")) {
                if (typeof call_order.collateral !== "number") {
                    call_order.collateral = parseInt(call_order.collateral, 10);
                }
                this.activeMarketCalls = this.activeMarketCalls.set(
                    call_order.id,
                    CallOrder(call_order)
                );
                // Update orderbook
                this._orderBook();

                // Update depth chart data
                this._depthChart();
            }

        }
    }

    onGetMarkets(markets) {
        markets.forEach(market => {
            this.markets = this.markets.set(
                market.id,
                market);
        });
    }

    _priceChart() {
        let volumeData = [];
        let price = [];

        // Fake data
        // priceData = [
        //     {time: new Date(2015, 5, 26, 14, 30).getTime(), open: 1, close: 1.5, high: 1.7, low: 1, volume: 10000},
        //     {time: new Date(2015, 5, 26, 15, 0).getTime(), open: 1.5, close: 1.6, high: 1.6, low: 1.4, volume: 15000},
        //     {time: new Date(2015, 5, 26, 15, 30).getTime(), open: 1.6, close: 1.4, high: 1.7, low: 1.4, volume: 8000},
        //     {time: new Date(2015, 5, 26, 16, 0).getTime(), open: 1.4, close: 1.4, high: 1.4, low: 1.1, volume: 20000},
        //     {time: new Date(2015, 5, 26, 16, 30).getTime(), open: 1.4, close: 1.5, high: 1.7, low: 1.3, volume: 17000},
        //     {time: new Date(2015, 5, 26, 17, 0).getTime(), open: 1.5, close: 1.35, high: 1.5, low: 1.3, volume: 25000},
        //     {time: new Date(2015, 5, 26, 17, 30).getTime(), open: 1.35, close: 1.5, high: 1.55, low: 1.33, volume: 32000},
        //     {time: new Date(2015, 5, 26, 18, 0).getTime(), open: 1.5, close: 1.8, high: 1.84, low: 1.5, volume: 37000},
        //     {time: new Date(2015, 5, 26, 18, 30).getTime(), open: 1.8, close: 1.99, high: 1.99, low: 1.76, volume: 54000}
        // ]

        // for (var i = 0; i < priceData.length; i++) {
        //     price.push([priceData[i].time, priceData[i].open, priceData[i].high, priceData[i].low, priceData[i].close]);
        //     volume.push([priceData[i].time, priceData[i].volume]);
        // };

        // Real data
        // console.log("priceData:", this.priceHistory);
        let open, high, low, close, volume;

        for (var i = 0; i < this.priceHistory.length; i++) {
            let date = new Date(this.priceHistory[i].key.open).getTime();
            if (this.quoteAsset.get("id") === this.priceHistory[i].key.quote) {
                high = utils.get_asset_price(this.priceHistory[i].high_base, this.baseAsset, this.priceHistory[i].high_quote, this.quoteAsset);
                low = utils.get_asset_price(this.priceHistory[i].low_base, this.baseAsset, this.priceHistory[i].low_quote, this.quoteAsset);
                open = utils.get_asset_price(this.priceHistory[i].open_base, this.baseAsset, this.priceHistory[i].open_quote, this.quoteAsset);
                close = utils.get_asset_price(this.priceHistory[i].close_base, this.baseAsset, this.priceHistory[i].close_quote, this.quoteAsset);
                volume = utils.get_asset_amount(this.priceHistory[i].quote_volume, this.quoteAsset);
            } else {
                low = utils.get_asset_price(this.priceHistory[i].high_quote, this.baseAsset, this.priceHistory[i].high_base, this.quoteAsset);
                high = utils.get_asset_price(this.priceHistory[i].low_quote, this.baseAsset, this.priceHistory[i].low_base, this.quoteAsset);
                open = utils.get_asset_price(this.priceHistory[i].open_quote, this.baseAsset, this.priceHistory[i].open_base, this.quoteAsset);
                close = utils.get_asset_price(this.priceHistory[i].close_quote, this.baseAsset, this.priceHistory[i].close_base, this.quoteAsset);
                volume = utils.get_asset_amount(this.priceHistory[i].base_volume, this.quoteAsset);
            }

            price.push([date, open, high, low, close]);
            volumeData.push([date, volume]);
        }

        this.priceData = price;
        this.volumeData = volumeData;

    }

    _orderBook() {

        var orderBookStart = new Date();

        // Loop over limit orders and return array containing bids with formatted values
        let constructBids = (orderArray) => {
            let bids = [];
            orderArray.filter(a => {
                return a.sell_price.base.asset_id === this.baseAsset.get("id");
            }).sort((a, b) => {
                let {price: a_price} = market_utils.parseOrder(a, this.baseAsset, this.quoteAsset);
                let {price: b_price} = market_utils.parseOrder(b, this.baseAsset, this.quoteAsset);

                return a_price.full - b_price.full;
            }).map(order => {
                // let isAskOrder = market_utils.isAsk(order, this.baseAsset);
                let {value, price, amount} = market_utils.parseOrder(order, this.baseAsset, this.quoteAsset);
                bids.push({
                    value: value,
                    price_full: price.full,
                    price_dec: price.dec,
                    price_int: price.int,
                    amount: amount,
                    type: "bid"
                });
            });

            // Sum bids at same price
            if (bids.length > 1) {
                for (let i = bids.length - 2; i >= 0; i--) {
                    if (bids[i].price_full === bids[i + 1].price_full) {
                        bids[i].amount += bids[i + 1].amount;
                        bids[i].value += bids[i + 1].value;
                        bids.splice(i + 1, 1);
                    }
                }
            }

            return bids;
        }

        // Get feed price if market asset
        let settlementPrice, squeezeRatio, maintenanceRatio;
        if (this.activeMarketCalls.size) {

            if (this.invertedCalls) {
                squeezeRatio = this.baseAsset.getIn(["bitasset", "current_feed", "maximum_short_squeeze_ratio"]) / 1000;
                maintenanceRatio = this.baseAsset.getIn(["bitasset", "current_feed", "maintenance_collateral_ratio"]) / 1000;
                settlementPrice = market_utils.getFeedPrice(
                    this.baseAsset.getIn(["bitasset", "current_feed", "settlement_price"]),
                    this.quoteAsset,
                    this.baseAsset,
                    true
                )
                 this.lowestCallPrice = settlementPrice / 5;
            } else {
                squeezeRatio = this.quoteAsset.getIn(["bitasset", "current_feed", "maximum_short_squeeze_ratio"]) / 1000;
                maintenanceRatio = this.quoteAsset.getIn(["bitasset", "current_feed", "maintenance_collateral_ratio"]) / 1000;
                settlementPrice = market_utils.getFeedPrice(
                    this.quoteAsset.getIn(["bitasset", "current_feed", "settlement_price"]),
                    this.baseAsset,
                    this.quoteAsset
                )
                this.lowestCallPrice = settlementPrice * 5;
            }
        }

        let constructCalls = (callsArray) => {
            let calls = [];
            
            callsArray.filter(a => {
                let a_price;
                if (this.invertedCalls) {
                    a_price = market_utils.parseOrder(a, this.quoteAsset, this.baseAsset, true).price;
                    this.lowestCallPrice = Math.max(this.lowestCallPrice, a_price.full);                    
                    return a_price.full >= settlementPrice / squeezeRatio; // TODO verify this
                } else {
                    a_price = market_utils.parseOrder(a, this.baseAsset, this.quoteAsset, false).price;
                    this.lowestCallPrice = Math.min(this.lowestCallPrice, a_price.full);
                    return a_price.full <= settlementPrice * squeezeRatio; // TODO verify this
                }
            }).sort((a, b) => {
                let a_price, b_price;
                if (this.invertedCalls) {
                    a_price = market_utils.parseOrder(a, this.quoteAsset, this.baseAsset, true).price;
                    b_price = market_utils.parseOrder(b, this.quoteAsset, this.baseAsset, true).price;
                } else {
                    a_price = market_utils.parseOrder(a, this.baseAsset, this.quoteAsset, false).price;
                    b_price = market_utils.parseOrder(b, this.baseAsset, this.quoteAsset, false).price;
                }
                return a_price.full - b_price.full;
            }).map(order => {
                let priceData;
                let feed_price_order;
                if (this.invertedCalls) {
                    let newQuote = this.baseAsset.getIn(["bitasset", "current_feed", "settlement_price", "base"]).toJS();
                    newQuote.amount /= squeezeRatio;

                    feed_price_order = {
                        call_price: {
                            base: this.baseAsset.getIn(["bitasset", "current_feed", "settlement_price", "quote"]).toJS(),
                            quote: newQuote
                        },
                        debt: order.debt,
                        collateral: order.collateral
                    }
                    // priceData = market_utils.parseOrder(order, this.quoteAsset, this.baseAsset, true, squeezeRatio);
                    priceData = market_utils.parseOrder(feed_price_order, this.quoteAsset, this.baseAsset, true);
                } else {
                    let newQuote = this.quoteAsset.getIn(["bitasset", "current_feed", "settlement_price", "quote"]).toJS();
                    newQuote.amount *= squeezeRatio;
                    feed_price_order = {
                        sell_price: {
                            base: this.quoteAsset.getIn(["bitasset", "current_feed", "settlement_price", "base"]).toJS(),
                            quote: newQuote
                        },
                        debt: order.debt,
                        collateral: order.collateral
                    }
                    // priceData = market_utils.parseOrder(order, this.baseAsset, this.quoteAsset, false, squeezeRatio);
                    priceData = market_utils.parseOrder(feed_price_order, this.baseAsset, this.quoteAsset, false);
                }

                let {value, price, amount} = priceData;
                calls.push({
                    value: value,
                    price_full: price.full,
                    price_dec: price.dec,
                    price_int: price.int,
                    amount: amount,
                    type: "call"
                });
            });

            // Sum calls at same price
            if (calls.length > 1) {
                for (let i = calls.length - 2; i >= 0; i--) {
                    if (calls[i].price_full === calls[i + 1].price_full) {
                        calls[i].amount += calls[i + 1].amount;
                        calls[i].value += calls[i + 1].value;
                        calls.splice(i + 1, 1);
                    }
                }
            }

            return calls;
        }

        let constructAsks = (orderArray) => {
            let asks = [];

            orderArray.filter(a => {
                return a.sell_price.base.asset_id !== this.baseAsset.get("id");
            }).sort((a, b) => {
                let {price: a_price} = market_utils.parseOrder(a, this.baseAsset, this.quoteAsset);
                let {price: b_price} = market_utils.parseOrder(b, this.baseAsset, this.quoteAsset);

                return a_price.full - b_price.full;
            }).map(order => {
                // let isAskOrder = market_utils.isAsk(order, this.baseAsset);
                let {value, price, amount} = market_utils.parseOrder(order, this.baseAsset, this.quoteAsset);
                asks.push({
                    value: value,
                    price_full: price.full,
                    price_dec: price.dec,
                    price_int: price.int,
                    amount: amount,
                    type: "ask"
                });
            });

            // Sum asks at same price
            if (asks.length > 1) {
                for (let i = asks.length - 2; i >= 0; i--) {
                    if (asks[i].price_full === asks[i + 1].price_full) {
                        asks[i].amount += asks[i + 1].amount;
                        asks[i].value += asks[i + 1].value;
                        asks.splice(i + 1, 1);
                    }
                }
            }

            return asks;
        }

        // Assign to store variables
        this.bids = constructBids(this.activeMarketLimits);
        this.asks = constructAsks(this.activeMarketLimits);
        this.calls = constructCalls(this.activeMarketCalls);

        console.log("time to construct orderbook:", new Date() - orderBookStart, "ms");
    }

    _depthChart() {
        // let depthStart = new Date();

        let bids = [], asks = [], calls= [], totalBids = 0, totalCalls = 0;
        let flat_bids = [], flat_asks = [], flat_calls = [];

        if (this.activeMarketLimits.size) {

            this.bids.map(order => {
                bids.push([order.price_full, order.amount]);
                totalBids += order.value;
            });

            this.asks.map(order => {
                asks.push([order.price_full, order.amount]);
            });

            // Make sure the arrays are sorted properly
            asks.sort((a, b) => {
                return a[0] - b[0];
            });

            bids.sort((a, b) => {
                return a[0] - b[0];
            });

            // Flatten the arrays to get the step plot look
            flat_bids = market_utils.flatten_orderbookchart_highcharts(bids, true, true, 1000);

            if (flat_bids.length > 0) {
                flat_bids.unshift([0, flat_bids[0][1]]);
            }

            flat_asks = market_utils.flatten_orderbookchart_highcharts(asks, true, false, 1000);
            if (flat_asks.length > 0) {
                flat_asks.push([flat_asks[flat_asks.length - 1][0] * 1.5, flat_asks[flat_asks.length - 1][1]]);
            }
        }

        if (this.calls.length) {

            this.calls.map(order => {
                calls.push([order.price_full, order.amount]);
            });

            // Calculate total value of call orders
            calls.forEach(call => {
                if (this.invertedCalls) {
                    totalCalls += call[1];
                } else {
                    totalCalls += call[1] * call[0];
                }
            })

            // Make sure the array is sorted properly
            calls.sort((a, b) => {
                return a[0] - b[0];
            });

            // Flatten the array to get the step plot look
            if (this.invertedCalls) {
                flat_calls = market_utils.flatten_orderbookchart_highcharts(calls, true, false, 1000);
                if (flat_asks.length && (flat_calls[flat_calls.length - 1][0] < flat_asks[flat_asks.length - 1][0])) {
                    flat_calls.push([flat_asks[flat_asks.length - 1][0], flat_calls[flat_calls.length - 1][1]]);
                }
            } else {
                flat_calls = market_utils.flatten_orderbookchart_highcharts(calls, true, true, 1000);
                if (flat_calls.length > 0) {
                    flat_calls.unshift([0, flat_calls[0][1]]);
                }
            }
        }

        // Assign to store variables
        this.flat_asks = flat_asks;
        this.flat_bids = flat_bids;
        this.totalBids = totalBids;
        this.totalCalls = totalCalls;
        this.flat_calls = flat_calls;

    }
}

module.exports = alt.createStore(MarketsStore, "MarketsStore");
