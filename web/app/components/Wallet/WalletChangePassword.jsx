import ReactDOM from "react-dom"
import React, {PropTypes, Component} from "react"
import Translate from "react-translate-component"
import notify from "actions/NotificationActions"
import cname from "classnames"
import WalletDb from "stores/WalletDb"
import PasswordConfirm from "./PasswordConfirm"
import WalletUnlock from "components/Wallet/WalletUnlock"
import LoadingIndicator from "components/LoadingIndicator"

export default class WalletChangePassword extends Component {
    
    constructor() {
        super()
        this.state = this.init_state = {
            loading: false,
            old_password: undefined,
            new_password: undefined
        }
    }
    
    componentWillUnmount() {
        this.setState(this.init_state)
    }
    
    render() {
        return <WalletUnlock>{ this.render_unlocked() }</WalletUnlock>
    }
    
    render_unlocked() {
        var ready = !!this.state.new_password && ! this.state.loading
        return <span>
            <h3><Translate content="wallet.change_password"/></h3>
            <WalletPassword onValid={this.onOldPassword.bind(this)}>
                <form onSubmit={this.onAccept.bind(this)}>
                    <PasswordConfirm onValid={this.onNewPassword.bind(this)}/>
                </form>
                {this.state.loading ? <div className="center-content"><LoadingIndicator type="circle"/><br/></div>:null}
                <div className={cname("button success", {disabled: ! ready})}
                    onClick={this.onAccept.bind(this)}><Translate content="wallet.accept" /></div>
            </WalletPassword>
            
            {this.state.loading ? null:<Reset/>}
            
        </span>
    }
    
    onAccept(e) {
        if(e) e.preventDefault()
        var {old_password, new_password} = this.state
        this.setState({ loading: true }, ()=>{
            WalletDb.changePassword(old_password, new_password)
            .then(()=> {
                this.setState(this.init_state)
                notify.success("Password changed")
                window.history.back()
            })
            .catch( error => {
                // Programmer or database error ( validation missed something? )
                // .. translation may be unnecessary
                console.error(error)
                notify.error("Unable to change password: " + error)
                this.setState(this.init_state)
            })
        })
    }
    onOldPassword(old_password) { this.setState({ old_password }) }
    onNewPassword(new_password) { this.setState({ new_password }) }
}

class WalletPassword extends Component {
    
    static propTypes = {
        onValid: React.PropTypes.func.isRequired
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
        ReactDOM.findDOMNode(this.refs.WalletPassword_pw).focus()
    }
    
    render() {
        if(this.state.verified) return <span>{this.props.children}</span>
        return <span>
            <label><Translate content="wallet.existing_password"/></label>
            <form onSubmit={this.onPassword.bind(this)}>
                <input type="password" id="password" ref="WalletPassword_pw"
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
