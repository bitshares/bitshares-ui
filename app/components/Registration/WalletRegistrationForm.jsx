import React from "react";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import {ChainStore, FetchChain} from "bitsharesjs/es";
import counterpart from "counterpart";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";
import WalletUnlockActions from "actions/WalletUnlockActions";
import WalletActions from "actions/WalletActions";
import AccountStore from "stores/AccountStore";
import WalletDb from "stores/WalletDb";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import utils from "common/utils";
import AccountSelect from "../Forms/AccountSelect";
import LoadingIndicator from "../LoadingIndicator";
import AccountNameInput from "./../Forms/AccountNameInput";
import PasswordInput from "./../Forms/PasswordInput";
import Icon from "../Icon/Icon";
import {Notification} from "bitshares-ui-style-guide";

class WalletRegistrationForm extends React.Component {
    static propTypes = {
        continue: PropTypes.func.isRequired,
        history: PropTypes.object.isRequired
    };

    constructor() {
        super();
        this.state = {
            validAccountName: false,
            accountName: "",
            validPassword: false,
            registrarAccount: null,
            loading: false,
            showIdenticon: false
        };
        this.onFinishConfirm = this.onFinishConfirm.bind(this);
        this.onRegistrarAccountChange = this.onRegistrarAccountChange.bind(
            this
        );
        this.unmounted = false;
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !utils.are_equal_shallow(nextState, this.state);
    }

    componentWillUnmount() {
        this.unmounted = true;
    }

    onAccountNameChange(e) {
        const state = {};
        if (e.valid !== undefined) {
            state.validAccountName = e.valid;
        }
        if (e.value !== undefined) {
            state.accountName = e.value;
        }
        if (!this.state.showIdenticon) {
            state.showIdenticon = true;
        }
        this.setState(state);
    }

    onPasswordChange(e) {
        this.setState({validPassword: e.valid});
    }

    onFinishConfirm(confirmStoreState) {
        if (
            confirmStoreState.included &&
            confirmStoreState.broadcasted_transaction
        ) {
            TransactionConfirmStore.unlisten(this.onFinishConfirm);
            TransactionConfirmStore.reset();

            FetchChain("getAccount", this.state.accountName, undefined, {
                [this.state.accountName]: true
            }).then(() => {
                console.log("onFinishConfirm");
                this.props.history.push(
                    "/wallet/backup/create?newAccount=true"
                );
            });
        }
    }

    onRegistrarAccountChange(registrarAccount) {
        this.setState({registrarAccount});
    }

    onSubmit(e) {
        e.preventDefault();
        if (!this.isValid()) {
            return;
        }
        const {accountName} = this.state;
        if (WalletDb.getWallet()) {
            this.createAccount(accountName);
        } else {
            const password = this.refs.password.value();
            this.createWallet(password).then(() =>
                this.createAccount(accountName)
            );
        }
    }

    createAccount(name) {
        const {referralAccount} = AccountStore.getState();
        WalletUnlockActions.unlock().then(() => {
            this.setState({loading: true});

            AccountActions.createAccount(
                name,
                this.state.registrarAccount,
                referralAccount || this.state.registrarAccount,
                0
            )
                .then(() => {
                    // User registering his own account
                    FetchChain("getAccount", name, undefined, {
                        [name]: true
                    }).then(() => {
                        this.props.continue();
                        if (this.unmounted) {
                            return;
                        }
                        this.setState({
                            loading: false
                        });
                    });
                    if (this.state.registrarAccount) {
                        TransactionConfirmStore.listen(this.onFinishConfirm);
                    }
                })
                .catch(error => {
                    console.log("ERROR AccountActions.createAccount", error);
                    let errorMsg =
                        error.base && error.base.length && error.base.length > 0
                            ? error.base[0]
                            : "unknown error";
                    if (error.remote_ip) [errorMsg] = error.remote_ip;
                    Notification.error({
                        message: counterpart.translate(
                            "notifications.account_create_failure",
                            {
                                account_name: name,
                                error_msg: errorMsg
                            }
                        )
                    });
                    this.setState({loading: false});
                });
        });
    }

    createWallet(password) {
        return WalletActions.setWallet("default", password)
            .then(() => {
                console.log(
                    "Congratulations, your wallet was successfully created."
                );
            })
            .catch(err => {
                console.log("CreateWallet failed:", err);
                Notification.error({
                    message: counterpart.translate(
                        "notifications.account_wallet_create_failure",
                        {
                            error_msg: err
                        }
                    )
                });
            });
    }

