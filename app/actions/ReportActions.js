import alt from "alt-instance";

class ReportActions {
    /** If you get resolved then the wallet is or was just unlocked.  If you get
        rejected then the wallet is still locked.

        @return nothing .. Just test for resolve() or reject()
    */
    open() {
        return dispatch => {
            return new Promise((resolve, reject) => {
                dispatch({resolve, reject});
            })
                .then(was_unlocked => {
                    console.log("was_unlocked ", was_unlocked);
                    //DEBUG  console.log('... WalletUnlockStore\tmodal unlock')
                    console.log("ReportActions ", WrappedReportActions);
                    WrappedReportActions.change();
                })
                .catch(params => {
                    throw params;
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

var WrappedReportActions = alt.createActions(ReportActions);
export default WrappedReportActions;
