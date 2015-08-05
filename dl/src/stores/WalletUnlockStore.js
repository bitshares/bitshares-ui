import alt from "alt-instance"
import WalletUnlockActions from "actions/WalletUnlockActions"
import WalletDb from "stores/WalletDb"

class WalletUnlockStore {
    
    constructor() {
        this.bindListeners({
            onUnlock: WalletUnlockActions.unlock,
            onLock: WalletUnlockActions.lock,
            onCancel: WalletUnlockActions.cancel
        })
        this.state = {}
    }
    
    onUnlock({resolve, reject}) {
        //DEBUG console.log('... onUnlock setState')
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
}

export default alt.createStore(WalletUnlockStore, 'WalletUnlockStore')
