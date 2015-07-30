import React, {Component} from 'react'
import WalletDb from "stores/WalletDb"
import WalletCreate from "components/Wallet/WalletCreate"
import NotificationActions from "actions/NotificationActions"
import cname from "classnames"
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import PasswordInput from "../Forms/PasswordInput"

export default class WalletUnlock extends Component {

    constructor() {
        super()
        this.state = {
            password_error: null
        }
    }

    componentDidMount() {
        if (WalletDb.isLocked()) {
            this.open()
        }
    }

    componentDidUpdate() {
        if (WalletDb.isLocked()) {
            this.open()
        }
    }

    render() {
        let modal = (
            <Modal id="unlock_wallet_modal" ref="modal" overlay={true}>
                <Trigger close="">
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <div className="grid-block vertical">
                    <br/>
                    <form onSubmit={this._passSubmit.bind(this)}>
                        <div className="grid-content no-overflow">
                            <PasswordInput onChange={this._passChange.bind(this)} wrongPassword={this.state.password_error}/>
                        </div>
                        <div className="grid-content button-group no-overflow">
                            <a className="button" href onClick={this._passSubmit.bind(this)}>Unlock Wallet</a>
                            &nbsp; &nbsp;
                            <Trigger close="unlock_wallet_modal">
                                <a href className="secondary button">Cancel</a>
                            </Trigger>
                        </div>
                    </form>
                </div>
            </Modal>
        );
        
        return <div>
            {modal}
            {this.props.children}
        </div>
    }
    
    open() {
        ZfApi.publish("unlock_wallet_modal", "open");
        let modal = React.findDOMNode(this.refs.modal);
        if(!modal) return
        ZfApi.subscribe( "unlock_wallet_modal", e => {
            modal.querySelector('[name="password"]').focus();
        });
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
        e.preventDefault();
        WalletDb.validatePassword(
            this.password_ui || "",
            true //unlock
        );
        if (WalletDb.isLocked())
            this.setState({password_error: true});
        else {
            this.setState({password_error: false});
            ZfApi.publish("unlock_wallet_modal", "close");
        }
    }

    _lock() {
        WalletDb.onLock()
        this.forceUpdate()
    }

}
