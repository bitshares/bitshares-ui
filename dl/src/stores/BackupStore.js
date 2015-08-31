import alt from "alt-instance"
import BackupActions from "actions/BackupActions"

class BackupStore {
    
    constructor() {
        this.bindActions(BackupActions)
    }
    
    onCreateWalletJson(walletObject) {
        console.log('... walletObject',walletObject)
    }
    
}

export var BackupStoreWrapped = alt.createStore(BackupStore)
export default BackupStoreWrapped