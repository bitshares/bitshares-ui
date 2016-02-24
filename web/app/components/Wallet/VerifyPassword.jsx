import ReactDOM from "react-dom"
import React, {PropTypes, Component} from "react"
import Translate from "react-translate-component"
import notify from "actions/NotificationActions"
import cname from "classnames"

// import WalletDb from "stores/WalletDb"
import AuthStore from "stores/AuthStore"
import AuthInput from "components/Forms/AuthInput"

import AltContainer from "alt-container"
export default class Alt extends Component {
    render() {
        return (
            <AltContainer stores={{ auth: AuthStore }}>
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
        this.init = ()=> ({
            verified: false,
            password_input_reset: Date.now(),
        })
        this.state = this.init()
    }
    
    componentWillUnmount() {
        this.setState(this.init())
    }
    
    render() {
        if(this.state.verified) return <span>{this.props.children}</span>
        // let { wallet } = WalletDb.getWallet()
        // console.log('wallet.storage.get("weak_password")', wallet.storage.get("weak_password"))
        return <span>
            <label><Translate content="wallet.existing_password"/></label>
            <form onSubmit={this.onPassword.bind(this)}>
                <AuthInput hasConfirmation={false} key={this.state.password_input_reset}/>
            </form>
            <span className={cname("button", "success", {disabled: !this.props.auth.valid})}
                onClick={this.onPassword.bind(this)}><Translate content="wallet.verify" /></span>
        </span>
    }
    
    onPassword(e) {
        e.preventDefault()
        e.stopPropagation()
        if( ! this.props.auth.valid) return
        if(AuthStore.verifyPassword()) {
            this.setState({ verified: true, password_input_reset: Date.now() })
        } else
            this.setState({ verified: false })
    }
    
}
