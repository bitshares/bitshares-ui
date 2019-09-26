import sanitize from "xss";
import asset_utils from "./asset_utils";

var numeral = require("numeral");
let id_regex = /\b\d+\.\d+\.(\d+)\b/;

import {ChainTypes} from "bitsharesjs";
var {object_type} = ChainTypes;

import {getAssetNamespaces, getAssetHideNamespaces} from "../../branding";

var Utils = {
    is_object_id: obj_id => {
        if ("string" != typeof obj_id) return false;
        let match = id_regex.exec(obj_id);
        return match !== null && obj_id.split(".").length === 3;
    },

    is_object_type: (obj_id, type) => {
        let prefix = object_type[type];
        if (!prefix || !obj_id) return null;
        prefix = "1." + prefix.toString();
        return obj_id.substring(0, prefix.length) === prefix;
    },

    get_asset_precision: precision => {
        precision = precision.toJS ? precision.get("precision") : precision;
        return Math.pow(10, precision);
    },

    get_asset_amount: function(amount, asset) {
        if (amount === 0) return amount;
        if (!amount) return null;
        return (
            amount /
            this.get_asset_precision(
                asset.toJS ? asset.get("precision") : asset.precision
            )
        );
    },

    convert_satoshi_to_typed: function(amount, asset) {
        if (amount === 0) return amount;
        if (!amount) return null;
        return (
            amount /
            this.get_asset_precision(
                asset.toJS ? asset.get("precision") : asset.precision
            )
        );
    },

    convert_typed_to_satoshi: function(amount, asset) {
        return (
            amount *
            this.get_asset_precision(
                asset.toJS ? asset.get("precision") : asset.precision
            )
        );
    },

    get_asset_price: function(
        quoteAmount,
        quoteAsset,
        baseAmount,
        baseAsset,
        inverted = false
    ) {
        if (!quoteAsset || !baseAsset) {
            return 1;
        }
        var price =
            this.get_asset_amount(quoteAmount, quoteAsset) /
            this.get_asset_amount(baseAmount, baseAsset);
        return inverted ? 1 / price : price;
    },

    format_volume(amount, precision = 3) {
        if (amount < 10000) {
            return this.format_number(amount, precision);
        } else if (amount < 1000000) {
            return (Math.round(amount / 10) / 100).toFixed(2) + "k";
        } else {
            return (Math.round(amount / 10000) / 100).toFixed(2) + "M";
        }
    },

    format_number: (number, decimals, trailing_zeros = true) => {
        if (
            isNaN(number) ||
            !isFinite(number) ||
            number === undefined ||
            number === null
        )
            return "";
        let zeros = ".";
        for (var i = 0; i < decimals; i++) {
            zeros += "0";
        }
        let num = numeral(number).format("0,0" + zeros);
        if (num.indexOf(".") > 0 && !trailing_zeros)
            return num.replace(/0+$/, "").replace(/\.$/, "");
        return num;
    },

    format_asset: function(amount, asset, noSymbol, trailing_zeros = true) {
        let symbol;
        let digits = 0;
        if (asset === undefined) return undefined;
        if ("symbol" in asset) {
            // console.log( "asset: ", asset )
            symbol = asset.symbol;
            digits = asset.precision;
        } else {
            // console.log( "asset: ", asset.toJS() )
            symbol = asset.get("symbol");
            digits = asset.get("precision");
        }
        let precision = this.get_asset_precision(digits);
        // console.log( "precision: ", precision )

        return `${this.format_number(
            amount / precision,
            digits,
            trailing_zeros
        )}${!noSymbol ? " " + symbol : ""}`;
    },

    price_text: function(price, base, quote) {
        let maxDecimals = 8;
        let priceText;
        let quoteID = quote.toJS ? quote.get("id") : quote.id;
        let quotePrecision = quote.toJS
            ? quote.get("precision")
            : quote.precision;
        let baseID = base.toJS ? base.get("id") : base.id;
        let basePrecision = base.toJS ? base.get("precision") : base.precision;
        let fixedPrecisionAssets = {
            "1.3.113": 5, // bitCNY
            "1.3.121": 5 // bitUSD
        };
        if (quoteID === "1.3.0") {
            priceText = this.format_number(price, quotePrecision);
        } else if (baseID === "1.3.0") {
            priceText = this.format_number(
                price,
                Math.min(maxDecimals, quotePrecision + 2)
            );
        } else if (fixedPrecisionAssets[quoteID]) {
            priceText = this.format_number(
                price,
                fixedPrecisionAssets[quoteID]
            );
        } else {
            priceText = this.format_number(
                price,
                Math.min(
                    maxDecimals,
                    Math.max(quotePrecision + basePrecision, 2)
                )
            );
        }
        return priceText;
    },

    price_to_text: function(price, base, quote, forcePrecision = null) {
        if (typeof price !== "number" || !base || !quote) {
            return;
        }

        if (price === Infinity) {
            price = 0;
        }
        let priceText;

        if (forcePrecision) {
            priceText = this.format_number(price, forcePrecision);
        } else {
            priceText = this.price_text(price, base, quote);
        }
        let price_split = priceText.split(".");
        let int = price_split[0];
        let dec = price_split[1];
        let i;

        let zeros = 0;
        if (dec) {
            if (price > 1) {
                let l = dec.length;
                for (i = l - 1; i >= 0; i--) {
                    if (dec[i] !== "0") {
                        break;
                    }
                    zeros++;
                }
            } else {
                let l = dec.length;
                for (i = 0; i < l; i++) {
                    if (dec[i] !== "0") {
                        i--;
                        break;
                    }
                    zeros++;
                }
            }
        }

        let trailing = zeros
            ? dec.substr(Math.max(0, i + 1), dec.length)
            : null;

        if (trailing) {
            if (trailing.length === dec.length) {
                dec = null;
            } else if (trailing.length) {
                dec = dec.substr(0, i + 1);
            }
        }

        return {
            text: priceText,
            int: int,
            dec: dec,
            trailing: trailing,
            full: price
        };
    },

    check_market_stats: function(
        newStats = {close: {}},
        oldStats = {close: {}}
    ) {
        let statsChanged =
            newStats.volumeBase !== oldStats.volumeBase ||
            !this.are_equal_shallow(
                newStats.close && newStats.close.base,
                oldStats.close && oldStats.close.base
            ) ||
            !this.are_equal_shallow(
                newStats.close && newStats.close.quote,
                oldStats.close && oldStats.close.quote
            );
        return statsChanged;
    },

    are_equal_shallow: function(a, b) {
        if ((!a && b) || (a && !b)) {
            return false;
        }
        if (Array.isArray(a) && Array.isArray(a)) {
            if (a.length > b.length) {
                return false;
            }
        }
        if (typeof a === "string" && typeof b === "string") {
            return a === b;
        } else if (
            (typeof a === "string" && typeof b !== "string") ||
            (typeof a !== "string" && typeof b === "string")
        ) {
            return false;
        }

        if (a && a.toJS && b && b.toJS) return a === b;
        for (var key in a) {
            if ((a.hasOwnProperty(key) && !(key in b)) || a[key] !== b[key]) {
                return false;
            }
        }
        for (var key in b) {
            if ((b.hasOwnProperty(key) && !(key in a)) || a[key] !== b[key]) {
                return false;
            }
        }

        return true;
    },

    makeISODateString(date_str) {
        if (typeof date_str === "string" && !/Z$/.test(date_str)) {
            date_str += "Z";
        }
        return date_str;
    },

    format_date: function(date_str) {
        date_str = this.makeISODateString(date_str);
        let date = new Date(date_str);
        return date.toLocaleDateString();
    },

    format_time: function(time_str) {
        time_str = this.makeISODateString(time_str);
        let date = new Date(time_str);
        return date.toLocaleString();
    },

    limitByPrecision: function(value, assetPrecision) {
        let valueString = value.toString();
        let splitString = valueString.split(".");
        if (
            splitString.length === 1 ||
            (splitString.length === 2 &&
                splitString[1].length <= assetPrecision)
        ) {
            return valueString;
        } else {
            return (
                splitString[0] + "." + splitString[1].substr(0, assetPrecision)
            );
        }
    },

    convertPrice: function(fromRate, toRate, fromID, toID) {
        if (!fromRate || !toRate) {
            return null;
        }
        // Handle case of input simply being a fromAsset and toAsset
        if (fromRate.toJS && this.is_object_type(fromRate.get("id"), "asset")) {
            fromID = fromRate.get("id");
            fromRate = fromRate.get("bitasset")
                ? asset_utils.extractRawFeedPrice(fromRate).toJS()
                : fromRate.getIn(["options", "core_exchange_rate"]).toJS();
        }

        if (toRate.toJS && this.is_object_type(toRate.get("id"), "asset")) {
            toID = toRate.get("id");
            toRate = toRate.get("bitasset")
                ? asset_utils.extractRawFeedPrice(toRate).toJS()
                : toRate.getIn(["options", "core_exchange_rate"]).toJS();
        }

        let fromRateQuoteID = fromRate.quote.asset_id;
        let toRateQuoteID = toRate.quote.asset_id;

        let fromRateQuoteAmount, fromRateBaseAmount;
        if (fromRateQuoteID === fromID) {
            fromRateQuoteAmount = fromRate.quote.amount;
            fromRateBaseAmount = fromRate.base.amount;
        } else {
            fromRateQuoteAmount = fromRate.base.amount;
            fromRateBaseAmount = fromRate.quote.amount;
        }

        let toRateQuoteAmount, toRateBaseAmount;
        if (toRateQuoteID === toID) {
            toRateQuoteAmount = toRate.quote.amount;
            toRateBaseAmount = toRate.base.amount;
        } else {
            toRateQuoteAmount = toRate.base.amount;
            toRateBaseAmount = toRate.quote.amount;
        }

        let baseRatio, finalQuoteAmount, finalBaseAmount;
        if (toRateBaseAmount > fromRateBaseAmount) {
            baseRatio = toRateBaseAmount / fromRateBaseAmount;
            finalQuoteAmount = fromRateQuoteAmount * baseRatio;
            finalBaseAmount = toRateQuoteAmount;
        } else {
            baseRatio = fromRateBaseAmount / toRateBaseAmount;
            finalQuoteAmount = fromRateQuoteAmount;
            finalBaseAmount = toRateQuoteAmount * baseRatio;
        }

        return {
            quote: {
                amount: finalQuoteAmount,
                asset_id: toID
            },
            base: {
                amount: finalBaseAmount,
                asset_id: fromID
            }
        };
    },

    convertValue: function(priceObject, amount, fromAsset, toAsset) {
        priceObject = priceObject.toJS ? priceObject.toJS() : priceObject;
        let quotePrecision = this.get_asset_precision(
            fromAsset.get("precision")
        );
        let basePrecision = this.get_asset_precision(toAsset.get("precision"));

        let assetPrice = this.get_asset_price(
            priceObject.quote.amount,
            fromAsset,
            priceObject.base.amount,
            toAsset
        );

        let eqValue =
            fromAsset.get("id") !== toAsset.get("id")
                ? (basePrecision * (amount / quotePrecision)) / assetPrice
                : amount;

        if (isNaN(eqValue) || !isFinite(eqValue)) {
            return null;
        }
        return eqValue;
    },

    sortText(a, b, inverse = false) {
        if (a > b) {
            return inverse ? 1 : -1;
        } else if (a < b) {
            return inverse ? -1 : 1;
        } else {
            return 0;
        }
    },

    sortID(a, b, inverse = false) {
        // inverse = false => low to high
        let intA = parseInt(a.split(".")[2], 10);
        let intB = parseInt(b.split(".")[2], 10);

        return inverse ? intB - intA : intA - intB;
    },

    calc_block_time(
        block_number,
        globalObject,
        dynGlobalObject,
        estimate = false
    ) {
        let block_interval = null;
        let head_block = null;
        let head_block_time = null;
        if (!estimate && (!globalObject || !dynGlobalObject)) {
            return null;
        }
        // estimate what is unknown, i.e. fix a block and assume interval and constant production with equal parameters
        if (!globalObject) {
            block_interval = 3;
        } else {
            block_interval = globalObject
                .get("parameters")
                .get("block_interval");
        }
        if (!dynGlobalObject) {
            // mainnet estimation
            head_block = 37025190;
            head_block_time = new Date("2019-04-30T07:55:24Z");
        } else {
            head_block = dynGlobalObject.get("head_block_number");
            head_block_time = new Date(dynGlobalObject.get("time") + "Z");
        }
        const seconds_below = (head_block - block_number) * block_interval;
        return new Date(head_block_time - seconds_below * 1000);
    },

    get_translation_parts(str) {
        let re = /{(.*?)}/g;
        return str.split(re);
    },

    get_percentage(a, b) {
        return Math.round((a / b) * 100) + "%";
    },

    replaceName(asset) {
        if (!asset) return {name: "", prefix: null, isBitAsset: false};
        let name = asset.get("symbol");
        const isBitAsset =
            asset.get("bitasset") &&
            !asset.getIn(["bitasset", "is_prediction_market"]) &&
            asset.get("issuer") === "1.2.0";

        let toReplace = getAssetNamespaces();
        let suffix = "";
        let i;
        for (i = 0; i < toReplace.length; i++) {
            if (name.indexOf(toReplace[i]) !== -1) {
                name = name.replace(toReplace[i], "") + suffix;
                break;
            }
        }

        let namespace = isBitAsset ? "bit" : toReplace[i];
        let prefix = null;
        if (!getAssetHideNamespaces().find(a => a.indexOf(namespace) !== -1)) {
            prefix = namespace ? namespace.toLowerCase() : null;
        }

        return {
            name,
            prefix,
            isBitAsset: !!isBitAsset
        };
    },

    sanitize(string) {
        // sanitize with package
        string = sanitize(string, {
            whiteList: [], // empty, means filter out all tags
            stripIgnoreTag: true // remove all tags instead of escaping
        });
        string = string.replace(/%3A/gi, ":"); // resolve to : to not break links
        string = string.replace(/javascript:/gi, "");
        string = string.replace(/vbscript:/gi, "");
        string = string.replace(/data:/gi, "");
        string = string.replace(/tcl:/gi, "");
        return string;
    }
};

export default Utils;
