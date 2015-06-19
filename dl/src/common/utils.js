let id_regex = /\b\d+\.\d+\.(\d+)\b/;

var Utils = {
    get_object_id: (obj_id) => {
        let id_regex_res = id_regex.exec(obj_id);
        console.log("[utils.js:6] ----- get_object_id ----->", obj_id, id_regex_res);
        return id_regex_res ? Number.parseInt(id_regex_res[1]) : 0;
    },

    is_object_id: (obj_id) => {
        let match = id_regex.exec(obj_id);
        return (match !== null && obj_id.split(".").length === 3);
    },

    get_asset_precision: (precision) => {
        return Math.pow(10, precision);
    }
};

module.exports = Utils;
