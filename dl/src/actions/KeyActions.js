var alt = require("../alt-instance");
import Apis from "rpc_api/ApiInstances";

class KeyActions {

    addKey(key) {
        this.dispatch(key);
    }

}

module.exports = alt.createActions(KeyActions);
