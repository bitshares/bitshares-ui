import React, {Component} from "react"

import Translate from "react-translate-component";
import BrainkeyInput from "components/Wallet/BrainkeyInput"
import AuthInput from "components/Forms/AuthInput"
import AuthStore from "stores/AuthStore"
import WalletDb from "stores/WalletDb"
import WalletActions from "actions/WalletActions"
import NotificationSystem from 'react-notification-system'
import notify from 'actions/NotificationActions'
import connectToStores from "alt/utils/connectToStores"
import { key } from "@graphene/ecc"
import cname from "classnames"

@connectToStores
class WalletCreate extends Component {

    static getStores() {
        return [WalletDb];
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

let CreateAuthStore = AuthStore("RecoverCreate", { hasConfirm: true })
let AuthEmail = AuthStore("RecoverAuthEmail", { hasEmail: true, hasPassword: false, hasUsername: false })

@connectToStores
class CreateNewWallet extends Component {
    
    static getStores() {
        return [WalletDb, CreateAuthStore, AuthEmail]
    }
    
    static getPropsFromStores() {
        var wallet = WalletDb.getState()
        wallet.auth = CreateAuthStore.getState()
        wallet.auth_email = AuthEmail.getState()
        return wallet
    }
    
    static propTypes = {
        hideTitle: React.PropTypes.bool
    }
    
    constructor() {
        super()
        this.state = { 
            wallet_public_name: "default",
            errors: {},
            isValid: false,
            create_submitted: false,
            custom_brainkey: false,
            brnkey: null,
            recover: true,
        }
    }
    
    componentWillMount() {
        this.validate()
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
                <AuthInput auth={this.props.auth} />
                { has_wallet ? (
                    <div className=" no-overflow">
                        <br/>
                        <label><Translate content="wallet.name" /></label>
                        <input type="text" id="wallet_public_name"
                            defaultValue={this.state.wallet_public_name}
                        />
                        <div className="has-error">{errors.wallet_public_name}</div>
                        <br/>
                    </div>) : null}
                <div className=" no-overflow">
                    { this.state.custom_brainkey ? <div>
                        <label><Translate content="wallet.brainkey" /></label>
                        <BrainkeyInput onChange={this.onBrainkey.bind(this)}/>
                            This BrainKey is not compatable with BTS 1.0
                        <br/>(Use a backup file instead)
                        <br/>&nbsp;
                    </div>:null}
                    <button className={cname("button",{disabled: ! (this.state.isValid && this.props.auth.valid) })}>
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
    
    onCustomBrainkey() {
        this.setState({ custom_brainkey: true })
    }
    
    onBrainkey(brnkey) {
        this.setState({ brnkey }, ()=> this.validate())
    }
    
    validate() {
        let state = this.state
        let errors = state.errors
        let wallet_names = WalletDb.getState().wallet_names
        errors.wallet_public_name =
            wallet_names.has(state.wallet_public_name) ?
            `Wallet ${state.wallet_public_name.toUpperCase()} exists, please change the name` :
            null

        var isValid = errors.wallet_public_name == null && state.wallet_public_name != ""
        if(state.custom_brainkey && isValid)
            isValid = state.brnkey != null
        
        this.setState({ isValid, errors })
    }

    onSubmit(e) {
        e.preventDefault()
        e.stopPropagation()
        var wallet_name = this.state.wallet_public_name
        WalletActions.setWallet(wallet_name, this.props.auth, this.state.brnkey)
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
        this.setState(this.state, ()=> this.validate())
    }
    
    onDone() {
        window.history.back()
    }
}

export default WalletCreate
