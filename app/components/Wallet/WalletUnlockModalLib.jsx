import React from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";

/* Dummy input to trick Chrome into disabling auto-complete */
export const DisableChromeAutocomplete = () => (
    <input
        type="text"
        className="no-padding no-margin"
        style={{visibility: "hidden", height: 0}}
    />
);

const uploadText = counterpart.translate("settings.backup_backup");

const stopPropagation = e => e.stopPropagation();

export const CustomError = ({message}) =>
    message ? (
        <div
            className="has-error"
            style={{
                marginBottom: "2rem"
            }}
        >
            {message}
        </div>
    ) : null;

export const BackupFileSelector = ({onFileChosen, onRestoreOther}) => (
    <span>
        <input onClick={stopPropagation} type="file" onChange={onFileChosen} />
        <div style={{marginTop: "1rem"}}>
            <Translate content="wallet.different_file_type" />{" "}
            <a onClick={onRestoreOther}>
                <Translate content="wallet.restore_it_here" />
            </a>
        </div>
    </span>
);

export const RestoreBackupOnly = ({onFileChosen, onRestoreOther}) => (
    <div>
        <div style={{marginBottom: "0.5rem"}}>{uploadText}</div>
        <BackupFileSelector
            onFileChosen={onFileChosen}
            onRestoreOther={onRestoreOther}
        />
    </div>
);

export const BackupWarning = ({onChange, checked}) => (
    <div style={{marginBottom: "2rem"}}>
        <p
            style={{
                border: "1px solid yellow",
                padding: "1rem"
            }}
        >
            <Translate content="wallet.backup_warning" />
        </p>
        <input
            key={`checkbox_${checked}`} // This is needed to prevent slow checkbox reaction
            type="checkbox"
            onChange={onChange}
            checked={checked}
        />{" "}
        <Translate content="wallet.dont_ask_for_backup" />
    </div>
);

export const LoginButtons = ({onLogin, onBackupLogin, useBackupLogin}) => (
    <div className="button-group">
        <button
            className="button"
            data-place="bottom"
            data-html
            data-tip={counterpart.translate("tooltip.login")}
            onClick={useBackupLogin ? onBackupLogin : onLogin}
        >
            <Translate
                content={
                    useBackupLogin
                        ? "wallet.backup_login"
                        : "header.unlock_short"
                }
            />
        </button>
    </div>
);

export class CustomPasswordInput extends React.Component {
    render = () => (
        <div
            className="content-block"
            style={{marginBottom: "2rem", marginTop: "2rem"}}
        >
            <div className="account-selector">
                <div className="input-area">
                    <label className="left-label">
                        <Translate content="settings.password" />
                    </label>
                    <div className="inline-label input-wrapper">
                        <input
                            ref="password_input"
                            name="password"
                            id="password"
                            type="password"
                            tabIndex={this.props.tabIndex}
                        />
                    </div>
                </div>
                {this.props.passwordError ? (
                    <div className="has-error" style={{marginTop: "1rem"}}>
                        <Translate content="wallet.pass_incorrect" />
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export const WalletDisplay = ({name, onUseOtherWallet}) => (
    <div className="content-box" style={{marginBottom: "2rem"}}>
        <b>
            <Translate content="wallet.using" />
        </b>{" "}
        {name}{" "}
        <a onClick={onUseOtherWallet}>
            (<Translate content="wallet.use_different" />)
        </a>
    </div>
);

export const CreateLocalWalletLink = ({onCreate}) => (
    <div style={{marginTop: "2rem"}}>
        <Translate content="wallet.no_wallet" component="span" />{" "}
        <span className="button" onClick={onCreate}>
            <Translate content="wallet.create_wallet" />
        </span>
    </div>
);

export const WalletSelector = ({
    restoringBackup,
    walletNames,
    onFileChosen,
    onRestoreOther,
    onWalletChange
}) => (
    <div style={{marginBottom: "2rem"}}>
        <select
            value={restoringBackup ? "upload." : ""}
            onChange={onWalletChange}
            className="settings-select"
        >
            <option value="" hidden>
                Select wallet
            </option>
            {walletNames.map(walletName => (
                <option key={walletName} value={`wallet.${walletName}`}>
                    {walletName}
                </option>
            ))}
            <option value="upload.">{uploadText}</option>
        </select>
        {restoringBackup && (
            <BackupFileSelector
                onFileChosen={onFileChosen}
                onRestoreOther={onRestoreOther}
            />
        )}
    </div>
);
