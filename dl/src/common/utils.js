var numeral = require("numeral");
let id_regex = /\b\d+\.\d+\.(\d+)\b/;

import {object_type, operations} from "chain/chain_types";

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

    get_asset_precision: (precision) => {
        return Math.pow(10, precision);
    },

    get_asset_amount: function(amount, asset) {
        if (amount === 0) return amount;
        if (!amount) return null;
        return amount / this.get_asset_precision(asset.toJS ? asset.get("precision") : asset.precision);
    },

    get_asset_price: function(quoteAmount, quoteAsset, baseAmount, baseAsset, inverted = false) {
        var price = this.get_asset_amount(quoteAmount, quoteAsset) / this.get_asset_amount(baseAmount, baseAsset);
        return inverted ? 1 / price : price;
    },

    round_number: function(number, asset) {
        let precision = this.get_asset_precision(asset.precision);
        return Math.round(number * precision) / precision;
    },

    format_volume(amount) {
        if (amount < 10) {
            return this.format_number(amount, 2);            
        } else if (amount < 10000) {
            return this.format_number(amount, 0);            
        } else {
            return Math.round(amount / 1000) + "k";
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

    price_to_text: function(price, base, quote, forcePrecision = null) {
        if (typeof price !== "number" || !base || !quote) {
            return;
        }
        let precision;
        let priceText;
        let satoshi = 8;

        if (forcePrecision) {
            priceText = this.format_number(price, forcePrecision);
        } else {
            let quoteID = quote.toJS ? quote.get("id") : quote.id;
            let quotePrecision  = quote.toJS ? quote.get("precision") : quote.precision;
            let baseID = base.toJS ? base.get("id") : base.id;
            let basePrecision  = base.toJS ? base.get("precision") : base.precision;
            if (quoteID === "1.3.0") {
                priceText = this.format_number(price, quotePrecision - 1);
            } else if (baseID === "1.3.0") {
                priceText = this.format_number(price, Math.min(satoshi, quotePrecision + 1));
            } else {
                priceText = this.format_number(price, Math.min(satoshi, quotePrecision + basePrecision));
            }
        }
        let price_split = priceText.split(".");
        let int = price_split[0];
        let dec = price_split[1];
        let i;

        let zeros = 0;
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

    convertPrice: function(quote, base) {
        let quoteID = quote.get("id"),
            baseID = base.get("id");
    
        let quoteRate = quote.get("bitasset") ? quote.getIn(["bitasset", "current_feed", "settlement_price"]).toJS() : quote.getIn(["options", "core_exchange_rate"]).toJS();
        let baseRate =  base.get("bitasset") ? base.getIn(["bitasset", "current_feed", "settlement_price"]).toJS() : base.getIn(["options", "core_exchange_rate"]).toJS();
        
        let quoteCoreRateQuoteID = quoteRate.quote.asset_id;
        let baseCoreRateQuoteID = baseRate.quote.asset_id;

        let quoteCoreRateQuoteAmount, quoteCoreRateBaseAmount;
        if (quoteCoreRateQuoteID === quoteID) {
            quoteCoreRateQuoteAmount = quoteRate.quote.amount;
            quoteCoreRateBaseAmount = quoteRate.base.amount;
        } else {
            quoteCoreRateQuoteAmount = quoteRate.base.amount;
            quoteCoreRateBaseAmount = quoteRate.quote.amount;
        }

        let baseCoreRateQuoteAmount, baseCoreRateBaseAmount;
        if (quoteCoreRateQuoteID === baseID) {
            baseCoreRateQuoteAmount = baseRate.quote.amount;
            baseCoreRateBaseAmount = baseRate.base.amount;
        } else {
            baseCoreRateQuoteAmount = baseRate.base.amount;
            baseCoreRateBaseAmount = baseRate.quote.amount;
        }

        let baseRatio;
        if (baseCoreRateBaseAmount > quoteCoreRateBaseAmount) {
            baseRatio = baseCoreRateBaseAmount / quoteCoreRateBaseAmount;
            quoteCoreRateQuoteAmount *= baseRatio;
        } else {
            baseRatio = quoteCoreRateBaseAmount / baseCoreRateBaseAmount;
            baseCoreRateQuoteAmount *= baseRatio;
        }

        return {quoteAmount: quoteCoreRateQuoteAmount, baseAmount: baseCoreRateQuoteAmount};
    }

};

module.exports = Utils;
