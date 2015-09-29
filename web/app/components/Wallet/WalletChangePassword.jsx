import React, {PropTypes, Component} from "react"
import Translate from "react-translate-component"
import notify from "actions/NotificationActions"
import cname from "classnames"
import WalletDb from "stores/WalletDb"
import PasswordInput from "components/Forms/PasswordInput"

export default class WalletChangePassword extends Component {
    constructor() {
        super()
        this.state = {}
    }
    
    render() {
        var ready = !!this.state.new_password
        return <span>
            <h3><Translate content="wallet.change_password"/></h3>
            <WalletPassword onValid={this.onOldPassword.bind(this)}>
                <PasswordConfirm onValid={this.onNewPassword.bind(this)}/>
                <div className={cname("button success", {disabled: ! ready})}
                    onClick={this.onAccept.bind(this)}><Translate content="wallet.accept" /></div>
            </WalletPassword>
            <Reset/>
        </span>
    }
    
    onAccept() {
        var {old_password, new_password} = this.state
        WalletDb.changePassword(old_password, new_password, true/*unlock*/)
            .then(()=> {
                notify.success("Password changed")
                window.history.back()
            })
            .catch( error => {
                // Programmer or database error ( validation missed something? )
                // .. translation may be unnecessary
                console.error(error)
                notify.error("Unable to change password: " + error)
            })
    }
    onOldPassword(old_password) { this.setState({ old_password }) }
    onNewPassword(new_password) { this.setState({ new_password }) }
}

import Immutable from "immutable"

class PasswordConfirm extends Component {
    
    static propTypes = {
        // Called everytime a valid password is provided and matches a confirmed password
        onValid: PropTypes.func.isRequired
    }
    
    constructor() {
        super()
        this.state = {
            password: "",
            confirm: "",
            errors: Immutable.Map(),
            // An empty form has no errors but is still invaid
            valid: false
        }
    }
    
    render() {
        var {password, confirm, valid, errors} = this.state
        return <div className={cname(
            "grid-content", "no-overflow", {"has-error": errors.size})}>
            <div>
                <Translate component="label" content="wallet.password" />
                <input type="password" id="password"
                    onChange={this.formChange.bind(this)}
                    value={this.state.password}/>
            </div>
            <div>
                <Translate component="label" content="wallet.confirm" />
                <input type="password" id="confirm"
                    onChange={this.formChange.bind(this)}
                    value={this.state.confirm}/>
            </div>
            <div>{errors.get("password_match") || errors.get("password_length")}</div>
            <br/>
        </div>
    }
    
    formChange(event) {
        var state = this.state
        state[event.target.id] = event.target.value
        this.setState(state)
        this.validate(state)
    }
    
    validate(state) {
        var {password, confirm} = state
        confirm = confirm.trim()
        password = password.trim()
        
        var errors = Immutable.Map()
        // Don't report until typing begins
        if(password.length !== 0 && password.length < 8)
            errors = errors.set("password_length", "Password must 8 characters or more")
        
        // Don't report it until the confirm is populated
        if( password !== "" && confirm !== "" && password !== confirm)
            errors = errors.set("password_match", "Passwords do not match")
        
        var valid = password.length >= 8 && password === confirm
        this.setState({errors, valid})
        if(valid) this.props.onValid(password)
    }
}

class WalletPassword extends Component {
    
    static propTypes = {
        onValid: React.PropTypes.func.isRequired
    }
    
    constructor() {
        super()
        this.state = {
            password: null,
            verified: false
        }
    }
    
    render() {
        if(this.state.verified) return <span>{this.props.children}</span>
        return <span>
            <label><Translate content="wallet.existing_password"/></label>
            <input type="password" id="password"
                onChange={this.formChange.bind(this)}
                value={this.state.password}/>
            <span className="button success"
                onClick={this.onPassword.bind(this)}><Translate content="wallet.verify" /></span>
        </span>
    }
    
    onPassword() {
        if( WalletDb.validatePassword(this.state.password) ) {
            this.setState({ verified: true })
            this.props.onValid(this.state.password)
        } else
            notify.error("Invalid Password")
    }
    
    formChange(event) {
        var state = {}
        state[event.target.id] = event.target.value
        this.setState(state)
    }
    
}

class Reset extends Component {
    
    render() {
        var label = this.props.label || <Translate content="wallet.reset" />
        return  <span className="button cancel"
            onClick={this.onReset.bind(this)}>{label}</span>
    }
    
    onReset() {
        window.history.back()
    }
}