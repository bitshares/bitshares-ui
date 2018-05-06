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

const stopPropagation = e => e.stopPropagation();

export const KeyFileLabel = ({showUseOtherWalletLink, onUseOtherWallet}) => (
    <div className="label-container">
        <label className="left-label login-label">
            <Translate content="wallet.key_file_bin" />{" "}
        </label>{" "}
        {showUseOtherWalletLink && (
            <a onClick={onUseOtherWallet}>
                (<Translate content="wallet.use_different" />)
            </a>
        )}
    </div>
);

export class StyledUpload extends React.Component {
    handleLabelClick = () => this.refs.input.click();
    render() {
        return (
            <label
                onClick={this.handleLabelClick}
                className="upload-button themed-input"
            >
                <Translate content="wallet.restore_key_file" />
                <UploadButtonLogo />
                <input
                    type="file"
                    onClick={stopPropagation}
                    onChange={this.props.onFileChosen}
                    ref="input"
                />
            </label>
        );
    }
}

export const CustomError = ({message}) => (
    <div className="has-error">{message || ""}</div>
);

export const BackupFileSelector = ({onFileChosen, onRestoreOther}) => (
    <div>
        <StyledUpload onFileChosen={onFileChosen} />
        <div className="login-hint">
            <Translate content="wallet.different_file_type" />{" "}
            <a onClick={onRestoreOther}>
                <Translate content="wallet.restore_it_here" />
            </a>
        </div>
    </div>
);

export const RestoreBackupOnly = ({onFileChosen, onRestoreOther}) => (
    <BackupFileSelector
        onFileChosen={onFileChosen}
        onRestoreOther={onRestoreOther}
    />
);

export const BackupWarning = ({onChange, checked}) => (
    <div className="backup-warning">
        <p>
            <Translate content="wallet.backup_warning" />
        </p>
        <div className="checkbox">
            <input
                key={`checkbox_${checked}`} // This is needed to prevent slow checkbox reaction
                type="checkbox"
                onChange={onChange}
                checked={checked}
            />{" "}
            <Translate content="wallet.dont_ask_for_backup" />
        </div>
    </div>
);

export const LoginButtons = ({onLogin, backupLogin}) => (
    <button
        className="button"
        data-place="bottom"
        data-html
        data-tip={counterpart.translate("tooltip.login")}
        onClick={onLogin}
    >
        <Translate
            content={
                backupLogin ? "wallet.backup_login" : "header.unlock_short"
            }
        />
    </button>
);

export class CustomPasswordInput extends React.Component {
    render = () => (
        <div className="content-block account-selector input-area">
            <label className="left-label login-label">
                <Translate content="settings.password" />
            </label>
            <input
                ref="password_input"
                name="password"
                id="password"
                type="password"
            />
        </div>
    );
}

const UploadButtonLogo = () => (
    <svg
        viewBox="0 0 6.349999 7.5313201"
        version="1.1"
        className="upload-button-logo"
    >
        <g transform="translate(-86.783338,-137.44666)">
            <path d="m 89.958337,144.97798 h -3.174999 v -1.18208 -1.18208 l 0.387288,-1.11098 0.387288,-1.11097 h 0.847434 0.847434 v 0.31163 0.31163 l -0.65212,0.17054 -0.652119,0.17053 -0.196798,0.75256 -0.196798,0.75255 h 2.40339 2.403391 l -0.196798,-0.75255 -0.196798,-0.75256 -0.652119,-0.17053 -0.65212,-0.17054 v -0.31163 -0.31163 h 0.847434 0.847434 l 0.387288,1.11097 0.387288,1.11098 v 1.18208 1.18208 z m 0,-3.175 H 89.60556 v -1.2017 -1.20169 l -0.705556,0.1845 -0.705555,0.18451 v -0.33243 -0.33243 l 0.881944,-0.82854 0.881944,-0.82854 0.881945,0.82854 0.881944,0.82854 v 0.33243 0.33243 l -0.705555,-0.18451 -0.705556,-0.1845 v 1.20169 1.2017 z" />
        </g>
    </svg>
);

export const WalletDisplay = ({name, onUseOtherWallet}) => (
    <div className="content-box">
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
    <div className="login-hint">
        <Translate content="wallet.no_wallet" component="span" />{" "}
        <span className="button" onClick={onCreate}>
            <Translate content="wallet.create_wallet" />
        </span>
    </div>
);

export const WalletSelector = ({
    restoringBackup,
    walletNames,
    onWalletChange
}) => (
    <select
        value={restoringBackup ? "upload." : ""}
        onChange={onWalletChange}
        className="login-select"
    >
        <option value="" hidden>
            <Translate content="wallet.select_wallet" />
        </option>
        {walletNames.map(walletName => (
            <option
                className="login-option"
                key={walletName}
                value={`wallet.${walletName}`}
            >
                {walletName}
            </option>
        ))}
        <option value="upload.">
            <Translate content="settings.backup_backup_short" />
        </option>
    </select>
);
