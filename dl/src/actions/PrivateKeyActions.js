var alt = require("../alt-instance");

class PrivateKeyActions {

    addKey(key) {
        this.dispatch(key);
    }

}

module.exports = alt.createActions(PrivateKeyActions);
