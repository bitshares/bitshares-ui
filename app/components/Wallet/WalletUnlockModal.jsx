import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import BaseModal from "../Modal/BaseModal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import PasswordInput from "../Forms/PasswordInput";
import notify from "actions/NotificationActions";
import Translate from "react-translate-component";
import AltContainer from "alt-container";
import WalletDb from "stores/WalletDb";
import WalletUnlockStore from "stores/WalletUnlockStore";
import WalletManagerStore from "stores/WalletManagerStore";
import BackupStore from "stores/BackupStore";
import AccountStore from "stores/AccountStore";
import WalletUnlockActions from "actions/WalletUnlockActions";
import WalletActions from "actions/WalletActions";
import BackupActions, {restore, backup} from "actions/BackupActions";
import AccountActions from "actions/AccountActions";
import SettingsActions from "actions/SettingsActions";
import {Apis} from "bitsharesjs-ws";
import utils from "common/utils";
import AccountSelector from "../Account/AccountSelector";
import {PrivateKey} from "bitsharesjs/es";
import {Link} from "react-router/es";
import {saveAs} from "file-saver";
import LoginTypeSelector from "./LoginTypeSelector";
import counterpart from "counterpart";
import {
    WalletSelector,
    CreateLocalWalletLink,
    WalletDisplay,
    CustomPasswordInput,
    LoginButtons,
    BackupWarning,
    RestoreBackupOnly,
    BackupFileSelector,
    DisableChromeAutocomplete,
    CustomError
} from "./WalletUnlockModalLib";
import {backupName} from "common/backupUtils";

class WalletUnlockModal extends React.Component {
    static contextTypes = {
        router: React.PropTypes.object
    };

    constructor(props) {
        super(props);
        this.state = this.initialState(props);
    }

    initialState = (props = this.props) => {
        const {passwordAccount, currentWallet} = props;
        return {
            passwordError: null,
            accountName: passwordAccount,
            walletSelected: !!currentWallet,
            customError: null,
            isOpen: false,
            restoringBackup: false,
            stopAskingForBackup: false
        };
    };

    componentWillReceiveProps(np) {
        const {walletSelected, restoringBackup, accountName} = this.state;
        const {
            currentWallet: newCurrentWallet,
            passwordAccount: newPasswordAccount
        } = np;

        const newState = {};
        if (newPasswordAccount && !accountName)
            newState.accountName = newPasswordAccount;
        if (walletSelected && !restoringBackup && !newCurrentWallet)
            newState.walletSelected = false;

        this.setState(newState);
    }

    shouldComponentUpdate(np, ns) {
        return (
            !utils.are_equal_shallow(np, this.props) ||
            !utils.are_equal_shallow(ns, this.state)
        );
    }

    handleModalClose = () => {
        WalletUnlockActions.cancel();
        BackupActions.reset();
        this.setState(this.initialState());
    };

    handleModalOpen = () => {
        BackupActions.reset();
        this.setState({isOpen: true}, () => {
            const {passwordLogin} = this.props;
            if (!passwordLogin) {
                const {password_input} = this.refs;
                if (password_input) {
                    password_input.clear();
                    password_input.focus();
                }

                const {dbWallet} = this.props;
                if (
                    dbWallet &&
                    Apis.instance().chain_id !== dbWallet.chain_id
                ) {
                    notify.error(
                        "This wallet was intended for a different block-chain; expecting " +
                            dbWallet.chain_id.substring(0, 4).toUpperCase() +
                            ", but got " +
                            Apis.instance()
                                .chain_id.substring(0, 4)
                                .toUpperCase()
                    );
                    WalletUnlockActions.cancel();
                }
            }
        });
    };

    componentDidMount() {
        const {modalId, passwordLogin} = this.props;

        ZfApi.subscribe(modalId, (name, msg) => {
            const {isOpen} = this.state;

            if (name !== modalId) return;
            if (msg === "close" && isOpen) {
                this.handleModalClose();
            } else if (msg === "open" && !isOpen) {
                this.handleModalOpen();
            }
        });

        if (passwordLogin) {
            const {password_input, account_input} = this.refs;
            const {accountName} = this.state;

            if (accountName) {
                password_input.focus();
            } else if (
                account_input &&
                typeof account_input.focus === "function"
            ) {
                account_input.focus();
            }
        }
    }

    componentDidUpdate() {
        const {resolve, modalId, isLocked} = this.props;

        if (resolve)
            if (isLocked) {
                ZfApi.publish(modalId, "open");
            } else {
                resolve();
            }
        else ZfApi.publish(this.props.modalId, "close");
    }

