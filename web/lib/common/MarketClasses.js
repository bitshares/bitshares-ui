import {clone} from "lodash";
import {Fraction} from "fractional";

function limitByPrecision(value, p = 8) {
    let valueString = value.toString();
    let splitString = valueString.split(".");
    if (splitString.length === 1 || splitString.length === 2 && splitString[1].length <= p) {
        return parseFloat(valueString);
    } else {
        return parseFloat(splitString[0] + "." + splitString[1].substr(0, p));
    }
}

function precisionToRatio(p) {
    return Math.pow(10, p);
}

class Asset {
    constructor({asset_id = "1.3.0", amount = 0, precision = 5, real = null} = {}) {
        this.satoshi = precisionToRatio(precision);
        this.asset_id = asset_id;
        if (real && typeof real === "number") {
            amount = this.toSats(real);
        }
        this.amount = amount;
        this.precision = precision;
    }

    hasAmount() {
        return this.amount > 0;
    }

    toSats(amount = 1) { // Return the full integer amount in 'satoshis'
        return amount * this.satoshi;
    }

    setAmount({sats, real}) {
        if (!sats && !real) {
            throw new Error("Invalid arguments for setAmount");
        }
        if (typeof real !== "undefined" && typeof real === "number") {
            this.amount = this.toSats(real);
            this._clearCache();
        } else if(typeof sats === "number") {
            this.amount = sats;
            this._clearCache();
        } else {
            throw new Error("Invalid setAmount input");
        }
    }

    _clearCache() {
        this._real_amount = null;
    }

    getAmount({real} = {}) {
        if (real) {
            if (this._real_amount) return this._real_amount;
            return this._real_amount = limitByPrecision(this.amount / this.toSats(), this.precision);
        } else {
            return this.amount;
        }
    }

    plus(asset) {
        if (asset.asset_id !== this.asset_id) throw new Error("Assets are not the same type");
        this.amount += asset.amount;
        this._clearCache();
    }

    minus(asset) {
        if (asset.asset_id !== this.asset_id) throw new Error("Assets are not the same type");
        this.amount -= asset.amount;
        this._clearCache();
    }

    equals(asset) {
        return (this.asset_id === asset.asset_id && this.amount === asset.amount);
    }

    times(p) { // asset amount times a price p
        if (this.asset_id === p.base.asset_id) {
            let amount = Math.floor((this.amount * p.quote.amount) / p.base.amount);
            return new Asset({asset_id: p.quote.asset_id, amount, precision: p.quote.precision});
        } else if (this.asset_id === p.quote.asset_id) {
            let amount = Math.floor((this.amount * p.base.amount) / p.quote.amount);
            return new Asset({asset_id: p.base.asset_id, amount, precision: p.base.precision});
        }
        throw new Error("Invalid asset types for price multiplication");
    }

    divide(quote, base = this) {
        return new Price({base, quote});
    }

    toObject() {
        return {
            asset_id: this.asset_id,
            amount: this.amount
        };
    }

    clone(amount = this.amount) {
        return new Asset({
            amount,
            asset_id: this.asset_id,
            precision: this.precision
        });
    }
}

/**
    * @brief The price struct stores asset prices in the Graphene system.
    *
    * A price is defined as a ratio between two assets, and represents a possible exchange rate between those two
    * assets. prices are generally not stored in any simplified form, i.e. a price of (1000 CORE)/(20 USD) is perfectly
    * normal.
    *
    * The assets within a price are labeled base and quote. Throughout the Graphene code base, the convention used is
    * that the base asset is the asset being sold, and the quote asset is the asset being purchased, where the price is
    * represented as base/quote, so in the example price above the seller is looking to sell CORE asset and get USD in
    * return.
*/

class Price {
    constructor({base, quote, real = false} = {}) {
        if (!base || !quote) {
            throw new Error("Base and Quote assets must be defined");
        }
        if (base.asset_id === quote.asset_id) {
            throw new Error("Base and Quote assets must be different");
        }

        base = new Asset(clone(base));
        quote = new Asset(clone(quote));
        if (real && typeof real === "number") {
            /*
            * In order to make large numbers work properly, we assume numbers
            * larger than 100k do not need more than 5 decimals. Without this we
            * quickly encounter JavaScript floating point errors for large numbers.
            */
            if (real > 100000) {
                real = limitByPrecision(real, 5);
            }
            let frac = new Fraction(real);
            let baseSats = base.toSats(), quoteSats = quote.toSats();
            let numRatio = (baseSats / quoteSats), denRatio = quoteSats / baseSats;

            if (baseSats >= quoteSats) {
                denRatio = 1;
            } else {
                numRatio = 1;
            }

            base.amount = frac.numerator * numRatio;
            quote.amount = frac.denominator * denRatio;
        } else if (real === 0) {
            base.amount = 0;
            quote.amount = 0;
        }

        if (!base.asset_id || !("amount" in base) || !quote.asset_id || !("amount" in quote)) throw new Error("Invalid Price inputs");
        this.base = base;
        this.quote = quote;
    }

