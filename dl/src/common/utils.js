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

    get_asset_amount: (amount, asset) => {
        return amount / Math.pow(10, asset.precision);
    },

    format_number: (number, decimals) => {
        let zeros = ".";
        for (var i = 0; i < decimals; i++) {
            zeros += "0"     
        };
        return numeral(number).format("0,0" + zeros);
    }
};

module.exports = Utils;
