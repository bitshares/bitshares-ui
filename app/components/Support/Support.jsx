/**
 * The main Support component
 */
import React from "react";
import Translate from "react-translate-component";
import LoadingIndicator from "components/LoadingIndicator";
import Ticket from "./Ticket";
import MessageComposer from "./MessageComposer";
import {find} from "lodash-es";
import PropTypes from "prop-types";
import TicketsMenu from "./TicketsMenu";
import NewTicketModal from "./NewTicketModal";
import {STATUSES} from "./Constants";
import counterpart from "counterpart";
import SupportActions from "./actions/SupportActions";
import SupportStore from "./stores/SupportStore";
import Notification from "./Notification";
import {log} from "./SupportUtils";
import AccountActions from "../../actions/AccountActions";
import WalletUnlockActions from "../../actions/WalletUnlockActions";
import ReCAPTCHA from "../Utility/ReCAPTCHA";

class Support extends React.Component {
    static contextTypes = {
        router: PropTypes.object.isRequired
    };

    constructor(props) {
        super(props);

        this.state = props.state;
        this.messageComposerRef = React.createRef();
        this.newTicketModalRef = React.createRef();
        this.recaptchaRef = React.createRef();

        this.onSupportChange = this.onSupportChange.bind(this);
    }

    componentWillUnmount() {
        SupportStore.unlisten(this.onSupportChange);
    }

    componentDidMount() {
        SupportStore.listen(this.onSupportChange);
        this._fetchTickets(this.props.accountAccess);
    }

    componentDidUpdate(prevProps) {
        if (
            prevProps.match.params.ticketId !== this.props.match.params.ticketId
        ) {
            this._onChangeMenu(this.props.match.params.ticketId);
        }
    }

    componentWillReceiveProps(np) {
        if (np.accountAccess !== this.props.accountAccess) {
            this._fetchTickets(np.accountAccess);
        }
    }

    onSupportChange(state) {
        this.setState(state);
    }

    _fetchTickets(accountAccess) {
        if (!accountAccess) {
            return;
        }

        this.setState({
            ticketFetchingError: null,
            isTicketFetchPending: true,
            loadingIndicatorMessage: counterpart.translate(
                "cryptobridge.support.processing_please_wait"
            )
        });

        SupportActions.getTickets(accountAccess).then(tickets => {
            const selectedTicket = tickets.find(
                ticket => ticket.key === this.props.match.params.ticketId
            );

            if (selectedTicket) {
                this._fetchCommentsForTicket(accountAccess, selectedTicket.id);
            }
        });
    }

    _handleCommentCreate = (selectedTicketId, comment) => {
        this.setState({
            isTicketReplyPending: true,
            ticketReplyError: null,
            loadingIndicatorMessage: counterpart.translate(
                "cryptobridge.support.saving_reply_please_wait"
            )
        });

        const auth = {
            access: this.props.accountAccess,
            reCaptchaToken: this.state.reCaptchaToken
        };

        SupportActions.addComment(auth, selectedTicketId, comment)
            .then(response => {
                if (response) {
                    if (this.messageComposerRef) {
                        this.messageComposerRef.current.reset();
                    }
                    this._fetchCommentsForTicket(
                        this.props.accountAccess,
                        selectedTicketId
                    );
                }
            })
            .catch(() => {});
    };

    _renderTicketComments = comments => (
        <div className="ticket-item__comments">
            {this.state.isCommentsFetchPending ? (
                <LoadingIndicator type="three-bounce" />
            ) : this.state.commentsFetchingError ? (
                <Notification
                    className="error"
                    message={this.state.commentsFetchingError}
                />
            ) : (
                comments.map(reply => (
                    <Ticket
                        key={`reply-${reply.username}${reply.datetime}`}
                        ticket={reply}
                    />
                ))
            )}
        </div>
    );

    _renderInfoScreen = () => (
        <div className={"support-content--intro"}>
            <div>
                <Translate
                    component="h3"
                    content="cryptobridge.support.intro_title"
                />
                <Translate
                    component="span"
                    content="cryptobridge.support.intro_text"
                />
            </div>
        </div>
    );

    _renderClose = ticketId => (
        <Translate
            content="cryptobridge.support.close_ticket"
            component="button"
            className="button button--close"
            onClick={() => this._handleCloseTicket(ticketId)}
        />
    );

    _handleCloseTicket = ticketId => {
        this.setState({
            isTicketClosePending: true,
            ticketCloseError: null,
            loadingIndicatorMessage: counterpart.translate(
                "cryptobridge.support.processing_please_wait"
            )
        });

        SupportActions.closeTicket(this.props.accountAccess, ticketId).then(
            () => {
                this._fetchTickets(this.props.accountAccess);
            }
        );
    };

    _stripHtmlTags = html => html.replace(/<\/?[^>]+(>|$)/g, "");

    _onRecaptchaChange = token => {
        this.setState({reCaptchaToken: token});
    };

