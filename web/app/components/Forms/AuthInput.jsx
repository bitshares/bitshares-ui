import React from "react";
import ReactDOM from "react-dom";
import {PropTypes, Component} from "react";
import Translate from "react-translate-component";
// import connectToStores from "alt/utils/connectToStores"
import cname from "classnames"

import AccountSelector from "../Account/AccountSelector"
// import AuthStore from "stores/AuthStore"
import WalletDb from "stores/WalletDb"

let tabIndex = 2 // AccountCreate -> AccountNameInput is 1

// connectToStores
export default class AuthInput extends Component {
    
    static propTypes = {
        
        // Properties from AuthStore.getState()
        // auth: PropTypes.object.isRequired,
        
        email: PropTypes.string,
        username: PropTypes.string,
        password: PropTypes.string,
        confirm: PropTypes.string,
        
        // Called with frequently with `null` (invalid) or fully validated data: { email, username, password }.  Use this to enable or disable the submit button and to capture the latest values. 
        onValid: PropTypes.func,
        
        // Display default auth error (invalid authentication)
        authError: PropTypes.bool,
        
        // Require email and username (as well as password)
        weak: PropTypes.bool,
        
        // Off to collect just an email (allows one to verify the email before password prompt)
        hasPassword: PropTypes.bool,
        
        // password re-entry ?
        hasConfirm: PropTypes.bool,
        
        // Wallets without a server backup may turn this off and use a weak password.  Or this data may be obtained elsewhere.
        hasUsername: PropTypes.bool,
        
        // Wallets without a server backup may turn this off and use a weak password.  Or this data may be obtained elsewhere.
        hasEmail: PropTypes.bool,
        
        // Focus the top element after mounting
        focus: PropTypes.bool,
    }
    
    static defaultProps = {
        weak: true, // support local only wallets by default..
        hasPassword: true,
        hasConfirm: false,
        // hasUsername: true,
        // hasEmail: true,
        focus: true,
        authError: false,
    }
    
    // static getStores() {
    //     return [AuthStore]
    // }
    // 
    // static getPropsFromStores() {
    //     return AuthStore.getState()
    // }
    
    componentDidMount() {
        if( this.props.focus ) this.focus()
    }
    
    render() {
        // Simply turining email and username on does not "require" them... Weak = false will make those required.
        let { weak, hasPassword, hasConfirm, hasUsername, hasEmail } = this.props
        if( weak == false ) {
            hasEmail = true
            hasUsername = true
        }
        if( hasEmail === undefined || hasUsername === undefined) {
            let { wallet } = WalletDb.getState()
            if( wallet && wallet.storage.state.has("weak_password")) {
                let weak_wallet = wallet.storage.state.get("weak_password")
                if(hasEmail === undefined)
                    hasEmail = ! weak_wallet
                
                if(hasUsername === undefined)
                    hasUsername = ! weak_wallet
            }
        }
        this.props.auth.setup({ weak, hasPassword, hasConfirm, hasUsername, hasEmail })
        return (
            <div>
                { this.props.hasPassword ? this.passwordForm(this.props.auth) : null } <br/>
                { this.props.hasEmail ? this.emailForm(this.props.auth) : null}
                { this.props.hasUsername ? this.usernameForm(this.props.auth) : null}
                <p className="has-error">
                    <Translate content={ this.props.auth.auth_error ? "wallet.invalid_auth" : null }/>
                </p>
            </div>
        );
    }
    
    focus() { try {
        if( this.props.focus ) {
            if( this.props.hasPassword  )
                ReactDOM.findDOMNode(this.refs.auth_password).focus()
            else if( this.props.hasEmail )
                ReactDOM.findDOMNode(this.refs.auth_email).focus()
            else if( this.props.hasUsername )
                ReactDOM.findDOMNode(this.refs.auth_username).focus()
        }
    } catch(e) {}}
    
    passwordForm({password, confirm, password_valid, password_error}) {
        
        let passwordChange = event => this.props.auth.update({ password: event.target.value })
        let confirmChange = event => this.props.auth.update({ confirm: event.target.value })
        
        // "grid-content", "no-overflow", 
        return <div className={cname("form-group", "no-margin", {"has-error": password_error != null })}>
        
            {/*  P A S S W O R D  */}
            <div>
                <Translate component="label" content="wallet.password" />
                <input type="password" value={password} onChange={passwordChange.bind(this)} tabIndex={tabIndex++}
                    id="auth_password" ref="auth_password" autoComplete="off"/>
            </div>
            
            {/* C O N F I R M */}
            { this.props.hasConfirm ?
            <div>
                <Translate component="label" content="wallet.confirm" />
                <input type="password" value={confirm} onChange={confirmChange.bind(this)} id="auth_confirm" tabIndex={tabIndex++} />
            </div> :null}
            <p className="has-error">
                <Translate content={ password_error ? "wallet." + password_error : null }/>
            </p>
        </div>
    }
    
    emailForm({ email }) {
        let emailChange = event => this.props.auth.update({ email: event.target.value })
        return <div className={cname("form-group", "no-margin", {"has-error": false})}>
            <div>
                <Translate component="label" content="wallet.email" />
                <input id="email" type="text" value={email} onChange={emailChange.bind(this)} autoComplete="on" tabIndex={tabIndex++} ref="auth_email"/>
            </div>
            { this.props.auth.email_valid ? null :
            <p className="has-error">
                <Translate content={this.props.auth.email_error}/>
            </p>}
        </div>
    }

    usernameForm({ username }) {
        let userChange = event => this.props.auth.update({ username: event.target.value })
        return <div className={cname("form-group", "no-margin", {"has-error": false})}>
            <div>
                <Translate component="label" content="account.name" />
                <input id="username" type="text" value={username} onChange={userChange.bind(this)} autoComplete="on" tabIndex={tabIndex++} ref="auth_username"/>
            </div>
            { this.props.auth.username_valid ? null :
            <p className="has-error">
                <Translate content={this.props.auth.username_error}/>
            </p>}
        </div>
    }
    
}