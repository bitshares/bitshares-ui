import alt from "alt-instance"
import WalletUnlockActions from "actions/WalletUnlockActions"
import WalletDb from "stores/WalletDb"

class WalletUnlockStore {
    
    constructor() {
        this.bindActions(WalletUnlockActions)
        this.state = {locked: true}
    }
    
    onUnlock({resolve, reject}) {
        //DEBUG console.log('... onUnlock setState', WalletDb.isLocked())
        if( ! WalletDb.isLocked()) {
            resolve()
            return
        }
        this.setState({resolve, reject, locked: WalletDb.isLocked()})
    }
    
    onLock({resolve}) {
        //DEBUG console.log('... WalletUnlockStore\tprogramatic lock', WalletDb.isLocked())
        if(WalletDb.isLocked()) {
            resolve()
            return
        }
        WalletDb.onLock()
        resolve()
        this.setState({resolve:null, reject:null, locked: WalletDb.isLocked()})
    }
    
    onCancel() {
        this.state.reject();
        this.setState({resolve:null, reject:null});
    }
    
    onChange() {
        this.setState({locked: WalletDb.isLocked()})
    }
}

export default alt.createStore(WalletUnlockStore, 'WalletUnlockStore')
