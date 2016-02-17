import ReactDOM from "react-dom"
import React, {PropTypes, Component} from "react"
import Translate from "react-translate-component"
import notify from "actions/NotificationActions"
import WalletDb from "stores/WalletDb"

export default class VerifyPassword extends Component {
    
    static propTypes = {
        onValid: React.PropTypes.func
    }
    
    constructor() {
        super()
        this.state = this.init_state = {
            password: null,
            verified: false
        }
    }
    
    componentWillUnmount() {
        this.setState(this.init_state)
    }
    
    componentDidMount() {
        ReactDOM.findDOMNode(this.refs.VerifyPassword_pw).focus()
    }
    
    render() {
        if(this.state.verified) return <span>{this.props.children}</span>
        return <span>
            <label><Translate content="wallet.existing_password"/></label>
            <form onSubmit={this.onPassword.bind(this)}>
                <input type="password" id="password" ref="VerifyPassword_pw"
                    onChange={this.formChange.bind(this)}
                    value={this.state.password}/>
            </form>
            <span className="button success"
                onClick={this.onPassword.bind(this)}><Translate content="wallet.verify" /></span>
        </span>
    }
    
    onPassword(e) {
        if(e) e.preventDefault()
        if(WalletDb.verifyPassword(this.state.password)) {
            this.setState({ verified: true })
            if(this.props.onValid)
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
