var alt = require("alt-instance");

class PrivateKeyActions {

    addKey(private_key_object, transaction) {
        // returned promise is deprecated
        return (dispatch) => {
            return new Promise( resolve => {
                dispatch({private_key_object, transaction, resolve});
            });
        };
    }

    loadDbData() {
        // returned promise is deprecated
        return (dispatch) => {
            return new Promise( resolve => {
                dispatch(resolve);
            });
        };

    }

}

module.exports = alt.createActions(PrivateKeyActions);
