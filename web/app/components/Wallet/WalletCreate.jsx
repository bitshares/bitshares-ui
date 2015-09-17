import React, {Component} from "react"

import {BackupRestore} from "components/Wallet/Backup"
import WalletDb from "stores/WalletDb"
import WalletManagerStore from "stores/WalletManagerStore"
import WalletActions from "actions/WalletActions"
import NotificationSystem from 'react-notification-system'
import notify from 'actions/NotificationActions'
import connectToStores from "alt/utils/connectToStores"
import key from "common/key_utils"
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
            password: "",
            password_confirm: "",
            errors: {},
            isValid: false,
            create_submitted: false
        }
        this.validate()
    }
    
    render() {
        let state = this.state
        let errors = state.errors
        let has_wallet = !!this.props.current_wallet
        
        if(this.state.create_submitted &&
            this.state.wallet_public_name === this.props.current_wallet) {
            return <div>
                <h4>Wallet Created</h4>
                <span onClick={this.onDone.bind(this)}
                    className="button success">Done</span>
            </div>
        }
        
        return (<span>
            {this.props.hideTitle ? null:<h3>Create Wallet</h3>}
            <form
                className="name-form"
                onSubmit={this.onSubmit.bind(this)}
                onChange={this.formChange.bind(this)} noValidate
            >
                <div className={cname("grid-content", "no-overflow", {"has-error": errors.password_match || errors.password_length})}>
                    <label>Password</label>
                    <input type="password" id="password" value={this.state.password} autoComplete="off" />

                    <label>Password (confirm)</label>
                    <input type="password" id="password_confirm" value={this.state.password_confirm} autoComplete="off"/>
                    <div>{errors.password_match || errors.password_length}</div>
                    <br/>
                    { has_wallet ? <div>
                        <label>Wallet Name</label>
                        <input type="text" id="wallet_public_name"
                            value={this.state.wallet_public_name}
                        />
                    <div className="has-error">{errors.wallet_public_name}</div>
                        <br/>
                    </div>:null}
                </div>

                <div className="grid-content no-overflow">
                    <button className={cname("button",{disabled: !(this.state.password && this.state.isValid)})}>Create</button>
                </div>
            </form>
        </span>)
    }

    onSubmit(e) {
        e.preventDefault()
        var wallet_name = this.state.wallet_public_name
        WalletActions.setWallet(wallet_name, this.state.password)
        this.setState({create_submitted: true})
    }
    
    validate() {
        let state = this.state
        let errors = state.errors
        let wallet_names = WalletManagerStore.getState().wallet_names
        errors.password_length = state.password.length === 0 || state.password.length > 7 ? null : "Password must be longer than 7 characters";
        
        errors.wallet_public_name = 
            !wallet_names.has(state.wallet_public_name) ? 
            null : `Wallet ${state.wallet_public_name.toUpperCase()} exists, please change the name`
        
        errors.password_match = null
        errors.password_match =
            state.password === state.password_confirm ||
            //don't report it until the confirm is populated
            (state.password === "" || state.password_confirm === "")
        ? null :
            "Passwords do not match"
        
        let password_unmatch =
            state.password !== state.password_confirm
        
        var isValid = !(errors.wallet_public_name || password_unmatch || errors.password_length)
        this.setState({isValid})
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
        //TODO BrainKeyCreate.jsx
        //key.suggest_brain_key(key.browserEntropy())
        //if(key_id === "brainkey") {
        //    value = value.toUpperCase()
        //    value = value.split(/[\t\n\v\f\r ]+/).join(" ")
        //}
        
        // Set state is done directly because validate is going to 
        // require a merge of new and old state
        this.state[key_id] = value
        this.validate()
    }
    
    onDone() {
        window.history.back()
    }
}

export default WalletCreate
