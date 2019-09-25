import React, {Component} from "react";
import PropTypes from "prop-types";
import {Link} from "react-router-dom";
import {FormattedDate} from "react-intl";
import {connect} from "alt-react";
import WalletActions from "actions/WalletActions";
import WalletManagerStore from "stores/WalletManagerStore";
import BackupStore from "stores/BackupStore";
import WalletDb from "stores/WalletDb";
import BackupActions, {
    backup,
    decryptWalletBackup
} from "actions/BackupActions";
import {saveAs} from "file-saver";
import Translate from "react-translate-component";
import {PrivateKey} from "tuscjs";
import SettingsActions from "actions/SettingsActions";
import {backupName} from "common/backupUtils";
import {getWalletName} from "branding";
import {Button, Input, Notification} from "bitshares-ui-style-guide";
import counterpart from "counterpart";

const connectObject = {
    listenTo() {
        return [WalletManagerStore, BackupStore];
    },
    getProps() {
        let wallet = WalletManagerStore.getState();
        let backup = BackupStore.getState();
        return {wallet, backup};
    }
};

//The default component is WalletManager.jsx
class BackupCreate extends Component {
    render() {
        return (
            <div style={{maxWidth: "40rem"}}>
                <Create
                    noText={this.props.noText}
                    newAccount={
                        this.props.location && this.props.location.query
                            ? this.props.location.query.newAccount
                            : null
                    }
                >
                    <NameSizeModified />
                    {this.props.noText ? null : <Sha1 />}
                    <Download downloadCb={this.props.downloadCb} />
                </Create>
            </div>
        );
    }
}
BackupCreate = connect(
    BackupCreate,
    connectObject
);

// layout is a small project
// class WalletObjectInspector extends Component {
//     static propTypes={ walletObject: PropTypes.object }
//     render() {
//         return <div style={{overflowY:'auto'}}>
//             <Inspector
//                 data={ this.props.walletObject || {} }
//                 search={false}/>
//         </div>
//     }
// }

class BackupRestore extends Component {
    constructor() {
        super();
        this.state = {
            newWalletName: null
        };
    }

    componentWillMount() {
        BackupActions.reset();
    }

    render() {
        let new_wallet = this.props.wallet.new_wallet;
        let has_new_wallet = this.props.wallet.wallet_names.has(new_wallet);
        let restored = has_new_wallet;
        const wallet_types = (
            <Link to="/help/introduction/wallets">
                {counterpart.translate("wallet.wallet_types")}
            </Link>
        );
        const backup_types = (
            <Link to="/help/introduction/backups">
                {counterpart.translate("wallet.backup_types")}
            </Link>
        );

        return (
            <div>
                <Translate
                    style={{textAlign: "left", maxWidth: "30rem"}}
                    component="p"
                    content="wallet.import_backup_choose"
                />
                <Translate
                    className="text-left"
                    component="p"
                    wallet={wallet_types}
                    backup={backup_types}
                    content="wallet.read_more"
                />
                {new FileReader().readAsBinaryString ? null : (
                    <p className="error">
                        Warning! You browser doesn't support some some file
                        operations required to restore backup, we recommend you
                        to use Chrome or Firefox browsers to restore your
                        backup.
                    </p>
                )}
                <Upload>
                    <NameSizeModified />
                    <DecryptBackup saveWalletObject={true}>
                        <NewWalletName>
                            <Restore />
                        </NewWalletName>
                    </DecryptBackup>
                </Upload>
                <br />
                <Link to="/">
                    <Button>
                        <Translate content="wallet.back" />
                    </Button>
                </Link>
            </div>
        );
    }
}

BackupRestore = connect(
    BackupRestore,
    connectObject
);

class Restore extends Component {
    constructor() {
        super();
        this.state = {};
    }

    isRestored() {
        let new_wallet = this.props.wallet.new_wallet;
        let has_new_wallet = this.props.wallet.wallet_names.has(new_wallet);
        return has_new_wallet;
    }

