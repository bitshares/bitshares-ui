import alt from "alt-instance";
import {log} from "../SupportUtils";
import counterpart from "counterpart";
import {getRequestAccessOptions} from "lib/common/AccountUtils";
import {STATUSES} from "../Constants";

/**
 *  @brief  Actions for CB Support
 */
class SupportActions {
    getTickets(access) {
        return dispatch => {
            return fetch(
                `${__API_SUPPORT_URL__}/tickets`,
                Object.assign(getRequestAccessOptions(access), {
                    method: "GET"
                })
            )
                .then(response => {
                    if (!response || !response.ok || response.status === 404) {
                        throw new Error("tickets not found");
                    }

                    return response.json();
                })
                .then(response => {
                    let tickets = [];
                    let ticketFetchingError = null;

                    if (response.isBoom) {
                        ticketFetchingError = counterpart.translate(
                            "cryptobridge.support.cannot_fetch_tickets"
                        );
                    } else {
                        tickets = response;
                    }

                    dispatch({
                        tickets,
                        isTicketFetchPending: false,
                        loadingIndicatorMessage: null,
                        ticketFetchingError
                    });

                    return tickets;
                })
                .catch(err => {
                    log(`Support.jsx:_fetchTickets() - ${err}`);

                    dispatch({
                        ticketFetchingError: counterpart.translate(
                            "cryptobridge.support.cannot_fetch_tickets"
                        ),
                        isTicketFetchPending: false,
                        loadingIndicatorMessage: null
                    });
                });
        };
    }

    getTicketComments(access, ticketId) {
        return dispatch => {
            return fetch(
                `${__API_SUPPORT_URL__}/tickets/${ticketId}/comments`,
                Object.assign(getRequestAccessOptions(access), {
                    method: "GET"
                })
            )
                .then(response => {
                    if (!response || !response.ok || response.status === 404) {
                        throw new Error("comments not found");
                    }

                    return response.json();
                })
                .then(response => {
                    if (response.isBoom) {
                        throw new Error("Not a valid response");
                    } else {
                        dispatch({
                            comments: response,
                            isCommentsFetchPending: false,
                            commentsFetchingError: null
                        });
                    }

                    return response;
                })
                .catch(() => {
                    log(
                        "Support.jsx:_fetchCommentsForTicket() - FETCH promise catch()"
                    );

                    dispatch({
                        comments: [],
                        isCommentsFetchPending: false,
                        commentsFetchingError: counterpart.translate(
                            "cryptobridge.support.cannot_fetch_comments"
                        )
                    });
                });
        };
    }

    addComment(auth, ticketId, comment) {
        return dispatch => {
            return fetch(
                `${__API_SUPPORT_URL__}/tickets/${ticketId}/comments`,
                Object.assign(
                    getRequestAccessOptions(auth.access, auth.reCaptchaToken),
                    {
                        method: "POST",
                        body: JSON.stringify({data: comment})
                    }
                )
            )
                .then(response => response.json())
                .then(response => {
                    if (response.jsdPublic) {
                        dispatch({
                            comment: "",
                            isTicketReplyPending: false,
                            ticketReplyError: null,
                            loadingIndicatorMessage: null
                        });
                    } else {
                        throw new Error("jsdPublic not available");
                    }

                    return response;
                })
                .catch(error => {
                    log(`Support.jsx:_handleCommentCreate() - ${error}`);

                    dispatch({
                        isTicketReplyPending: false,
                        ticketReplyError: counterpart.translate(
                            "cryptobridge.support.cannot_reply_ticket"
                        ),
                        loadingIndicatorMessage: null
                    });
                });
        };
    }

    createTicket(auth, ticket) {
        return dispatch => {
            const ticketMaster = ticket.username;
            delete ticket.username;

            return fetch(
                `${__API_SUPPORT_URL__}/tickets`,
                Object.assign(
                    getRequestAccessOptions(auth.access, auth.reCaptchaToken),
                    {
                        method: "POST",
                        body: JSON.stringify(ticket)
                    }
                )
            )
                .then(response => response.json())
                .then(response => {
                    if (response.key) {
                        ticket.key = response.key;
                        ticket.id = response.id;
                        ticket.statusId = STATUSES.OPEN;
                        ticket.datetime = new Date().getTime();
                        ticket.username = ticketMaster;

                        dispatch(ticket);
                        return ticket;
                    } else {
                        throw new Error("No key created");
                    }
                })
                .catch(error => {
                    log(`SupportActions.js:createTicket() - ${error}`);
                });
        };
    }

    closeTicket(access, ticketId) {
        return dispatch => {
            return fetch(
                `${__API_SUPPORT_URL__}/tickets/${ticketId}/close`,
                Object.assign(getRequestAccessOptions(access), {
                    method: "POST"
                })
            )
                .then(response => response.json())
                .then(response => {
                    dispatch(response);
                    return response;
                })
                .catch(error => {
                    log(
                        `Support.jsx:_handleCloseTicket() - could not close ticket (${error})`
                    );

                    dispatch({
                        isTicketClosePending: false,
                        ticketCloseError: counterpart.translate(
                            "cryptobridge.support.cannot_close_ticket"
                        ),
                        loadingIndicatorMessage: null
                    });
                });
        };
    }
}

export default alt.createActions(SupportActions);
