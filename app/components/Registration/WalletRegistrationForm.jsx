import React from "react";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import {ChainStore, FetchChain} from "tuscjs/es";
import counterpart from "counterpart";
import AccountActions from "actions/AccountActions";
import WalletUnlockActions from "actions/WalletUnlockActions";
import WalletActions from "actions/WalletActions";
import AccountStore from "stores/AccountStore";
import WalletDb from "stores/WalletDb";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import utils from "common/utils";
import AccountSelect from "../Forms/AccountSelect";
import AccountNameInput from "./../Forms/AccountNameInputStyleGuide";
import PasswordInput from "./../Forms/PasswordInputStyleGuide";
import Icon from "../Icon/Icon";
import {
    Notification,
    Form,
    Input,
    Button,
    Select,
    Alert,
    Tooltip
} from "bitshares-ui-style-guide";

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
            registrarAccount: undefined,
            loading: false,
            showIdenticon: false,
            password: ""
        };
        this.onFinishConfirm = this.onFinishConfirm.bind(this);
        this.onRegistrarAccountChange = this.onRegistrarAccountChange.bind(
            this
        );
        this.unmounted = false;

        this.onSubmit = this.onSubmit.bind(this);
        this.onPasswordChange = this.onPasswordChange.bind(this);
        this.onPasswordValidationChange = this.onPasswordValidationChange.bind(
            this
        );
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

    onPasswordChange(value) {
        this.setState({password: value});
    }

    onPasswordValidationChange(validation) {
        this.setState({validPassword: validation.valid});
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
            const password = this.state.password;
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
                    this.setState({loading: false});
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
                });
        });
    }

    createWallet(password) {
        this.setState({
            loading: true
        });
        return WalletActions.setWallet("default", password)
            .then(() => {
                console.log(
                    "Congratulations, your wallet was successfully created."
                );
            })
            .catch(err => {
                this.setState({
                    loading: false
                });
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
            <Form.Item label={counterpart.translate("account.pay_from")}>
                <Select
                    placeholder={counterpart.translate(
                        "account.select_placeholder"
                    )}
                    style={{width: "100%"}}
                    value={this.state.registrarAccount}
                    onChange={this.onRegistrarAccountChange}
                >
                    {myAccounts.map(accountName => (
                        <Select.Option key={accountName} value={accountName}>
                            {accountName}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>
        );
    }

    renderPasswordInput() {
        return (
            <PasswordInput
                ref="password"
                onChange={this.onPasswordChange}
                onValidationChange={this.onPasswordValidationChange}
                label={
                    <span>
                        <span className="vertical-middle">
                            {counterpart.translate("settings.password")}
                        </span>
                        &nbsp;
                        <Tooltip
                            title={counterpart.translate(
                                "tooltip.registration.password"
                            )}
                        >
                            <span>
                                <Icon
                                    name="question-in-circle"
                                    className="icon-14px question-icon vertical-middle"
                                />
                            </span>
                        </Tooltip>
                    </span>
                }
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

        const isButtonDisabled = () => {
            return !valid || (registrarAccount && !isLTM);
        };

        return (
            <Form layout={"vertical"} onSubmit={this.onSubmit}>
                <AccountNameInput
                    cheapNameOnly={!!firstAccount}
                    onChange={e => this.onAccountNameChange(e)}
                    accountShouldNotExist
                    placeholder={counterpart.translate("account.name")}
                    label={
                        <span>
                            <span className="vertical-middle">
                                {counterpart.translate("account.name")}
                            </span>
                            &nbsp;
                            <Tooltip
                                title={counterpart.translate(
                                    "tooltip.registration.accountName"
                                )}
                            >
                                <span>
                                    <Icon
                                        name="question-in-circle"
                                        className="icon-14px question-icon vertical-middle"
                                    />
                                </span>
                            </Tooltip>
                        </span>
                    }
                    noLabel
                />

                {hasWallet ? null : this.renderPasswordInput()}

                {firstAccount ? null : this.renderDropdown(myAccounts, isLTM)}

                {registrar && !isLTM ? (
                    <Form.Item>
                        <Alert
                            type="error"
                            description={
                                <Translate content="wallet.must_be_ltm" />
                            }
                        />
                    </Form.Item>
                ) : null}

                <Form.Item>
                    <Button
                        type="primary"
                        disabled={this.state.loading || isButtonDisabled()}
                        htmlType="submit"
                        loading={this.state.loading}
                    >
                        {counterpart.translate("registration.continue")}
                    </Button>
                </Form.Item>
            </Form>
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