    render() {
        let new_wallet = this.props.wallet.new_wallet;
        let has_new_wallet = this.isRestored();

        if (has_new_wallet)
            return (
                <span>
                    <h5>
                        <Translate
                            content="wallet.restore_success"
                            name={new_wallet.toUpperCase()}
                        />
                    </h5>
                    <Link to="/">
                        <Button type="primary">
                            <Translate
                                component="span"
                                content="header.dashboard"
                            />
                        </Button>
                    </Link>
                    <div>{this.props.children}</div>
                </span>
            );

        return (
            <span>
                <h3>
                    <Translate content="wallet.ready_to_restore" />
                </h3>
                <Button type="primary" onClick={this.onRestore.bind(this)}>
                    <Translate
                        content="wallet.restore_wallet_of"
                        name={new_wallet}
                    />
                </Button>
            </span>
        );
    }

    onRestore() {
        WalletActions.restore(
            this.props.wallet.new_wallet,
            this.props.backup.wallet_object
        );
        SettingsActions.changeSetting({
            setting: "passwordLogin",
            value: false
        });
    }
}
Restore = connect(
    Restore,
    connectObject
);

class NewWalletName extends Component {
    constructor() {
        super();
        this.state = {
            new_wallet: null,
            accept: false
        };
    }

    componentWillMount() {
        let has_current_wallet = !!this.props.wallet.current_wallet;
        if (!has_current_wallet) {
            let walletName = "default";
            if (this.props.backup.name) {
                walletName = this.props.backup.name.match(/[a-z0-9_-]*/)[0];
            }
            WalletManagerStore.setNewWallet(walletName);
            this.setState({accept: true});
        }
        if (
            has_current_wallet &&
            this.props.backup.name &&
            !this.state.new_wallet
        ) {
            // begning of the file name might make a good wallet name
            let new_wallet = this.props.backup.name
                .toLowerCase()
                .match(/[a-z0-9_-]*/)[0];
            if (new_wallet) this.setState({new_wallet});
        }
    }

    render() {
        if (this.state.accept) return <span>{this.props.children}</span>;

        let has_wallet_name = !!this.state.new_wallet;
        let has_wallet_name_conflict = has_wallet_name
            ? this.props.wallet.wallet_names.has(this.state.new_wallet)
            : false;
        let name_ready = !has_wallet_name_conflict && has_wallet_name;

        return (
            <form onSubmit={this.onAccept.bind(this)}>
                <h5>
                    <Translate content="wallet.new_wallet_name" />
                </h5>
                <Input
                    type="text"
                    id="new_wallet"
                    onChange={this.formChange.bind(this)}
                    value={this.state.new_wallet}
                />
                <p>
                    {has_wallet_name_conflict ? (
                        <Translate content="wallet.wallet_exist" />
                    ) : null}
                </p>
                <Button
                    onClick={this.onAccept.bind(this)}
                    type="primary"
                    disabled={!name_ready}
                >
                    <Translate content="wallet.accept" />
                </Button>
            </form>
        );
    }

    onAccept(e) {
        if (e) e.preventDefault();
        this.setState({accept: true});
        WalletManagerStore.setNewWallet(this.state.new_wallet);
    }

    formChange(event) {
        let key_id = event.target.id;
        let value = event.target.value;
        if (key_id === "new_wallet") {
            //case in-sensitive
            value = value.toLowerCase();
            // Allow only valid file name characters
            if (/[^a-z0-9_-]/.test(value)) return;
        }
        let state = {};
        state[key_id] = value;
        this.setState(state);
    }
}
NewWalletName = connect(
    NewWalletName,
    connectObject
);

class Download extends Component {
    componentWillMount() {
        try {
            this.isFileSaverSupported = !!new Blob();
        } catch (e) {}
    }

    componentDidMount() {
        if (!this.isFileSaverSupported) {
            Notification.error({
                message: counterpart.translate(
                    "notifications.backup_file_save_unsupported"
                )
            });
        }

        if (this.props.confirmation) {
            this.createBackup();
        }
    }

    getBackupName() {
        return backupName(this.props.wallet.current_wallet);
    }

