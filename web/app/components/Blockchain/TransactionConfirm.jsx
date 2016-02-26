import React from "react";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import notify from "actions/NotificationActions";
import Transaction from "./Transaction";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import TransactionConfirmActions from "actions/TransactionConfirmActions";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import BaseComponent from "../BaseComponent";
import Icon from "../Icon/Icon";
import LoadingIndicator from "../LoadingIndicator";

class TransactionConfirm extends BaseComponent {
    
    constructor(props) {
        super(props, TransactionConfirmStore);
    }

    componentDidUpdate() {
        if(!this.state.closed) {
            ZfApi.publish("transaction_confirm_modal", "open");
        } else {
            ZfApi.publish("transaction_confirm_modal", "close");
        }
    }

    onConfirmClick(e) {
        e.preventDefault();
        TransactionConfirmActions.broadcast(this.state.transaction);
    }

    onCloseClick(e) {
        e.preventDefault();
        TransactionConfirmActions.close();
    }

    render() {
        if ( !this.state.transaction || this.state.closed ) {return null; }

        let button_group, header;
        if(this.state.error || this.state.included) {
            header = this.state.error ? (
                <div className="modal-header has-error">
                    <Translate component="h3" content="transaction.broadcast_fail" />
                    <h6>{this.state.error}</h6>
                </div>
                ) :
                (
                <div className="modal-header">
                    <div className="float-left"><Icon name="checkmark-circle" size="4x" className="success"/></div>
                    <Translate component="h3" content="transaction.transaction_confirmed" />
                    <h6 style={{wordWrap: "break-word"}}>{this.state.trx_id} {this.state.trx_block_num && <span>(block {this.state.trx_block_num})</span>}</h6>
                </div>
            );
            button_group = (
                <div className="button-group">
                    <a href className="button" onClick={this.onCloseClick.bind(this)}><Translate content="transfer.close" /></a>
                </div>
            );
        } else if (this.state.broadcast) {
            header = (
                <div className="modal-header">
                    <Translate component="h3" content="transaction.broadcast_success" />
                    <h6>Waiting for confirmation..</h6>
                </div>
            );
            button_group = (
                <div className="button-group">
                    <a href className="button" onClick={this.onCloseClick.bind(this)}><Translate content="transfer.close" /></a>
                </div>
            );
        } else if (this.state.broadcasting) {
            header = (
                <div className="modal-header">
                    <Translate component="h3" content="transaction.broadcasting" />
                </div>
            );
            button_group = (
                <div className="button-group">
                    <a href className="button disabled"><Translate content="transfer.close" /></a>
                </div>
            );
        } else {
            header = (
                <div className="modal-header">
                    <Translate component="h3" content="transaction.confirm" />
                </div>
            );
            button_group = (
                <div className="button-group">
                    <a className="button" href onClick={this.onConfirmClick.bind(this)}><Translate content="transfer.confirm" /></a>
                    <a href className="secondary button" onClick={this.onCloseClick.bind(this)}><Translate content="account.perm.cancel" /></a>
                </div>
            );
        }

        const trx = this.state.transaction;
        const transaction = trx.type && trx.type === "blind" ?
            <table style={{marginBottom: "1em"}} className="table op-table">
                <tbody>
                    <tr key="0">
                        <td><span className="txtlabel success">Stealth Transfer</span></td>
                        <td></td>
                    </tr>
                    <tr key="1">
                        <td><Translate component="span" content="transfer.from" /></td>
                        <td>{trx.from} &nbsp; <span className="label info">{trx.from_type}</span></td>
                    </tr>
                    <tr key="2">
                        <td><Translate component="span" content="transfer.to" /></td>
                        <td>{trx.to} &nbsp; <span className="label info">{trx.to_type}</span></td>
                    </tr>
                    <tr key="3">
                        <td><Translate component="span" content="transfer.amount" /></td>
                        <td>{trx.amount} {trx.asset}</td>
                    </tr>
                </tbody>
            </table>
            : <Transaction
            key={Date.now()}
            trx={this.state.transaction.serialize()}
            index={0}
            no_links={true}/>

        return (
            <div ref="transactionConfirm">
                <Modal id="transaction_confirm_modal" ref="modal" overlay={true} overlayClose={!this.state.broadcasting}>
                    {!this.state.broadcasting ? <a href className="close-button" onClick={this.onCloseClick.bind(this)}>&times;</a> : null}
                    {header}
                    <div style={{maxHeight: "60vh", overflowY:'auto', overflowX: "hidden"}}>
                        {transaction}
                    </div>
                    <div className="grid-block shrink" style={{paddingTop: "1rem"}}>
                        {button_group}
                    </div>
                </Modal>
            </div>
        );
    }

}

export default TransactionConfirm;

