import ReactDOM from "react-dom"
import React, {PropTypes, Component} from "react"
import Translate from "react-translate-component"
import notify from "actions/NotificationActions"
import WalletDb from "stores/WalletDb"
import AuthInput from "components/Forms/AuthInput"

export default class VerifyPassword extends Component {
    
    static propTypes = {
        onValid: React.PropTypes.func
    }
    
    constructor() {
        super()
        this.state = this.init_state = {
            password: null,
            verified: false,
            password_error: false,
            password_input_reset: Date.now(),
            confirmation_matches: false
        }
    }
    
    componentWillUnmount() {
        this.setState(this.init_state)
    }
    
    // componentDidMount() {
    //     ReactDOM.findDOMNode(this.refs.VerifyPassword_AuthInput).focus()
    // }
    
    render() {
        if(this.state.verified) return <span>{this.props.children}</span>
        let { wallet } = WalletDb.getWallet()
        // console.log('wallet.storage.get("weak_password")', wallet.storage.get("weak_password"))
        return <span>
            <label><Translate content="wallet.existing_password"/></label>
            <form onSubmit={this.onPassword.bind(this)}>
                <AuthInput
                    hasConfirmation={true}
                    key={this.state.password_input_reset}
                    onValid={this.onAuthInputChange.bind(this)}
                    authError={this.state.password_error}/>
            </form>
            <span className="button success"
                onClick={this.onPassword.bind(this)}><Translate content="wallet.verify" /></span>
        </span>
    }
    
    onAuthInputChange(auth) {
        this.setState({ confirmation_matches: auth.valid, auth })
    }

    onPassword(e) {
        if(e) e.preventDefault()
        let { password, email, username } = this.state.auth
        if(WalletDb.verifyPassword(password, email, username)) {
            this.setState({ password_error: false, verified: true, password_input_reset: Date.now() })
            if(this.props.onValid)
                this.props.onValid(password)
        } else
            this.setState({ password_error: true })//notify.error("Invalid Password")
    }
    
    // formChange(event) {
    //     var state = {}
    //     state[event.target.id] = event.target.value
    //     this.setState(state)
    // }
    
}
