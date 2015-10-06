import React, {Component} from "react"
import {FormattedDate} from "react-intl"
import {BrainkeyInput} from "components/Wallet/Brainkey"
import Translate from "react-translate-component"
import WalletActions from "actions/WalletActions"
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
            invalid_password: false,
            verify: false
        }
    }
    
    render() {
        var content
        var brainkey_backup_date = WalletDb.getWallet().brainkey_backup_date
        var brainkey_backup_time = brainkey_backup_date ?
            <h3>Verified <FormattedDate value={brainkey_backup_date}/></h3>:
            <h3>This Brainkey is not verified</h3>
        
        if(this.state.verified) {
            content = <div>
                <h3>Verified Brainkey</h3>
                <div className="card"><div className="card-content">
                    <h5>{this.state.brainkey}</h5></div></div>
                <br/>
                {brainkey_backup_time}
                <br/>
                <button className="button success" onClick={this.onBack.bind(this)}>Done</button>
            </div>
        }
        
        if(!content && this.state.verify) {
            content = <span>
                <h3>Backup Brainkey</h3>
                <label>Re-Enter Brainkey</label>
                <BrainkeyInput onChange={this.onVerifyBrainkey.bind(this)}/>
                <div>{this.state.brainkey ? 
                        <span>Brainkey does not match, keep going&hellip;</span>
                :null}</div>
                <br/>
                <button className="button cancel" onClick={this.onBack.bind(this)}>Cancel</button>
            </span>
        }
        
        if(!content && this.state.brainkey) {
            content = <span>
                <h3>Backup Brainkey</h3>
                <div className="card"><div className="card-content">
                    <h5>{this.state.brainkey}</h5></div></div>
                <br/>
                <button className="button success" onClick={this.verify.bind(this)}>Verify</button>
                <button className="button cancel" onClick={this.onBack.bind(this)}>Cancel</button>
                <hr/>
                WARNING: Print this out, or write it down.<br/>
                Anyone with access to your recovery key will<br/>
                have access to funds within this wallet.
            </span>
        }
        
        if(!content) {
            var valid = this.state.password && this.state.password !== ""
            content = <span>
                <h3>Backup Brainkey</h3>
                <label>Wallet Password</label>
                <form onSubmit={this.onSubmit.bind(this)} className="name-form" noValidate>
                    <input type="password" id="password" onChange={this.onPassword.bind(this)}/>
                    <p>
                        {this.state.invalid_password ?
                            <span className="error">Invalid password</span>:
                            <span>Enter password to show your brainkey</span>}
                    </p>
                    <div>{brainkey_backup_time}<br/></div>
                    <button className="button success">Show Brainkey</button>
                    <button className="button cancel" onClick={this.onBack.bind(this)}>Cancel</button>
                </form>
            </span>
        }
        return <div className="grid-block vertical" style={{overflowY: 'hidden'}}>
            <div class="grid-container">
                <div className="grid-content no-overflow">
                    {content}
                </div>
            </div>
        </div>
    }
    
    verify() {
        this.setState({ verify: true })
    }
    
    onVerifyBrainkey(brnkey) {
        if(brnkey === this.state.brainkey) {
            this.setState({ verified: true })
            WalletActions.setBrainkeyBackupDate()
        }
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