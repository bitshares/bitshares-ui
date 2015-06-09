var Immutable = require("immutable");
var alt = require("../alt-instance");
var PrivateKeyActions = require("../actions/PrivateKeyActions");
var Utils = require("../common/utils");
import {Key} from "./tcomb_structs";


class PrivateKeyStore {
    constructor() {
        this.bindListeners({
            onAddKey: PrivateKeyActions.addKey
        });
    }

    onAddKey(key) {
        console.log("handling onAddKey:", key);
    }

}

module.exports = alt.createStore(PrivateKeyStore, "PrivateKeyStore");
