import alt from "alt-instance"
import BaseStore from "stores/BaseStore"
import Immutable from "immutable"
import { rfc822Email } from "@graphene/wallet-client"
import { validation } from "@graphene/chain"

class AuthStore extends BaseStore {
    
    constructor() {
        super()
        const init = ()=> ({
            password: "", confirm: "", password_error: null,
            username: "", username_error: "",
            email: "", email_error: null,
            valid: false
        })
        this.state = init()
        this.clear = ()=> this.setState(init())
        this.componentWillUnmount = ()=> this.setState(init())
        this._export("update", "clear", "setup", "login", "changePassword")
    }
    
    login() {
        if( ! this.state.valid ) return Promise.reject()
        let { password, email, username } = this.state
        return WalletDb
            .login({ password, email, username })
            .catch( error => this.setState({ password_error: "invalid_password" }))
    }
    
    changePassword() {
        if( ! this.state.valid ) return
        let { password, email, username } = this.state
        WalletDb
            .changePassword({ password, email, username })
            .catch( error => this.setState({ password_error: "invalid_password" }))
    }
    
    setup({ hasConfirm, hasUsername, hasEmail }) {
        this.config = { hasConfirm, hasUsername, hasEmail }
    }
    
    update(state) {
        this.setState(state)
        this.checkEmail(this.state)
        this.checkUsername(this.state)
        this.checkPassword(this.state)
        this.setState({ valid:
            this.state.password_valid &&
            this.state.email_valid &&
            this.state.username_valid })
    }
    
    checkEmail({ email }) {
        if( ! this.config.hasEmail ) {
            this.setState({ email_valid: true, email_error: null })
            return
        }
        let email_valid = rfc822Email(this.state.email)
        let email_error = email.length > 0 ?
            email_valid ? null : "invalid_email" : null
        
        this.setState({ email_valid, email_error })
    }
    
    checkUsername({ username }) {
        if( ! this.config.hasUsername ) {
            this.setState({ username_valid: true, username_error: null })
            return
        }
        let username_valid = validation.is_account_name(username)
        let username_error = username.length > 0 ?
            username_valid ? null : "invalid_username" : null
        
        this.setState({ username_valid, username_error })
    }
    
    /**
        @arg {string} data.password - required
        @arg {string} [data.confirm = null] - missing to ignore
    */
    checkPassword({ password = "", confirm = null }) {

        confirm = confirm.trim()
        password = password.trim()
        
        var password_error = null
        // Don't report until typing begins
        if(password.length !== 0 && password.length < 8)
            password_error = "password_length"
        
        // Don't report it until the confirm is populated
        else if( password !== "" && this.config.hasConfirm && password !== confirm)
            password_error = "password_match"
                
        var password_valid = password.length >= 8 &&
            ( ! this.config.hasConfirm || password === confirm)
        
        this.setState({ password, confirm,
            password_error, password_valid })
    }
    
}

export var AuthStoreWrapped = alt.createStore(AuthStore, "AuthStore");
export default AuthStoreWrapped
