import React from 'react'
import AltContainer from "alt/AltContainer"
import Modal from "react-foundation-apps/src/modal"
import Trigger from "react-foundation-apps/src/trigger"
import ZfApi from "react-foundation-apps/src/utils/foundation-api"

import notify from 'actions/NotificationActions'
import Transaction from "components/Blockchain/Transaction"
//import BaseComponent from "./components/BaseComponent"
import AccountStore from "stores/AccountStore"
import AssetStore from "stores/AssetStore"
import WalletDb from "stores/WalletDb"

export default class TransactionConfirm extends React.Component {
    
    constructor() {
        super()
        this.state = this._getInitialState()
    }
    
    _getInitialState() {
        return {tr: null, confirmed: false}
    }
    
    reset() {
        this.setState(this._getInitialState())
    }
    
    confirm_and_broadcast({tr, resolve, reject}) {
        var trx = tr.serialize()
        this.setState({tr, trx, resolve, reject})
        
        ZfApi.publish("transaction_confim_modal", "open");
        
        //let modal = React.findDOMNode(this.refs.modal);
        //if(!modal) return
        //ZfApi.subscribe( "transaction_confim_modal", e => {
        //    modal.querySelector('[name="password"]').focus();
        //});
    }
    
    render() {
        
        if( ! this.state.trx) return <div/>
        
        var assets = AssetStore.getState().assets
        var account_id_to_name = AccountStore.getState().account_id_to_name
        
        //var password = WalletDb.isLocked() ? <div>
        //    <label>Password</label>
        //    <input type="password" id="password"
        //        value={this.state.password}
        //        onChange={this._passwordChange.bind(this)}
        //        />
        //    </div>: null
        //            <a className="button success" href
        //                onClick={this._passSubmit.bind(this)}>Unlock Wallet</a>
        return (
            <Modal id="transaction_confim_modal" ref="modal" overlay={true}>
                <Trigger close="">
                    <a href="#" className="close-button"
                        onClick={this.close.bind(this)}
                        >&times;</a>
                </Trigger>
                <div className="grid-block vertical">
                    <div className="shrink grid-content">
                        <h3>Please confirm transaction</h3>
                    </div>
                    
                    {this.state.trx ?
                    <Transaction key={1} trx={this.state.trx} index={1}
                        account_id_to_name={account_id_to_name}
                        assets={assets}
                        />
                    :null}
                    
                    <a href className="secondary button"
                        onClick={this._confirmPress.bind(this)}
                        >Confirm</a>
                </div>
            </Modal>
        )
    }
    
    _confirmPress() {
        ZfApi.publish("transaction_confim_modal", "close")
        this.state.tr.broadcast().then( ()=> {
            notify.success("Transaction broadcasted")
            this.state.resolve()
            this.reset()
        }).catch( error => {
            console.log("TransactionConfirm broadcast error",error)
            var message = error
            notify.error("Transaction broadcast error: ", message)
            this.state.reject(error)
            this.reset()
        })
    }
    
    //_passwordChange(event) {
    //    this.setState({password: event.target.value})
    //}
    
    
}

