import ReactDOM from "react-dom"
import React, {PropTypes, Component} from "react"
import Translate from "react-translate-component"
import notify from "actions/NotificationActions"
import WalletDb from "stores/WalletDb"
import AuthStore from "stores/AuthStore"
import AuthInput from "components/Forms/AuthInput"
import AltContainer from "alt-container"


export default class Alt extends Component {
    render() {
        return (
            <AltContainer store={AuthStore} inject={{auth: AuthStore.getState()}}>
                <VerifyPassword  {...this.props}/>
            </AltContainer>
        )
    }
}

class VerifyPassword extends Component {
    
    static propTypes = {
        onValid: React.PropTypes.func
    }
    
    constructor() {
        super()
        this.state = this.init_state = {
            verified: false,
            password_error: false,
            password_input_reset: Date.now(),
        }
    }
    
    componentWillUnmount() {
        this.setState(this.init_state)
    }
    
    render() {
        if(this.state.verified) return <span>{this.props.children}</span>
        let { wallet } = WalletDb.getWallet()
        // console.log('wallet.storage.get("weak_password")', wallet.storage.get("weak_password"))
        return <span>
            <label><Translate content="wallet.existing_password"/></label>
            <form onSubmit={this.onPassword.bind(this)}>
                <AuthInput
                    hasConfirmation={false}
                    key={this.state.password_input_reset}
                    authError={this.state.password_error}/>
            </form>
            <span className="button success"
                onClick={this.onPassword.bind(this)}><Translate content="wallet.verify" /></span>
        </span>
    }
    
    onPassword(e) {
        if(e) e.preventDefault()
        if( ! this.props.auth.valid) return
        if(WalletDb.verifyPassword(this.props.auth)) {
            this.setState({ password_error: false, verified: true, password_input_reset: Date.now() })
        } else
            this.setState({ password_error: true })
    }
    
}
