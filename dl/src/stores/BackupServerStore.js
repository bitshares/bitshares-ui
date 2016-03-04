import alt from "alt-instance"
import { fromJS } from "immutable"
import { rfc822Email, WalletWebSocket } from "@graphene/wallet-client"
import WalletDb from "stores/WalletDb"

class BackupServerStore {
    
    constructor() {
        this.init = ()=> ({
            // UI Backup status (will check for wallet.backup_status.xxxx internationalization)
            backup_status: null
        })
        this.state = this.init()
        // this.exportPublicMethods({
        // })
        
        WalletDb.subscribe(this.onWalletUpdate.bind(this))
        WalletWebSocket.api_error_callbacks.add(this.onApiError.bind(this))
    }
    
    onApiError(api_error) {
        this.setState({ api_error: api_error.message })
        console.log('BackupServerStore\tapi_error', api_error)
    }
    
    // update(state) {
    //     this.setState(state)
    //     this.checkEmail(state)
    // }
    
    onWalletUpdate() {
        let wallet = WalletDb.getState().wallet
        if(!wallet) {
            this.setState(this.init())
            return
        }
        
        let { remote_status, local_status } = wallet // socket_status
        let { remote_url, remote_copy, remote_token } = wallet.storage.state.toJS()
        let weak_password  = wallet.wallet_object.get("weak_password")
        
        let backup_status = remote_status // remote_copy === true ? remote_status : local_status
        let state = { 
            remote_status, local_status,
            remote_url, remote_copy, remote_token,
            weak_password, 
            backup_status
        }
        this.setState(state)
        // console.log('BackupServerStore\tstate', state)
    }
    
    
}

export var AltBackupServerStore = alt.createStore(BackupServerStore, "BackupServerStore");
export default AltBackupServerStore
