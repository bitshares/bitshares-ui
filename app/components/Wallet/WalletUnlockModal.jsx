import React from "react";
import BaseModal from "../Modal/BaseModal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import PasswordInput from "../Forms/PasswordInput";
import notify from "actions/NotificationActions";
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
import {Apis} from "bitsharesjs-ws";
import utils from "common/utils";
import AccountSelector from "../Account/AccountSelector";
import {PrivateKey} from "bitsharesjs/es";
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
    BackupFileSelector,
    DisableChromeAutocomplete,
    CustomError,
    KeyFileLabel
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
        if (this.props.passwordLogin != np.passwordLogin) {
            newState.passwordError = false;
            newState.customError = null;
        }

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

            if (accountName && password_input) {
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
            else if (this.shouldUseBackupLogin()) this.backup();
            resolve();
            WalletUnlockActions.cancel();
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
                customError: counterpart.translate(
                    "wallet.ask_to_select_wallet"
                )
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

        BackupActions.reset();
        if (selectionType === "upload")
            this.setState({
                restoringBackup: true,
                customError: null
            });
        else
            WalletActions.setWallet(walletName).then(() =>
                this.setState({
                    walletSelected: true,
                    customError: null,
                    restoringBackup: false
                })
            );
    };

    backup = () =>
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

    shouldShowBackupWarning = () =>
        !this.props.passwordLogin &&
        this.state.walletSelected &&
        !this.state.restoringBackup &&
        !(!!this.props.dbWallet && !!this.props.dbWallet.backup_date);

    shouldUseBackupLogin = () =>
        this.shouldShowBackupWarning() && !this.state.stopAskingForBackup;

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
        const walletDisplayName = backup.name || currentWallet;
        const errorMessage = passwordError
            ? counterpart.translate("wallet.pass_incorrect")
            : customError;
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
                                hideImage
                                placeholder=" "
                                useHR
                                labelClass="login-label"
                                reserveErrorSpace
                            />
                            <CustomPasswordInput
                                password_error={passwordError}
                                ref="custom_password_input"
                            />
                        </div>
                    ) : (
                        <div>
                            <div
                                className={
                                    "key-file-selector " +
                                    (restoringBackup && !walletSelected
                                        ? "restoring"
                                        : "")
                                }
                            >
                                <KeyFileLabel
                                    showUseOtherWalletLink={
                                        restoringBackup && !backup.name
                                    }
                                    onUseOtherWallet={this.handleUseOtherWallet}
                                />
                                <hr />
                                {walletSelected ? (
                                    <WalletDisplay
                                        name={walletDisplayName}
                                        onUseOtherWallet={
                                            this.handleUseOtherWallet
                                        }
                                    />
                                ) : (
                                    <div>
                                        {restoringBackup || noWalletNames ? (
                                            <BackupFileSelector
                                                onFileChosen={this.loadBackup}
                                                onRestoreOther={
                                                    this.handleRestoreOther
                                                }
                                            />
                                        ) : (
                                            <WalletSelector
                                                onFileChosen={this.loadBackup}
                                                restoringBackup={
                                                    restoringBackup
                                                }
                                                walletNames={walletNames}
                                                onWalletChange={
                                                    this
                                                        .handleSelectedWalletChange
                                                }
                                            />
                                        )}
                                        {noLocalWallet && (
                                            <CreateLocalWalletLink
                                                onCreate={
                                                    this.handleCreateWallet
                                                }
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                            <PasswordInput
                                ref="password_input"
                                onEnter={this.handleLogin}
                                noValidation
                                labelClass="login-label"
                            />
                        </div>
                    )}
                    <CustomError message={errorMessage} />
                    {this.shouldShowBackupWarning() && (
                        <BackupWarning
                            onChange={this.handleAskForBackupChange}
                            checked={stopAskingForBackup}
                        />
                    )}
                    <LoginButtons
                        onLogin={this.handleLogin}
                        backupLogin={this.shouldUseBackupLogin()}
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
