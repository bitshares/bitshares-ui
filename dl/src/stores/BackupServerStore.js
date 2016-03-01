import alt from "alt-instance"
import { fromJS } from "immutable"
import { rfc822Email } from "@graphene/wallet-client"

class BackupServerStore {
    
    constructor() {
        this.init = ()=> ({
            ui_status: "unknown"
        })
        this.state = this.init()
        this.exportPublicMethods({
            setWallet: this.setWallet.bind(this),
            update: this.update.bind(this),
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
    
    update(state) {
        this.setState(state)
        this.checkEmail(state)
    }
    
    checkEmail({ email }) {
        let email_valid = rfc822Email(email)
        let email_error = email.length > 0 ?
            email_valid ? null : "invalid_email" : null
        
        this.setState({ email_valid, email_error })
    }
    
    notify() {
        let { socket_status, remote_status, local_status } = this.wallet
        let { remote_url, remote_copy, remote_token } = this.wallet.storage.state.toJS()
        let weak_password  = this.wallet.wallet_object.get("weak_password")
        
        let ui_status = remote_copy != null ? "configure" : "unknown"
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
