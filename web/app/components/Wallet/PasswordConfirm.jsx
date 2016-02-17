import ReactDOM from "react-dom"
import React, {PropTypes, Component} from "react"
import Translate from "react-translate-component"
import Immutable from "immutable"
import cname from "classnames"

export default class PasswordConfirm extends Component {
    
    static propTypes = {
        // Called everytime a valid password is provided and matches a confirmed password
        onValid: PropTypes.func.isRequired
    }
    
    componentDidMount() {
        ReactDOM.findDOMNode(this.refs.PasswordConfirm_pw).focus()
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
                <input type="password" id="password" ref="PasswordConfirm_pw"
                    onChange={this.formChange.bind(this)}
                    value={this.state.password}
                    tabIndex={1}/>
            </div>
            <div>
                <Translate component="label" content="wallet.confirm" />
                <input type="password" id="confirm"
                    onChange={this.formChange.bind(this)}
                    value={this.state.confirm}
                    tabIndex={2}/>
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
            errors = errors.set("password_length", "Password must be 8 characters or more")
        
        // Don't report it until the confirm is populated
        if( password !== "" && confirm !== "" && password !== confirm)
            errors = errors.set("password_match", "Passwords do not match")
        
        var valid = password.length >= 8 && password === confirm
        this.setState({errors, valid})
        this.props.onValid(valid ? password : null)
    }
}
