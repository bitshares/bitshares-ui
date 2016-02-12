import React, {Component} from "react"
import {FormattedDate} from "react-intl"
import BrainkeyInput from "components/Wallet/BrainkeyInput"
import WalletUnlock from "components/Wallet/WalletUnlock"
import Translate from "react-translate-component"
import WalletActions from "actions/WalletActions"
import WalletDb from "stores/WalletDb"
import { hash } from "@graphene/ecc"
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
        return <WalletUnlock>{ this.render_unlocked() }</WalletUnlock>
    }
    
    render_unlocked() {
        var content
        var brainkey_backup_date = WalletDb.prop("brainkey_backup_date")
        var brainkey_backup_time = brainkey_backup_date ?
            <h3><Translate content="wallet.verified" /> <FormattedDate value={brainkey_backup_date}/></h3>:
            <h3><Translate content="wallet.brainkey_not_verified" /></h3>

        if(this.state.verified) {
            var sha1 = hash.sha1(this.state.brainkey).toString('hex').substring(0,4)
            content = <div>
                <h3><Translate content="wallet.brainkey" /></h3>
                <div className="card"><div className="card-content">
                    <h5>{this.state.brainkey}</h5></div></div>
                <br/>
                <pre className="no-overflow">{sha1} * Check Digits</pre>
                <br/>
                {brainkey_backup_time}
                <br/>
                <button className="button success" onClick={this.onBack.bind(this)}><Translate content="wallet.done" /></button>
            </div>
        }

        if(!content && this.state.verify) {
            content = <span>
                <h3><Translate content="wallet.backup_brainkey" /></h3>
                <label><Translate content="wallet.reenter_brainkey" /></label>
                <BrainkeyInput onChange={this.onVerifyBrainkey.bind(this)} hideCheckDigits/>
                <div>{this.state.brainkey ?
                        <span><Translate content="wallet.brainkey_no_match" />&hellip;</span>
                :null}</div>
                <br/>
                <button className="button cancel" onClick={this.onBack.bind(this)}><Translate content="wallet.cancel" /></button>
            </span>
        }

        if(!content && this.state.brainkey) {
            var sha1 = hash.sha1(this.state.brainkey).toString('hex').substring(0,4)
            content = <span>
                <h3><Translate content="wallet.brainkey" /></h3>
                <div className="card"><div className="card-content">
                    <h5>{this.state.brainkey}</h5></div></div>
                <br/>
                <pre className="no-overflow">{sha1} * Check Digits</pre>
                <br/>
                <button className="button success" onClick={this.verify.bind(this)}><Translate content="wallet.verify" /></button>
                <button className="button cancel" onClick={this.onBack.bind(this)}><Translate content="wallet.cancel" /></button>
                <hr/>
                <Translate content="wallet.brainkey_w1" /><br/>
                <Translate content="wallet.brainkey_w2" /><br/>
                <Translate content="wallet.brainkey_w3" />
            </span>
        }

        if(!content) {
            var valid = this.state.password && this.state.password !== ""
            content = <span>
                <h3><Translate content="wallet.backup_brainkey" /></h3>
                <label><Translate content="wallet.enter_password" /></label>
                <form onSubmit={this.onSubmit.bind(this)} className="name-form" noValidate>
                    <input type="password" id="password" onChange={this.onPassword.bind(this)}/>
                    <p>
                        {this.state.invalid_password ?
                            <span className="error">Invalid password</span>:
                            <span><Translate content="wallet.pwd4brainkey" /></span>}
                    </p>
                    <div>{brainkey_backup_time}<br/></div>
                    <button className="button success"><Translate content="wallet.show_brainkey" /></button>
                    <button className="button cancel" onClick={this.onBack.bind(this)}><Translate content="wallet.cancel" /></button>
                </form>
            </span>
        }
        return <div className="grid-block vertical" style={{overflowY: 'hidden'}}>
            <div className="grid-container">
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