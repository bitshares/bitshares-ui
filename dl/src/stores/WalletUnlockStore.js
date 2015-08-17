import alt from "alt-instance"
import WalletUnlockActions from "actions/WalletUnlockActions"
import WalletDb from "stores/WalletDb"

class WalletUnlockStore {
    
    constructor() {
        this.bindActions(WalletUnlockActions)
        this.state = {}
    }
    
    onUnlock({resolve, reject}) {
        //DEBUG console.log('... onUnlock setState')
        if( ! WalletDb.isLocked()) {
            resolve()
            return
        }
        this.setState({resolve, reject})
    }
    
    onLock() {
        //DEBUG console.log('... WalletUnlockStore\tprogramatic lock')
        WalletDb.onLock()
        this.setState({resolve:null, reject:null})
    }
    
    onCancel() {
        this.setState({resolve:null, reject:null})
    }
    
    onChange() {
    }
}

export default alt.createStore(WalletUnlockStore, 'WalletUnlockStore')