    _renderTicketDetails = selectedTicketId => {
        if (this.state.tickets) {
            const ticket = find(this.state.tickets, {key: selectedTicketId});

            return ticket ? (
                <div className="support-content--inner-div">
                    {ticket.statusId !== STATUSES.CLOSED
                        ? this._renderClose(selectedTicketId)
                        : null}
                    {this.state.ticketCloseError ? (
                        <div className="ticket-close-notification-wrapper">
                            <Notification
                                className="error"
                                message={this.state.ticketCloseError}
                            />
                        </div>
                    ) : null}
                    <Ticket ticket={ticket} />
                    {this._renderTicketComments(this.state.comments)}
                    {ticket.statusId !== STATUSES.CLOSED ? (
                        <div className="ticket-item__reply">
                            <MessageComposer
                                ref={this.messageComposerRef}
                                onChange={comment => this.setState({comment})}
                            />
                            <br />
                            {this.state.ticketReplyError ? (
                                <Notification
                                    className="error"
                                    message={this.state.ticketReplyError}
                                />
                            ) : null}
                            {this.state.isTicketReplyPending ? (
                                <LoadingIndicator type="three-bounce" />
                            ) : null}
                            <div className="ticket-item__buttons">
                                <div style={{float: "right"}}>
                                    <ReCAPTCHA
                                        ref={this.recaptchaRef}
                                        onChange={this._onRecaptchaChange}
                                        payload={{user: this.props.account}}
                                    />
                                    <Translate
                                        content="cryptobridge.support.reply"
                                        component="button"
                                        className="button button--reply"
                                        disabled={
                                            this._stripHtmlTags(
                                                this.state.comment
                                            ).length === 0 ||
                                            !this.state.reCaptchaToken
                                        }
                                        onClick={this._handleCommentCreate.bind(
                                            this,
                                            selectedTicketId,
                                            this.state.comment
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null;
        }

        return null;
    };

    _redirectToEntry = ticketId => {
        this.props.history.push(`/support/${ticketId}`);
    };

    _fetchCommentsForTicket = (accountAccess, ticketId) => {
        if (!accountAccess || !ticketId) {
            return;
        }

        this.setState({
            comments: [],
            isCommentsFetchPending: true,
            commentsFetchingError: null
        });

        SupportActions.getTicketComments(accountAccess, ticketId);
    };

    _onChangeMenu = ticketId => {
        this._redirectToEntry(ticketId);
        this._fetchCommentsForTicket(this.props.accountAccess, ticketId);

        this.setState({
            selectedTicketId: ticketId
        });
    };

    _handleAddTicket = () => {
        this.newTicketModalRef.current.show();
    };

    _unlockWallet = () => {
        WalletUnlockActions.unlock()
            .then(() => {
                AccountActions.tryToSetCurrentAccount();
            })
            .catch(error => {
                log(
                    `Support.jsx:_unlockWallet() - WalletUnlockActions.unlock catch() (${error})`
                );
            });
    };

    render() {
        const {
            tickets,
            isTicketFetchPending,
            isTicketClosePending,
            isTicketReplyPending,
            loadingIndicatorMessage
        } = this.state;
        const selectedTicketId = this.props.match.params.ticketId || null;

        if (this.props.locked) {
            return (
                <div className="support-login">
                    <div className="small-10 medium-6 large-4 xlarge-3 text-center">
                        <Translate
                            component="h3"
                            content="cryptobridge.support.title"
                        />
                        <div className="support-login__content">
                            <div className="content-block">
                                <Translate
                                    component="p"
                                    content="cryptobridge.support.support_intro_text"
                                />
                                <div>
                                    <Translate
                                        content="header.unlock_short"
                                        component="button"
                                        className="button primary"
                                        onClick={this._unlockWallet}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid-block">
                {isTicketFetchPending ||
                isTicketClosePending ||
                isTicketReplyPending ? (
                    <LoadingIndicator loadingText={loadingIndicatorMessage} />
                ) : null}
                <div className="grid-block main-content main-content--support margin-block">
                    <div className="grid-content shrink support-menu">
                        <Translate
                            style={{paddingBottom: 10, paddingLeft: 10}}
                            component="h3"
                            content="cryptobridge.support.title"
                            className="panel-bg-color"
                        />

                        <TicketsMenu
                            tickets={tickets}
                            selected={selectedTicketId}
                            onItemPress={ticket =>
                                this._onChangeMenu(ticket.key)
                            }
                            onAddTicket={() => this._handleAddTicket()}
                            error={this.state.ticketFetchingError}
                        />
                    </div>

                    <div className="grid-content support-content">
                        <div className="support-content--inner">
                            {selectedTicketId !== null
                                ? this._renderTicketDetails(selectedTicketId)
                                : this._renderInfoScreen()}
                        </div>
                    </div>

                    <NewTicketModal
                        ref={this.newTicketModalRef}
                        account={this.props.account}
                        accountAccess={this.props.accountAccess}
                    />
                </div>
            </div>
        );
    }
}

export default Support;
