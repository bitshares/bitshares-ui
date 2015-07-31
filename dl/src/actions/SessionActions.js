var alt = require("../alt-instance");

class SessionActions {

    onUnlock() {
        this.dispatch();
    }

    onLock() {
        this.dispatch();
    }

}

module.exports = alt.createActions(SessionActions);
