var alt = require("../alt-instance");
import mockUtils from "./mockApi";

class SessionActions {

    unlock(input) {
        // Dispatch here for possible loading state
        this.dispatch({inProgress: true});

        // Fire rpc call to unlock (this will be a rpc lib call)
        let mockApiCall = mockUtils.getMock();

        mockApiCall.then((result) => {
            if (result === true) {
                this.dispatch({inProgress: false, unlocked: true, failed: false});
            }
        })
        .catch((error) => {
            this.dispatch({inProgress: false, unlocked: false, failed: true, error: error});
        });
    }

    lock() {
        this.dispatch({lockInProgress: true});
        // Fire rpc call to lock (this will be a rpc lib call)
        let mockApiCall = mockUtils.getMock();

        mockApiCall.then((result) => {
            // Unlock successful
            if (result === true) {
                this.dispatch({lockInProgress: false, unlocked: false, lockError: null});
            }
        })
        .catch((error) => {
            this.dispatch({lockInProgress: false, lockError: true, error: error});
        });
    }
}

module.exports = alt.createActions(SessionActions);
