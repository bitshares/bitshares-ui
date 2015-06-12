import {object_type} from "chain/chain_types";
var opTypes = Object.keys(object_type);
console.log(opTypes);

let id_regex = /\b\d+(\.\d+){2}\b/;

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

    order_type: (id) => {
        var type = id.split(".")[1];
        console.log("type:", type, opTypes[type]);
        return opTypes[type];
    }

};

module.exports = Utils;
