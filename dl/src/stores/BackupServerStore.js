import alt from "alt-instance"
import { fromJS } from "immutable"
import { rfc822Email } from "@graphene/wallet-client"

class BackupServerStore {
    
    constructor() {
        this.init = ()=> ({
            ui_status: null
        })
        this.state = this.init()
        this.exportPublicMethods({
            setWallet: this.setWallet.bind(this),
            // update: this.update.bind(this),
        })
    }
    
    setWallet(wallet) {
        this.state = this.init()
        if(this.wallet && this._notify_subscription)
            this.wallet.unsubscribe(this._notify_sub)
        
        this.wallet = wallet
        this.notify()
        this._notify_subscription = this.notify.bind(this)
        this.wallet.subscribe(this._notify_subscription)
    }
    
    // update(state) {
    //     this.setState(state)
    //     this.checkEmail(state)
    // }
    
    notify() {
        let { socket_status, remote_status, local_status } = this.wallet
        let { remote_url, remote_copy, remote_token } = this.wallet.storage.state.toJS()
        let weak_password  = this.wallet.wallet_object.get("weak_password")
        
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
