import React from "react";
import PropTypes from "prop-types";
import {connect} from "alt-react";
import Clipboard from "react-clipboard.js";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import WalletDb from "stores/WalletDb";
import notify from "actions/NotificationActions";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import Translate from "react-translate-component";
import {FetchChain} from "bitsharesjs/es";
import WalletUnlockActions from "actions/WalletUnlockActions";
import Icon from "components/Icon/Icon";

class AccountRegistrationConfirm extends React.Component {
    static propTypes = {
        accountName: PropTypes.string.isRequired,
        password: PropTypes.string.isRequired,
        toggleConfirmed: PropTypes.func.isRequired,
        history: PropTypes.object.isRequired
    };

    constructor() {
        super();
        this.state = {
            confirmed: false
        };
        this.onFinishConfirm = this.onFinishConfirm.bind(this);
        this.toggleConfirmed = this.toggleConfirmed.bind(this);
        this.createAccount = this.createAccount.bind(this);
        this.onCreateAccount = this.onCreateAccount.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.confirmed !== this.state.confirmed;
    }

    onFinishConfirm(confirmStoreState) {
        if (
            confirmStoreState.included &&
            confirmStoreState.broadcasted_transaction
        ) {
            TransactionConfirmStore.unlisten(this.onFinishConfirm);
            TransactionConfirmStore.reset();

            FetchChain("getAccount", this.state.accountName).then(() => {
                this.props.history.push(
                    "/wallet/backup/create?newAccount=true"
                );
            });
        }
    }

    onCreateAccount(e) {
        e.preventDefault();
        this.createAccount(this.props.accountName, this.props.password);
    }

    createAccount(name, password) {
        const {referralAccount} = AccountStore.getState();

        AccountActions.createAccountWithPassword(
            name,
            password,
            this.state.registrarAccount,
            referralAccount || this.state.registrarAccount,
            0
        )
            .then(() => {
                AccountActions.setPasswordAccount(name);
                if (this.state.registrarAccount) {
                    FetchChain("getAccount", name).then(() => {
                        this.unlockAccount(name, password);
                    });
                    TransactionConfirmStore.listen(this.onFinishConfirm);
                } else {
                    FetchChain("getAccount", name).then(() => {});
                    this.unlockAccount(name, password);
                    this.props.history.push(
                        `/account/${this.props.accountName}`
                    );
                }
            })
            .catch(error => {
                console.log("ERROR AccountActions.createAccount", error);
                let errorMsg =
                    error.base && error.base.length && error.base.length > 0
                        ? error.base[0]
                        : "unknown error";
                if (error.remote_ip) {
                    [errorMsg] = error.remote_ip;
                }
                notify.addNotification({
                    message: `Failed to create account: ${name} - ${errorMsg}`,
                    level: "error",
                    autoDismiss: 10
                });
            });
    }

    unlockAccount(name, password) {
        WalletDb.validatePassword(password, true, name);
        WalletUnlockActions.checkLock.defer();
    }

    toggleConfirmed(e) {
        e.preventDefault();
        const {confirmed} = this.state;
        this.setState({
            confirmed: !confirmed
        });
        this.props.toggleConfirmed(!confirmed);
    }

    renderWarning() {
        return (
            <div className="attention-note">
                <Icon name="attention" size="1x" />
                <Translate
                    content="registration.attention"
                    className="attention-text"
                />
                <Translate component="p" content="registration.accountNote" />
            </div>
        );
    }

    render() {
        return (
            <div>
                <section>
                    <div className="form-group">
                        <label className="left-label" htmlFor="password">
                            <Translate
                                component="span"
                                content="registration.copyPassword"
                            />
                        </label>
                        <div className="input-block">
                            <input
                                id="password"
                                type="text"
                                defaultValue={this.props.password}
                                className="input create-account-input"
                            />
                            <Clipboard
                                component="button"
                                className="no-width btn-clipboard"
                                data-clipboard-text={this.props.password}
                            >
                                <Icon
                                    name="copy"
                                    className="copy-icon icon-opacity icon-14px"
                                />
                            </Clipboard>
                        </div>
                    </div>

                    <div>{this.renderWarning()}</div>

                    <div className="form-group">
                        <div className="input-block">
                            <div
                                className="checkbox-block"
                                onClick={this.toggleConfirmed}
                            >
                                <span>
                                    <Icon
                                        className={`${
                                            this.state.confirmed
                                                ? "checkbox-active"
                                                : ""
                                        } checkbox`}
                                        name="checkmark"
                                    />
                                </span>
                                <Translate
                                    content="registration.accountConfirmation"
                                    className="checkbox-text"
                                />
                            </div>
                        </div>
                        <button
                            className="button-primary"
                            disabled={!this.state.confirmed}
                            onClick={this.onCreateAccount}
                        >
                            <Translate content="account.create_account" />
                        </button>
                    </div>
                </section>
            </div>
        );
    }
}

export default connect(
    AccountRegistrationConfirm,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps() {
            return {};
        }
    }
);
