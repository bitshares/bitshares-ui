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
import connectToStores from "alt/utils/connectToStores";
import Icon from "../Icon/Icon";
import LoadingIndicator from "../LoadingIndicator";

@connectToStores
class TransactionConfirm extends React.Component {
    
    static getStores() {
        return [TransactionConfirmStore]
    };

    static getPropsFromStores() {
        return TransactionConfirmStore.getState();
    };

    componentDidUpdate() {
        if(!this.props.closed) {
            ZfApi.publish("transaction_confirm_modal", "open");
        } else {
            ZfApi.publish("transaction_confirm_modal", "close");
        }
    }

    onConfirmClick(e) {
        e.preventDefault();
        TransactionConfirmActions.broadcast(this.props.transaction);
    }

    onCloseClick(e) {
        e.preventDefault();
        TransactionConfirmActions.close();
    }

    render() {
        if ( !this.props.transaction || this.props.closed ) {return null; }

        let button_group, header;
        if(this.props.error || this.props.included) {
            header = this.props.error ? (
                <div className="modal-header has-error">
                    <Translate component="h3" content="transaction.broadcast_fail" />
                    <h6>{this.props.error}</h6>
                </div>
                ) :
                (
                <div className="modal-header">
                    <div className="float-left"><Icon name="checkmark-circle" size="4x" className="success"/></div>
                    <Translate component="h3" content="transaction.transaction_confirmed" />
                    <h6>#{this.props.trx_id}@{this.props.trx_block_num}</h6>
                </div>
            );
            button_group = (
                <div className="button-group">
                    <a href className="button" onClick={this.onCloseClick.bind(this)}><Translate content="transfer.close" /></a>
                </div>
            );
        } else if (this.props.broadcast) {
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
        } else if (this.props.broadcasting) {
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

        return (
            <div ref="transactionConfirm">
                <Modal id="transaction_confirm_modal" ref="modal" overlay={true} overlayClose={!this.props.broadcasting}>
                    {!this.props.broadcasting ? <a href className="close-button" onClick={this.onCloseClick.bind(this)}>&times;</a> : null}
                    {header}
                    <div style={{maxHeight: "60vh", overflowY:'auto', overflowX: "hidden"}}>
                        <Transaction
                            key={Date.now()}
                            trx={this.props.transaction.serialize()}
                            index={0}
                            no_links={true}/>
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

