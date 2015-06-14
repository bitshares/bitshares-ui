var alt = require("../alt-instance");

class DelegateActions {

    changeSetting(value) {
        this.dispatch(value);        
    }
}

module.exports = alt.createActions(DelegateActions);
