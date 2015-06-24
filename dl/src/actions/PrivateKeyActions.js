var alt = require("../alt-instance");

class PrivateKeyActions {

    addKey(private_key) {
        this.dispatch(private_key);
    }

}

module.exports = alt.createActions(PrivateKeyActions);