    isValid() {
        return (
            this.base.amount !== 0 && this.quote.amount !== 0) &&
            !isNaN(this.toReal()) &&
            isFinite(this.toReal());
    }

    toReal(sameBase = false) {
        const key = sameBase ? "_samebase_real" : "_not_samebase_real";
        if (this[key]) {
            return this[key];
        }
        let real = sameBase ?
            (this.quote.amount * this.base.toSats()) / (this.base.amount * this.quote.toSats()) :
            (this.base.amount * this.quote.toSats()) / (this.quote.amount * this.base.toSats());
        return this[key] = parseFloat(real.toFixed(8)); // toFixed and parseFloat helps avoid floating point errors for really big or small numbers
    }

    invert() {
        return new Price({
            base: this.quote,
            quote: this.base
        });
    }

    equals(b) {
        if (this.base.asset_id !== b.base.asset_id || this.quote.asset_id !== b.quote.asset_id) {
            throw new Error("Cannot compare prices for different assets");
        }
        const amult = b.quote.amount * this.base.amount;
        const bmult = this.quote.amount * b.base.amount;

        return amult === bmult;
    }

    lt(b) {
        if (this.base.asset_id !== b.base.asset_id || this.quote.asset_id !== b.quote.asset_id) {
            throw new Error("Cannot compare prices for different assets");
        }
        const amult = b.quote.amount * this.base.amount;
        const bmult = this.quote.amount * b.base.amount;

        return amult < bmult;
    }

    lte(b) {
        return (this.equals(b)) || (this.lt(b));
    }

    ne(b) {
        return !(this.equals(b));
    }

    gt(b) {
        return !(this.lte(b));
    }

    gte(b) {
        return !(this.lt(b));
    }
}

class FeedPrice extends Price {
    constructor({priceObject, assets, real = false}) {
        if (!priceObject || typeof priceObject !== "object") {
            throw new Error("Invalid inputs, priceObject must be an object");
        }

        if (priceObject.toJS) {
            priceObject = priceObject.toJS();
        }

        const base = new Asset({
            asset_id: priceObject.base.asset_id,
            amount: priceObject.base.amount,
            precision: assets[priceObject.base.asset_id].precision
        });

        const quote = new Asset({
            asset_id: priceObject.quote.asset_id,
            amount: priceObject.quote.amount,
            precision: assets[priceObject.quote.asset_id].precision
        });

        super({base, quote, real});

        // this.base =
        //
        // console.log("this.base:", this.base);
        //
        // this.quote = new Asset({
        //     asset_id: priceObject.quote.asset_id,
        //     amount: priceObject.quote.amount,
        //     precision: assets[priceObject.quote.asset_id].precision
        // });
        // console.log("this.quote:", this.quote);
        // this.price = new Price({
        //     base: this.base,
        //     quote: this.quote
        // });
    }
}

class LimitOrderCreate {
    constructor({for_sale, to_receive, seller = "", expiration = new Date(), fill_or_kill = false, fee = {amount: 0, asset_id: "1.3.0"}} = {}) {
        if (!for_sale || !to_receive) {
            throw new Error("Missing order amounts");
        }

        if (for_sale.asset_id === to_receive.asset_id) {
            throw new Error("Order assets cannot be the same");
        }

        this.amount_for_sale = for_sale;
        this.min_to_receive = to_receive;
        this.setExpiration(expiration);
        this.fill_or_kill = fill_or_kill;
        this.seller = seller;
        this.fee = fee;
    }

    setExpiration(expiration = null) {
        if (!expiration) {
            expiration = new Date();
            expiration.setYear(expiration.getFullYear() + 5);
        }
        this.expiration = expiration;
    }

    toObject() {
        return {
            seller: this.seller,
            min_to_receive: this.min_to_receive.toObject(),
            amount_to_sell: this.amount_for_sale.toObject(),
            expiration: this.expiration,
            fill_or_kill: this.fill_or_kill
        };
    }
}

