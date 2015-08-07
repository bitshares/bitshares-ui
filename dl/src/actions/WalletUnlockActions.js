import alt from "alt-instance"

class WalletUnlockActions {

    onChange() {
    }
    
    unlock() {
        //DEBUG console.log('... WalletUnlockActions.unlock')
        return new Promise( (resolve, reject) => {
            this.dispatch({resolve, reject})
        }).then( unlocked => {
            //DEBUG  console.log('... WalletUnlockStore\tmodal unlock')
            WrappedWalletUnlockActions.onChange()
        }).catch( locked => {
            //DEBUG  console.log('... WalletUnlockStore\tmodal lock',locked)
            WrappedWalletUnlockActions.onChange()
        })
    }
    
    lock() {
        //DEBUG  console.log("... WalletUnlockActions\tprogramatic lock")
        this.dispatch()
    }
    
    cancel() {
        this.dispatch()
    }
}

var WrappedWalletUnlockActions = alt.createActions(WalletUnlockActions)
export default WrappedWalletUnlockActions
