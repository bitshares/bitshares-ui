import React, {PropTypes, Component} from "react"
import Translate from "react-translate-component"
import notify from "actions/NotificationActions"
import cname from "classnames"
import WalletDb from "stores/WalletDb"
import AuthStore from "stores/AuthStore"
import AuthInput from "components/Forms/AuthInput"
import WalletUnlock from "components/Wallet/WalletUnlock"
import LoadingIndicator from "components/LoadingIndicator"
import VerifyPassword from "components/Wallet/VerifyPassword"
import counterpart from "counterpart"

import AltContainer from "alt-container"

let ChangePasswordAuthStore = AuthStore("ChangePassword", { hasConfirm: true })

export default class Alt extends Component {
    render() {
        return (
            <AltContainer stores={{ auth: ChangePasswordAuthStore }}>
                <WalletChangePassword {...this.props}/>
            </AltContainer>
        )
    }
}

class WalletChangePassword extends Component {
    
    constructor() {
        super()
        this.init = ()=> ({
            loading: false
        })
        this.state = this.init()
    }
    
    componentWillUnmount() {
        this.setState(this.init())
        this.props.auth.clear()
    }
    
    render() {
        return <WalletUnlock>{ this.render_unlocked() }</WalletUnlock>
    }
    
    render_unlocked() {
        var ready = !!this.state.new_password && ! this.state.loading
        return <span>
            <h3><Translate content="wallet.change_password"/></h3>
            <VerifyPassword>
                <form onSubmit={this.onAccept.bind(this)}>
                    <AuthInput auth={this.props.auth}/>
                </form>
                {this.state.loading ? <div className="center-content"><LoadingIndicator type="circle"/><br/></div>:null}
                <div className={cname("button success", {disabled: ! this.props.auth.valid || this.state.loading })}
                    onClick={this.onAccept.bind(this)}><Translate content="wallet.accept" /></div>
            </VerifyPassword>
            
            {this.state.loading ? null : <Reset/> }
            
        </span>
    }
    
    onAccept(e) {
        if(e) e.preventDefault()
        this.setState({ loading: true }, ()=>{
            WalletDb.changePassword(this.props.auth)
            .then(()=> {
                this.setState(this.init())
                notify.success(counterpart.translate("wallet.password_changed"))
                window.history.back()
            })
            .catch( error => {
                // Programmer or database error ( validation missed something? )
                // .. translation may be unnecessary
                console.error(error)
                notify.error("Unable to change password: " + error)
                this.setState(this.init())
            })
        })
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
