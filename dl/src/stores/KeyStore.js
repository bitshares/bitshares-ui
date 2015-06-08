var Immutable = require("immutable");
var alt = require("../alt-instance");
var KeyActions = require("../actions/KeyActions");
var Utils = require("../common/utils");
import {Key} from "./tcomb_structs";


class KeyStore {
    constructor() {
        this.bindListeners({
            onAddKey: KeyActions.addKey
        });
    }

    onAddKey(key) {
        console.log("handling onAddKey:", key);
    }

}

module.exports = alt.createStore(KeyStore, "KeyStore");
