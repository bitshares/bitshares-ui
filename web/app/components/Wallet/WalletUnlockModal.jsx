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


export default class Atl extends React.Component {
    render() {
        return (
            <AltContainer stores={{ unlock: WalletUnlockStore, auth: AuthStore }}>
                <WalletUnlockModal {...this.props}/>
            </AltContainer>
        )
    }
}

class WalletUnlockModal extends React.Component {

    static defaultProps = {
        modalId: "unlock_wallet_modal2"
    }
    
    constructor() {
        super()
        this.state = this._getInitialState()
        this.onPasswordEnter = this.onPasswordEnter.bind(this)
    }
    
    _getInitialState() {
        return {
            authInput_reset: Date.now(),
            working: false
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
                if(this.props.unlock.resolve) {
                    if (WalletDb.isLocked()){
                        // this.props.unlock.reject()
                    } else
                        this.props.unlock.resolve()
                }
                WalletUnlockActions.cancel()// Warning, cancel() triggers another update from WalletUnlockStore
                AuthStore.clear()
                this.open = false
            } //else if (msg === "open") { }
        })
    }
    
    componentDidUpdate() {
        //DEBUG console.log('WalletUnlockModal componentDidUpdate this.props.unlock.resolve', this.props.unlock.resolve)
        if(this.props.unlock.resolve) {
            if (WalletDb.isLocked()) {
                if( ! this.open)
                    ZfApi.publish(this.props.modalId, "open")
            } else {
                this.props.unlock.resolve()
            }
        }
    }
    
    onPasswordEnter(e) {
        e.preventDefault()
        e.stopPropagation()
        this.setState({working: true}, ()=>
            AuthStore.login().then(()=>{
                AuthStore.clear()
                ZfApi.publish(this.props.modalId, "close")
                this.props.unlock.resolve()
                WalletUnlockActions.change()
                this.setState({authInput_reset: Date.now(), working: false})
            })
            .catch( error =>{ this.setState({ working: false }) })
        )
    }
    
    render() {
        //DEBUG console.log('... U N L O C K',this.props)
        let unlock_what = this.props.unlock_what || counterpart.translate("wallet.title");

        // Modal overlayClose must be false pending a fix that allows us to detect
        // this event and clear the password (via AuthStore.clear())
        // https://github.com/akiran/react-foundation-apps/issues/34
        return ( 
            // U N L O C K
            <Modal id={this.props.modalId} ref="modal" overlay={true} overlayClose={false}>
                <Trigger close="">
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                
                <h3><Translate content="header.unlock" /> {unlock_what}</h3>
                
                <form onSubmit={this.onPasswordEnter} noValidate>
                    
                    <AuthInput key={this.state.authInput_reset} hasConfirm={false} />
                    
                    <div className="button-group">
                        <button 
                            className={cname("button", {disabled: this.state.working || !this.props.auth.valid}) }
                            onClick={this.onPasswordEnter}><Translate content="header.unlock" />
                            {unlock_what}
                        </button>
                        <Trigger close={this.props.modalId}>
                            <a href className="secondary button"><Translate content="account.perm.cancel" /></a>
                        </Trigger>
                    </div>
                    
                </form>
            </Modal>
        )
    }
}
