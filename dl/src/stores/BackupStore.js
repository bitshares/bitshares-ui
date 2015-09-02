import alt from "alt-instance"
import BackupActions from "actions/BackupActions"
import BaseStore from "stores/BaseStore"

class BackupStore extends BaseStore {
    
    constructor() {
        super()
        this.bindActions(BackupActions)
    }
    
    onBackup(backup) {
        this.setState({backup})
    }
    
}

export var BackupStoreWrapped = alt.createStore(BackupStore)
export default BackupStoreWrapped