    validate = (password, account) => {
        const {passwordLogin, resolve} = this.props;
        const {stopAskingForBackup} = this.state;

        const {cloudMode} = WalletDb.validatePassword(
            password || "",
            true, //unlock
            account
        );

        if (WalletDb.isLocked()) {
            this.setState({passwordError: true});
        } else {
            const password_input = this.passwordInput();
            if (!passwordLogin) {
                password_input.clear();
            } else {
                password_input.value = "";
                if (cloudMode) AccountActions.setPasswordAccount(account);
            }
            WalletUnlockActions.change();
            if (stopAskingForBackup) WalletActions.setBackupDate();
            WalletUnlockActions.cancel();
            resolve();
        }
    };

    passwordInput = () =>
        this.refs.password_input ||
        this.refs.custom_password_input.refs.password_input;

    restoreBackup = (password, callback) => {
        const {backup} = this.props;
        const privateKey = PrivateKey.fromSeed(password || "");
        const walletName = backup.name.split(".")[0];
        restore(privateKey.toWif(), backup.contents, walletName)
            .then(() => {
                return WalletActions.setWallet(walletName)
                    .then(() => {
                        BackupActions.reset();
                        callback();
                    })
                    .catch(e => this.setState({customError: e.message}));
            })
            .catch(e => {
                const message = typeof e === "string" ? e : e.message;
                const invalidBackupPassword =
                    message === "invalid_decryption_key";
                this.setState({
                    customError: invalidBackupPassword ? null : message,
                    passwordError: invalidBackupPassword
                });
            });
    };

    handleLogin = e => {
        if (e) e.preventDefault();

        const {passwordLogin, backup} = this.props;
        const {walletSelected, accountName} = this.state;

        if (!passwordLogin && !walletSelected) {
            this.setState({
                customError: counterpart.translate("wallet.select_wallet")
            });
        } else {
            this.setState({passwordError: null}, () => {
                const password_input = this.passwordInput();
                const password = passwordLogin
                    ? password_input.value
                    : password_input.value();
                if (!passwordLogin && backup.name) {
                    this.restoreBackup(password, () => this.validate(password));
                } else {
                    const account = passwordLogin ? accountName : null;
                    this.validate(password, account);
                }
            });
        }
    };

    closeRedirect = path => {
        WalletUnlockActions.cancel();
        this.context.router.push(path);
    };

    handleCreateWallet = () => this.closeRedirect("/create-account/wallet");

    handleRestoreOther = () => this.closeRedirect("/settings/restore");

    loadBackup = e => {
        const fullPath = e.target.value;
        const file = e.target.files[0];

        this.setState({restoringBackup: true}, () => {
            const startIndex =
                fullPath.indexOf("\\") >= 0
                    ? fullPath.lastIndexOf("\\")
                    : fullPath.lastIndexOf("/");
            let filename = fullPath.substring(startIndex);
            if (filename.indexOf("\\") === 0 || filename.indexOf("/") === 0) {
                filename = filename.substring(1);
            }
            BackupActions.incommingWebFile(file);
            this.setState({
                walletSelected: true
            });
        });
    };

    handleSelectedWalletChange = e => {
        const {value} = e.target;
        const selectionType = value.split(".")[0];
        const walletName = value.substring(value.indexOf(".") + 1);

        if (selectionType === "upload") {
            this.setState({
                restoringBackup: true,
                customError: null
            });
        } else {
            BackupActions.reset();
            WalletActions.setWallet(walletName).then(() =>
                this.setState({
                    walletSelected: true,
                    customError: null,
                    restoringBackup: false
                })
            );
        }
    };

    handleBackupAndLogin = () =>
        backup(this.props.dbWallet.password_pubkey).then(contents => {
            const {currentWallet} = this.props;
            const name = backupName(currentWallet);
            BackupActions.incommingBuffer({name, contents});

            const {backup} = this.props;
            let blob = new Blob([backup.contents], {
                type: "application/octet-stream; charset=us-ascii"
            });
            if (blob.size !== backup.size)
                throw new Error("Invalid backup to download conversion");
            saveAs(blob, name);
            WalletActions.setBackupDate();
            BackupActions.reset();
            this.handleLogin();
        });

    handleAskForBackupChange = e =>
        this.setState({stopAskingForBackup: e.target.checked});

    handleUseOtherWallet = () => {
        this.setState({
            walletSelected: false,
            restoringBackup: false,
            passwordError: null,
            customError: null
        });
    };

    handleAccountNameChange = accountName =>
        this.setState({accountName, error: null});

