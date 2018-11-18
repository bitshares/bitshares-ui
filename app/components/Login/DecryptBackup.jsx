import React, {Component} from "react";
import PropTypes from "prop-types";
import {connect} from "alt-react";
import Translate from "react-translate-component";
import {PrivateKey} from "bitsharesjs/es";
import WalletManagerStore from "stores/WalletManagerStore";
import BackupStore from "stores/BackupStore";
import AccountStore from "stores/AccountStore";
import WalletActions from "actions/WalletActions";
import WalletDb from "stores/WalletDb";
import WalletUnlockActions from "actions/WalletUnlockActions";
import BackupActions, {restore} from "actions/BackupActions";
import notify from "actions/NotificationActions";
import SettingsActions from "actions/SettingsActions";
import Icon from "../Icon/Icon";

class DecryptBackup extends Component {
    static propTypes = {
        active: PropTypes.bool,
        currentAccount: PropTypes.string,
        backup: PropTypes.object,
        wallet: PropTypes.object,
        history: PropTypes.object.isRequired
    };

    static defaultProps = {
        active: false,
        currentAccount: "",
        backup: {},
        wallet: {}
    };

    constructor() {
        super();
        this.state = {
            backupPassword: ""
        };

        this.onPassword = this.onPassword.bind(this);
        this.formChange = this.formChange.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (this.props.active) {
            this.refs.passwordInput.focus();
        }
        if (!prevProps.currentAccount && this.props.currentAccount) {
            this.props.history.push("/");
        }
    }

    onRestore() {
        const {backupPassword} = this.state;
        WalletDb.validatePassword(backupPassword || "", true);
        WalletUnlockActions.change();
        SettingsActions.changeSetting({
            setting: "passwordLogin",
            value: false
        });
        BackupActions.reset();
    }

    onPassword(e) {
        if (e) e.preventDefault();
        const privateKey = PrivateKey.fromSeed(this.state.backupPassword || "");
        const {contents, name} = this.props.backup;
        const walletName = name.split(".")[0];
        restore(privateKey.toWif(), contents, walletName)
            .then(() => {
                return WalletActions.setWallet(walletName).then(() => {
                    this.onRestore(walletName);
                });
            })
            .catch(error => {
                console.error(
                    `Error verifying wallet ${this.props.backup.name}`,
                    error,
                    error.stack
                );
                if (error === "invalid_decryption_key") {
                    notify.error("Invalid Password");
                } else {
                    notify.error(`${error}`);
                }
                this.setState({passwordError: true});
            });
    }

    formChange(event) {
        const state = {};
        state[event.target.id] = event.target.value;
        this.setState(state);
    }

    renderButtons() {
        return (
            <div className="button-group">
                {this.props.active ? (
                    <Translate
                        component="button"
                        type="submit"
                        onClick={this.onPassword}
                        className="button-primary"
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

    render() {
        return (
            <form onSubmit={this.onPassword}>
                <div
                    className={`${
                        !this.props.active ? "display-none" : ""
                    } password-block`}
                >
                    <label
                        className="text-left left-label"
                        htmlFor="backupPassword"
                    >
                        <Translate content="settings.password" />
                    </label>
                    <input
                        className={`${
                            this.state.passwordError
                                ? "input-warning"
                                : this.state.backupPassword
                                    ? "input-success"
                                    : ""
                        } input create-account-input`}
                        type={!this.state.passwordVisible ? "password" : "text"}
                        id="backupPassword"
                        onChange={this.formChange}
                        value={this.state.backupPassword}
                        ref="passwordInput"
                        autoFocus={true}
                    />
                    {!this.state.passwordVisible ? (
                        <span
                            className="no-width eye-block"
                            onClick={() =>
                                this.setState({passwordVisible: true})
                            }
                        >
                            <Icon
                                name="eye-visible"
                                className="eye-icon icon-opacity"
                            />
                        </span>
                    ) : (
                        <span
                            className="no-width eye-block"
                            onClick={() =>
                                this.setState({passwordVisible: false})
                            }
                        >
                            <Icon
                                name="eye-invisible"
                                className="eye-icon icon-opacity"
                            />
                        </span>
                    )}
                </div>
                {this.renderButtons()}
            </form>
        );
    }
}

const connectObject = {
    listenTo() {
        return [WalletManagerStore, BackupStore, AccountStore];
    },
    getProps() {
        return {
            wallet: WalletManagerStore.getState(),
            backup: BackupStore.getState(),
            currentAccount:
                AccountStore.getState().currentAccount ||
                AccountStore.getState().passwordAccount
        };
    }
};

export default connect(
    DecryptBackup,
    connectObject
);