    createBackup() {
        const backupPubkey = WalletDb.getWallet().password_pubkey;
        backup(backupPubkey).then(contents => {
            const name = this.getBackupName();
            BackupActions.incommingBuffer({name, contents});
        });
    }

    render() {
        let isReady = true;
        if (this.props.confirmation) {
            isReady = this.props.checkboxActive;
        }
        return (
            <Button
                type={"primary"}
                disabled={!isReady}
                onClick={() => {
                    this.onDownload();
                }}
                style={
                    this.props.confirmation
                        ? {height: "initial", padding: 0}
                        : {}
                }
            >
                {this.props.confirmation ? (
                    <div
                        className="download-block"
                        style={{padding: "1.25rem"}}
                    >
                        <img
                            className="bin-img"
                            src="/bin-file/default.svg"
                            alt="bin"
                        />
                        <span className="text-left">
                            <Translate
                                className="download-text"
                                content="registration.downloadFile"
                            />
                            <p className="file-name" style={{marginBottom: 0}}>
                                {this.props.backup.name}
                            </p>
                        </span>
                    </div>
                ) : (
                    <Translate content="wallet.download" />
                )}
            </Button>
        );
    }

    onDownload() {
        const blob = new Blob([this.props.backup.contents], {
            type: "application/octet-stream; charset=us-ascii"
        });

        if (blob.size !== this.props.backup.size) {
            throw new Error("Invalid backup to download conversion");
        }
        saveAs(blob, this.props.backup.name);
        WalletActions.setBackupDate();

        if (this.props.downloadCb) {
            this.props.downloadCb();
        }
    }
}
Download = connect(
    Download,
    connectObject
);

class Create extends Component {
    getBackupName() {
        return backupName(this.props.wallet.current_wallet);
    }

    render() {
        let has_backup = !!this.props.backup.contents;
        if (has_backup) return <div>{this.props.children}</div>;

        let ready = WalletDb.getWallet() != null;

        return (
            <div>
                {this.props.noText ? null : (
                    <div style={{textAlign: "left"}}>
                        {this.props.newAccount ? (
                            <Translate
                                component="p"
                                content="wallet.backup_new_account"
                                wallet_name={getWalletName()}
                            />
                        ) : null}
                        <Translate
                            component="p"
                            content="wallet.backup_explain"
                        />
                    </div>
                )}
                <Button
                    type="primary"
                    onClick={this.onCreateBackup.bind(this)}
                    style={{marginBottom: 10}}
                    disabled={!ready}
                >
                    <Translate
                        content="wallet.create_backup_of"
                        name={this.props.wallet.current_wallet}
                    />
                </Button>
                <LastBackupDate />
            </div>
        );
    }

    onCreateBackup() {
        let backup_pubkey = WalletDb.getWallet().password_pubkey;
        backup(backup_pubkey).then(contents => {
            let name = this.getBackupName();
            BackupActions.incommingBuffer({name, contents});
        });
    }
}
Create = connect(
    Create,
    connectObject
);

class LastBackupDate extends Component {
    render() {
        if (!WalletDb.getWallet()) {
            return null;
        }
        let backup_date = WalletDb.getWallet().backup_date;
        let last_modified = WalletDb.getWallet().last_modified;
        let backup_time = backup_date ? (
            <h4>
                <Translate content="wallet.last_backup" />{" "}
                <FormattedDate value={backup_date} />
            </h4>
        ) : (
            <Translate
                style={{paddingTop: 20}}
                className="facolor-error"
                component="p"
                content="wallet.never_backed_up"
            />
        );
        let needs_backup = null;
        if (backup_date) {
            needs_backup =
                last_modified.getTime() > backup_date.getTime() ? (
                    <h4 className="facolor-error">
                        <Translate content="wallet.need_backup" />
                    </h4>
                ) : (
                    <h4 className="success">
                        <Translate content="wallet.noneed_backup" />
                    </h4>
                );
        }
        return (
            <span>
                {backup_time}
                {needs_backup}
            </span>
        );
    }
}

