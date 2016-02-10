import React, {Component} from "react"

import Translate from "react-translate-component";
import {BackupRestore} from "components/Wallet/Backup"
import BrainkeyInput from "components/Wallet/BrainkeyInput"
import PasswordConfirm from "components/Wallet/PasswordConfirm"
import WalletDb from "stores/WalletDb"
import WalletManagerStore from "stores/WalletManagerStore"
import WalletActions from "actions/WalletActions"
import NotificationSystem from 'react-notification-system'
import notify from 'actions/NotificationActions'
import connectToStores from "alt/utils/connectToStores"
import { key } from "@graphene/ecc"
import cname from "classnames"

@connectToStores
class WalletCreate extends Component {

    static getStores() {
        return [WalletManagerStore];
    }
    
    static getPropsFromStores() {
        return {}
    }
    
    render() {
        if(WalletDb.getWallet() && this.props.children)
            return <div>{this.props.children}</div>
        
        return <span>
            <CreateNewWallet {...this.props}/>
        </span>
    }
    
}

@connectToStores
class CreateNewWallet extends Component {
    
    static getStores() {
        return [WalletManagerStore]
    }
    
    static getPropsFromStores() {
        var wallet = WalletManagerStore.getState()
        return wallet
    }
    
    static propTypes = {
        hideTitle: React.PropTypes.bool
    }
    
    constructor() {
        super()
        this.state = { 
            wallet_public_name: "default",
            valid_password: null,
            errors: {},
            isValid: false,
            create_submitted: false,
            custom_brainkey: false,
            brnkey: null
        }
    }
    
    render() {
        let state = this.state
        let errors = state.errors
        let has_wallet = !!this.props.current_wallet
        
        if(this.state.create_submitted &&
            this.state.wallet_public_name === this.props.current_wallet) {
            return <div>
                <h4><Translate content="wallet.wallet_created" /></h4>
                <span onClick={this.onDone.bind(this)}
                    className="button success"><Translate content="wallet.done" /></span>
            </div>
        }
        
        return (<span>
            {this.props.hideTitle ? null:
                <h3><Translate content="wallet.create_wallet" /></h3>}
            <form
                className="name-form"
                onSubmit={this.onSubmit.bind(this)}
                onChange={this.formChange.bind(this)} noValidate
            >
                <PasswordConfirm onValid={this.onPassword.bind(this)}/>
                { has_wallet ? (
                    <div className="grid-content no-overflow">
                        <br/>
                        <label><Translate content="wallet.name" /></label>
                        <input type="text" id="wallet_public_name"
                            defaultValue={this.state.wallet_public_name}
                        />
                        <div className="has-error">{errors.wallet_public_name}</div>
                        <br/>
                    </div>) : null}
                <div className="grid-content no-overflow">
                    { this.state.custom_brainkey ? <div>
                        <label><Translate content="wallet.brainkey" /></label>
                        <BrainkeyInput onChange={this.onBrainkey.bind(this)}/>
                            This BrainKey is not compatable with BTS 1.0
                        <br/>(Use a backup file instead)
                        <br/>&nbsp;
                    </div>:null}
                    <button className={cname("button",{disabled: !(this.state.isValid)})}>
                        <Translate content="wallet.create_wallet" /></button>
                    <button className="button secondary" onClick={this.onBack.bind(this)}>
                        <Translate content="wallet.cancel" /> </button>
                </div>
                <br/>
                { ! this.state.custom_brainkey ? <span>
                <label><a onClick={this.onCustomBrainkey.bind(this)}>
                    <Translate content="wallet.custom_brainkey" /></a></label>
                </span>:null}
            </form>
        </span>)
    }
    
    onBack(e) {
        e.preventDefault()
        window.history.back()
    }
    
    onPassword(valid_password) {
        this.state.valid_password = valid_password
        this.setState({ valid_password })
        this.validate()
    }
    
    onCustomBrainkey() {
        this.setState({ custom_brainkey: true })
    }
    
    onBrainkey(brnkey) {
        this.state.brnkey = brnkey
        this.setState({ brnkey })
        this.validate()
    }

    onSubmit(e) {
        e.preventDefault()
        var wallet_name = this.state.wallet_public_name
        WalletActions.setWallet(wallet_name, this.state.valid_password, this.state.brnkey)
        this.setState({create_submitted: true})
    }
    
    formChange(event) {
        let key_id = event.target.id
        let value = event.target.value
        if(key_id === "wallet_public_name") {
            //case in-sensitive
            value = value.toLowerCase()
            // Allow only valid file name characters
            if( /[^a-z0-9_-]/.test(value) ) return
        }
        
        // Set state is updated directly because validate is going to 
        // require a merge of new and old state
        this.state[key_id] = value
        this.setState(this.state)
        this.validate()
    }
    
    validate() {
        let state = this.state
        let errors = state.errors
        let wallet_names = WalletManagerStore.getState().wallet_names
        errors.wallet_public_name =
            wallet_names.has(state.wallet_public_name) && WalletDb.hasDiskWallet(state.wallet_public_name) ?
            `Wallet ${state.wallet_public_name.toUpperCase()} exists, please change the name` :
            null
        
        var isValid = errors.wallet_public_name === null && state.valid_password !== null
        if(this.state.custom_brainkey && isValid)
            isValid = this.state.brnkey !== null
        this.setState({ isValid, errors })
    }
    
    onDone() {
        window.history.back()
    }
}

export default WalletCreate
