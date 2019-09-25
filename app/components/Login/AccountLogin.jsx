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
import ChainStore from "tuscjs/es/chain/src/ChainStore";
import AccountInputStyleGuide from "../Account/AccountInputStyleGuide";
import {Button, Input, Form} from "bitshares-ui-style-guide";
import counterpart from "counterpart";

class AccountLogin extends React.Component {
    static propTypes = {
        active: PropTypes.bool.isRequired,
        onChangeActive: PropTypes.func.isRequired,
        goToWalletModel: PropTypes.func.isRequired
    };

    constructor(props) {
        super();
        this.state = this.getInitialState(props);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.onPasswordEnter = this.onPasswordEnter.bind(this);
        this.accountChanged = this.accountChanged.bind(this);
        this.onAccountChanged = this.onAccountChanged.bind(this);
    }

    getInitialState(props = this.props) {
        return {
            password: "",
            passwordError: null,
            accountName: props.passwordAccount,
            account: null,
            passwordVisible: false
        };
    }

    componentDidUpdate(previousProps) {
        ReactTooltip.rebuild();

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

    handlePasswordChange(e) {
        this.setState({
            password: e.target.value
        });
    }

    onPasswordEnter(e) {
        e && e.preventDefault();
        const password = this.state.password;
        const account = this.state.accountName;
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
            this.setState({
                password: ""
            });

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
        if (!accountName) {
            this.setState({account: null, accountName: null});
        } else {
            let account = ChainStore.getAccount(accountName);

            this.setState({
                accountName,
                error: null,
                account: account
            });
        }
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
            <Form.Item style={{textAlign: "center"}}>
                {this.props.active ? (
                    <Button onClick={this.onPasswordEnter} type="primary">
                        {counterpart.translate("login.loginButton")}
                    </Button>
                ) : (
                    <Button>
                        {counterpart.translate("registration.select")}
                    </Button>
                )}
            </Form.Item>
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
            <AccountInputStyleGuide
                label="account.name"
                value={accountName}
                onChange={this.accountChanged}
                placeholder={"account.name"}
                size={60}
                hideImage
                focus={active && !this.state.accountName}
            />
        );
    }

    renderPasswordInput() {
        const {passwordError, passwordVisible} = this.state;

        const getValidateStatus = () => {
            return passwordError !== null ? "error" : "";
        };

        const getHelp = () => {
            return passwordError !== null ? (
                <Translate
                    data-for="password-error"
                    data-tip
                    data-place="bottom"
                    data-effect="solid"
                    data-delay-hide={500}
                    content="wallet.pass_incorrect"
                />
            ) : null;
        };

        return (
            <Form.Item
                label={"Password"}
                help={getHelp()}
                validateStatus={getValidateStatus()}
            >
                <Input
                    ref={"password"}
                    placeholder={counterpart.translate("wallet.enter_password")}
                    style={{width: "100%"}}
                    value={this.state.password}
                    onChange={this.handlePasswordChange}
                    type={!passwordVisible ? "password" : "text"}
                    className={`${
                        passwordError ? "input-warning" : ""
                    } input create-account-input`}
                />
            </Form.Item>
        );
    }

    render() {
        return (
            <div onClick={this.props.onChangeActive} className="account-block">
                <div className="overflow-bg-block show-for-small-only">
                    <span className="content" />
                </div>

                <Form
                    layout="vertical"
                    className={!this.props.active ? "display-none" : ""}
                    style={{textAlign: "left"}}
                >
                    {this.renderNameInput()}

                    {this.renderPasswordInput()}

                    {this.renderButtons()}
                </Form>
                {this.renderTooltip()}
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
