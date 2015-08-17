import alt from "alt-instance"

import WalletDb from "stores/WalletDb"

class WalletUnlockActions {

    unlock() {
        if ( ! WalletDb.isLocked())
            return Promise.resolve()
        
        //DEBUG console.log('... WalletUnlockActions.unlock')
        return new Promise( (resolve, reject) => {
            this.dispatch({resolve, reject})
        }).then( unlocked => {
            //DEBUG  console.log('... WalletUnlockStore\tmodal unlock')
            WrappedWalletUnlockActions.change()
        }).catch ( ()=>{})
    }
    
    lock() {
        if (WalletDb.isLocked()) return
        //DEBUG  console.log("... WalletUnlockActions\tprogramatic lock")
        this.dispatch()
        WrappedWalletUnlockActions.change()
    }
    
    cancel() {
        this.dispatch()
    }
    
    change() {
        this.dispatch()
        console.log('... WalletUnlockActions.change')
    }
    
}

var WrappedWalletUnlockActions = alt.createActions(WalletUnlockActions)
export default WrappedWalletUnlockActions
