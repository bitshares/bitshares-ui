import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import PasswordInput from "../Forms/PasswordInput";
import notify from "actions/NotificationActions";
import Translate from "react-translate-component";

import AltContainer from "alt-container";
import WalletDb from "stores/WalletDb";
import WalletUnlockStore from "stores/WalletUnlockStore";
import WalletUnlockActions from "actions/WalletUnlockActions";
import {Apis} from "graphenejs-ws";

class WalletUnlockModal extends React.Component {

    constructor() {
        super()
        this.state = this._getInitialState()
        this.onPasswordEnter = this.onPasswordEnter.bind(this)
    }

    _getInitialState() {
        return {
            password_error: null,
            password_input_reset: Date.now()
        }
    }

    reset() {
        this.setState(this._getInitialState())
    }

    componentDidMount() {
        let modal = this.refs.modal;
        ZfApi.subscribe(this.props.modalId, (name, msg) => {
            if(name !== this.props.modalId)
                return
            if(msg === "close") {
                //if(this.props.reject) this.props.reject()
                WalletUnlockActions.cancel()
            } else if (msg === "open") {
                this.refs.password_input.clear()
                if(Apis.instance().chain_id !== WalletDb.getWallet().chain_id) {
                    notify.error("This wallet was intended for a different block-chain; expecting " +
                        WalletDb.getWallet().chain_id.substring(0,4).toUpperCase() + ", but got " +
                        Apis.instance().chain_id.substring(0,4).toUpperCase())
                    ZfApi.publish(this.props.modalId, "close")
                    return
                }
                modal.querySelector('[name="password"]').focus()
            }
        })
    }

    componentDidUpdate() {
        //DEBUG console.log('... componentDidUpdate this.props.resolve', this.props.resolve)
        if(this.props.resolve) {
            if (WalletDb.isLocked())
                ZfApi.publish(this.props.modalId, "open")
            else
                this.props.resolve()
        }
    }

    onPasswordEnter(e) {
        e.preventDefault()
        var password = this.refs.password_input.value()
        this.setState({password_error: null})
        WalletDb.validatePassword(
            password || "",
            true //unlock
        )
        if (WalletDb.isLocked()) {
            this.setState({password_error: true})
            return false
        }
        else {
            this.refs.password_input.clear()
            ZfApi.publish(this.props.modalId, "close")
            this.props.resolve()
            WalletUnlockActions.change()
            this.setState({password_input_reset: Date.now(), password_error: false})
        }
        return false
    }

    render() {
        //DEBUG console.log('... U N L O C K',this.props)

        // Modal overlayClose must be false pending a fix that allows us to detect
        // this event and clear the password (via this.refs.password_input.clear())
        // https://github.com/akiran/react-foundation-apps/issues/34
        return (
            // U N L O C K
            <Modal id={this.props.modalId} ref="modal" overlay={true} overlayClose={false}>
                <Trigger close="">
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <h3><Translate content="header.unlock" /></h3>
                <form onSubmit={this.onPasswordEnter} noValidate>
                    <PasswordInput ref="password_input"
                        onEnter={this.onPasswordEnter}
                        key={this.state.password_input_reset}
                        wrongPassword={this.state.password_error}
                        noValidation />
                    <div className="button-group">
                        <button className={"button"} onClick={this.onPasswordEnter}><Translate content="header.unlock" /></button>
                        <Trigger close={this.props.modalId}>
                            <div className=" button"><Translate content="account.perm.cancel" /></div>
                        </Trigger>
                    </div>
                </form>
            </Modal>
        )
    }

}

WalletUnlockModal.defaultProps = {
    modalId: "unlock_wallet_modal2"
}

class WalletUnlockModalContainer extends React.Component {
    render() {
        return (
            <AltContainer store={WalletUnlockStore}>
                <WalletUnlockModal/>
            </AltContainer>
        )
    }
}
export default WalletUnlockModalContainer
