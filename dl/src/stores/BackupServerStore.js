import alt from "alt-instance"
import { fromJS } from "immutable"
import { rfc822Email, WalletWebSocket } from "@graphene/wallet-client"
import WalletDb from "stores/WalletDb"

class BackupServerStore {
    
    constructor() {
        this.init = ()=> ({
            // UI Backup status (will check for wallet.backup_status.xxxx internationalization)
            backup_status: "unknown",
            socket_status: null,
            api_error: null,
        })
        this.state = this.init()
        WalletDb.subscribe(this.onUpdate.bind(this))
        WalletWebSocket.api_status.add(this.onApiError.bind(this))
        WalletWebSocket.socket_status.add(this.onSocketChange.bind(this))
    }
    
    onApiError(api_error) {
        if(api_error)
            console.log('ERROR\tBackupServerStore api_error', api_error)
        
        this.setState({ api_error: api_error ? api_error.message : null })
        this.onUpdate()
    }
    
    onSocketChange(socket_status) {
        // console.log('BackupServerStore\tsocket_status', socket_status)
        this.setState({ socket_status })
        this.onUpdate()
    }
    
    onUpdate() {
        let wallet = WalletDb.getState().wallet
        if(!wallet) {
            this.setState(this.init())
            return
        }
        
        let { remote_status, local_status } = wallet // socket_status
        let { remote_url, remote_copy, remote_token } = wallet.storage.state.toJS()
        let { socket_status } = this.state
        // let weak_password  = wallet.wallet_object.get("weak_password")
        
        let backup_status = remote_copy !== true ? "disabled" :
            socket_status !== "open" ? socket_status :
            remote_status !== "Not Modified" ? remote_status :
            "backed_up"
        
        let state = { 
            remote_status, local_status,
            remote_url, remote_copy, remote_token,
            // weak_password, 
            backup_status
        }
        this.setState(state)
        // console.log('BackupServerStore\tstate', state)
    }
    
    
}

export var AltBackupServerStore = alt.createStore(BackupServerStore, "BackupServerStore");
export default AltBackupServerStore