    isValid() {
        const firstAccount = AccountStore.getMyAccounts().length === 0;
        let valid = this.state.validAccountName;
        if (!WalletDb.getWallet()) {
            valid = valid && this.state.validPassword;
        }
        if (!firstAccount) {
            valid = valid && this.state.registrarAccount;
        }
        return valid;
    }

    renderDropdown(myAccounts, isLTM) {
        const {registrarAccount} = this.state;

        return (
            <div className="full-width-content form-group no-overflow">
                <label className="left-label">
                    <Translate content="account.pay_from" />
                </label>
                <AccountSelect
                    account_names={myAccounts}
                    onChange={this.onRegistrarAccountChange}
                />
                {registrarAccount && !isLTM ? (
                    <div style={{textAlign: "left"}} className="facolor-error">
                        <Translate content="wallet.must_be_ltm" />
                    </div>
                ) : null}
            </div>
        );
    }

    renderPasswordInput() {
        return (
            <PasswordInput
                ref="password"
                confirmation
                onChange={e => this.onPasswordChange(e)}
                noLabel
                checkStrength
                placeholder={
                    <span>
                        <span className="vertical-middle">
                            {counterpart.translate("settings.password")}
                        </span>
                        <span
                            data-tip={counterpart.translate(
                                "tooltip.registration.password"
                            )}
                        >
                            <Icon
                                name="question-in-circle"
                                className="icon-14px question-icon vertical-middle"
                            />
                        </span>
                    </span>
                }
            />
        );
    }

    renderAccountNameInput(firstAccount) {
        return (
            <AccountNameInput
                cheapNameOnly={!!firstAccount}
                onChange={e => this.onAccountNameChange(e)}
                accountShouldNotExist
                placeholder={
                    <span>
                        <span className="vertical-middle">
                            {counterpart.translate("account.name")}
                        </span>
                        <span
                            data-tip={counterpart.translate(
                                "tooltip.registration.accountName"
                            )}
                        >
                            <Icon
                                name="question-in-circle"
                                className="icon-14px question-icon vertical-middle"
                            />
                        </span>
                    </span>
                }
                noLabel
            />
        );
    }

    renderAccountCreateForm() {
        const {registrarAccount} = this.state;

        const myAccounts = AccountStore.getMyAccounts();
        const firstAccount = myAccounts.length === 0;
        const hasWallet = WalletDb.getWallet();
        const valid = this.isValid();
        let isLTM = false;
        const registrar = registrarAccount
            ? ChainStore.getAccount(registrarAccount)
            : null;
        if (registrar) {
            if (registrar.get("lifetime_referrer") === registrar.get("id")) {
                isLTM = true;
            }
        }

        const buttonClass = classNames("button-primary", {
            disabled: !valid || (registrarAccount && !isLTM)
        });

        return (
            <form
                onSubmit={e => this.onSubmit(e)}
                noValidate
                className="text-left"
            >
                {this.renderAccountNameInput(firstAccount)}

                {/* Only ask for password if a wallet already exists */}
                {hasWallet ? null : this.renderPasswordInput()}

                {/* If this is not the first account, show dropdown for fee payment account */}
                {firstAccount ? null : this.renderDropdown(myAccounts, isLTM)}

                {/* Submit button */}
                {this.state.loading ? (
                    <LoadingIndicator type="three-bounce" />
                ) : (
                    <button className={buttonClass}>
                        <Translate content="registration.continue" />
                    </button>
                )}
            </form>
        );
    }

    render() {
        const hasWallet = WalletDb.getWallet();
        const firstAccount = AccountStore.getMyAccounts().length === 0;

        return (
            <div>
                <div className="text-left">
                    {firstAccount ? (
                        <Translate
                            component="h3"
                            content="registration.createAccountTitle"
                        />
                    ) : (
                        <Translate component="h3" content="wallet.create_a" />
                    )}
                    {!hasWallet ? (
                        <Translate
                            component="p"
                            content="registration.walletDescription"
                            className="model-description"
                        />
                    ) : null}
                </div>
                {this.renderAccountCreateForm()}
            </div>
        );
    }
}

export default WalletRegistrationForm;
