import utils from "./utils";
import {
    object_type
}
from "chain/chain_types";
var opTypes = Object.keys(object_type);

class MarketUtils {
    constructor() {
        this.order_type = this.order_type.bind(this);
    }

    // static parse_order(newOrder) {
    //     let o = newOrder[0][1];
    //     let orderType = this.order_type(newOrder[1][1]);
    //     let order = {};
    //     switch (orderType) {

    //         case "limit_order":
    //             o.expiration = new Date(o.expiration);
    //             console.log("new limit order:", orderType, newOrder);

    //             order = {
    //                 expiration: o.expiration,
    //                 for_sale: o.amount_to_sell.amount,
    //                 id: newOrder[1][1],
    //                 sell_price: {
    //                     base: {
    //                         amount: parseInt(o.min_to_receive.amount, 10) / parseInt(o.amount_to_sell.amount),
    //                         asset_id: o.min_to_receive.asset_id
    //                     },
    //                     quote: {
    //                         amount: 1,
    //                         asset_id: parseInt(o.amount_to_sell.asset_id, 10)

    //                     }
    //                 },
    //                 seller: o.seller
    //             };

    //             break;

    //         case "short_order":
    //             o.expiration = new Date(o.expiration);
    //             console.log("new short order:", orderType, newOrder);

    //             order = {
    //                 expiration: o.expiration,
    //                 for_sale: o.amount_to_sell.amount,
    //                 id: newOrder[1][1],
    //                 sell_price: {
    //                     base: {
    //                         amount: parseInt(o.min_to_receive.amount, 10) / parseInt(o.amount_to_sell.amount, 10),
    //                         asset_id: o.min_to_receive.asset_id
    //                     },
    //                     quote: {
    //                         amount: 1,
    //                         asset_id: o.amount_to_sell.asset_id
    //                     }
    //                 },
    //                 seller: o.seller
    //             };
    //             break;

    //         default:
    //             break;
    //     }

    //     return {
    //         order: order,
    //         orderType: orderType
    //     };
    // }

    static order_type(id) {
        if (typeof id !== "string") {
            return false;
        }
        var type = id.split(".")[1];
        return opTypes[type];
    }

    static isAsk(order, base) {
        let baseId = base.toJS ? base.get("id") : base.id;;

        if (order.sell_price) {
            return order.sell_price.quote.asset_id === baseId;
        } else if (order.call_price) {
            return order.call_price.quote.asset_id === baseId;
        }
    }

    static isAskOp(op) {
        return op.amount_to_sell.asset_id !== op.fee.asset_id;
    }

    static limitByPrecision(value, asset) {

        let precision = utils.get_asset_precision(asset.toJS ? asset.get("precision") : asset.precision);
        value = Math.floor(value * precision) / precision;
        if (isNaN(value) || !isFinite(value)) {
            return 0;
        }
        return value;
    }

    static getFeedPrice(settlement_price, backing_asset, quote_asset, invert = false) {
        let price = utils.get_asset_price(
            settlement_price.getIn(["quote", "amount"]),
            backing_asset,
            settlement_price.getIn(["base", "amount"]),
            quote_asset
        )

        if (invert) {
            return 1 / price;
        } else {
            return price;
        }
    }

    static parseOrder(order, base, quote, invert = false) {
        let ask = this.isAsk(order, base);
        let quotePrecision = utils.get_asset_precision(quote.toJS ? quote.get("precision") : quote.precision);
        let basePrecision = utils.get_asset_precision(base.toJS ? base.get("precision") : base.precision);

        let buy, sell;
        if (order.sell_price) {
            buy = ask ? order.sell_price.base : order.sell_price.quote;
            sell = ask ? order.sell_price.quote : order.sell_price.base;
        } else if (order.call_price) {
            // console.log("order:", order);
            buy = ask ? order.call_price.base : order.call_price.quote;
            sell = ask ? order.call_price.quote : order.call_price.base;
        }

        if (typeof sell.amount !== "number") {
            sell.amount = parseInt(sell.amount, 10);
        }

        if (typeof buy.amount !== "number") {
            buy.amount = parseInt(buy.amount, 10);
        }
        let price = {
            full: (sell.amount / basePrecision) / (buy.amount / quotePrecision)
        };
        if (invert) {
            price.full = 1 / price.full;
        }
        let amount, value;

        // We need to figure out a better way to set the number of decimals
        let price_split = utils.format_number(price.full, Math.max(5, quote.toJS ? quote.get("precision") : quote.precision)).split(".");
        price.int = price_split[0];
        price.dec = price_split[1];

        if (order.debt) {
            if (invert) {
                // Price in USD/CORE, amount should be in CORE, value should be in USD, debt is in USD
                // buy is in USD, sell is in CORE
                // quote is USD, base is CORE
                value = order.debt / quotePrecision;
                amount = this.limitByPrecision(value / price.full, base);
            } else {
                // Price in CORE/USD, amount should be in USD, value should be in CORE, debt is in USD
                // buy is in USD, sell is in CORE
                // quote is USD, base is CORE

                amount = this.limitByPrecision(order.debt / quotePrecision, quote);
                value = price.full * amount;
            }
        } else if (!ask) {
            amount = this.limitByPrecision((buy.amount / sell.amount) * order.for_sale / quotePrecision, quote);
            value = order.for_sale / basePrecision;
        } else {
            amount = this.limitByPrecision(order.for_sale / quotePrecision, quote);
            value = price.full * amount;
        }

        value = this.limitByPrecision(value, base);

        if (!ask && order.for_sale) {
            value = this.limitByPrecision(price.full * amount, base);
        }

        return {
            value: value,
            price: price,
            amount: amount
        };
    }

