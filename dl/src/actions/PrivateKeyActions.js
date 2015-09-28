var alt = require("../alt-instance");

class PrivateKeyActions {

    addKey(private_key_object, transaction) {
        // returned promise is deprecated
        return new Promise( resolve => {
            this.dispatch({private_key_object, transaction, resolve})
        })
    }
    
    loadDbData() {
        // returned promise is deprecated
        return new Promise( resolve => {
            this.dispatch(resolve)
        })
    }

}

module.exports = alt.createActions(PrivateKeyActions);
