import alt from "alt-instance"
import WalletUnlockActions from "actions/WalletUnlockActions"
import WalletDb from "stores/WalletDb"

class WalletUnlockStore {
    
    constructor() {
        this.bindActions(WalletUnlockActions)
        this.state = {locked: true}
    }
    
    onUnlock({resolve, reject}) {
        //DEBUG console.log('... onUnlock setState')
        if( ! WalletDb.isLocked()) {
            resolve(false)
            return
        }
        this.setState({resolve, reject, locked: false})
    }
    
    onLock({resolve}) {
        //DEBUG console.log('... WalletUnlockStore\tprogramatic lock')
        if(WalletDb.isLocked()) {
            resolve(false)
            return
        }
        WalletDb.onLock()
        resolve(true)
        this.setState({resolve:null, reject:null, locked: true})
    }
    
    onCancel() {
        this.setState({resolve:null, reject:null})
    }
    
    onChange() {
    }
}

export default alt.createStore(WalletUnlockStore, 'WalletUnlockStore')
