var Immutable = require("immutable");
var alt = require("../alt-instance");
var MarketsActions = require("../actions/MarketsActions");
var SettingsActions = require("../actions/SettingsActions");
var market_utils = require("../common/market_utils");
import ls from "common/localStorage";
import {ChainStore} from "graphenejs-lib";
import utils from "common/utils";

import {
    LimitOrder,
    ShortOrder,
    CallOrder,
    SettleOrder
}
from "./tcomb_structs";

let marketStorage = new ls("__graphene__");

class MarketsStore {
    constructor() {
        this.markets = Immutable.Map();
        this.asset_symbol_to_id = {};
        this.pendingOrders = Immutable.Map();
        this.activeMarketLimits = Immutable.Map();
        this.activeMarketCalls = Immutable.Map();
        this.activeMarketSettles = Immutable.OrderedSet();
        this.activeMarketHistory = Immutable.OrderedSet();
        this.bids = [];
        this.asks = [];
        this.calls = [];
        this.flat_bids = [];
        this.flat_asks = [];
        this.flat_calls = [];
        this.totalBids = 0;
        this.totalCalls = 0;
        this.priceData = [];
        this.volumeData = [];
        this.pendingCreateLimitOrders = [];
        this.activeMarket = null;
        this.quoteAsset = null;
        this.pendingCounter = 0;
        this.buckets = [15,60,300,3600,86400];
        this.bucketSize = this._getBucketSize();
        this.priceHistory = [];
        this.lowestCallPrice = null;
        this.marketBase = "CORE";
        this.marketStats = Immutable.Map({
            change: 0,
            volumeBase: 0,
            volumeQuote: 0
        });

        this.allMarketStats = Immutable.Map();

        this.baseAsset = {
            id: "1.3.0",
            symbol: "CORE",
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
            onChangeBase: MarketsActions.changeBase,
            onChangeBucketSize: MarketsActions.changeBucketSize,
            onCancelLimitOrderSuccess: MarketsActions.cancelLimitOrderSuccess,
            onCloseCallOrderSuccess: MarketsActions.closeCallOrderSuccess,
            onCallOrderUpdate: MarketsActions.callOrderUpdate,
            onClearMarket: MarketsActions.clearMarket,
            onGetMarketStats: MarketsActions.getMarketStats,
            onFeedUpdate: MarketsActions.feedUpdate,
            onSettleOrderUpdate: MarketsActions.settleOrderUpdate
        });
    }

    onGetCollateralPositions(payload) {
        this.borrowMarketState = {
            totalDebt: payload.totalDebt,
            totalCollateral: payload.totalCollateral
        };
    }

    _getBucketSize() {
        return parseInt(marketStorage.get("bucketSize", 4 * 3600));
    }

    _setBucketSize(size) {
        this.bucketSize = size;
        marketStorage.set("bucketSize", size);
    }

    onChangeBase(market) {
        this.marketBase = market;
    }

    onChangeBucketSize(size) {
        this._setBucketSize(size);
    }

    onUnSubscribeMarket(payload) {

        // Optimistic removal of activeMarket
        if (payload.unSub) {
            this.activeMarket = null;
        } else { // Unsub failed, restore activeMarket
            this.activeMarket = payload.market;
        }
    }

    onClearMarket() {
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
        this.marketStats = Immutable.Map({
            change: 0,
            volumeBase: 0,
            volumeQuote: 0
        });
    }

    onSubscribeMarket(result) {

        if (result.switchMarket) {
            this.marketReady = false;
            return true;
        }

        // console.log("onSubscribeMarket:", result, this.activeMarket);
        this.invertedCalls = result.inverted;

        // Get updated assets every time for updated feed data
        this.quoteAsset = ChainStore.getAsset(result.quote.get("id"));
        this.baseAsset = ChainStore.getAsset(result.base.get("id"));



        if (result.market && (result.market !== this.activeMarket)) {
            // console.log("switch active market from", this.activeMarket, "to", result.market);
            this.activeMarket = result.market;
            this.onClearMarket();
        }

        if (result.buckets) {
            this.buckets = result.buckets;
            if (result.buckets.indexOf(this.bucketSize) === -1) {
                this.bucketSize = result.buckets[result.buckets.length - 1];
            }
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

            // console.log("time to process limit orders:", new Date() - limitStart, "ms");
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

        this.updateSettleOrders(result);

        if (result.history) {
            this.activeMarketHistory = this.activeMarketHistory.clear();
            result.history.forEach(order => {
                order.op.time = order.time;
                this.activeMarketHistory = this.activeMarketHistory.add(
                    order.op
                );
            });
        }

        if (result.fillOrders) {
            result.fillOrders.forEach(fill => {
                // console.log("fill:", fill);
                this.activeMarketHistory = this.activeMarketHistory.add(
                    fill[0][1]
                );
            });
        }

        if (result.recent && result.recent.length) {

            let stats = this._calcMarketStats(result.recent, this.baseAsset, this.quoteAsset);

            this.marketStats = this.marketStats.set("change", stats.change);
            this.marketStats = this.marketStats.set("volumeBase", stats.volumeBase);
            this.marketStats = this.marketStats.set("volumeQuote", stats.volumeQuote);
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

        this.marketReady = true;
    }

    onCancelLimitOrderSuccess(cancellations) {

        if (cancellations && cancellations.length) {

            let didUpdate = false;
            cancellations.forEach(orderID => {
                if (orderID && this.activeMarketLimits.has(orderID)) {
                    didUpdate = true;
                    this.activeMarketLimits = this.activeMarketLimits.delete(orderID);
                }
            })

            if (this.activeMarketLimits.size === 0) {
                this.bids = [];
                this.flat_bids = [];
                this.asks = [];
                this.flat_asks = [];
            }

            if (didUpdate) {
                // Update orderbook
                this._orderBook();

                // Update depth chart data
                this._depthChart();
            }
        } else {
            return false;
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
        } else {
            return false;
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

        } else {
            return false;
        }
    }

    onFeedUpdate(asset) {
        if (!this.quoteAsset || !this.baseAsset) {
            return;
        }
        let needsUpdate = false;
        if (asset.get("id") === this.quoteAsset.get("id")) {
            this.quoteAsset = asset;
            needsUpdate = true;
        } else if (asset.get("id") === this.baseAsset.get("id")) {
            this.baseAsset = asset;
            needsUpdate = true;
        }

        if (needsUpdate) {
            // console.log("onFeedUpdate asset", asset.get("symbol"), "quote:", this.quoteAsset.get("symbol"), "base:", this.baseAsset.get("symbol"));
            // Update orderbook
            this.calls = this.constructCalls(this.activeMarketCalls);
            // Update depth chart data
            this._depthChart();
        } else {
            return false;
        }
    }

    _priceChart() {
        let volumeData = [];
        let prices = [];


        let open, high, low, close, volume;

        let addTime = (time, i, bucketSize) => {
            return new Date(time.getTime() + i * bucketSize * 1000);
        }

        for (let i = 0; i < this.priceHistory.length; i++) {
            let date = new Date(this.priceHistory[i].key.open + "+00:00");
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

            function findMax(a, b) {
                if (a !== Infinity && b !== Infinity) {
                    return Math.max(a, b);
                } else if (a === Infinity) {
                    return b;
                } else {
                    return a;
                }
            }

            function findMin(a, b) {
                if (a !== 0 && b !== 0) {
                    return Math.min(a, b);
                } else if (a === 0) {
                    return b;
                } else {
                    return a;
                }
            }

            if (low === 0) {
                low = findMin(open, close);
            }

            if (isNaN(high) || high === Infinity) {
                high = findMax(open, close);
            }

            if (close === Infinity || close === 0) {
                close = open;
            }

            if (open === Infinity || open === 0) {
                open = close;
            }

            prices.push([date, open, high, low, close]);
            volumeData.push([date, volume]);
        }

        // max buckets returned is 200, if we get less, fill in the gaps starting at the first data point
        let priceLength = prices.length;
        if (priceLength > 0 && priceLength < 200) {
            let now = new Date().getTime();
            let firstDate = prices[0].date;
            // ensure there's a final entry close to the current time
            let i = 1;
            while (addTime(prices[0].date, i, this.bucketSize).getTime() < now) {
                i++;
            }
            let finalDate = addTime(prices[0].date, i - 1, this.bucketSize);
            if (prices[priceLength - 1].date !== finalDate) {
                if (priceLength === 1) {
                    prices.push({date: addTime(finalDate, -1, this.bucketSize), open: prices[0].close, high: prices[0].close, low: prices[0].close, close: prices[0].close, volume: 0});
                    prices.push({date: finalDate, open: prices[0].close, high: prices[0].close, low: prices[0].close, close: prices[0].close, volume: 0});
                    volumeData.push([addTime(finalDate, -1, this.bucketSize), 0]);
                } else {
                    prices.push({date: finalDate, open: prices[priceLength - 1].close, high: prices[priceLength - 1].close, low: prices[priceLength - 1].close, close: prices[priceLength - 1].close, volume: 0});
                }
                volumeData.push([finalDate, 0]);
            }

            // Loop over the data and fill in any blank time periods
            for (let ii = 0; ii < prices.length - 1; ii++) {

                // If next date is beyond one bucket up
                if (prices[ii+1].date.getTime() !== (addTime(prices[ii].date, 1, this.bucketSize).getTime())) {

                    // Break if next date is beyond now
                    if (addTime(prices[ii].date, 1, this.bucketSize).getTime() > now) {
                        break;
                    }

                    prices.splice(ii + 1, 0, {date: addTime(prices[ii].date, 1, this.bucketSize), open: prices[ii].close, high: prices[ii].close, low: prices[ii].close, close: prices[ii].close, volume: 0});
                    volumeData.splice(ii + 1, 0, [addTime(prices[ii].date, 1, this.bucketSize), 0]);
                }
            };
        }

        this.priceData = prices;
        this.volumeData = volumeData;

    }

    _orderBook() {

        let orderBookStart = new Date();

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
                // console.log("order:", order);
                bids.push({
                    value: value,
                    price: price,
                    price_full: price.full,
                    price_dec: price.dec,
                    price_int: price.int,
                    amount: amount,
                    type: "bid",
                    sell_price: order.sell_price,
                    for_sale: order.for_sale
                });
            });

            // Sum bids at same price
            if (bids.length > 1) {
                for (let i = bids.length - 2; i >= 0; i--) {
                    if (bids[i].price_full === bids[i + 1].price_full) {
                        bids[i].amount += bids[i + 1].amount;
                        bids[i].value += bids[i + 1].value;
                        bids[i].for_sale += bids[i + 1].for_sale;
                        bids.splice(i + 1, 1);
                    }
                }
            }

            return bids;
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
                    price: price,
                    price_full: price.full,
                    price_dec: price.dec,
                    price_int: price.int,
                    amount: amount,
                    type: "ask",
                    sell_price: order.sell_price,
                    for_sale: order.for_sale
                });
            });

            // Sum asks at same price
            if (asks.length > 1) {
                for (let i = asks.length - 2; i >= 0; i--) {
                    if (asks[i].price_full === asks[i + 1].price_full) {
                        asks[i].amount += asks[i + 1].amount;
                        asks[i].value += asks[i + 1].value;
                        asks[i].for_sale += asks[i + 1].for_sale;
                        asks.splice(i + 1, 1);
                    }
                }
            }

            return asks;
        }

        // Assign to store variables
        this.bids = constructBids(this.activeMarketLimits);
        this.asks = constructAsks(this.activeMarketLimits);
        this.calls = this.constructCalls(this.activeMarketCalls);

        // console.log("time to construct orderbook:", new Date() - orderBookStart, "ms");
    }

    _depthChart() {
        // let depthStart = new Date();

        let bids = [], asks = [], calls= [], totalBids = 0, totalCalls = 0;
        let flat_bids = [], flat_asks = [], flat_calls = [];

        if (this.activeMarketLimits.size) {

            this.bids.forEach(order => {
                bids.push([order.price_full, order.amount]);
                totalBids += order.value;
            });

            this.asks.forEach(order => {
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

            this.calls.forEach(order => {
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

    _calcMarketStats(history, baseAsset, quoteAsset, recent) {
        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday = yesterday.getTime();
        let volumeBase = 0,
            volumeQuote = 0,
            change = 0,
            last = {close_quote: null, close_base: null},
            invert,
            latestPrice,
            noTrades = true;

        if (history.length) {
            let first;
            history.forEach((bucket, i) => {
                let date = new Date(bucket.key.open + "+00:00").getTime();
                if (date > yesterday) {
                    noTrades = false;
                    if (!first) {
                        first = history[i > 0 ? i - 1 : i];
                        invert = first.key.base === baseAsset.get("id");
                    }
                    if (invert) {
                        volumeBase += parseInt(bucket.base_volume, 10);
                        volumeQuote += parseInt(bucket.quote_volume, 10);
                    } else {
                        volumeQuote += parseInt(bucket.base_volume, 10);
                        volumeBase += parseInt(bucket.quote_volume, 10);
                    }
                }
            });
            if (!first) {
                first = history[0];
            }
            last = history[history.length -1];
            let open, close;
            if (invert) {
                open = utils.get_asset_price(first.open_quote, quoteAsset, first.open_base, baseAsset, invert);
                close = utils.get_asset_price(last.close_quote, quoteAsset, last.close_base, baseAsset, invert);
            } else {
                open = utils.get_asset_price(first.open_quote, baseAsset, first.open_base, quoteAsset, invert);
                close = utils.get_asset_price(last.close_quote, baseAsset, last.close_base, quoteAsset, invert);
            }

            change = noTrades ? 0 : Math.round(10000 * (close - open) / open) / 100;
        }

        if (recent && recent.length && recent.length > 1) {
            let order = recent[1].op;
            let paysAsset, receivesAsset, isAsk = false;

            if (order.pays.asset_id === baseAsset.get("id")) {
                paysAsset = baseAsset;
                receivesAsset = quoteAsset;
                isAsk = true;
            } else {
                paysAsset = quoteAsset;
                receivesAsset = baseAsset;
            }
            let flipped = baseAsset.get("id").split(".")[2] > quoteAsset.get("id").split(".")[2];
            latestPrice = market_utils.parse_order_history(order, paysAsset, receivesAsset, isAsk, flipped).full;
        }

        let close = last.close_base && last.close_quote ? {
            quote: {
                amount: invert ? last.close_quote : last.close_base,
                asset_id: invert ? last.key.quote : last.key.base
            },
            base: {
                amount: invert ? last.close_base : last.close_quote,
                asset_id: invert ? last.key.base : last.key.quote
            }
        } : null;

        return {
            change: change.toFixed(2),
            volumeBase: utils.get_asset_amount(volumeBase, baseAsset),
            volumeQuote: utils.get_asset_amount(volumeQuote, quoteAsset),
            close: close,
            latestPrice
        };
    }

    onGetMarketStats(payload) {
        if (payload) {
            let stats = this._calcMarketStats(payload.history, payload.base, payload.quote, payload.last);
            this.allMarketStats = this.allMarketStats.set(payload.market, stats);
        }
    }

    constructCalls (callsArray) {
        let calls = [];

        // Get feed price if market asset
        let settlementPrice, squeezeRatio, maintenanceRatio;
        if (this.activeMarketCalls.size) {

            if (this.invertedCalls) {
                squeezeRatio = this.baseAsset.getIn(["bitasset", "current_feed", "maximum_short_squeeze_ratio"]) / 1000;
                maintenanceRatio = this.baseAsset.getIn(["bitasset", "current_feed", "maintenance_collateral_ratio"]) / 1000;
                settlementPrice = market_utils.getFeedPrice(
                    this.baseAsset.getIn(["bitasset", "current_feed", "settlement_price"]),
                    true
                )
                 this.lowestCallPrice = settlementPrice / 5;
            } else {
                squeezeRatio = this.quoteAsset.getIn(["bitasset", "current_feed", "maximum_short_squeeze_ratio"]) / 1000;
                maintenanceRatio = this.quoteAsset.getIn(["bitasset", "current_feed", "maintenance_collateral_ratio"]) / 1000;
                settlementPrice = market_utils.getFeedPrice(
                    this.quoteAsset.getIn(["bitasset", "current_feed", "settlement_price"]),
                    false
                )
                this.lowestCallPrice = settlementPrice * 5;
            }
        }

        callsArray.filter(a => {
            let a_price;
            if (this.invertedCalls) {
                a_price = market_utils.parseOrder(a, this.quoteAsset, this.baseAsset, true).price;
                this.lowestCallPrice = Math.max(this.lowestCallPrice, a_price.full);
                return a_price.full >= settlementPrice // / squeezeRatio; // TODO verify this
            } else {
                a_price = market_utils.parseOrder(a, this.baseAsset, this.quoteAsset, false).price;
                this.lowestCallPrice = Math.min(this.lowestCallPrice, a_price.full);
                return a_price.full <= settlementPrice // * squeezeRatio; // TODO verify this
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
        }).forEach(order => {
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
                price: price,
                price_full: price.full,
                price_dec: price.dec,
                price_int: price.int,
                amount: amount,
                type: "call",
                sell_price: order.call_price,
                for_sale: !this.invertedCalls ? order.debt : order.collateral
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

    onSettleOrderUpdate(result) {
        this.updateSettleOrders(result);
    }

    updateSettleOrders(result) {
        if (result.settles && result.settles.length) {
            this.activeMarketSettles = this.activeMarketSettles.clear();

            result.settles.forEach(settle => {
                // let key = settle.owner + "_" + settle.balance.asset_id;

                settle.settlement_date = new Date(settle.settlement_date);

                this.activeMarketSettles = this.activeMarketSettles.add(
                    SettleOrder(settle)
                );
            });
        }
    }
}

export default alt.createStore(MarketsStore, "MarketsStore");
