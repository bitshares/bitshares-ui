import alt from "alt-instance";

class WalletUnlockActions {
    /** If you get resolved then the wallet is or was just unlocked.  If you get
        rejected then the wallet is still locked.

        @return nothing .. Just test for resolve() or reject()
    */
    unlock() {
        return dispatch => {
            return new Promise((resolve, reject) => {
                dispatch({resolve, reject});
            })
                .then(was_unlocked => {
                    //DEBUG  console.log('... WalletUnlockStore\tmodal unlock')
                    if (was_unlocked) WrappedWalletUnlockActions.change();
                })
                .catch(params => {
                    throw params;
                });
        };
    }

    lock() {
        return dispatch => {
            return new Promise(resolve, reject => {
                dispatch({resolve, reject});
            })
                .then(was_unlocked => {
                    if (was_unlocked) WrappedWalletUnlockActions.change();
                })
                .catch(error => {
                    console.log("Error in MarketsActions.lock: ", error);
                    reject(error);
                });
        };
    }

    cancel() {
        return true;
    }

    change() {
        return true;
    }

    checkLock() {
        return true;
    }
}

var WrappedWalletUnlockActions = alt.createActions(WalletUnlockActions);
export default WrappedWalletUnlockActions;