    static flatten_orderbookchart(array, sumBoolean, inverse, precision) {
        inverse = inverse === undefined ? false : inverse;
        let orderBookArray = [];
        let maxStep, arrayLength = array.length;

        // Sum orders at same price
        // if (arrayLength > 1) {
        //     for (var i = arrayLength - 2; i >= 0; i--) {
        //         if (array[i].x === array[i + 1].x) {
        //             console.log("found order to sum");
        //             array[i].y += array[i + 1].y;
        //             array.splice(i + 1, 1);
        //         }
        //     }
        // }
        // arrayLength = array.length;

        if (inverse) {

            if (array && arrayLength) {
                arrayLength = arrayLength - 1;
                orderBookArray.unshift({
                    x: array[arrayLength].x,
                    y: array[arrayLength].y
                });
                if (array.length > 1) {
                    for (let i = array.length - 2; i >= 0; i--) {
                        maxStep = Math.min((array[i + 1].x - array[i].x) / 2, 0.1 / precision);
                        orderBookArray.unshift({
                            x: array[i].x + maxStep,
                            y: array[i + 1].y
                        });
                        if (sumBoolean) {
                            array[i].y += array[i + 1].y;
                        }
                        orderBookArray.unshift({
                            x: array[i].x,
                            y: array[i].y
                        });
                    }
                } else {
                    orderBookArray.unshift({
                        x: 0,
                        y: array[arrayLength].y
                    });
                }
            }
        } else {
            if (array && arrayLength) {
                orderBookArray.push({
                    x: array[0].x,
                    y: array[0].y
                });
                if (array.length > 1) {
                    for (let i = 1; i < array.length; i++) {
                        maxStep = Math.min((array[i].x - array[i - 1].x) / 2, 0.1 / precision);
                        orderBookArray.push({
                            x: array[i].x - maxStep,
                            y: array[i - 1].y
                        });
                        if (sumBoolean) {
                            array[i].y += array[i - 1].y;
                        }
                        orderBookArray.push({
                            x: array[i].x,
                            y: array[i].y
                        });
                    }
                } else {
                    orderBookArray.push({
                        x: array[0].x * 1.5,
                        y: array[0].y
                    });
                }
            }
        }
        return orderBookArray;
    }

    static flatten_orderbookchart_highcharts(array, sumBoolean, inverse, precision) {
        inverse = inverse === undefined ? false : inverse;
        let orderBookArray = [];
        let maxStep, arrayLength;

        if (inverse) {

            if (array && array.length) {
                arrayLength = array.length - 1;
                orderBookArray.unshift([array[arrayLength][0], array[arrayLength][1]]);
                if (array.length > 1) {
                    for (let i = array.length - 2; i >= 0; i--) {
                        maxStep = Math.min((array[i + 1][0] - array[i][0]) / 2, 0.1 / precision);
                        orderBookArray.unshift([array[i][0] + maxStep, array[i + 1][1]]);
                        if (sumBoolean) {
                            array[i][1] += array[i + 1][1];
                        }
                        orderBookArray.unshift([array[i][0], array[i][1]]);
                    }
                } else {
                    orderBookArray.unshift([0, array[arrayLength][1]]);
                }
            }
        } else {
            if (array && array.length) {
                orderBookArray.push([array[0][0], array[0][1]]);
                if (array.length > 1) {
                    for (var i = 1; i < array.length; i++) {
                        maxStep = Math.min((array[i][0] - array[i - 1][0]) / 2, 0.1 / precision);
                        orderBookArray.push([array[i][0] - maxStep, array[i - 1][1]]);
                        if (sumBoolean) {
                            array[i][1] += array[i - 1][1];
                        }
                        orderBookArray.push([array[i][0], array[i][1]]);
                    }
                } else {
                    orderBookArray.push([array[0][0] * 1.5, array[0][1]]);
                }
            }
        }
        return orderBookArray;
    }

}

export default MarketUtils;
