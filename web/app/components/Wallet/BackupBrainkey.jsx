import React, {Component} from "react"
import Translate from "react-translate-component"
import WalletDb from "stores/WalletDb"
import cname from "classnames"

export default class BackupBrainkey extends Component {
    
    constructor() {
        super()
        this.state = this._getInitialState()
    }
    
    _getInitialState() {
        return {
            password: null,
            brainkey: null,
            invalid_password: false
        }
    }
    
    render() {
        var content
        if(this.state.brainkey) {
            
            content = <span>
                <div className="card"><div className="card-content">
                    <h5>{this.state.brainkey}</h5></div></div>
                <br/>
                <div className="button" onClick={this.reset.bind(this)}>hide</div>
            </span>
        }
        
        if(!content) {
            var valid = this.state.password && this.state.password !== ""
            content = <span>
                <label>Wallet Password</label>
                <form onSubmit={this.onSubmit.bind(this)} className="name-form" noValidate>
                    <input type="password" id="password" onChange={this.onPassword.bind(this)}/>
                    <p>
                        {this.state.invalid_password ?
                            <span className="error">Invalid password</span>:
                            <span>Enter password to show your brainkey</span>}
                    </p>
                    <button className="button success">Show Brainkey</button>
                    <button className="button cancel" onClick={this.onBack.bind(this)}>Cancel</button>
                </form>
            </span>
        }
        return <span className="grid-content">
            <h3>Backup Brainkey</h3>
            {content}
            <hr/>
            WARNING: It is not possible to recover a lost recovery key. Make a backup, print it out, or write it down. Anyone with access to your recovery key will have access to keys and accounts created with this wallet.
        </span>
    }
    
    reset() {
        this.setState(this._getInitialState())
    }
    
    onBack(e) {
        e.preventDefault()
        window.history.back()
    }
    
    onSubmit(e) {
        e.preventDefault()
        var was_locked = WalletDb.isLocked()
        if(WalletDb.validatePassword(this.state.password, true)) {
            var brainkey = WalletDb.getBrainKey()
            if(was_locked) WalletDb.onLock()
            this.setState({ brainkey })
        } else 
            this.setState({ invalid_password: true })
    }

    onPassword(event) {
        this.setState({ password: event.target.value, invalid_password: false })
    }
}