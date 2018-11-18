import React from "react";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import AltContainer from "alt-container";
import ReactTooltip from "react-tooltip";
import WalletDb from "stores/WalletDb";
import AccountStore from "stores/AccountStore";
import WalletUnlockActions from "actions/WalletUnlockActions";
import AccountActions from "actions/AccountActions";
import SettingsActions from "actions/SettingsActions";
import utils from "common/utils";
import AccountSelector from "../Account/AccountSelector";
import Icon from "../Icon/Icon";

class AccountLogin extends React.Component {
    static propTypes = {
        active: PropTypes.bool.isRequired,
        onChangeActive: PropTypes.func.isRequired,
        goToWalletModel: PropTypes.func.isRequired
    };

    constructor(props) {
        super();
        this.state = this.getInitialState(props);
        this.onPasswordEnter = this.onPasswordEnter.bind(this);
        this.accountChanged = this.accountChanged.bind(this);
        this.onAccountChanged = this.onAccountChanged.bind(this);
    }

    getInitialState(props = this.props) {
        return {
            passwordError: null,
            accountName: props.passwordAccount,
            account: null,
            passwordVisible: false
        };
    }

    componentDidUpdate(previousProps) {
        if (
            !previousProps.active &&
            this.props.active &&
            this.state.accountName
        ) {
            this.refs.password.focus();
        }
    }

    componentWillReceiveProps(np) {
        if (np.passwordAccount && !this.state.accountName) {
            this.setState({
                accountName: np.passwordAccount
            });
        }
    }

    shouldComponentUpdate(np, ns) {
        return (
            !utils.are_equal_shallow(np, this.props) ||
            !utils.are_equal_shallow(ns, this.state)
        );
    }

    onPasswordEnter(e) {
        e && e.preventDefault();
        const password = this.refs.password.value;
        const account = this.state.account && this.state.account.get("name");
        this.setState({passwordError: null});

        WalletDb.validatePassword(
            password,
            true, // unlock
            account
        );

        setTimeout(() => {
            WalletDb.validatePassword(
                password,
                true, // unlock
                account
            );

            if (WalletDb.isLocked()) {
                this.setState({passwordError: true});
                return false;
            }
            this.refs.password.value = "";
            AccountActions.setPasswordAccount(account);
            SettingsActions.changeSetting({
                setting: "passwordLogin",
                value: true
            });
            this.props.history.push("/");
            WalletUnlockActions.change();
        }, 550);

        return false;
    }

    onAccountChanged(account) {
        this.setState({account, error: null});
    }

    accountChanged(accountName) {
        if (!accountName) this.setState({account: null});
        this.setState({accountName, error: null});
    }

    reset() {
        this.setState(this.getInitialState());
    }

    hideTooltip() {
        document
            .getElementById("password-error")
            .classList.remove("custom-tooltip");
        ReactTooltip.hide();
    }

    renderButtons() {
        return (
            <div className="button-group">
                {this.props.active ? (
                    <Translate
                        component="button"
                        className="button-primary"
                        onClick={this.onPasswordEnter}
                        content="login.loginButton"
                    />
                ) : (
                    <Translate
                        className="button-secondary"
                        content="registration.select"
                    />
                )}
            </div>
        );
    }

    renderTooltip() {
        return (
            <ReactTooltip
                id="password-error"
                className="custom-tooltip text-left"
            >
                <div className="tooltip-text">
                    <Translate content="tooltip.login-tooltip.incorrectPassword.begin" />
                    <Translate
                        onClick={this.props.goToWalletModel}
                        className="active-upload-text without-bin cursor-pointer"
                        content="tooltip.login-tooltip.incorrectPassword.model"
                    />
                    <Translate content="tooltip.login-tooltip.incorrectPassword.end" />
                    <span
                        onClick={() => this.hideTooltip()}
                        className="close-button"
                    >
                        ×
                    </span>
                </div>
            </ReactTooltip>
        );
    }

    renderNameInput() {
        const {accountName} = this.state;
        const {active} = this.props;

        return (
            <div className={`${!active ? "display-none" : ""} content-block`}>
                <AccountSelector
                    label="account.name"
                    ref="accountName"
                    accountName={accountName}
                    onChange={this.accountChanged}
                    onAccountChanged={this.onAccountChanged}
                    account={accountName}
                    size={60}
                    placeholder=" "
                    hideImage
                    focus={active && !this.state.accountName}
                />
            </div>
        );
    }

    renderPasswordInput() {
        const {passwordError, passwordVisible} = this.state;

        return (
            <div className="inline-label input-wrapper">
                <input
                    ref="password"
                    type={!passwordVisible ? "password" : "text"}
                    className={`${
                        passwordError ? "input-warning" : ""
                    } input create-account-input`}
                />

                {!passwordVisible ? (
                    <span
                        className="no-width eye-block"
                        onClick={() => this.setState({passwordVisible: true})}
                    >
                        <Icon
                            name="eye-visible"
                            className="eye-icon icon-opacity"
                        />
                    </span>
                ) : (
                    <span
                        className="no-width eye-block"
                        onClick={() => this.setState({passwordVisible: false})}
                    >
                        <Icon
                            name="eye-invisible"
                            className="eye-icon icon-opacity"
                        />
                    </span>
                )}

                {this.refs.password &&
                this.refs.password.value &&
                passwordError !== null ? (
                    passwordError ? (
                        <span className="dismiss-icon">&times;</span>
                    ) : (
                        <Icon name="checkmark" className="approve-icon" />
                    )
                ) : null}
            </div>
        );
    }

    render() {
        const {passwordError} = this.state;

        return (
            <div onClick={this.props.onChangeActive} className="account-block">
                <div className="overflow-bg-block show-for-small-only">
                    <span className="content" />
                </div>

                {this.renderNameInput()}

                <form
                    className={!this.props.active ? "display-none" : ""}
                    onSubmit={this.onPasswordEnter}
                    noValidate
                >
                    <div className="content-block">
                        <div className="account-selector">
                            <div className="content-area">
                                <div className="header-area">
                                    <Translate
                                        className="left-label"
                                        component="label"
                                        content="settings.password"
                                    />
                                </div>
                                <div className="input-area">
                                    {this.renderPasswordInput()}
                                </div>
                                {passwordError ? (
                                    <div className="facolor-error error-area text-left">
                                        <Translate
                                            data-for="password-error"
                                            data-tip
                                            data-place="bottom"
                                            data-effect="solid"
                                            data-delay-hide={500}
                                            content="wallet.pass_incorrect"
                                        />
                                        {this.renderTooltip()}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </form>
                {this.renderButtons()}
            </div>
        );
    }
}

function AccountLoginContainer(props) {
    return (
        <AltContainer
            stores={[AccountStore]}
            inject={{
                passwordAccount: () =>
                    AccountStore.getState().passwordAccount || ""
            }}
        >
            <AccountLogin {...props} />
        </AltContainer>
    );
}

export default AccountLoginContainer;