class Upload extends Component {
    reset() {
        // debugger;
        // this.refs.file_input.value = "";
        BackupActions.reset();
    }

    render() {
        let resetButton = (
            <div style={{paddingTop: 20}}>
                <Button
                    disabled={!this.props.backup.contents}
                    onClick={this.reset.bind(this)}
                >
                    <Translate content="wallet.reset" />
                </Button>
            </div>
        );

        if (this.props.backup.contents && this.props.backup.public_key)
            return (
                <span>
                    {this.props.children}
                    {resetButton}
                </span>
            );

        let is_invalid =
            this.props.backup.contents && !this.props.backup.public_key;

        return (
            <div>
                <input
                    ref="file_input"
                    accept=".bin"
                    type="file"
                    id="backup_input_file"
                    style={{border: "solid"}}
                    onChange={this.onFileUpload.bind(this)}
                />
                {is_invalid ? (
                    <h5>
                        <Translate content="wallet.invalid_format" />
                    </h5>
                ) : null}
                {resetButton}
            </div>
        );
    }

    onFileUpload(evt) {
        let file = evt.target.files[0];
        BackupActions.incommingWebFile(file);
        this.forceUpdate();
    }
}
Upload = connect(
    Upload,
    connectObject
);

class NameSizeModified extends Component {
    render() {
        return (
            <span>
                <h5>
                    <b>{this.props.backup.name}</b> ({this.props.backup.size}{" "}
                    bytes)
                </h5>
                {this.props.backup.last_modified ? (
                    <div>{this.props.backup.last_modified}</div>
                ) : null}
                <br />
            </span>
        );
    }
}
NameSizeModified = connect(
    NameSizeModified,
    connectObject
);

class DecryptBackup extends Component {
    static propTypes = {
        saveWalletObject: PropTypes.bool
    };

    constructor() {
        super();
        this.state = this._getInitialState();
    }

    _getInitialState() {
        return {
            backup_password: "",
            verified: false
        };
    }

    render() {
        if (this.state.verified) return <span>{this.props.children}</span>;
        return (
            <form onSubmit={this.onPassword.bind(this)}>
                <label>
                    <Translate content="wallet.enter_password" />
                </label>
                <Input
                    type="password"
                    id="backup_password"
                    onChange={this.formChange.bind(this)}
                    value={this.state.backup_password}
                />
                <Sha1 />
                <Button
                    type="primary"
                    htmlType="submit"
                    onClick={this.onPassword.bind(this)}
                >
                    <Translate content="wallet.submit" />
                </Button>
            </form>
        );
    }

    onPassword(e) {
        if (e) e.preventDefault();
        let private_key = PrivateKey.fromSeed(this.state.backup_password || "");
        let contents = this.props.backup.contents;
        decryptWalletBackup(private_key.toWif(), contents)
            .then(wallet_object => {
                this.setState({verified: true});
                if (this.props.saveWalletObject)
                    BackupStore.setWalletObjct(wallet_object);
            })
            .catch(error => {
                console.error(
                    "Error verifying wallet " + this.props.backup.name,
                    error,
                    error.stack
                );
                if (error === "invalid_decryption_key") {
                    Notification.error({
                        message: counterpart.translate(
                            "notifications.invalid_password"
                        )
                    });
                } else {
                    Notification.error({
                        message: error
                    });
                }
            });
    }

    formChange(event) {
        let state = {};
        state[event.target.id] = event.target.value;
        this.setState(state);
    }
}
DecryptBackup = connect(
    DecryptBackup,
    connectObject
);

class Sha1 extends Component {
    render() {
        return (
            <div className="padding no-overflow">
                <pre className="no-overflow" style={{lineHeight: "1.2"}}>
                    {this.props.backup.sha1} * SHA1
                </pre>
                <br />
            </div>
        );
    }
}
Sha1 = connect(
    Sha1,
    connectObject
);

export {
    BackupCreate,
    BackupRestore,
    Restore,
    NewWalletName,
    Download,
    Create,
    Upload,
    NameSizeModified,
    DecryptBackup,
    Sha1
};
