import React from "react";
import Transaction from "./Transaction";
import counterpart from "counterpart";
import Translate from "react-translate-component";
import TransactionConfirmActions from "actions/TransactionConfirmActions";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import {connect} from "alt-react";
import Icon from "../Icon/Icon";
import WalletDb from "stores/WalletDb";
import AccountStore from "stores/AccountStore";
import AccountSelect from "components/Forms/AccountSelect";
import {ChainStore} from "tuscjs";
import utils from "common/utils";
import Operation from "components/Blockchain/Operation";
import notify from "actions/NotificationActions";
import {
    Modal,
    Button,
    Icon as AIcon,
    Alert,
    Switch
} from "bitshares-ui-style-guide";

class TransactionConfirm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isModalVisible: false
        };

        this.onCloseClick = this.onCloseClick.bind(this);

        this.onConfirmClick = this.onConfirmClick.bind(this);

        this.onKeyUp = this.onKeyUp.bind(this);
    }

    shouldComponentUpdate(nextProps) {
        if (!nextProps.transaction) {
            return false;
        }

        return !utils.are_equal_shallow(nextProps, this.props);
    }

    componentDidUpdate() {
        if (!this.props.closed) {
            this.showModal();
        } else {
            this.hideModal();
        }
    }

    showModal() {
        this.setState({
            isModalVisible: true
        });
    }

    hideModal() {
        this.setState({
            isModalVisible: false
        });
    }

    onKeyUp(e) {
        if (e.keyCode === 13) this.onConfirmClick(e);
        else e.preventDefault();
    }

    onConfirmClick(e) {
        e.preventDefault();
        if (this.props.propose) {
            const propose_options = {
                fee_paying_account: ChainStore.getAccount(
                    this.props.fee_paying_account
                ).get("id")
            };
            this.props.transaction.update_head_block().then(() => {
                WalletDb.process_transaction(
                    this.props.transaction.propose(propose_options),
                    null,
                    true
                );
            });
        } else {
            TransactionConfirmActions.broadcast(
                this.props.transaction,
                this.props.resolve,
                this.props.reject
            );
        }
    }

    onCloseClick(e) {
        e.preventDefault();
        TransactionConfirmActions.close();
    }

    onProposeClick() {
        TransactionConfirmActions.togglePropose();
    }

    onProposeAccount(fee_paying_account) {
        ChainStore.getAccount(fee_paying_account);
        TransactionConfirmActions.proposeFeePayingAccount(fee_paying_account);
    }

    componentWillReceiveProps(np) {
        if (np.broadcast && np.included && !this.props.included && !np.error) {
            notify.addNotification.defer({
                children: (
                    <div>
                        <p>
                            <Translate content="transaction.transaction_confirmed" />
                            &nbsp;&nbsp;
                            <span>
                                <Icon
                                    name="checkmark-circle"
                                    title="icons.checkmark_circle.operation_succeed"
                                    size="1x"
                                    className="success"
                                />
                            </span>
                        </p>
                        <table>
                            <Operation
                                op={
                                    this.props.transaction.serialize()
                                        .operations[0]
                                }
                                block={1}
                                current={"1.2.0"}
                                hideFee
                                inverted={false}
                                hideOpLabel={true}
                                hideDate={true}
                            />
                        </table>
                    </div>
                ),
                level: "success",
                autoDismiss: 3
            });
        }
    }

    render() {
        let {broadcast, broadcasting} = this.props;
        if (!this.props.transaction || this.props.closed) {
            return null;
        }
        let button_group,
            footer,
            header,
            confirmButtonClass = "button";
        if (this.props.propose && !this.props.fee_paying_account)
            confirmButtonClass += " disabled";

        if (this.props.error || this.props.included) {
            header = this.props.error
                ? counterpart.translate("transaction.broadcast_fail", {
                      message: ""
                  })
                : counterpart.translate("transaction.transaction_confirmed");

            footer = [
                <Button key={"cancel"} onClick={this.onCloseClick}>
                    {counterpart.translate("transfer.close")}
                </Button>
            ];
        } else if (broadcast) {
            header = `${counterpart.translate(
                "transaction.broadcast_success"
            )}. ${counterpart.translate("transaction.waiting")}`;

            footer = [
                <Button key={"cancel"} onClick={this.onCloseClick}>
                    {counterpart.translate("transfer.close")}
                </Button>
            ];
        } else if (broadcasting) {
            header = (
                <div>
                    {counterpart.translate("transaction.broadcasting")}
                    <AIcon type="loading" />
                </div>
            );
            footer = [];
        } else {
            header = counterpart.translate("transaction.confirm");

            footer = [
                <Button
                    key={"confirm"}
                    type="primary"
                    onClick={this.onConfirmClick}
                >
                    {this.props.propose
                        ? counterpart.translate("propose")
                        : counterpart.translate("transfer.confirm")}
                </Button>,
                <Button key={"cancel"} onClick={this.onCloseClick}>
                    {counterpart.translate("account.perm.cancel")}
                </Button>
            ];
        }

        return (
            <div ref="transactionConfirm" onKeyUp={this.onKeyUp}>
                <Modal
                    wrapClassName="modal--transaction-confirm"
                    title={header}
                    visible={!this.props.closed}
                    id="transaction_confirm_modal"
                    ref="modal"
                    footer={footer}
                    overlay={true}
                    onCancel={this.onCloseClick}
                    overlayClose={!broadcasting}
                    noCloseBtn={true}
                >
                    <div className="grid-block vertical no-padding no-margin">
                        {this.props.error ? (
                            <Alert type="error" message={this.props.error} />
                        ) : null}

                        {this.props.included ? (
                            <Alert
                                type="success"
                                message={counterpart.translate(
                                    "transaction.transaction_confirmed"
                                )}
                                description={`#${this.props.trx_id}@${this.props.trx_block_num}`}
                            />
                        ) : null}

                        <div
                            className="shrink"
                            style={{
                                maxHeight: "60vh",
                                overflowY: "auto",
                                overflowX: "hidden"
                            }}
                        >
                            <Transaction
                                key={Date.now()}
                                trx={this.props.transaction.serialize()}
                                index={0}
                                no_links={true}
                            />
                        </div>

                        {/* P R O P O S E   F R O M */}
                        {this.props.propose ? (
                            <div className="full-width-content form-group">
                                <label>
                                    <Translate content="account.propose_from" />
                                </label>
                                <AccountSelect
                                    className="full-width"
                                    account_names={AccountStore.getMyAccounts()}
                                    onChange={this.onProposeAccount.bind(this)}
                                />
                            </div>
                        ) : null}

                        <div
                            className="grid-block shrink"
                            style={{paddingTop: "1rem"}}
                        >
                            {/* P R O P O S E   T O G G L E */}
                            {!this.props.transaction.has_proposed_operation() &&
                            !(broadcast || broadcasting || this.props.error) ? (
                                <div className="align-right grid-block">
                                    <label
                                        style={{
                                            paddingRight: "0.5rem"
                                        }}
                                    >
                                        <Translate content="propose" />:
                                    </label>
                                    <Switch
                                        checked={this.props.propose}
                                        onChange={this.onProposeClick.bind(
                                            this
                                        )}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }
}

TransactionConfirm = connect(
    TransactionConfirm,
    {
        listenTo() {
            return [TransactionConfirmStore];
        },
        getProps() {
            return TransactionConfirmStore.getState();
        }
    }
);

export default TransactionConfirm;
