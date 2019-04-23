/**
 * NewTicketModal component
 *
 * Renders a modal dialog for creating a new support ticket.
 */
import React, {Component} from "react";
import counterpart from "counterpart";
import Translate from "react-translate-component";
import LoadingIndicator from "components/LoadingIndicator";
import FaqSearch from "./FaqSearch";
import DepositWithdrawForm from "./NewTicketModal/DepositWithdrawForm";
import {ISSUES} from "./Constants";
import SupportActions from "./actions/SupportActions";
import Notification from "./Notification";
import CBModal from "./CBModal";
import {log} from "./SupportUtils";

export default class NewTicketModal extends Component {
    state = {
        searchTerm: "",
        otherIssue: false,
        selectedIssueType: -1,
        isTicketCreatePending: false,
        ticketCreateError: null,
        sendClicked: false,
        formState: null
    };

    constructor(props) {
        super(props);

        this.newTicketModalRef = React.createRef();
    }

    /**
     * Displays the modal dialog
     */
    show() {
        this.newTicketModalRef.current.show();

        this.setState({
            searchResults: [],
            searchTerm: "",
            otherIssue: false,
            selectedIssueType: -1
        });
    }

    /**
     * Closes the modal dialog
     */
    close = () => {
        this.newTicketModalRef.current.close();
    };

    /**
     * Handles clicking on "Other Issue" link button
     *
     * @param event
     * @private
     */
    _handleOtherIssue = event => {
        event.preventDefault();

        this.setState({
            searchResults: [],
            searchTerm: "",
            otherIssue: true,
            selectedIssueType: -1
        });
    };

    /**
     * Handles a given search term
     *
     * @param searchTerm
     * @returns {*}
     * @private
     */
    _handleSearchTerm = searchTerm => this.setState({searchTerm});

    /**
     * Handles Issue selection change
     * @param event
     * @private
     */
    _handleIssuesChange = event => {
        const selectedIssueType = event.target.value;

        this.setState({
            selectedIssueType
        });
    };

    /**
     * Gets a list of issue options for the dropdown list
     *
     * @type {{label, key : string, value : string}[]}
     * @private
     */
    _getIssuesOptions = Object.keys(ISSUES).map((issueType, index) => ({
        label: counterpart.translate(
            `cryptobridge.support.${ISSUES[issueType]}`.toLowerCase()
        ),
        key: `modal-new-ticket__issues-option${index}`,
        value: issueType
    }));

