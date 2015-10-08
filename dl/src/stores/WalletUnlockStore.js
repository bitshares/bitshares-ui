import alt from "alt-instance"
import WalletUnlockActions from "actions/WalletUnlockActions"
import WalletDb from "stores/WalletDb"

class WalletUnlockStore {
    
    constructor() {
        this.bindActions(WalletUnlockActions)
        this.state = {locked: true}
    }
    
    onUnlock({resolve, reject}) {
        let locked = WalletDb.isLocked()
        if(!locked) resolve(true)
        else this.setState({resolve, reject, locked})
    }
    
    onLock({resolve}) {
        //DEBUG console.log('... WalletUnlockStore\tprogramatic lock', WalletDb.isLocked())
        if(WalletDb.isLocked()) {
            resolve(false)
            return
        }
        WalletDb.onLock()
        resolve(true)
        this.setState({resolve:null, reject:null, locked: WalletDb.isLocked()})
    }
    
    onCancel() {
        this.setState({resolve:null, reject:null})
    }
    
    onChange() {
        this.setState({locked: WalletDb.isLocked()})
    }
}

export default alt.createStore(WalletUnlockStore, 'WalletUnlockStore')
