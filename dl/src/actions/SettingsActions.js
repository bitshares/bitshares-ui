var alt = require("../alt-instance");

class SettingsActions {

    changeSetting(value) {
        this.dispatch(value);        
    }
}

module.exports = alt.createActions(SettingsActions);
