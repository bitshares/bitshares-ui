var numeral = require("numeral");

let id_regex = /\b\d+\.\d+\.(\d+)\b/;

import {ChainTypes} from "bitsharesjs/es";
var {object_type, operations} = ChainTypes;

var Utils = {
    get_object_id: (obj_id) => {
        let id_regex_res = id_regex.exec(obj_id);
        return id_regex_res ? Number.parseInt(id_regex_res[1]) : 0;
    },

    is_object_id: (obj_id) => {
        if( 'string' != typeof obj_id ) return false
        let match = id_regex.exec(obj_id);
        return (match !== null && obj_id.split(".").length === 3);
    },

    is_object_type: (obj_id, type) => {
        let prefix = object_type[type];
        if (!prefix || !obj_id) return null;
        prefix = "1." + prefix.toString();
        return obj_id.substring(0, prefix.length) === prefix;
    },

    get_satoshi_amount(amount, asset) {
        let precision = asset.toJS ? asset.get("precision") : asset.precision;
        let assetPrecision = this.get_asset_precision(precision);
        amount = typeof amount === "string" ? amount : amount.toString();

        let decimalPosition = amount.indexOf(".");
        if (decimalPosition === -1) {
            return parseInt(amount, 10) * assetPrecision;
        } else {
            let amountLength = amount.length,
                i;
            amount = amount.replace(".", "");
            amount = amount.substr(0, decimalPosition + precision);
            for (i = 0; i < precision; i++) {
                decimalPosition += 1;
                if (decimalPosition > amount.length) {
                    amount += "0";
                }
            };

            return parseInt(amount, 10);
        }
    },

    get_asset_precision: (precision) => {
        precision = precision.toJS ? precision.get("precision") : precision;
        return Math.pow(10, precision);
    },

    get_asset_amount: function(amount, asset) {
        if (amount === 0) return amount;
        if (!amount) return null;
        return amount / this.get_asset_precision(asset.toJS ? asset.get("precision") : asset.precision);
    },

    get_asset_price: function(quoteAmount, quoteAsset, baseAmount, baseAsset, inverted = false) {
        if (!quoteAsset || !baseAsset) {
            return 1;
        }
        var price = this.get_asset_amount(quoteAmount, quoteAsset) / this.get_asset_amount(baseAmount, baseAsset);
        return inverted ? 1 / price : price;
    },

    round_number: function(number, asset) {
        let assetPrecision = asset.toJS ? asset.get("precision") : asset.precision;
        let precision = this.get_asset_precision(assetPrecision);
        return Math.round(number * precision) / precision;
    },

    format_volume(amount) {

        if (amount < 10000) {
            return this.format_number(amount, 3);
        } else if (amount < 1000000) {
            return (Math.round(amount / 10) / 100).toFixed(2) + "k";
        } else {
            return (Math.round(amount / 10000) / 100).toFixed(2) + "M";
        }
    },

    format_number: (number, decimals, trailing_zeros = true) => {
        if(isNaN(number) || !isFinite(number) || number === undefined || number === null) return "";
        let zeros = ".";
        for (var i = 0; i < decimals; i++) {
            zeros += "0";
        }
        let num = numeral(number).format("0,0" + zeros);
        if( num.indexOf('.') > 0 && !trailing_zeros)
           return num.replace(/0+$/,"").replace(/\.$/,"")
        return num
    },

    format_asset: function(amount, asset, noSymbol, trailing_zeros=true) {
        let symbol;
        let digits = 0
        if( asset === undefined )
           return undefined
        if( 'symbol' in asset )
        {
            // console.log( "asset: ", asset )
            symbol = asset.symbol
            digits = asset.precision
        }
        else
        {
           // console.log( "asset: ", asset.toJS() )
           symbol = asset.get('symbol')
           digits = asset.get('precision')
        }
        let precision = this.get_asset_precision(digits);
        // console.log( "precision: ", precision )

        return `${this.format_number(amount / precision, digits, trailing_zeros)}${!noSymbol ? " " + symbol : ""}`;
    },

    format_price: function(quoteAmount, quoteAsset, baseAmount, baseAsset, noSymbol,inverted = false, trailing_zeros = true) {
        if (quoteAsset.size) quoteAsset = quoteAsset.toJS();
        if (baseAsset.size) baseAsset = baseAsset.toJS();

        let precision = this.get_asset_precision(quoteAsset.precision);
        let basePrecision = this.get_asset_precision(baseAsset.precision);

        if (inverted) {
            if (parseInt(quoteAsset.id.split(".")[2], 10) < parseInt(baseAsset.id.split(".")[2], 10)) {
                return `${this.format_number((quoteAmount / precision) / (baseAmount / basePrecision), Math.max(5, quoteAsset.precision),trailing_zeros)}${!noSymbol ? "" + quoteAsset.symbol + "/" + baseAsset.symbol : ""}`;
            } else {
                return `${this.format_number((baseAmount / basePrecision) / (quoteAmount / precision), Math.max(5, baseAsset.precision),trailing_zeros)}${!noSymbol ? "" + baseAsset.symbol + "/" + quoteAsset.symbol : ""}`;
            }
        } else {
            if (parseInt(quoteAsset.id.split(".")[2], 10) > parseInt(baseAsset.id.split(".")[2], 10)) {
                return `${this.format_number((quoteAmount / precision) / (baseAmount / basePrecision), Math.max(5, quoteAsset.precision),trailing_zeros)}${!noSymbol ? "" + quoteAsset.symbol + "/" + baseAsset.symbol : ""}`;
            } else {
                return `${this.format_number((baseAmount / basePrecision) / (quoteAmount / precision), Math.max(5, baseAsset.precision),trailing_zeros)}${!noSymbol ? "" + baseAsset.symbol + "/" + quoteAsset.symbol : ""}`;
            }
        }
    },

    price_text: function(price, base, quote) {
        let maxDecimals = 8;
        let priceText;
        let quoteID = quote.toJS ? quote.get("id") : quote.id;
        let quotePrecision  = quote.toJS ? quote.get("precision") : quote.precision;
        let baseID = base.toJS ? base.get("id") : base.id;
        let basePrecision  = base.toJS ? base.get("precision") : base.precision;
        if (quoteID === "1.3.0") {
            priceText = this.format_number(price, quotePrecision);
        } else if (baseID === "1.3.0") {
            priceText = this.format_number(price, Math.min(maxDecimals, quotePrecision + 2));
        } else {
            priceText = this.format_number(price, Math.min(maxDecimals, quotePrecision + basePrecision));
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
        let precision;
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
                };
            } else {
                let l = dec.length;
                for (i = 0; i < l; i++) {
                    if (dec[i] !== "0") {
                        i--;
                        break;
                    }
                    zeros++;
                };
            }
        }

        let trailing = zeros ? dec.substr(Math.max(0, i + 1), dec.length) : null;

        if (trailing) {
            if (trailing.length === dec.length) {
                dec = null;
            } else  if (trailing.length) {
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

    get_op_type: function(object) {
        let type = parseInt(object.split(".")[1], 10);

        for (let id in object_type) {
            if (object_type[id] === type) {
                return id;
            }
        }
    },

    add_comma: function(value) {
        if (typeof value === "number") {
            value = value.toString();
        }
        value = value.trim()
        value = value.replace( /,/g, "" )
        if( value == "." || value == "" ) {
           return value;
        }
        else if( value.length ) {
            // console.log( "before: ",value )
            let n = Number(value)
            if( isNaN( n ) )
                return
            let parts = value.split('.')
            // console.log( "split: ", parts )
            n = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            if( parts.length > 1 )
                n += "." + parts[1]
            // console.log( "after: ",transfer.amount )
            return n;
       }
    },

    parse_float_with_comma: function(value) {
        // let value = new_state.transfer.amount
        value = value.replace( /,/g, "" )
        let fvalue = parseFloat(value)
        if( value.length && isNaN(fvalue) && value != "." )
           throw "parse_float_with_comma: must be a number"
         else if( fvalue < 0 )
           return 0;

        return fvalue;
    },

    are_equal_shallow: function(a, b) {
        if (!a && b || a && !b) {
            return false;
        }
        if (Array.isArray(a) && Array.isArray(a)) {
            if (a.length > b.length) {
                return false;
            }
        }
        for(var key in a) {
            if(!(key in b) || a[key] !== b[key]) {
                return false;
            }
        }
        for(var key in b) {
            if(!(key in a) || a[key] !== b[key]) {
                return false;
            }
        }
        return true;
    },

    format_date: function(date_str) {
        let date = new Date(date_str);
        return date.toLocaleDateString();
    },

    format_time: function(time_str) {
        let date = new Date(time_str);
        return date.toLocaleString();
    },

    limitByPrecision: function(value, assetPrecision) {
        let valueString = value.toString();
        let splitString = valueString.split(".");
        if (splitString.length === 1 || splitString.length === 2 && splitString[1].length <= assetPrecision) {
            return valueString;
        } else {
            return splitString[0] + "." + splitString[1].substr(0, assetPrecision);
        }
        // let precision = this.get_asset_precision(assetPrecision);
        // value = Math.floor(value * precision) / precision;
        // if (isNaN(value) || !isFinite(value)) {
        //     return 0;
        // }
        // return value;
    },

    estimateFee: function(op_type, options, globalObject) {
        if (!globalObject) return 0;
        let op_code = operations[op_type];
        let currentFees = globalObject.getIn(["parameters", "current_fees", "parameters", op_code, 1]).toJS();

        let fee = 0;
        if (currentFees.fee) {
            fee += currentFees.fee;
        }

        if (options) {
            for (let option of options) {
                fee += currentFees[option];
            }
        }

        return fee * globalObject.getIn(["parameters", "current_fees", "scale"]) / 10000;
    },

    convertPrice: function(fromRate, toRate, fromID, toID) {

        if (!fromRate || !toRate) {
            return null;
        }
        // Handle case of input simply being a fromAsset and toAsset
        if (fromRate.toJS && this.is_object_type(fromRate.get("id"), "asset")) {
            fromID = fromRate.get("id")
            fromRate = fromRate.get("bitasset") ? fromRate.getIn(["bitasset", "current_feed", "settlement_price"]).toJS() : fromRate.getIn(["options", "core_exchange_rate"]).toJS();
        }

        if (toRate.toJS && this.is_object_type(toRate.get("id"), "asset")) {
            toID = toRate.get("id");
            toRate = toRate.get("bitasset") ? toRate.getIn(["bitasset", "current_feed", "settlement_price"]).toJS() : toRate.getIn(["options", "core_exchange_rate"]).toJS();
        }

        let fromRateQuoteID = fromRate.quote.asset_id;
        let toRateQuoteID = toRate.quote.asset_id;

        let fromRateQuoteAmount, fromRateBaseAmount, finalQuoteID, finalBaseID;
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
        priceObject = priceObject.toJS ?  priceObject.toJS() : priceObject;
        let quotePrecision = this.get_asset_precision(fromAsset.get("precision"));
        let basePrecision = this.get_asset_precision(toAsset.get("precision"));

        let assetPrice = this.get_asset_price(priceObject.quote.amount, fromAsset, priceObject.base.amount, toAsset);

        let eqValue = fromAsset.get("id") !== toAsset.get("id") ?
            basePrecision * (amount / quotePrecision) / assetPrice :
            amount;

        if (isNaN(eqValue) || !isFinite(eqValue)) {
            return null;
        }
        return eqValue;
    },

    isValidPrice(rate) {
        if (!rate || !rate.toJS) {
            return false;
        }
        let base = rate.get("base").toJS();
        let quote = rate.get("quote").toJS();
        if ((base.amount > 0 && quote.amount > 0) && (base.asset_id !== quote.asset_id)) {
            return true;
        } else {
            return false;
        }
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

        return inverse ? (intB - intA) : (intA -intB);
    },

    calc_block_time(block_number, globalObject, dynGlobalObject) {
        if (!globalObject || !dynGlobalObject) return null;
        const block_interval = globalObject.get("parameters").get("block_interval");
        const head_block = dynGlobalObject.get("head_block_number");
        const head_block_time = new Date(dynGlobalObject.get("time") + "+00:00");
        const seconds_below = (head_block - block_number) * block_interval;
        return new Date(head_block_time - seconds_below * 1000);
    },

    get_translation_parts(str) {
        let result = [];
        let toReplace = {};
        let re = /{(.*?)}/g;
        let interpolators = str.split(re);
        // console.log("split:", str.split(re));
        return str.split(re);
        // var str = '{{azazdaz}} {{azdazd}}';
        // var m;

        // while ((m = re.exec(str)) !== null) {
        //     if (m.index === re.lastIndex) {
        //         re.lastIndex++;
        //     }
        //     console.log("m:", m);
        //     // View your result using the m-variable.
        //     // eg m[0] etc.
        //     //
        //     toReplace[m[1]] = m[0]
        //     result.push(m[1])
        // }

        // return result;
    },

    get_percentage(a, b) {
        return Math.round((a/b) * 100) + "%";
    },

    replaceName(name, isBitAsset = false) {
        let toReplace = ["TRADE.", "OPEN.", "METAEX."];
        let suffix = "";
        let i;
        for (i = 0; i < toReplace.length; i++) {
            if (name.indexOf(toReplace[i]) !== -1) {
                name = name.replace(toReplace[i], "") + suffix;
                break;
            }
        }

        let prefix = isBitAsset ? "bit" : toReplace[i] ? toReplace[i].toLowerCase() : null;
        if (prefix === "open.") prefix = "";

        return {
            name,
            prefix
        };
    }
};

export default Utils;
