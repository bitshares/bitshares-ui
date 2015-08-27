import alt from "alt-instance"
import BackupActions from "actions/BackupActions"

class BackupStore {
    
    constructor() {
        this.bindActions(BackupActions)
        
    }
    
    onMount() {
        this.mounted = true
    }
    
    onUnmount() {
        this.mounted = false
    }
}

export var BackupStoreWrapped = alt.createStore(BackupStore)
export default BackupStoreWrapped