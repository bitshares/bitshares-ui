var alt = require("../alt-instance");

class PrivateKeyActions {

    addKey(private_key_object, transaction) {
        this.dispatch({private_key_object, transaction});
    }

}

module.exports = alt.createActions(PrivateKeyActions);