    /**
     * Renders the Issues dropdown
     *
     * @returns {*}
     * @private
     */
    _renderIssuesDropdown = () => {
        const issuesClasses = `modal-new-ticket__issues ${
            this.state.otherIssue ? "visible" : ""
        }`;

        return (
            <div className={issuesClasses}>
                <label htmlFor="modal-new-ticket__issues">
                    <label className={"left-label"}>
                        {counterpart.translate(
                            "cryptobridge.support.issues_label"
                        )}
                    </label>
                    <select
                        className={"form-control"}
                        onChange={this._handleIssuesChange}
                        defaultValue={""}
                    >
                        <option value={-1}>
                            {counterpart.translate(
                                "cryptobridge.support.issues_please_select"
                            )}
                        </option>
                        {this._getIssuesOptions.map(issue => (
                            <option key={issue.key} value={issue.value}>
                                {issue.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
        );
    };

    /**
     * Automatically generates a Subject field from various properties
     *
     * @param properties
     * @returns {string}
     * @private
     */
    _generateSubject = properties => {
        const type = counterpart
            .translate(
                `cryptobridge.support.${ISSUES[properties.selectedIssueType]}`
            )
            .toLowerCase();
        const detail =
            properties.amount && properties.selectedCoin
                ? `: ${properties.amount} ${
                      properties.selectedCoin.backingCoinType
                  }`
                : "";

        return `${type}${detail} / USER: ${properties.username}`;
    };

    /**
     * Creates a support ticket from the selection state data
     *
     * @returns {Promise<void>}
     * @private
     */
    _handleTicketCreate = () => {
        const {formState} = this.state;
        const username = this.props.account;

        this.setState({
            isTicketCreatePending: true,
            ticketCreateError: null
        });

        let ticket = {
            title: this._generateSubject({
                ...this.state,
                ...formState,
                username
            }),
            issueType: `${this.state.selectedIssueType}`.toLowerCase(),
            comment: formState.message,
            username
        };

        switch (this.state.selectedIssueType) {
            case ISSUES.DEPOSIT:
            case ISSUES.WITHDRAWAL:
                ticket = Object.assign(ticket, {
                    coin: formState.selectedCoin.backingCoinType,
                    recipientAddress: formState.recipientAddress,
                    transactionId: formState.transactionId,
                    amount: formState.amount
                });
                break;
            case ISSUES.OTHER:
                break;
            default:
                log(
                    `NewTicketModal.jsx:_handleTicketCreate() - unknown selectedIssueType (${
                        this.state.selectedIssueType
                    })`
                );
                break;
        }

        const auth = {
            access: this.props.accountAccess,
            reCaptchaToken: formState.reCaptchaToken
        };

        SupportActions.createTicket(auth, ticket)
            .then(() => {
                this.setState({
                    ticketCreateError: null,
                    isTicketCreatePending: false,
                    sendClicked: false
                });

                this.close();
            })
            .catch(() => {
                this.setState({
                    ticketCreateError: counterpart.translate(
                        "cryptobridge.support.cannot_create_ticket"
                    ),
                    isTicketCreatePending: false,
                    sendClicked: false
                });
            });
    };

    /**
     * Validates the form fields
     *
     * @returns {boolean}
     * @private
     */
    _validateFormFields = () => {
        const {formState} = this.state;

        if (formState && this.state.selectedIssueType !== -1) {
            if (formState.message === "" || !formState.reCaptchaToken) {
                return false;
            }

            switch (this.state.selectedIssueType) {
                case ISSUES.DEPOSIT:
                    return (
                        formState.transactionId !== "" &&
                        formState.selectedCoin !== null &&
                        formState.amount >= 0
                    );

                case ISSUES.WITHDRAWAL:
                    return (
                        formState.recipientAddress !== "" &&
                        formState.selectedCoin !== null &&
                        formState.amount >= 0
                    );

                case ISSUES.OTHER:
                    return true;
            }
        }
        return false;
    };

    /**
     * Handles the form submission
     *
     * @param event
     * @private
     */
    _handleSubmit = event => {
        event.preventDefault();

        this.setState({
            sendClicked: true
        });

        if (this._validateFormFields()) {
            // TODO: validate fields
            this._handleTicketCreate();
            // this._generateNewRecaptchaToken();
        } else {
            alert(
                counterpart.translate(
                    "cryptobridge.support.incomplete_form_fields"
                )
            );
        }
    };

    _onFormChange = formState => {
        if (
            JSON.stringify(this.state.formState) !== JSON.stringify(formState)
        ) {
            this.setState({formState});
        }
    };

    render() {
        const {isTicketCreatePending} = this.state;

        return (
            <CBModal
                id="new-ticket-modal"
                ref={this.newTicketModalRef}
                title="Create Ticket"
                className="new-ticket-modal"
            >
                <form
                    id="form-new-support-ticket"
                    noValidate
                    autoComplete="off"
                >
                    <div className="grid-block vertical no-overflow modal-new-ticket__content-inner">
                        <Translate
                            content="cryptobridge.support.new_ticket_intro1"
                            component="p"
                            style={{lineHeight: 1.2, marginBottom: 10}}
                        />

                        {!this.state.otherIssue && (
                            <div>
                                <Translate
                                    content="cryptobridge.support.new_ticket_intro2"
                                    component="p"
                                    style={{lineHeight: 1.2, marginBottom: 10}}
                                />

                                <FaqSearch
                                    searchTerm={this.state.searchTerm}
                                    onChange={this._handleSearchTerm}
                                    account={this.props.account}
                                    accountAccess={this.props.accountAccess}
                                />
                            </div>
                        )}

                        {this.state.searchTerm &&
                        this.state.searchTerm.length > 2 ? (
                            <Translate
                                content="cryptobridge.support.could_not_find_solution"
                                component="button"
                                className="modal-new-ticket__other-issue-button"
                                onClick={this._handleOtherIssue}
                            />
                        ) : (
                            <p />
                        )}

                        {this._renderIssuesDropdown(
                            this.state.selectedIssueType
                        )}
                        {[
                            ISSUES.DEPOSIT,
                            ISSUES.WITHDRAWAL,
                            ISSUES.OTHER
                        ].indexOf(this.state.selectedIssueType) !== -1 && (
                            <DepositWithdrawForm
                                onChange={this._onFormChange}
                                selectedIssueType={this.state.selectedIssueType}
                            />
                        )}
                        {this.state.ticketCreateError ? (
                            <Notification
                                className="error"
                                message={this.state.ticketCreateError}
                            />
                        ) : null}
                        <div className="button-group no-overflow modal-new-ticket__footer">
                            {isTicketCreatePending ? (
                                <LoadingIndicator type="three-bounce" />
                            ) : null}

                            <Translate
                                content="cryptobridge.support.cancel"
                                component="button"
                                onClick={this.close}
                                className="button button--cancel"
                            />

                            <Translate
                                content="cryptobridge.support.create_ticket"
                                component="button"
                                className="button button--add"
                                onClick={this._handleSubmit}
                                disabled={
                                    !this.state.otherIssue ||
                                    this.state.sendClicked ||
                                    !this._validateFormFields()
                                }
                            />
                        </div>
                    </div>
                </form>
            </CBModal>
        );
    }
}
