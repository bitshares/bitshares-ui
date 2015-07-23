var numeral = require("numeral");
let id_regex = /\b\d+\.\d+\.(\d+)\b/;

var Utils = {
    get_object_id: (obj_id) => {
        let id_regex_res = id_regex.exec(obj_id);
        return id_regex_res ? Number.parseInt(id_regex_res[1]) : 0;
    },

    is_object_id: (obj_id) => {
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

    format_number: (number, decimals) => {
        let zeros = ".";
        for (var i = 0; i < decimals; i++) {
            zeros += "0";     
        }
        return numeral(number).format("0,0" + zeros);
    },

    format_asset: function(amount, asset, noSymbol) {
        let precision = this.get_asset_precision(asset.precision);

        return `${this.format_number(amount / precision, asset.precision)}${!noSymbol ? " " + asset.symbol : ""}`;
    },

    format_price: function(quoteAmount, quoteAsset, baseAmount, baseAsset, noSymbol) {
        let precision = this.get_asset_precision(quoteAsset.precision);
        let basePrecision = this.get_asset_precision(baseAsset.precision);

        return `${this.format_number((quoteAmount / precision) / (baseAmount / basePrecision), Math.max(5, quoteAsset.precision))}${!noSymbol ? " " + quoteAsset.symbol + "/" + baseAsset.symbol : ""}`;
    }
};

module.exports = Utils;