    render() {
        const {
            backup,
            passwordLogin,
            modalId,
            currentWallet,
            walletNames,
            dbWallet
        } = this.props;
        const {
            walletSelected,
            restoringBackup,
            passwordError,
            customError,
            accountName,
            stopAskingForBackup
        } = this.state;

        const noWalletNames = !(walletNames.size > 0);
        const noLocalWallet = noWalletNames && !walletSelected;
        const backupRequested =
            walletSelected &&
            !restoringBackup &&
            !(!!dbWallet && !!dbWallet.backup_date);
        const allowBackupLogin =
            !passwordLogin && backupRequested && !stopAskingForBackup;
        const walletDisplayName = backup.name || currentWallet;
        let tabIndex = 0;
        // Modal overlayClose must be false pending a fix that allows us to detect
        // this event and clear the password (via this.refs.password_input.clear())
        // https://github.com/akiran/react-foundation-apps/issues/34
        return (
            // U N L O C K
            <BaseModal
                id={modalId}
                ref="modal"
                overlay={true}
                overlayClose={false}
                modalHeader="header.unlock_short"
                leftHeader
            >
                <form onSubmit={this.handleLogin} className="full-width">
                    <LoginTypeSelector />
                    {passwordLogin ? (
                        <div>
                            <DisableChromeAutocomplete />
                            <AccountSelector
                                label="account.name"
                                ref="account_input"
                                accountName={accountName}
                                account={accountName}
                                onChange={this.handleAccountNameChange}
                                onAccountChanged={() => {}}
                                size={60}
                                tabIndex={tabIndex++}
                                hideImage
                            />
                            <CustomPasswordInput
                                password_error={passwordError}
                                tabIndex={tabIndex++}
                                ref="custom_password_input"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="left-label">
                                <Translate content="settings.wallet" />
                            </label>
                            {walletSelected ? (
                                <WalletDisplay
                                    name={walletDisplayName}
                                    onUseOtherWallet={this.handleUseOtherWallet}
                                />
                            ) : noLocalWallet ? (
                                <div style={{marginBottom: "2rem"}}>
                                    <RestoreBackupOnly
                                        onFileChosen={this.loadBackup}
                                        onRestoreOther={this.handleRestoreOther}
                                    />
                                    <CreateLocalWalletLink
                                        onCreate={this.handleCreateWallet}
                                    />
                                </div>
                            ) : (
                                <WalletSelector
                                    onFileChosen={this.loadBackup}
                                    restoringBackup={restoringBackup}
                                    walletNames={walletNames}
                                    onFileChosen={this.loadBackup}
                                    onRestoreOther={this.handleRestoreOther}
                                    onWalletChange={
                                        this.handleSelectedWalletChange
                                    }
                                />
                            )}
                            <PasswordInput
                                ref="password_input"
                                onEnter={this.handleLogin}
                                wrongPassword={passwordError}
                                noValidation
                            />
                            <CustomError message={customError} />
                            {backupRequested && (
                                <BackupWarning
                                    onChange={this.handleAskForBackupChange}
                                    checked={stopAskingForBackup}
                                />
                            )}
                        </div>
                    )}
                    <LoginButtons
                        onLogin={this.handleLogin}
                        onBackupLogin={this.handleBackupAndLogin}
                        allowBackupLogin={allowBackupLogin}
                    />
                </form>
            </BaseModal>
        );
    }
}

WalletUnlockModal.defaultProps = {
    modalId: "unlock_wallet_modal2"
};

class WalletUnlockModalContainer extends React.Component {
    render() {
        return (
            <AltContainer
                stores={[
                    WalletUnlockStore,
                    AccountStore,
                    WalletManagerStore,
                    WalletDb,
                    BackupStore
                ]}
                inject={{
                    currentWallet: () =>
                        WalletManagerStore.getState().current_wallet,
                    walletNames: () =>
                        WalletManagerStore.getState().wallet_names,
                    dbWallet: () => WalletDb.getWallet(),
                    isLocked: () => WalletDb.isLocked(),
                    backup: () => BackupStore.getState(),
                    resolve: () => WalletUnlockStore.getState().resolve,
                    reject: () => WalletUnlockStore.getState().reject,
                    locked: () => WalletUnlockStore.getState().locked,
                    passwordLogin: () =>
                        WalletUnlockStore.getState().passwordLogin,
                    passwordAccount: () =>
                        AccountStore.getState().passwordAccount || ""
                }}
            >
                <WalletUnlockModal {...this.props} />
            </AltContainer>
        );
    }
}
export default WalletUnlockModalContainer;
