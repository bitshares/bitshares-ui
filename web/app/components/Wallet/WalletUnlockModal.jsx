import React from 'react'
import ReactDOM from "react-dom";
import cname from "classnames"
import Trigger from "react-foundation-apps/src/trigger"
import Modal from "react-foundation-apps/src/modal"
import ZfApi from "react-foundation-apps/src/utils/foundation-api"
import AuthInput from "../Forms/AuthInput"
import notify from "actions/NotificationActions"
import Translate from "react-translate-component";
import counterpart from "counterpart";

import AltContainer from "alt-container";
import connectToStores from "alt/utils/connectToStores"
import WalletDb from "stores/WalletDb"
import AuthStore from "stores/AuthStore"
import WalletUnlockStore from "stores/WalletUnlockStore"
import WalletUnlockActions from "actions/WalletUnlockActions"
import { Apis } from "@graphene/chain"

class WalletUnlockModal extends React.Component {

    constructor() {
        super()
        this.state = this._getInitialState()
        this.onPasswordEnter = this.onPasswordEnter.bind(this)
    }
    
    _getInitialState() {
        return {
            password_error: null,
            authInput_reset: Date.now()
        }
    }
    
    reset() {
        AuthStore.clear()
        this.setState(this._getInitialState())
    }

    componentDidMount() {
        let modal = ReactDOM.findDOMNode(this.refs.modal)
        ZfApi.subscribe(this.props.modalId, (name, msg) => {
            if(name !== this.props.modalId)
                return
            if(msg === "close") {
                //if(this.props.reject) this.props.reject()
                AuthStore.clear()
                WalletUnlockActions.cancel()
            } else if (msg === "open") {
                
            }
        })
    }
    
    componentDidUpdate() {
        //DEBUG 
        console.log('... componentDidUpdate this.props.resolve', this.props.resolve)
        if(this.props.resolve) {
            if (WalletDb.isLocked())
                ZfApi.publish(this.props.modalId, "open")
            else {
                this.props.resolve()
            }
        }
    }
    
    // componentWillReceiveProps(nextProps) {
    //     console.log('this.props, nextProps', this.props, nextProps)
    // }

    onPasswordEnter(e) {
        e.preventDefault()
        console.log('this.auth', this.auth)
        if( ! this.auth ) return
        this.setState({password_error: null})
        let { password, email, username } = this.auth
        AuthStore.login( password, email, username ).then(()=>{
            AuthStore.clear()
            ZfApi.publish(this.props.modalId, "close")
            this.props.resolve()
            WalletUnlockActions.change()
            this.setState({authInput_reset: Date.now(), password_error: false})
        })
        .catch( error =>{ this.setState({password_error: true}) })
    }
    
    render() {
        //DEBUG console.log('... U N L O C K',this.props)
        let unlock_what = this.props.unlock_what || counterpart.translate("wallet.title");
        let authValid = auth => this.auth = auth

        // Modal overlayClose must be false pending a fix that allows us to detect
        // this event and clear the password (via this.refs.authInput.clear())
        // https://github.com/akiran/react-foundation-apps/issues/34
        return ( 
            // U N L O C K
            <Modal id={this.props.modalId} ref="modal" overlay={true} overlayClose={false}>
                <Trigger close="">
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <h3><Translate content="header.unlock" /> {unlock_what}</h3>
                <form onSubmit={this.onPasswordEnter} noValidate>
                    <AuthInput key={this.state.authInput_reset}
                        hasConfirm={false} onValid={authValid.bind(this)}
                        authError={this.state.password_error}/>
                    <div className="button-group">
                        <button className={"button"} onClick={this.onPasswordEnter}><Translate content="header.unlock" /> {unlock_what}</button>
                        <Trigger close={this.props.modalId}>
                            <a href className="secondary button"><Translate content="account.perm.cancel" /></a>
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
