import React, {Component} from "react"

import WalletStore from "stores/WalletStore"
import WalletImport from "./WalletImport"

import key from "common/key_utils"
import forms from "newforms"
import cname from "classnames"

export default class WalletCreate extends Component {
    
    constructor() {
        super()
        this.state = { 
            wallet_public_name: "default",
            brainkey: key.suggest_brain_key(key.browserEntropy()),
            password: "",
            password_confirm: "",
            private_wifs: [],
            errors: {},
            isValid: false
        }
        this.validate()
    }
    
    render() {
        var state = this.state
        var errors = state.errors
        var submitDisabled = this.state.isValid ? "" : "disabled"
        var disabled = this.state.notice ? true : false
        
        return <div className="grid-block vertical">
            <form className="name-form"
                onSubmit={this.onSubmit.bind(this)}
                onChange={this.formChange.bind(this)} noValidate
            >
                <div className={cname("grid-content", {"has-error": errors.from})}>
                    <label>Name</label>
                    <input type="text" id="wallet_public_name"
                        className={cname({'disabled': disabled})}
                        value={this.state.wallet_public_name} />
                    <div>{errors.wallet_public_name}</div>
                    <br/>
                </div>
                
                <div className={cname("grid-content", "no-overflow", {
                    'has-error': errors.password_match 
                })}>
                    <label>Password</label>
                    <input type="password" id="password"
                        className={cname({'disabled': disabled})}
                        value={this.state.password} />
                    
                    <label>Password (confirm)</label>
                        <input type="password" id="password_confirm"
                            className={cname({'disabled': disabled})}
                            value={this.state.password_confirm}/>
                    <div>{errors.password_match}</div>
                    <br/>
                </div>
                
                <div className="grid-content">
                    <label>Brain-Key</label>
                    <textarea type="text" id="brainkey"
                        className={cname({'disabled': disabled})}
                        value={this.state.brainkey} />
                    <br/>
                </div>
                
                <div className="grid-content">
                    <WalletImport className={cname({'disabled': disabled})}
                        private_wifs={this.state.private_wifs}/>
                    <br/>
                </div>
                
                { state.notice ?
                <div className="grid-content">
                    <div>{state.notice}</div>
                    <br/>
                </div>
                :
                <div className="grid-content">
                    <input type="submit" value={"Save"}
                        className={cname("button",{disabled:submitDisabled})}/>
                    <br/>
                </div>
                }
                
            </form>
        </div>
    }
    
    noticeConfirm() {
        this.setState({notice: null})
    }
    
    validate() {
        var state = this.state
        var errors = state.errors
        var wallets = WalletStore.getState().wallets
        
        errors.wallet_public_name = 
            ! wallets.get(state.wallet_public_name) ? 
            null : `Wallet ${state.wallet_public_name.toUpperCase()} exists, please change the name`
        
        errors.password_match = null
        errors.password_match =
            state.password === state.password_confirm ||
            //don't report it until the confirm is populated
            (state.password === "" || state.password_confirm === "")
        ? null :
            "Passwords do not match"
        
        var password_unmatch =
            state.password != state.password_confirm
        
        state.isValid = !(errors.wallet_public_name || password_unmatch)
    }
    
    formChange(event) {
        let key = event.target.id
        let value = event.target.value
        this.state[key] = value
        this.validate()
        this.setState(this.state)
    }
    
    onSubmit(e) {
        e.preventDefault()
        WalletStore.onCreate(
            this.state.wallet_public_name,
            this.state.password,
            this.state.brainkey,
            this.state.private_wifs
        ).then( ()=> {
            this.setState({notice: 'Wallet Saved'})
        })
    }
}
