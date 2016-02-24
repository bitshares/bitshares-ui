import alt from "alt-instance"

class WalletUnlockActions {

    /** If you get resolved then the wallet is or was just unlocked.  If you get
        rejected then the wallet is still locked.
        
        @return test for resolve() or reject() 
    */
    unlock() {
        return new Promise( (resolve, reject) => {
            this.dispatch({resolve, reject})
        }).then( was_unlocked => {
            WrappedWalletUnlockActions.unlocked();
            //if(was_unlocked)
            //    WrappedWalletUnlockActions.change()
        })
    }
    
    lock() {
        return new Promise( resolve => {
            this.dispatch({resolve})
        }).then( was_unlocked => {
            WrappedWalletUnlockActions.locked();
            //if(was_unlocked)
            //    WrappedWalletUnlockActions.change()
        })
    }
    
    cancel() {
        this.dispatch()
    }
    
    change() {
        this.dispatch()
    }

    unlocked() {
        this.dispatch();
    }

    locked() {
        this.dispatch();
    }
}

var WrappedWalletUnlockActions = alt.createActions(WalletUnlockActions)
export default WrappedWalletUnlockActions
