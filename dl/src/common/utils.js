var numeral = require("numeral");
let id_regex = /\b\d+\.\d+\.(\d+)\b/;

import {object_type} from "chain/chain_types";

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
        return amount / this.get_asset_precision(asset.precision);
    },

    get_asset_price: function(quoteAmount, quoteAsset, baseAmount, baseAsset) {
        return this.get_asset_amount(quoteAmount, quoteAsset) / this.get_asset_amount(baseAmount, baseAsset);
    },

    round_number: function(number, asset) {
        let precision = this.get_asset_precision(asset.precision);
        return Math.round(number * precision) / precision;
    },

    format_number: (number, decimals, trailing_zeros = true) => {
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
        let precision = this.get_asset_precision(asset.precision);

        return `${this.format_number(amount / precision, asset.precision, trailing_zeros)}${!noSymbol ? " " + asset.symbol : ""}`;
    },

    format_price: function(quoteAmount, quoteAsset, baseAmount, baseAsset, noSymbol,inverted,trailing_zeros=true) {
        let precision = this.get_asset_precision(quoteAsset.precision);
        let basePrecision = this.get_asset_precision(baseAsset.precision);
        if (inverted) {
            if (parseInt(quoteAsset.id.split(".")[2], 10) < parseInt(baseAsset.id.split(".")[2], 10)) {
                return `${this.format_number((quoteAmount / precision) / (baseAmount / basePrecision), Math.max(5, quoteAsset.precision),trailing_zeros)}${!noSymbol ? " " + quoteAsset.symbol + "/" + baseAsset.symbol : ""}`;
            } else {
                return `${this.format_number((baseAmount / basePrecision) / (quoteAmount / precision), Math.max(5, baseAsset.precision)),trailing_zeros}${!noSymbol ? " " + baseAsset.symbol + "/" + quoteAsset.symbol : ""}`;
            }
        } else {
            if (parseInt(quoteAsset.id.split(".")[2], 10) > parseInt(baseAsset.id.split(".")[2], 10)) {
                return `${this.format_number((quoteAmount / precision) / (baseAmount / basePrecision), Math.max(5, quoteAsset.precision),trailing_zeros)}${!noSymbol ? " " + quoteAsset.symbol + "/" + baseAsset.symbol : ""}`;
            } else {
                return `${this.format_number((baseAmount / basePrecision) / (quoteAmount / precision), Math.max(5, baseAsset.precision),trailing_zeros)}${!noSymbol ? " " + baseAsset.symbol + "/" + quoteAsset.symbol : ""}`;
            }
        }
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
    }
};

module.exports = Utils;
