import React, {Component} from 'react'
import WalletDb from "stores/WalletDb"
import WalletCreate from "components/Wallet/WalletCreate"
import NotificationActions from "actions/NotificationActions"
import cname from "classnames"
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";

export default class WalletUnlock extends Component {

    constructor() {
        super()
        this.state = {
            password_error: null
        }
    }

    componentDidMount() {
        if (WalletDb.isLocked()) ZfApi.publish("unlock_wallet_modal", "open");
    }


    render() {
        let modal = null;
        if (WalletDb.isLocked()) {
            modal = (
                <Modal id="unlock_wallet_modal" overlay={true}>
                    <Trigger close="">
                        <a href="#" className="close-button">&times;</a>
                    </Trigger>
                    <div className="grid-block vertical">
                        <br/>
                        <form onSubmit={this._passSubmit.bind(this)}>
                            <div className="grid-content no-overflow">
                                <div className={cname("form-group", {"has-error": this.state.password_error})}>
                                    <label>Wallet Password</label>
                                    <input type="password" onChange={this._passChange.bind(this)}/>
                                    <div>{this.state.password_error}</div>
                                </div>
                            </div>
                            <div className="grid-content button-group no-overflow">
                                <a className="button" href onClick={this._passSubmit.bind(this)}>Unlock Wallet</a>
                                <Trigger close="unlock_wallet_modal">
                                    <a href className="secondary button">Cancel</a>
                                </Trigger>
                            </div>
                        </form>
                    </div>
                </Modal>
            );
        }
        return <div>
            {modal}
            {this.props.children}
        </div>
    }

//   { ! this.props.relock_button ? "" : <div>
//               <button className="button" onClick={this._lock.bind(this)}>
//                   Re-Lock Wallet
//               </button>
//               <br>
//           </div>}

    _passChange(e) {
        this.password_ui = e.target.value
        this.setState({password_error: null})
    }

    _passSubmit(e) {
        e.preventDefault()
        WalletDb.validatePassword(
            this.password_ui || "",
            true //unlock
        )
        if (WalletDb.isLocked())
            this.setState({password_error: "Incorrect"})
        else {
            this.setState({password_error: null})
            console.log('... unlock_wallet_modal')
            ZfApi.publish("unlock_wallet_modal", "close");
        }
    }

    _lock() {
        console.log('... onLock')
        WalletDb.onLock()
        this.forceUpdate()
    }

}
