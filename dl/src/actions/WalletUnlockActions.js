import alt from "alt-instance"

class WalletUnlockActions {

    unlock() {
        //DEBUG console.log('... WalletUnlockActions.unlock')
        return new Promise( (resolve, reject) => {
            this.dispatch({resolve, reject})
        }).then( unlocked => {
            //DEBUG  console.log('... WalletUnlockStore\tmodal unlock')
            if(unlocked)
                WrappedWalletUnlockActions.change()
            return unlocked
        }).catch ( ()=>{})
    }
    
    lock() {
        //DEBUG  console.log("... WalletUnlockActions\tprogramatic lock")
        return new Promise( resolve => {
            this.dispatch({resolve})
        }).then( unlocked => {
            if(unlocked)
                WrappedWalletUnlockActions.change()
        })
    }
    
    cancel() {
        this.dispatch()
    }
    
    change() {
        this.dispatch()
        //DEBUG console.log('... WalletUnlockActions.change')
    }
    
}

var WrappedWalletUnlockActions = alt.createActions(WalletUnlockActions)
export default WrappedWalletUnlockActions
