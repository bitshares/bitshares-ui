import alt from "alt-instance"
import { Map } from "immutable"
import { rfc822Email } from "@graphene/wallet-client"
import { extractSeed } from "@graphene/time-token"
import { validation } from "@graphene/chain"
import WalletDb from "stores/WalletDb"

/** Additional instances */
let instances = new Map()

class AuthStore {
    
    constructor() {
        this.init = ()=> ({
            password: "", confirm: "", password_error: null, auth_error: null,
            username: "", username_error: "",
            email: "", email_error: null,
            valid: false,
            
            setup: this.setup.bind(this),
            update: this.update.bind(this),
            defaults: this.defaults.bind(this),
            useEmailFromToken: this.useEmailFromToken.bind(this),
            login: this.login.bind(this),
            changePassword: this.changePassword.bind(this),
            verifyPassword: this.verifyPassword.bind(this),
            clear: ()=> this.clear(),
        })
        this.clear = ()=> this.setState(this.init())
        this.state = this.init()
        
        this.instance = name => (
            instances = instances
            // By `name`, create new or return prior alt store
            .update(name, store => store ? store : alt.createStore(AuthStore, name + "AuthStore"))
        ).get(name)
        this.exportPublicMethods({
            instance: this.instance.bind(this),
        })
    }
    
    defaults() {
        let { wallet } = WalletDb.getState()
        if(wallet.storage.state.has("email"))
            this.setState({ email: wallet.storage.state.get("email") })
        
        if(wallet.storage.state.has("username"))
            this.setState({ username: wallet.storage.state.get("username") })
    }
    
    useEmailFromToken() {
        let email = emailFromToken()
        let email_verified = this.state.email === emailFromToken()
        if( email )
            this.setState({ email, email_verified })
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
    
    setup({ weak, hasPassword, hasConfirm, hasUsername, hasEmail }) {
        this.config = { weak, hasPassword, hasConfirm, hasUsername, hasEmail }
    }
    
    update(state) {
        const new_state = {...this.state, ...state};
        if(new_state.username)
            new_state.username = new_state.username.toLowerCase()
        
        new_state.email_verified = this.state.email === emailFromToken()
        new_state.auth_error = null
        
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
        // console.log('this.state', this.state, this.config)
    }
    
    checkEmail({ email }) {
        if( ! this.config.hasEmail || (email === "" && this.config.weak)) {
            this.setState({ email_valid: true, email_error: null })
            return
        }
        let email_valid = rfc822Email(this.state.email)
        let email_error = email.length > 0 ?
            email_valid ? null : "invalid_email" : null
        
        return { email_valid, email_error }
    }
    
    checkUsername({ username }) {
        if( ! this.config.hasUsername || (username === ""  && this.config.weak)) {
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
        
        var password_error = null
        
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

export default alt.createStore(AuthStore, "AuthStore")

