import React from 'react'
import WalletDb from "stores/WalletDb"
import WalletCreate from "components/Wallet/WalletCreate"
import cname from "classnames"
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import PasswordInput from "../Forms/PasswordInput";
import notify from "actions/NotificationActions";
import SessionActions from "actions/SessionActions";

export default class WalletUnlock extends React.Component {

    constructor() {
        super()
        this.state = {
            password_error: null
        }
    }

    componentDidMount() {
        if (this.props.autoOpen) {
            this.open();
        } else {
            ZfApi.subscribe("show-unlock-wallet-modal", e => {
                this.open();
            });
        }
    }


    render() {
        let modal = WalletDb.isLocked() ? (
            <Modal id={this.props.modalId} ref="modal" overlay={true}>
                <Trigger close="">
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <div className="grid-block vertical">
                    <br/>
                    <h3>Unlock wallet:</h3>
                    <form onSubmit={this._passSubmit.bind(this)}>
                        <div className="grid-content no-overflow">
                            <PasswordInput onChange={this._passChange.bind(this)} wrongPassword={this.state.password_error}/>
                        </div>
                        <div className="grid-content button-group no-overflow">
                            <a className="button success" href onClick={this._passSubmit.bind(this)}>Unlock Wallet</a>
                            <Trigger close="unlock_wallet_modal">
                                <a href className="secondary button">Cancel</a>
                            </Trigger>
                        </div>
                    </form>
                </div>
            </Modal>
        ) : null;
        
        return <div>
            {modal}
            {this.props.children}
        </div>
    }
    
    open() {
        if (!WalletDb.isLocked()) return;
        ZfApi.publish(this.props.modalId, "open");
        let modal = React.findDOMNode(this.refs.modal);
        if(!modal) return;
        ZfApi.subscribe(this.props.modalId, e => {
            modal.querySelector('[name="password"]').focus();
        });
    }

    _passChange(e) {
        this.password_ui = e.value
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
            SessionActions.onUnlock();
            this.setState({password_error: false});
            ZfApi.publish(this.props.modalId, "close");
        }
    }

    lock() {
        WalletDb.onLock();
        SessionActions.onLock();
        notify.success("Wallet was locked");
    }

}

WalletUnlock.defaultProps = {
    modalId: "unlock_wallet_modal",
    autoOpen: true
};

WalletUnlock.propTypes = {
    modalId: React.PropTypes.string.isRequired,
    autoOpen: React.PropTypes.bool
};

export default WalletUnlock;
