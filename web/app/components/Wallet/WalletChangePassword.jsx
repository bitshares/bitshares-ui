import React, {PropTypes, Component} from "react"
import {Link} from "react-router"
import Translate from "react-translate-component"
import notify from "actions/NotificationActions"
import cname from "classnames"
import WalletDb from "stores/WalletDb"
import PasswordConfirm from "./PasswordConfirm"

export default class WalletChangePassword extends Component {
    constructor() {
        super()
        this.state = {success: false}
    }
    
    onAccept(e) {
        e.preventDefault();
        var {old_password, new_password} = this.state
        WalletDb.changePassword(old_password, new_password, true/*unlock*/)
            .then(()=> {
                notify.success("Password changed")
                this.setState({success: true});
                // window.history.back();
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

    render() {
        var ready = !!this.state.new_password;
        let {success} = this.state;

        if (success) {
            return (
                <div>
                    <Translate component="p" content="wallet.change_success" />
                    <Translate component="p" content="wallet.change_backup" />
                    <Link to="/wallet/backup/create">
                        <div className="button outline success">
                            <Translate content="wallet.create_backup" />
                        </div>
                    </Link>
                </div>
            );
        }

        return <span>
            <WalletPassword onValid={this.onOldPassword.bind(this)}>
                <PasswordConfirm
                    onSubmit={this.onAccept.bind(this)}
                    newPassword={true}
                    onValid={this.onNewPassword.bind(this)}
                >
                    <button
                        className={cname("button success", {disabled: ! ready})}
                        type="submit"
                    >
                        <Translate content="wallet.accept" />
                    </button>
                <Reset/>
            </PasswordConfirm>
            </WalletPassword>
            
        </span>
    }
}

class WalletPassword extends Component {
    
    static propTypes = {
        onValid: React.PropTypes.func.isRequired
    };
    
    constructor() {
        super()
        this.state = {
            password: null,
            verified: false
        }
    }    
       
    onPassword(e) {
        e.preventDefault();
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

    render() {
        if(this.state.verified) {
            return <div className="grid-content">{this.props.children}</div>
        }
         else {
            return (
                <form onSubmit={this.onPassword.bind(this)}>
                    <label><Translate content="wallet.existing_password"/></label>
                    <input
                        type="password"
                        id="password"
                        onChange={this.formChange.bind(this)}
                        value={this.state.password || ""}
                    />
                    <button
                        className="button success"
                    >
                        <Translate content="wallet.verify" />
                    </button>
                </form>
            );
        }
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
