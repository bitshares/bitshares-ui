/**
 * The Ticket component
 *
 * Renders a single ticket
 */
import React from "react";
import Translate from "react-translate-component";
import AccountImage from "../Account/AccountImage";
import {getStatusKey, formatTimestamp} from "./SupportUtils";
import {ISSUES, IssuesEnum} from "./Constants";

class Ticket extends React.Component {
    state = {};

    _renderDepositFields = ticket => (
        <div>
            <div className="ticket-item__field">
                <div className="ticket-item__field-label">Transaction Id:</div>
                <div className="ticket-item__field-value">
                    {ticket.transactionId}
                </div>
            </div>
        </div>
    );

    _renderWithdrawalFields = ticket => (
        <div>
            <div className="ticket-item__field">
                <div className="ticket-item__field-label">
                    Recipient Address:
                </div>
                <div className="ticket-item__field-value">
                    {ticket.recipientAddress}
                </div>
            </div>
            {ticket.transactionId ? (
                <div className="ticket-item__field">
                    <div className="ticket-item__field-label">
                        Transaction Id:
                    </div>
                    <div className="ticket-item__field-value">
                        {ticket.transactionId}
                    </div>
                </div>
            ) : null}
        </div>
    );

    _renderTransactionFields = ticket => (
        <div>
            <div className="ticket-item__field">
                <div className="ticket-item__field-label">
                    Transaction Type:
                </div>
                <Translate
                    content={`cryptobridge.support.${
                        ISSUES[ticket.transferTypeId]
                    }`}
                    component="div"
                    className="ticket-item__field-value"
                />
            </div>
            <div className="ticket-item__field">
                <div className="ticket-item__field-label">Coin Amount:</div>
                <div className="ticket-item__field-value">
                    {`${ticket.amount} ${ticket.coin
                        .replace("bridge.", "")
                        .toUpperCase()}`}
                </div>
            </div>
            {ticket.transferTypeId === IssuesEnum.DEPOSIT
                ? this._renderDepositFields(ticket)
                : this._renderWithdrawalFields(ticket)}
        </div>
    );

    render() {
        const {ticket} = this.props;
        const statusKey = ticket.statusId
            ? getStatusKey(ticket.statusId)
            : null;
        const translationKey = statusKey
            ? `cryptobridge.support.${statusKey}`
            : null;
        const isSupport = ticket.isSupport || false;
        const ticketClasses = `ticket-item${isSupport ? " support" : ""}`;

        return (
            <div className={ticketClasses}>
                <div className="ticket-item__user">
                    <AccountImage
                        size={{height: 80, width: 80}}
                        account={ticket.username}
                        custom_image={null}
                    />
                    {ticket.username}
                </div>
                <div className="ticket-item__content">
                    <div className="ticket-item__header">
                        <div className="ticket-item__datetime">
                            {formatTimestamp(ticket.datetime)}
                        </div>
                        {translationKey ? (
                            <div className="ticket-item__status">
                                <Translate content={translationKey} />
                            </div>
                        ) : null}
                    </div>
                    <div className="ticket-item__field">
                        <div className="ticket-item__field-label">
                            Ticket ID:
                        </div>
                        <div className="ticket-item__field-value">
                            {ticket.key}
                        </div>
                    </div>
                    {ticket.type === 1
                        ? this._renderTransactionFields(ticket)
                        : null}
                    <div className="ticket-item__field ticket-item__field-message">
                        <div className="ticket-item__field-label">Message:</div>
                    </div>
                    <div
                        className="ticket-item__comment"
                        dangerouslySetInnerHTML={{
                            __html: ticket.renderedComment || ticket.comment
                        }}
                    />
                </div>
            </div>
        );
    }
}

export default Ticket;
