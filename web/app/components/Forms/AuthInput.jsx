import React from "react";
import ReactDOM from "react-dom";
import {PropTypes, Component} from "react";
import Translate from "react-translate-component";
import connectToStores from "alt/utils/connectToStores"
import cname from "classnames"

import AccountSelector from "../Account/AccountSelector"
import AuthStore from "stores/AuthStore"

global.tabIndex = global.tabIndex || 0

@connectToStores
export default class AuthInput extends Component {
    
    static propTypes = {
        
        email: PropTypes.string,
        username: PropTypes.string,
        password: PropTypes.string,
        
        // Called with frequently with `null` (invalid) or fully validated data: { email, username, password }.  Use this to enable or disable the submit button and to capture the latest values. 
        onValid: PropTypes.func,
        
        // Display default auth error (invalid authentication)
        authError: PropTypes.bool,
        
        // password re-entry ?
        hasConfirm: PropTypes.bool,
        
        // Wallets without a server backup may turn this off and use a weak password.  Or this data may be obtained elsewhere.
        hasUsername: PropTypes.bool,
        
        // Wallets without a server backup may turn this off and use a weak password.  Or this data may be obtained elsewhere.
        hasEmail: PropTypes.bool,
        
        // Focus the top element after mounting
        shouldFocus: PropTypes.bool,
    }
    
    static defaultProps = {
        hasConfirm: false,
        hasUsername: false,
        hasEmail: false,
        shouldFocus: true,
    }
    
    static getStores() {
        return [AuthStore]
    }
    
    static getPropsFromStores() {
        return AuthStore.getState()
    }
    
    constructor(props) {
        super(props)
        this.clear = ()=> AuthStore.clear()
    }
    
    componentWillMount() {
        // console.log('this.props', this.props)
        let { hasConfirm, hasUsername, hasEmail } = this.props
        AuthStore.setup({ hasConfirm, hasUsername, hasEmail })
    }
    
    componentDidMount() {
        if( this.props.shouldFocus )
            ReactDOM.findDOMNode(this.refs.auth_password).focus()
    }
    
    componentWillReceiveProps(nextProps) {
        console.log('AuthInput nextProps', nextProps)
        if( nextProps.onValid) {
            if( nextProps.valid ) {
                let { email, username, password } = nextProps
                nextProps.onValid({ email, username, password })
            } else {
                nextProps.onValid(null)
            }
        }
    }
    
    componentWillUnmount() {
        console.log("AuthStore.clear");
        AuthStore.clear()
    }
    
    render() {
        return (
            <div>
                { this.passwordForm(this.props) } <br/>
                { this.props.hasEmail ? this.emailForm(this.props) : null}
                { this.props.hasUsername ? this.usernameForm(this.props) : null}
            </div>
        );
    }
    
    passwordForm({password, confirm, password_valid, password_error}) {
        
        let password_class_name = cname("form-group", {"has-error": password_error === "password_length" });
        let password_confirmation_class_name = cname("form-group", {"has-error": password_error === "password_match" });
        
        let passwordChange = event => AuthStore.update({ password: event.target.value })
        let confirmChange = event => AuthStore.update({ confirm: event.target.value })

        return <div className={cname("grid-content", "no-overflow", {"has-error": password_error != null })}>
        
            {/*  P A S S W O R D  */}
            <div>
                <Translate component="label" content="wallet.password" />
                <input type="password" value={password} onChange={passwordChange.bind(this)} tabIndex={++global.tabIndex}
                    id="auth_password" ref="auth_password" autoComplete="off"/>
            </div>
            
            {/* C O N F I R M */}
            { this.props.hasConfirm ?
            <div>
                <Translate component="label" content="wallet.confirm" />
                <input type="password" value={confirm} onChange={confirmChange.bind(this)} id="auth_confirm" tabIndex={++global.tabIndex} />
            </div> :null}
            
            <p className="grid-content has-error">
                <Translate content={ password_error }/>
            </p>
            
        </div>

        // "password_length": "Password must be 8 characters or more"
        // "password_match": "Confirmation doesn't match"
        // "password_incorrect": "Incorrect password"

    }
    
    emailForm({ email }) {
        let emailChange = event => AuthStore.update({ email: event.target.value })
        return <div className={cname("grid-content", "no-overflow", {"has-error": false})}>
            <div className="content-block">
                <Translate component="label" content="wallet.email" />
                <input type="text" value={email} onChange={emailChange.bind(this)} autoComplete="on" tabIndex={++global.tabIndex}/>
            </div>
            { this.props.email_valid ? null :
            <p className="grid-content has-error">
                <Translate content={this.props.email_error}/>
            </p>}
        </div>
    }

    usernameForm({ username }) {
        let userChange = event => AuthStore.update({ username: event.target.value })
        return <div className={cname("grid-content", "no-overflow", {"has-error": false})}>
            <div className="content-block">
                <Translate component="label" content="wallet.username" />
                <input type="text" value={username} onChange={userChange.bind(this)} autoComplete="on" tabIndex={++global.tabIndex}/>
            </div>
            { this.props.username_valid ? null :
            <p className="grid-content has-error">
                <Translate content={this.props.username_error}/>
            </p>}
        </div>
    }
    
    // onKeyDown(e) {
    //     if(this.state.valid && this.props.onEnter && e.keyCode === 13) this.props.onEnter(e);
    // }
    
    // valid() {
    //     return !(this.state.error || this.state.wrong || this.state.doesnt_match) && this.state.value.length >= 8;
    // }

    // checkPasswordConfirmation() {
    //     let confirmation = ReactDOM.findDOMNode(this.refs.confirm_password).value;
    //     let password = ReactDOM.findDOMNode(this.refs.password).value;
    //     this.state.doesnt_match = confirmation && password !== confirmation;
    //     this.setState({doesnt_match: this.state.doesnt_match});
    // }

    // onChange(e) {
    //     e.preventDefault();
    //     e.stopPropagation();
    //     let confirmation = this.props.confirmation ? ReactDOM.findDOMNode(this.refs.confirm_password).value : true;
    //     let password = ReactDOM.findDOMNode(this.refs.password).value;
    //     let email = ReactDOM.findDOMNode(this.refs.auth_email).value;
    //     if(this.props.confirmation) this.checkPasswordConfirmation();
    //     let state = {
    //         valid: !this.state.error && !this.state.wrong
    //         && !(this.props.confirmation && this.state.doesnt_match)
    //         && confirmation && password.length >= 8,
    //         value: password,
    //         email
    //     };
    //     if (this.props.onChange) this.props.onChange(state);
    //     this.setState(state);
    // }

}

// import AltContainer from "alt-container"
// export default class Container extends Component {
//     render() {
//         return (
//             <AltContainer store={AuthStore}>
//                 <AuthInput/>
//             </AltContainer>
//         )
//     }
// }