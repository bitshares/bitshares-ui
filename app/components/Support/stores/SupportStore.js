import BaseStore from "stores/BaseStore";
import alt from "alt-instance";
import SupportActions from "../actions/SupportActions";

/**
 *  This Store holds information about accounts in this wallet
 *
 */
class SupportStore extends BaseStore {
    constructor() {
        super();

        this.state = {
            comments: [],
            comment: "",
            isTicketFetchPending: false,
            isCommentsFetchPending: false,
            isTicketClosePending: false,
            isTicketReplyPending: false,
            loadingIndicatorMessage: null,
            ticketFetchingError: null,
            commentsFetchingError: null,
            ticketCloseError: null,
            tickets: []
        };

        this.bindListeners({
            onGetTickets: SupportActions.getTickets,
            onGetTicketComments: SupportActions.getTicketComments,
            onAddComment: SupportActions.addComment,
            onCloseTicket: SupportActions.closeTicket,
            onCreateTicket: SupportActions.createTicket
        });

        this._export("getTickets", "getTicketComments");
    }

    onGetTicketComments(comments) {
        this.setState(comments);
    }

    onGetTickets(tickets) {
        this.setState(tickets);
    }

    onAddComment(comment) {
        this.setState(comment);
    }

    onCloseTicket(close) {
        this.setState(close);
    }

    onCreateTicket(ticket) {
        const {tickets} = this.state;
        tickets.push(ticket);
        this.setState({tickets});
    }

    getTickets() {
        return this.state.tickets;
    }

    getTicketComments() {
        return this.state.comments;
    }
}

export default alt.createStore(SupportStore, "SupportStore");
