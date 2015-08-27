import alt from "alt-instance"

class BackupActions {
    
    mount() {
        
        this.dispatch()
        // this.mounted = true
    }
    
    unmount() {
        this.dispatch()
        // this.mounted = false
    }

}

var BackupActionsWrapped = alt.createActions(BackupActions)
export default BackupActionsWrapped