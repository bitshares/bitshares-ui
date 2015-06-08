var alt = require("../alt-instance");
var SessionActions = require("../actions/SessionActions");

class SessionStore {
    constructor() {
        this.isUnlocked = true;
        this.inProgress = false;
        this.lockInProgress = false;
        this.failed = false;
        this.lockError = null;

        this.bindListeners({
            unlock: SessionActions.unlock,
            lock: SessionActions.lock
        });

        this.exportPublicMethods({
            getUnlockState: this.getUnlockState
        });
    }

    getUnlockState() {
        return this.getState().isUnlocked;
    }

    unlock(payload) {
        this.inProgress = payload.inProgress;

        if (!this.inProgress) {
            if (payload.unlocked) {
                this.isUnlocked = payload.unlocked;
            }

            if (payload.failed) {
                this.failed = payload.failed;
            }
        }
    }

    lock(payload) {
        this.lockError = payload.lockError;
        this.lockInProgress = payload.lockInProgress;

        if (!this.lockError && !this.lockInProgress) {
            this.isUnlocked = payload.unlocked;
        } else {
            // TODO handle error if any
        }
    }
}

module.exports = alt.createStore(SessionStore, "SessionStore");
