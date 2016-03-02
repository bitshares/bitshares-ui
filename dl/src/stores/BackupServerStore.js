import alt from "alt-instance"
import { fromJS } from "immutable"
import { rfc822Email } from "@graphene/wallet-client"
import WalletDb from "stores/WalletDb"

class BackupServerStore {
    
    constructor() {
        this.init = ()=> ({
            ui_status: null
        })
        this.state = this.init()
        this.exportPublicMethods({
        })
        WalletDb.subscribe(this.notify.bind(this))
    }
    
    // update(state) {
    //     this.setState(state)
    //     this.checkEmail(state)
    // }
    
    notify() {
        let wallet = WalletDb.getState().wallet
        let { socket_status, remote_status, local_status } = wallet
        let { remote_url, remote_copy, remote_token } = wallet.storage.state.toJS()
        let weak_password  = wallet.wallet_object.get("weak_password")
        
        let ui_status = remote_copy === true ? remote_status : local_status
        let state = { 
            socket_status, remote_status, local_status,
            remote_url, remote_copy, remote_token,
            weak_password, 
            ui_status
        }
        this.setState(state)
        // console.log('BackupServerStore\tstate', state)
    }
    
    
}

export var AltBackupServerStore = alt.createStore(BackupServerStore, "BackupServerStore");
export default AltBackupServerStore
