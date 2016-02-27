import alt from "alt-instance"
import BaseStore from "stores/BaseStore"
import Immutable from "immutable"
import { rfc822Email } from "@graphene/wallet-client"
import { extractSeed } from "@graphene/time-token"
import { validation } from "@graphene/chain"
import WalletDb from "stores/WalletDb"

class AuthStore extends BaseStore {
    
    constructor() {
        super()
        const init = ()=> ({
            password: "", confirm: "", password_error: null, auth_error: null,
            username: "", username_error: "",
            email: "", email_error: null,
            valid: false
        })
        this.state = init()
        this.clear = ()=>{
            this.setState(init())
            this.defaultEmailFromToken()
        }
        this._export("update", "clear", "setup", "login",
            "changePassword", "verifyPassword", "defaultEmailFromToken")
    }
    
    defaultEmailFromToken() {
        let email = emailFromToken()
        if( email )
            this.setState({ email })
    }
    
    /** @return {Promise} */
    login() {
        if( ! this.state.valid ) return Promise.reject()
        let { password, email, username } = this.state
        return WalletDb
            .login({ password, email, username })
            .catch( error =>{
                if(/invalid_auth/.test(error)) {
                    this.setState({ auth_error: true })
                }
                throw error
            })
    }
    
    /** @return undefined */
    changePassword() {
        if( ! this.state.valid ) return
        WalletDb
            .changePassword( this.state )
            .catch( error => this.setState({ auth_error: true }))
    }
    
    /** @return {boolean} */
    verifyPassword() {
        if( ! this.state.valid ) return false
        if( ! WalletDb.verifyPassword( this.state )) {
            this.setState({ auth_error: true })
            return false
        }
        return true
    }
    
    setup({ hasPassword, hasConfirm, hasUsername, hasEmail }) {
        this.config = { hasPassword, hasConfirm, hasUsername, hasEmail }
    }
    
    update(state) {
        const new_state = {...this.state, ...state};
        const check_email = this.checkEmail(new_state)
        const check_username = this.checkUsername(new_state)
        const check_password = this.checkPassword(new_state)
        this.setState({
            ...state,
            ...check_email,
            ...check_username,
            ...check_password,
            valid:
                check_password.password_valid &&
                check_email.email_valid &&
                check_username.username_valid })
    }
    
    checkEmail({ email }) {
        if( ! this.config.hasEmail || email === "") {
            this.setState({ email_valid: true, email_error: null })
            return
        }
        let email_valid = rfc822Email(this.state.email)
        let email_error = email.length > 0 ?
            email_valid ? null : "invalid_email" : null
        
        return { email_valid, email_error }
    }
    
    checkUsername({ username }) {
        if( ! this.config.hasUsername || username === "") {
            this.setState({ username_valid: true, username_error: null })
            return
        }
        let username_valid = validation.is_account_name(username)
        let username_error = username.length > 0 ?
            username_valid ? null : "invalid_username" : null
        
        return { username_valid, username_error }
    }
    
    /**
        @arg {string} data.password - required
        @arg {string} [data.confirm = null] - missing to ignore
    */
    checkPassword({ password = "", confirm = null }) {

        if( ! this.config.hasPassword ) {
            this.setState({ password_valid: true, password_error: null })
            return
        }
        
        confirm = confirm.trim()
        password = password.trim()
        
        var password_error
        // Don't report until typing begins
        if(password.length !== 0 && password.length < 8)
            password_error = "password_length"

        // Don't report it until the confirm is populated
        else if( password !== "" && this.config.hasConfirm && password !== confirm)
            password_error = "password_match"
                
        var password_valid = password.length >= 8 &&
            ( ! this.config.hasConfirm || password === confirm)
        
        return { password, confirm, password_error, password_valid }
    }
    
}

function emailFromToken() {
    let { wallet } = WalletDb.getState()
    if(wallet && wallet.storage.state.has("remote_token")) {
        let remote_token = wallet.storage.state.get("remote_token")
        let email = extractSeed(remote_token)
        return email
    }
}

export var AuthStoreWrapped = alt.createStore(AuthStore, "AuthStore");
export default AuthStoreWrapped