class LimitOrder {
    constructor(order, assets, base_id) {
        this.assets = assets;
        this.base_id = base_id;
        this.id = order.id;
        this.expiration = new Date(order.expiration);
        this.seller = order.seller;
        this.for_sale = parseInt(order.for_sale, 10); // asset id is sell_price.base.asset_id

        let base = new Asset({
            asset_id: order.sell_price.base.asset_id,
            amount: parseInt(order.sell_price.base.amount, 10),
            precision: assets[order.sell_price.base.asset_id].precision
        });
        let quote = new Asset({
            asset_id: order.sell_price.quote.asset_id,
            amount: parseInt(order.sell_price.quote.amount, 10),
            precision: assets[order.sell_price.quote.asset_id].precision
        });

        this.sell_price = new Price({
            base, quote
        });

        this.fee = order.deferred_fee;
    }

    getPrice(p = this.sell_price) {
        if (this._real_price) {
            return this._real_price;
        }
        return this._real_price = p.toReal(p.base.asset_id === this.base_id);
    }

    isBid(base) {
        return this.sell_price.base.asset_id === base;
    }

    sellPrice() {
        return this.sell_price;
    }

    amountForSale() {
        if (this._for_sale) return this._for_sale;
        return this._for_sale = new Asset({
            asset_id: this.sell_price.base.asset_id,
            amount: this.for_sale,
            precision: this.assets[this.sell_price.base.asset_id].precision
        });
    }

    amountToReceive() {
        if (this._to_receive) return this._to_receive;
        return this._to_receive = this.amountForSale().times(this.sell_price);
    }

    sum(order) {
        this.for_sale += order.for_sale;
        this._clearCache();
    }

    _clearCache() {
        this._to_receive = null;
        this._for_sale = null;
    }

    ne(order) {
        return (
            this.sell_price.ne(order.sell_price) ||
            this.for_sale !== order.for_sale
        );
    }

    equals(order) {
        return !this.ne(order);
    }
}

class CallOrder {
    constructor(order, assets, base_id, feed) {

        this.assets = assets;
        this.base_id = base_id;
        this.id = order.id;
        this.borrower = order.borrower;
        this.collateral = parseInt(order.collateral, 10);
        this.debt = parseInt(order.debt, 10);
        let base = new Asset({
            asset_id: order.call_price.base.asset_id,
            amount: parseInt(order.call_price.base.amount, 10),
            precision: assets[order.call_price.base.asset_id].precision
        });
        let quote = new Asset({
            asset_id: order.call_price.quote.asset_id,
            amount: parseInt(order.call_price.quote.amount, 10),
            precision: assets[order.call_price.quote.asset_id].precision
        });

        this.for_sale = 0;
        this.call_price = new Price({
            base, quote
        });

        this.feed_price = feed;
    }

    getPrice(p = this.call_price, f = this.feed_price) {
        if (this._real_price) {
            return this._real_price;
        }
        return this._real_price = p.toReal(p.base.asset_id === this.base_id);
    }

    getFeedPrice(f = this.feed_price) {
        if (this._feed_price) {
            return this._feed_price;
        }
        return this._feed_price = f.toReal(f.base.asset_id === this.base_id);
    }

    isMarginCalled() {
        return this.call_price.lte(this.feed_price);
    }

    isBid(base) {
        return this.call_price.base.asset_id === base;
    }

    sellPrice() {
        return this.call_price;
    }

    amountForSale() {
        if (this._for_sale) return this._for_sale;
        return this._for_sale = this.amountToReceive().times(this[this.isMarginCalled() ? "feed_price" : "call_price"]);
    }

    amountToReceive() {
        if (this._debt) return this._debt;
        return this._debt = new Asset({
            asset_id: this.call_price.quote.asset_id,
            amount: this.debt,
            precision: this.assets[this.call_price.quote.asset_id].precision
        });
    }

    sum(order) {
        this.debt += order.debt;
        this.collateral += order.collateral;
        this._clearCache();
    }

    _clearCache() {
        this._for_sale = null;
        this._debt = null;
        this._feed_price = null;
    }

    ne(order) {
        return (
            this.call_price.ne(order.call_price) ||
            this.debt !== order.debt
        );
    }
}

class SettleOrder {
    constructor() {

    }
}

export {
    Asset,
    Price,
    FeedPrice,
    LimitOrderCreate,
    limitByPrecision,
    precisionToRatio,
    LimitOrder,
    CallOrder,
    SettleOrder
};
