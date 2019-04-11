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
import {ISSUES, IssuesEnum} from "./Constants";
import SupportActions from "./actions/SupportActions";
import Notification from "./Notification";
import CBModal from "./CBModal";
import {log} from "./SupportUtils";

export default class NewTicketModal extends Component {
    state = {
        searchTerm: "",
        otherIssue: false,
        selectedIssueId: -1,
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
            selectedIssueId: -1
            /*disabledCoinsMessage: null,
            selectedCoin: -1,
            explorerUrl: "",
            transactionId: "",
            transactionNotFound: false,
            amount: 0,
            recipientAddress: "",
            message: ""*/
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
            selectedIssueId: -1
            /*disabledCoinsMessage: null,
            selectedCoin: -1,
            explorerUrl: "",
            transactionId: "",
            transactionNotFound: false,
            amount: 0,
            recipientAddress: "",
            message: ""*/
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
     * @param selectedOption
     * @param event
     * @private
     */
    _handleIssuesChange = event => {
        const selectedIssueId = parseInt(event.target.value);

        this.setState({
            selectedIssueId
        });
    };

    /**
     * Gets a list of issue options for the dropdown list
     *
     * @type {{label, key : string, value : string}[]}
     * @private
     */
    _getIssuesOptions = Object.keys(ISSUES).map((issueId, index) => ({
        label: counterpart.translate(
            `cryptobridge.support.${ISSUES[issueId]}s`
        ),
        key: `modal-new-ticket__issues-option${index}`,
        value: issueId
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
    _generateSubject = properties =>
        `${counterpart
            .translate(
                `cryptobridge.support.${ISSUES[properties.selectedIssueId]}`
            )
            .toUpperCase()}: ${properties.amount} ${
            properties.selectedCoin.coinType
        } / USER: ${properties.username}`;

    /**
     * Creates a support ticket from the selection state data
     *
     * @returns {Promise<void>}
     * @private
     */
    _handleTicketCreate = () => {
        const {formState} = this.state;
        let ticket = {};
        const username = this.props.account;

        this.setState({
            isTicketCreatePending: true,
            ticketCreateError: null
        });

        switch (this.state.selectedIssueId) {
            case 1:
            case 2:
                ticket = {
                    // type: 1, // Transfer
                    title: this._generateSubject({
                        ...this.state,
                        ...formState,
                        username
                    }), // formState.subject
                    coin: formState.selectedCoin.coinType,
                    transferTypeId: this.state.selectedIssueId,
                    recipientAddress: formState.recipientAddress,
                    transactionId: formState.transactionId,
                    amount: formState.amount,
                    comment: formState.message,
                    username
                };
                break;
            default:
                log(
                    `NewTicketModal.jsx:_handleTicketCreate() - unknown selectedIssueId (${
                        this.state.selectedIssueId
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

        if (formState && this.state.selectedIssueId !== -1) {
            if (
                formState.amount <= 0 ||
                formState.selectedCoin === null ||
                formState.message === "" ||
                !formState.reCaptchaToken
            ) {
                return false;
            }

            switch (this.state.selectedIssueId) {
                case IssuesEnum.DEPOSIT:
                    return formState.transactionId !== "";

                case IssuesEnum.WITHDRAWAL:
                    return formState.recipientAddress !== "";
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

                        <Translate
                            content="cryptobridge.support.have_another_issue"
                            component="button"
                            className="modal-new-ticket__other-issue-button"
                            onClick={this._handleOtherIssue}
                        />

                        {this._renderIssuesDropdown(this.state.selectedIssueId)}
                        {[IssuesEnum.DEPOSIT, IssuesEnum.WITHDRAWAL].indexOf(
                            this.state.selectedIssueId
                        ) !== -1 && (
                            <DepositWithdrawForm
                                onChange={this._onFormChange}
                                selectedIssueId={this.state.selectedIssueId}
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
