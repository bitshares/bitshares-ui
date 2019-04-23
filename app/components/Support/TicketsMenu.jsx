/**
 * The TicketsMenu component
 *
 * Renders the tickets menu from the supplied tickets array.
 */
import React from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import {getStatusKey, getTicketClasses, formatTimestamp} from "./SupportUtils";
import {ISSUES, STATUSES, STATUSKEYS} from "./Constants";
import {orderBy} from "lodash-es";
import Notification from "./Notification";

class TicketsMenu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedTicketId: props.selected || null,
            selectedStatusId: -1
        };
    }

    _handleItemClick = ticket => {
        if (this.props.onItemPress) {
            this.props.onItemPress(ticket);
        }

        this.setState({
            selectedTicketId: ticket.key
        });
    };

    _renderSummary = ticket => {
        const type = counterpart.translate(
            `cryptobridge.support.${
                ISSUES[ticket.issueType.toUpperCase()]
            }`.toLowerCase()
        );
        const detail =
            ticket.amount && ticket.coin
                ? ` ${ticket.amount} ${ticket.coin
                      .replace("bridge.", "")
                      .toUpperCase()}`
                : "";

        return `${type}${detail}`;
    };

    _renderMenuItem = ticket => {
        const statusKey = getStatusKey(ticket.statusId);
        const selected =
            ticket.key === this.state.selectedTicketId ? "selected" : "";

        return (
            <li
                className={getTicketClasses(
                    `ticket-item ${selected}`,
                    ticket.statusId
                )}
                onClick={() => this._handleItemClick(ticket)}
                key={`ticket-${ticket.key}`}
            >
                <div className="ticket-item__header">
                    <div>{formatTimestamp(ticket.datetime)}</div>

                    <Translate
                        content={`cryptobridge.support.${statusKey}`}
                        component="div"
                        className="ticket-item__status"
                    />
                </div>
                <div>
                    {this._renderSummary(ticket)}&nbsp;#{ticket.key}
                </div>
            </li>
        );
    };

    _renderMenu = tickets => (
        <ul>{tickets.map(ticket => this._renderMenuItem(ticket))}</ul>
    );

    _renderHeader = () => (
        <div className="support-tickets-list__header">
            <select
                onChange={this._handleStatusFilterChange}
                value={this.state.selectedStatusId}
            >
                <Translate
                    component="option"
                    content="cryptobridge.support.all_tickets"
                    value="-1"
                />
                {Object.keys(STATUSKEYS).map(
                    (statusId, index) =>
                        [
                            STATUSES.WAITING_FOR_SUPPORT,
                            STATUSES.BLOCKED
                        ].indexOf(statusId) === -1 ? (
                            <Translate
                                component="option"
                                content={`cryptobridge.support.${
                                    STATUSKEYS[statusId]
                                }`}
                                key={`support-tickets-list-option${index}`}
                                value={statusId}
                            />
                        ) : null
                )}
            </select>

            <button
                className="support-tickets-list__add-button button"
                onClick={() =>
                    this.props.onAddTicket ? this.props.onAddTicket() : null
                }
            >
                +&nbsp;
                <Translate content="cryptobridge.support.new_ticket" />
            </button>
        </div>
    );

    _renderFooter = tickets => (
        <div className="support-tickets-list__footer">
            {tickets.length} Tickets
        </div>
    );

    _handleStatusFilterChange = event => {
        this.setState({
            selectedStatusId: parseInt(event.target.value)
        });
    };

    _filterTicketsByStatusId = (tickets, statusId) =>
        statusId !== -1
            ? tickets.filter(ticket => {
                  return ticket.statusId === statusId;
              })
            : tickets;

    render() {
        const {tickets} = this.props;
        const filteredTickets = this._filterTicketsByStatusId(
            tickets,
            this.state.selectedStatusId
        );
        const sortedTickets = orderBy(
            filteredTickets,
            ["statusId", "datetime"],
            ["asc", "desc"]
        );

        return this.props.error ? (
            <Notification className="error" message={this.props.error} />
        ) : (
            <div className="support-tickets-list">
                {this._renderHeader()}
                {this._renderMenu(sortedTickets)}
                {this._renderFooter(sortedTickets)}
            </div>
        );
    }
}

export default TicketsMenu;
