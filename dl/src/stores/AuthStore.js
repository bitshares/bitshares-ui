import alt from "alt-instance"
import { Map } from "immutable"
import { rfc822Email } from "@graphene/wallet-client"
import { extractSeed } from "@graphene/time-token"
import { validation } from "@graphene/chain"
import WalletDb from "stores/WalletDb"
import counterpart from "counterpart"

/** Singleton instances */
let instances = new Map()
let instanceConfig, instanceName

/**
    @arg {string} name - Singleton instance name
    @arg {object} setup - now or later (via props.auth.setup(...).  Also, setup is optional (see AuthStore.setup())
*/
export default (name, config = {}) => {
    instanceName = name
    instanceConfig = config
    instances = instances
        // By `name`, create new or return prior alt store
        .update(name, store => store ? store : alt.createStore(AuthStore, name + "AuthStore"))
    let store = instances.get(name)
    return store
}

/**
    Usage: AuthStore("MyComponent") or AuthStore("MyComponent", {hasConfirm: true, ...})
*/
class AuthStore {
    
    constructor() {
        this.init = ()=> ({
            password: "", confirm: "", password_error: null, auth_error: null,
            email: "", email_error: null,// email_verified: undefined,
            username: "", username_error: "",
            valid: false,
            api_error: null,
            
            // Singleton store methods, these could move to actions where needed: 
            config: ()=> this.config,
            setup: this.setup.bind(this),
            update: this.update.bind(this),
            defaults: this.defaults.bind(this),
            // useEmailFromToken: this.useEmailFromToken.bind(this),
            login: this.login.bind(this),
            changePassword: this.changePassword.bind(this),
            verifyPassword: this.verifyPassword.bind(this),
            clear: ()=> this.clear(),//can't bind, this.clear is undefined at this point
        })
        this.clear = ()=> this.setState(this.init())
        this.state = this.init()
        // weak means the username is optional ( supports old wallets )
        this.config = { hasPassword: true, hasUsername: true, weak: true, hasConfirm: null, hasEmail: null }
        this.config = { ...this.config, ...instanceConfig }
        this.instanceName = instanceName
    }
    
    /** Called after a wallet is opened (if one exists).  Helps with configuration default values. */ 
    setup() {
        // if(this.config.hasConfirm == null)
        //     this.config.hasConfirm = WalletDb.isEmpty() 
        // 
        // let { wallet } = WalletDb.getState()
        // if( wallet ) {
        //     if(wallet.storage.state.has("remote_url")) {
        //         if(wallet.storage.state.has("weak_password") && ! WalletDb.isLocked()) {
        //             let weak_password = wallet.storage.state.get("weak_password")
        //             if(this.config.hasEmail == null) this.config.hasEmail = ! weak_password
        //             if(this.config.hasUsername == null) this.config.hasUsername = ! weak_password
        //         }
        //     }
        // }
        // // hide extra remote backup fields (until everything is ready)
        // if(this.config.hasEmail == null) {
        //     this.config.hasEmail = false
        //     this.config.hasUsername = false
        // }
        // console.log('instanceName,config', this.instanceName,this.config)
    }
    
    defaults() {
        let { wallet } = WalletDb.getState()
        if(wallet.storage.state.has("email"))
            this.setState({ email: wallet.storage.state.get("email") })
        
        if(wallet.storage.state.has("username"))
            this.setState({ username: wallet.storage.state.get("username") })
    }
    
    // useEmailFromToken() {
    //     let email = emailFromToken()
    //     if( ! email) return
    //     if(this.state.email === email && this.state.email_verified) return
    //     this.state.update({ email, email_verified: true })
    // }
    
    /** @return {Promise} */
    login() {
        if( ! this.state.valid ) return Promise.reject()
        let { password, email, username } = this.state
        return WalletDb
            .login({ password, email, username })
            .catch( error =>{
                if(/invalid_auth/.test(error)) {
                    this.setState({ auth_error: true })
                    throw error // lets the caller know
                }
                if(error.cause) {// Server Wallet API error
                    this.setState({ api_error: error.cause.message })
                    console.error(error)
                    // release the unlock dialog, did not re-throw
                }
            })
    }
    
    /** @return {Promise} */
    changePassword() {
        if( ! this.state.valid ) return
        return WalletDb.changePassword( this.state )
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
    
    /**
        // password re-entry ?
        config.confirm: PropTypes.bool,
        
        // Require email and username (as well as password)
        config.weak: PropTypes.bool,
        
        // Off to collect just an email (allows one to verify the email before password prompt)
        config.hasPassword: PropTypes.bool,
        
        // password re-entry ?
        config.hasConfirm: PropTypes.bool,
        
        // Wallets without a server backup may turn this off and use a weak password.  Or this data may be obtained elsewhere.
        config.hasUsername: PropTypes.bool,
        
        // Wallets without a server backup may turn this off and use a weak password.  Or this data may be obtained elsewhere.
        config.hasEmail: PropTypes.bool,

    */
    // setup(config) {
    //     this.config = { ...this.config, ...config }
    // }
    
    update(state) {
        let new_state = {...this.state, ...state};
        
        if(new_state.username)
            new_state.username = new_state.username.toLowerCase().trim()
        
        if(new_state.email)
            new_state.email = new_state.email.toLowerCase().trim()
        
        new_state.auth_error = null
        
        // // If the email token is being used (via useEmailFromToken)
        // if(new_state.email_verified != null ) {
        //     // Wallet password upgrade mode... AuthInput.jsx is watching `email_verified`.
        //     // Let the user work with a verified email and add other fields, but still let them change the email so it becomes unverified (allowing them to send a new token to a different email).
        //     new_state.email_verified = new_state.email === emailFromToken()
        //     if(new_state.email_verified) {
        //         this.config.hasEmail = true
        //         this.config.hasUsername = true
        //         this.config.hasConfirm = true
        //     } else {
        //         this.config.hasEmail = true
        //         this.config.hasUsername = false
        //         this.config.hasPassword = false
        //     }
        // }
        
        const check_email = this.checkEmail(new_state)
        const check_username = this.checkUsername(new_state)
        const check_password = this.checkPassword(new_state)

        new_state = {
            ...new_state,
            ...check_email,
            ...check_username,
            ...check_password,
            valid:
                check_password.password_valid &&
                check_email.email_valid &&
                check_username.username_valid
        }
        
        // console.log('AuthStore\tnew_state', new_state, this.config)
        this.setState(new_state)
    }
    
    checkEmail({ email }) {
        if( ! this.config.hasEmail || (email === "")) {
            return { email_valid: true, email_error: null }
        }
        let email_valid = rfc822Email(email)
        let email_error = email.length > 0 ?
            email_valid ? null : "invalid_email" : null
        
        return { email_valid, email_error }
    }
    
    checkUsername({ username }) {
        if( ! this.config.hasUsername || (username === ""  && this.config.weak)) {
            return { username_valid: true, username_error: null }
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

        if( ! this.config.hasPassword )
            return { password_valid: true, password_error: null }
        
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

// function emailFromToken() {
//     let { wallet } = WalletDb.getState()
//     // `wallet` could be undefined, AuthStore is used to unlock the wallet.. 
//     if( wallet && wallet.storage.state.has("remote_token")) {
//         let remote_token = wallet.storage.state.get("remote_token")
//         let [ email ] = extractSeed(remote_token).split("\t")
//         return email
//     }
// }
