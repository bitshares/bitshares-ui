var alt = require("../alt-instance");
var SessionActions = require("../actions/SessionActions");

class SessionStore {

    constructor() {
        this.isLocked = true;
        this.bindListeners({
            onUnlock: SessionActions.onUnlock,
            onLock: SessionActions.onLock
        });
    }

    onUnlock() {
        this.isLocked = false;
    }

    onLock() {
        this.isLocked = true;
    }

}

module.exports = alt.createStore(SessionStore, "SessionStore");
