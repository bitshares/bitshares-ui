import React, {PropTypes, Component} from "react";
import {Link} from "react-router/es";
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
import notify from "actions/NotificationActions";
import {saveAs} from "file-saver";
import cname from "classnames";
import Translate from "react-translate-component";
import {ChainConfig} from "bitsharesjs-ws";
import {PrivateKey} from "bitsharesjs/es";
import SettingsActions from "actions/SettingsActions";

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
                        this.props.location
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
BackupCreate = connect(BackupCreate, connectObject);

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

        return (
            <div>
                <Translate
                    style={{textAlign: "left", maxWidth: "30rem"}}
                    component="p"
                    content="wallet.import_backup_choose"
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
                    <button className="blue">
                        <Translate content="wallet.back" />
                    </button>
                </Link>
            </div>
        );
    }
}

BackupRestore = connect(BackupRestore, connectObject);

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
                        <div className="button outline">
                            <Translate
                                component="span"
                                content="header.dashboard"
                            />
                        </div>
                    </Link>
                    <div>{this.props.children}</div>
                </span>
            );

        return (
            <span>
                <h3>
                    <Translate content="wallet.ready_to_restore" />
                </h3>
                <div
                    className="button outline"
                    onClick={this.onRestore.bind(this)}
                >
                    <Translate
                        content="wallet.restore_wallet_of"
                        name={new_wallet}
                    />
                </div>
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
Restore = connect(Restore, connectObject);

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
                <input
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
                <div
                    onClick={this.onAccept.bind(this)}
                    type="submit"
                    className={cname("button outline", {disabled: !name_ready})}
                >
                    <Translate content="wallet.accept" />
                </div>
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
NewWalletName = connect(NewWalletName, connectObject);

class Download extends Component {
    componentWillMount() {
        try {
            this.isFileSaverSupported = !!new Blob();
        } catch (e) {}
    }

    componentDidMount() {
        if (!this.isFileSaverSupported)
            notify.error("File saving is not supported");
    }

    render() {
        return (
            <div className="button" onClick={this.onDownload.bind(this)}>
                <Translate content="wallet.download" />
            </div>
        );
    }

    onDownload() {
        let blob = new Blob([this.props.backup.contents], {
            type: "application/octet-stream; charset=us-ascii"
        });

        if (blob.size !== this.props.backup.size)
            throw new Error("Invalid backup to download conversion");
        saveAs(blob, this.props.backup.name);
        WalletActions.setBackupDate();

        if (this.props.downloadCb) {
            this.props.downloadCb();
        }
    }
}
Download = connect(Download, connectObject);

class Create extends Component {
    getBackupName() {
        let name = this.props.wallet.current_wallet;
        let address_prefix = ChainConfig.address_prefix.toLowerCase();
        if (name.indexOf(address_prefix) !== 0)
            name = address_prefix + "_" + name;

        let date = new Date();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let stampedName = `${name}_${date.getFullYear()}${
            month >= 10 ? month : "0" + month
        }${day >= 10 ? day : "0" + day}`;

        name = stampedName + ".bin";

        return name;
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
                            />
                        ) : null}
                        <Translate
                            component="p"
                            content="wallet.backup_explain"
                        />
                    </div>
                )}
                <div
                    onClick={this.onCreateBackup.bind(this)}
                    className={cname("button", {disabled: !ready})}
                    style={{marginBottom: 10}}
                >
                    <Translate
                        content="wallet.create_backup_of"
                        name={this.props.wallet.current_wallet}
                    />
                </div>
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
Create = connect(Create, connectObject);

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
                <div
                    onClick={this.reset.bind(this)}
                    className={cname("button outline", {
                        disabled: !this.props.backup.contents
                    })}
                >
                    <Translate content="wallet.reset" />
                </div>
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
Upload = connect(Upload, connectObject);

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
NameSizeModified = connect(NameSizeModified, connectObject);

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
                <input
                    type="password"
                    id="backup_password"
                    onChange={this.formChange.bind(this)}
                    value={this.state.backup_password}
                />
                <Sha1 />
                <div
                    type="submit"
                    className="button outline"
                    onClick={this.onPassword.bind(this)}
                >
                    <Translate content="wallet.submit" />
                </div>
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
                if (error === "invalid_decryption_key")
                    notify.error("Invalid Password");
                else notify.error("" + error);
            });
    }

    formChange(event) {
        let state = {};
        state[event.target.id] = event.target.value;
        this.setState(state);
    }
}
DecryptBackup = connect(DecryptBackup, connectObject);

class Sha1 extends Component {
    render() {
        return (
            <div>
                <pre className="no-overflow">
                    {this.props.backup.sha1} * SHA1
                </pre>
                <br />
            </div>
        );
    }
}
Sha1 = connect(Sha1, connectObject);

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
