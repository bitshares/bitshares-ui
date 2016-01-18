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
import WalletDb from "stores/WalletDb";
import AccountStore from "stores/AccountStore";
import AccountSelect from "components/Forms/AccountSelect";
import ChainStore from "api/ChainStore";

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
        if(this.state.propose) {
            TransactionConfirmActions.close();
            var propose_options = {
                fee_paying_account: ChainStore.getAccount(this.state.fee_paying_account).get("id")
            }
            WalletDb.process_transaction(this.state.transaction.propose(propose_options), null, true)
        } else
            TransactionConfirmActions.broadcast(this.state.transaction);
    }

    onCloseClick(e) {
        e.preventDefault();
        TransactionConfirmActions.close();
    }

    onProposeClick(e) {
        e.preventDefault()
        TransactionConfirmActions.togglePropose()
    }

    onProposeAccount(fee_paying_account) {
        ChainStore.getAccount(fee_paying_account)
        TransactionConfirmActions.proposeFeePayingAccount(fee_paying_account)
    }

    render() {
        if ( !this.state.transaction || this.state.closed ) {return null; }
        let button_group, header, confirmButtonClass = "button";
        if(this.state.propose && ! this.state.fee_paying_account) confirmButtonClass += " disabled";
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
                    <h6>#{this.state.trx_id}@{this.state.trx_block_num}</h6>
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
                    <div class="grid-block full-width-content">
                        <a className={confirmButtonClass} href onClick={this.onConfirmClick.bind(this)}>
                            {this.state.propose ? 
                                <Translate content="propose" />:
                                <Translate content="transfer.confirm" />
                            }
                        </a>
                        <a href className="secondary button" onClick={this.onCloseClick.bind(this)}><Translate content="account.perm.cancel" /></a>
                    </div>

                    {/* P R O P O S E   T O G G L E */}
                    {/* TODO right-justify the propose checkbox */}
                    { ! this.state.transaction.has_proposed_operation() ?
                    <div class="align-right grid-block">
                        <div className="switch" onClick={this.onProposeClick.bind(this)}>
                            <input type="checkbox" checked={this.state.propose} />
                            <label />
                        </div>
                        <label><Translate content="propose" /></label>
                    </div>
                    :null}
                </div>
            );
        }

        return (
            <div ref="transactionConfirm">
                <Modal id="transaction_confirm_modal" ref="modal" overlay={true} overlayClose={!this.state.broadcasting}>
                    {!this.state.broadcasting ? <a href className="close-button" onClick={this.onCloseClick.bind(this)}>&times;</a> : null}
                    {header}
                    <div style={{maxHeight: "60vh", overflowY:'auto', overflowX: "hidden"}}>
                        <Transaction
                            key={Date.now()}
                            trx={this.state.transaction.serialize()}
                            index={0}
                            no_links={true}/>
                    </div>
                    
                    {/* P R O P O S E   F R O M */}
                    {this.state.propose ?
                    <div className="full-width-content form-group">
                        <label><Translate content="account.propose_from" /></label>
                        <AccountSelect account_names={AccountStore.getMyAccounts()}
                            onChange={this.onProposeAccount.bind(this)}/>
                    </div>:null}
                    
                    <div className="grid-block shrink" style={{paddingTop: "1rem"}}>
                        {button_group}
                    </div>
                </Modal>
            </div>
        );
    }
}

export default TransactionConfirm;

