import React, {Component} from "react";
import { connect } from "alt-react";
import cname from "classnames";
import notify from "actions/NotificationActions";
import {PrivateKey, Aes, PublicKey, hash} from "bitsharesjs/es";
import {ChainConfig} from "bitsharesjs-ws";
import PrivateKeyStore from "stores/PrivateKeyStore";
import WalletUnlockActions from "actions/WalletUnlockActions";
import {WalletCreate} from "components/Wallet/WalletCreate";
import LoadingIndicator from "components/LoadingIndicator";
import Translate from "react-translate-component";
import counterpart from "counterpart";

import BalanceClaimActive from "../Wallet/BalanceClaimActive";
import BalanceClaimActiveActions from "actions/BalanceClaimActiveActions";
import BalanceClaimAssetTotal from "components/Wallet/BalanceClaimAssetTotal";
import WalletDb from "stores/WalletDb";
import ImportKeysStore from "stores/ImportKeysStore";

import GenesisFilter from "chain/GenesisFilter";

require("./ImportKeys.scss");

let import_keys_assert_checking = false;

const KeyCount = ({key_count}) => {
    if( !key_count) return <span/>;
    return <span>Found {key_count} private keys</span>;
};

class ImportKeys extends Component {

    constructor() {
        super();
        this.state = this._getInitialState();

        this._renderBalanceClaims = this._renderBalanceClaims.bind(this);
    }

    static defaultProps = {
        privateKey: true
    };

    _getInitialState(keep_file_name = false) {
        return {
            keys_to_account: { },
            no_file: true,
            account_keys: [],
            //brainkey: null,
            //encrypted_brainkey: null,
            reset_file_name: keep_file_name ? this.state.reset_file_name : Date.now(),
            reset_password: Date.now(),
            password_checksum: null,
            import_file_message: null,
            import_password_message: null,
            imported_keys_public: {},
            key_text_message: null,
            genesis_filtering: false,
            genesis_filter_status: [],
            genesis_filter_finished: undefined,
            importSuccess: false
        };
    }

    reset(e, keep_file_name) {
        if(e) e.preventDefault();
        let state = this._getInitialState(keep_file_name);
        this.setState(state, ()=> this.updateOnChange());
    }

    onWif(event) {
        event.preventDefault();
        let value = this.refs.wifInput.value;
        this.addByPattern(value);
    }

    onCancel(e) {
        if(e) e.preventDefault();
        this.setState(this._getInitialState());
    }

    updateOnChange() {
        BalanceClaimActiveActions.setPubkeys(Object.keys(this.state.imported_keys_public));
    }

    getImportAccountKeyCount(keys_to_account) {
        let account_keycount = {};
        let found = false;
        for(let key in keys_to_account)
            for(let account_name of keys_to_account[key].account_names) {
                account_keycount[account_name] =
                    (account_keycount[account_name] || 0) + 1;
                found = true;
            }
        return found ? account_keycount : null;
    }

    upload(evt) {
        this.reset(null, true);
        let file = evt.target.files[0];
        let reader = new FileReader();
        reader.onload = evt => {
            let contents = evt.target.result;
            try {
                let json_contents;
                try {
                    json_contents = JSON.parse(contents);
                    // This is the only chance to encounter a large file,
                    // try this format first.
                    this._parseImportKeyUpload(json_contents, file.name, update_state => {
                        // console.log("update_state", update_state)
                        this.setState(update_state, ()=> {
                            if( update_state.genesis_filter_finished ) {
                                // try empty password, also display "Enter import file password"
                                this._passwordCheck();
                            }
                        });
                    });
                } catch(e) {
                    //DEBUG console.log("... _parseImportKeyUpload",e)
                    try {
                        if( ! json_contents) file.name + " is an unrecognized format";
                        this._parseWalletJson(json_contents);
                    } catch(ee) {
                        if( ! this.addByPattern(contents))
                            throw ee;
                    }
                    // try empty password, also display "Enter import file password"
                    this._passwordCheck();
                }
            } catch(message) {
                console.error("... ImportKeys upload error", message);
                this.setState({import_file_message: message});
            }
        };
        reader.readAsText(file);
    }

    /** BTS 1.0 client wallet_export_keys format. */
    _parseImportKeyUpload(json_contents, file_name, update_state) {
        let password_checksum, unfiltered_account_keys;
        try {
            password_checksum = json_contents.password_checksum;
            if( ! password_checksum)
                throw file_name + " is an unrecognized format";

            if( ! Array.isArray(json_contents.account_keys))
                throw file_name + " is an unrecognized format";

            unfiltered_account_keys = json_contents.account_keys;

        } catch(e) { throw e.message || e; }

        // BTS 1.0 wallets may have a lot of generated but unused keys or spent TITAN addresses making
        // wallets so large it is was not possible to use the JavaScript wallets with them.

        let genesis_filter = new GenesisFilter;
        if( ! genesis_filter.isAvailable() ) {
            update_state({ password_checksum, account_keys: unfiltered_account_keys,
                genesis_filter_finished: true, genesis_filtering: false });
            return;
        }
        this.setState({ genesis_filter_initalizing: true }, ()=>// setTimeout(()=>
            genesis_filter.init(()=> {
                let filter_status = this.state.genesis_filter_status;

                // FF < version 41 does not support worker threads internals (like blob urls)
                // let GenesisFilterWorker = require("worker-loader!workers/GenesisFilterWorker")
                // let worker = new GenesisFilterWorker
                // worker.postMessage({
                //     account_keys: unfiltered_account_keys,
                //     bloom_filter: genesis_filter.bloom_filter
                // })
                // worker.onmessage = event => { try {
                //     let { status, account_keys } = event.data
                //     // ...
                // } catch( e ) { console.error('GenesisFilterWorker', e) }}

                let account_keys = unfiltered_account_keys;
                genesis_filter.filter( account_keys, status => {
                    //console.log("import filter", status)
                    if( status.error === "missing_public_keys" ) {
                        console.error("un-released format, just for testing");
                        update_state({ password_checksum, account_keys: unfiltered_account_keys,
                            genesis_filter_finished: true, genesis_filtering: false });
                        return;
                    }
                    if( status.success ) {
                        // let { account_keys } = event.data // if using worker thread
                        update_state({ password_checksum, account_keys,
                            genesis_filter_finished: true, genesis_filtering: false });
                        return;
                    }
                    if( status.initalizing !== undefined ) {
                        update_state({ genesis_filter_initalizing: status.initalizing, genesis_filtering: true });
                        return;
                    }
                    if( status.importing === undefined ) {
                        // programmer error
                        console.error("unknown status", status);
                        return;
                    }
                    if( ! filter_status.length )
                        // first account
                        filter_status.push( status );
                    else {
                        let last_account_name = filter_status[filter_status.length - 1].account_name;
                        if( last_account_name === status.account_name )
                            // update same account
                            filter_status[filter_status.length - 1] = status;
                        else
                            // new account
                            filter_status.push( status );
                    }
                    update_state({ genesis_filter_status: filter_status });
                });
            })
        //, 100)
    );
    }

    /**
    BTS 1.0 hosted wallet backup (wallet.bitshares.org) is supported.

    BTS 1.0 native wallets should use wallet_export_keys instead of a wallet backup.

    Note,  Native wallet backups will be rejected.  The logic below does not
    capture assigned account names (for unregisted accounts) and does not capture
    signing keys.  The hosted wallet has only registered accounts and no signing
    keys.

    */
    _parseWalletJson(json_contents) {
        let password_checksum;
        let encrypted_brainkey;
        let address_to_enckeys = {};
        let account_addresses = {};

        let savePubkeyAccount = function (pubkey, account_name) {
            //replace BTS with GPH
            pubkey = ChainConfig.address_prefix + pubkey.substring(3);
            let address = PublicKey.fromPublicKeyString(pubkey).toAddressString();
            let addresses = account_addresses[account_name] || [];
            address = "BTS" + address.substring(3);
            //DEBUG console.log("... address",address,account_name)
            addresses.push(address);
            account_addresses[account_name] = addresses;
        };

        try {
            if(! Array.isArray(json_contents)) {
                //DEBUG console.log('... json_contents',json_contents)
                throw new Error("Invalid wallet format");
            }
            for(let element of json_contents) {

                if( "key_record_type" == element.type &&
                    element.data.account_address &&
                    element.data.encrypted_private_key
                ) {
                    let address = element.data.account_address;
                    let enckeys = address_to_enckeys[address] || [];
                    enckeys.push(element.data.encrypted_private_key);
                    //DEBUG console.log("... address",address,enckeys)
                    address_to_enckeys[address] = enckeys;
                    continue;
                }

                if( "account_record_type" == element.type) {
                    let account_name = element.data.name;
                    savePubkeyAccount(element.data.owner_key, account_name);
                    for(let history of element.data.active_key_history) {
                        savePubkeyAccount(history[1], account_name);
                    }
                    continue;
                }

                if ( "property_record_type" == element.type &&
                    "encrypted_brainkey" == element.data.key
                ) {
                    encrypted_brainkey = element.data.value;
                    continue;
                }

                if( "master_key_record_type" == element.type) {
                    if( ! element.data)
                        throw file.name + " invalid master_key_record record";

                    if( ! element.data.checksum)
                        throw file.name + " is missing master_key_record checksum";

                    password_checksum = element.data.checksum;
                }

            }
            if( ! encrypted_brainkey)
                throw "Please use a BTS 1.0 wallet_export_keys file instead";

            if( ! password_checksum)
                throw file.name + " is missing password_checksum";

            if( ! enckeys.length)
                throw file.name + " does not contain any private keys";

        } catch(e) { throw e.message || e; }

        let account_keys = [];
        for(let account_name in account_addresses) {
            let encrypted_private_keys = [];
            for(let address of account_addresses[account_name]) {
                let enckeys = address_to_enckeys[address];
                if( ! enckeys) continue;
                for(let enckey of enckeys)
                    encrypted_private_keys.push(enckey);
            }
            account_keys.push({
                account_name,
                encrypted_private_keys
            });
        }
        // We could prompt for this brain key instead on first use.  The user
        // may already have a brainkey at this point so with a single brainkey
        // wallet we can't use it now.
        this.setState({
            password_checksum,
            account_keys
            //encrypted_brainkey
        });
    }

    _passwordCheck(evt) {
        if (evt && "preventDefault" in evt) {
            evt.preventDefault();
        }
        let pwNode = this.refs.password;
        // if(pwNode) pwNode.focus()
        let password = pwNode ? pwNode.value : "";
        let checksum = this.state.password_checksum;
        let new_checksum = hash.sha512(hash.sha512(password)).toString("hex");
        if(checksum != new_checksum) {
            return this.setState({
                no_file: false,
                import_password_message: password.length ? "Incorrect password" : null
            });

        }
        this.setState({
            no_file: false,
            reset_password: Date.now(),
            import_password_message: counterpart.translate("wallet.import_pass_match")
        }, ()=> this._decryptPrivateKeys(password));
        // setTimeout(, 250)
    }

    _decryptPrivateKeys(password) {
        let password_aes = Aes.fromSeed(password);
        let format_error1_once = true;
        for(let account of this.state.account_keys) {
            if(! account.encrypted_private_keys) {
                let error = `Account ${account.account_name} missing encrypted_private_keys`;
                console.error(error);
                if(format_error1_once) {
                    notify.error(error);
                    format_error1_once = false;
                }
                continue;
            }
            let account_name = account.account_name.trim();
            let same_prefix_regex = new RegExp("^" + ChainConfig.address_prefix);
            for(let i = 0; i < account.encrypted_private_keys.length; i++) {
                let encrypted_private = account.encrypted_private_keys[i];
                let public_key_string = account.public_keys ?
                    account.public_keys[i] : null; // performance gain

                try {
                    let private_plainhex = password_aes.decryptHex(encrypted_private);
                    if(import_keys_assert_checking && public_key_string) {
                        let private_key = PrivateKey.fromHex( private_plainhex );
                        let pub = private_key.toPublicKey(); // S L O W
                        let addy = pub.toAddressString();
                        let pubby = pub.toPublicKeyString();
                        let error = "";

                        let address_string = account.addresses ?
                            account.addresses[i] : null; // assert checking

                        if(address_string && addy.substring(3) != address_string.substring(3))
                            error = "address imported " + address_string + " but calculated " + addy + ". ";

                        if(pubby.substring(3) != public_key_string.substring(3))
                            error += "public key imported " + public_key_string + " but calculated " + pubby;

                        if(error != "")
                            console.log("ERROR Miss-match key",error);
                    }

                    if( ! public_key_string) {
                        let private_key = PrivateKey.fromHex( private_plainhex );
                        let public_key = private_key.toPublicKey(); // S L O W
                        public_key_string = public_key.toPublicKeyString();
                    } else {
                        if( ! same_prefix_regex.test(public_key_string))
                            // This was creating a unresponsive chrome browser
                            // but after the results were shown.  It was probably
                            // caused by garbage collection.
                            public_key_string = ChainConfig.address_prefix +
                                public_key_string.substring(3);
                    }
                    this.state.imported_keys_public[public_key_string] = true;
                    let {account_names} = this.state.keys_to_account[private_plainhex] ||
                        {account_names: []};
                    let dup = false;
                    for(let _name of account_names)
                        if(_name == account_name)
                            dup = true;
                    if(dup) continue;
                    account_names.push(account_name);
                    this.state.keys_to_account[private_plainhex] = {account_names, public_key_string};
                } catch(e) {
                    console.log(e, e.stack);
                    let message = e.message || e;
                    notify.error(`Account ${account_name} had a private key import error: `+message);
                }
            }
        }
        //let enc_brainkey = this.state.encrypted_brainkey
        //if(enc_brainkey){
        //    this.setState({
        //        brainkey: password_aes.decryptHexToText(enc_brainkey)
        //    })
        //}
        this.setState({
            import_file_message: null,
            import_password_message: null,
            password_checksum: null
        }, ()=> this.updateOnChange());
    }

    _saveImport(e) {
        e.preventDefault();
        let keys = PrivateKeyStore.getState().keys;
        let dups = {};
        for(let public_key_string in this.state.imported_keys_public) {
            if( ! keys.has(public_key_string) ) continue;
            delete this.state.imported_keys_public[public_key_string];
            dups[public_key_string] = true;
        }
        if( Object.keys(this.state.imported_keys_public).length === 0 ) {
            notify.error("This wallet has already been imported");
            return;
        }
        let keys_to_account = this.state.keys_to_account;
        for(let private_plainhex of Object.keys(keys_to_account)) {
            let {account_names, public_key_string} = keys_to_account[private_plainhex];
            if( dups[public_key_string] ) delete keys_to_account[private_plainhex];
        }
        WalletUnlockActions.unlock().then(()=> {
            ImportKeysStore.importing(true);
            // show the loading indicator
            setTimeout(()=> this.saveImport(), 200);
        });
    }

    saveImport() {
        let keys_to_account = this.state.keys_to_account;
        let private_key_objs = [];
        for(let private_plainhex of Object.keys(keys_to_account)) {
            let {account_names, public_key_string} = keys_to_account[private_plainhex];
            private_key_objs.push({
                private_plainhex,
                import_account_names: account_names,
                public_key_string
            });
        }
        this.reset();
        WalletDb.importKeysWorker( private_key_objs ).then( result => {
            ImportKeysStore.importing(false);
            let import_count = private_key_objs.length;

            notify.success(counterpart.translate("wallet.import_key_success", {count: import_count}));
            this.setState({
                importSuccess: true
            });
            // this.onCancel() // back to claim balances
        }).catch( error => {
            console.log("error:", error);
            ImportKeysStore.importing(false);
            let message = error;
            try { message = error.target.error.message; } catch (e){}
            notify.error(`Key import error: ${message}`);
        });
    }

    addByPattern(contents) {
        if( ! contents)
            return false;

        let count = 0, invalid_count = 0;
        let wif_regex = /5[HJK][1-9A-Za-z]{49}/g;
        for(let wif of contents.match(wif_regex) || [] ) {
            try {
                let private_key = PrivateKey.fromWif(wif); //could throw and error
                let private_plainhex = private_key.toBuffer().toString("hex");
                let public_key = private_key.toPublicKey(); // S L O W
                let public_key_string = public_key.toPublicKeyString();
                this.state.imported_keys_public[public_key_string] = true;
                this.state.keys_to_account[private_plainhex] = {
                    account_names: [], public_key_string};
                count++;
            } catch(e) { invalid_count++; }
        }
        this.setState({
            key_text_message: "Found " +
                (!count ? "" : count + " valid") +
                (!invalid_count ? "" : " and " + invalid_count + " invalid") +
                " key" + ( count > 1 || invalid_count > 1 ? "s" : "") + "."
        }, ()=> this.updateOnChange());
        // removes the message on the next render
        this.state.key_text_message = null;
        return count;
    }

    // toggleImportType(type) {
    //     if (!type) {
    //         return;
    //     }
    //     console.log("toggleImportType", type);
    //     this.setState({
    //         privateKey: type === "privateKey"
    //     });
    // }

    _renderBalanceClaims() {
        return (
            <div>
                <BalanceClaimActive />

                <div style={{paddingTop: 15}}>
                    <div className="button success" onClick={this.onCancel.bind(this)}>
                        <Translate content="wallet.done" />
                    </div>
                </div>
            </div>
        );
    }

    render() {
        let {privateKey} = this.props;
        let {keys_to_account} = this.state;
        let key_count = Object.keys(keys_to_account).length;
        let account_keycount = this.getImportAccountKeyCount(keys_to_account);

        // Create wallet prior to the import keys (keeps layout clean)
        if( ! WalletDb.getWallet()) return <WalletCreate importKeys={true} hideTitle={true}/>;
        if( this.props.importing ) {
            return <div>
                <div className="center-content">
                    <LoadingIndicator type="circle"/>
                </div>
            </div>;
        }

        let filtering = this.state.genesis_filtering;
        let was_filtered = !!this.state.genesis_filter_status.length && this.state.genesis_filter_finished;
        let account_rows = null;

        if(this.state.genesis_filter_status.length) {
            account_rows = [];
            for(let status of this.state.genesis_filter_status) {
                if (status.count && status.total) {
                    account_rows.push(
                        <tr key={status.account_name}>
                            <td>{status.account_name}</td>
                            <td>{filtering ?
                                <span>Filtering { Math.round( (status.count / status.total) * 100) } % </span>
                                : <span>{status.count}</span>
                            }</td>
                        </tr>
                    );
                }
            }
        }

        let import_ready = key_count !== 0;
        let password_placeholder = counterpart.translate("wallet.import_password");

        if (import_ready) password_placeholder = "";

        if( ! account_rows && account_keycount) {
            account_rows = [];
            for (let account_name in account_keycount) {
                account_rows.push(
                    <tr key={account_name}>
                        <td>{account_name}</td>
                        <td>{account_keycount[account_name]}</td>
                    </tr>);
            }
        }


        let cancelButton = (
            <div className="button success" onClick={this.onCancel.bind(this)}>
                <Translate content="wallet.cancel" />
            </div>
        );

        let tabIndex = 1;

        if (this.state.importSuccess) {
            return this._renderBalanceClaims();
        };

        return (
            <div>
                {/* Key file upload */}
                <div style={{padding: "10px 0"}}>
                    <span>{this.state.key_text_message ?
                        this.state.key_text_message :
                        <KeyCount key_count={key_count}/>
                    }</span>
                    { ! import_ready ?
                        null :
                        <span> (<a onClick={this.reset.bind(this)}><Translate content="wallet.reset" /></a>)</span>
                    }
                </div>

                { account_rows ?
                <div>
                    { ! account_rows.length ? counterpart.translate("wallet.no_accounts") :
                    <div>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th><Translate content="explorer.account.title" /></th>
                                    <th><Translate content="settings.restore_key_count" /></th>
                                </tr>
                            </thead>
                            <tbody>
                                {account_rows}
                            </tbody>
                        </table>
                        <br/>
                    </div>}
                </div> : null}
                <br/>

                { ! import_ready && ! this.state.genesis_filter_initalizing ?
                <div>
                    <div>

                        <div>
                            {privateKey ? (
                            <form onSubmit={this.onWif.bind(this)}>
                                    <Translate component="label" content="wallet.paste_private" />
                                    <input ref="wifInput" type="password" id="wif" tabIndex={tabIndex++} />

                                    <button className="button" type="submit"><Translate content="wallet.submit" /></button>
                                    {cancelButton}
                            </form>) : (
                            <form onSubmit={this._passwordCheck.bind(this)}>
                                <label><Translate content="wallet.bts_09_export" />
                                {this.state.no_file ? null : <span>&nbsp;
                                    (<a onClick={this.reset.bind(this)}>Reset</a>)</span>}
                                </label>
                                <input
                                    type="file"
                                    id="file_input"
                                    accept=".json"
                                    style={{
                                        border: "solid" ,
                                        marginBottom: 15
                                    }}
                                    key={this.state.reset_file_name}
                                    onChange={this.upload.bind(this)}
                                />
                                <div>{this.state.import_file_message}</div>
                                { ! this.state.no_file ?
                                    (<div>
                                        <input
                                            type="password"
                                            ref="password"
                                            key={this.state.reset_password}
                                            placeholder={password_placeholder}
                                            onChange={() => {if (this.state.import_password_message && this.state.import_password_message.length) {
                                                this.setState({
                                                    import_password_message: null
                                                });
                                            }}}
                                        />
                                        <p className="facolor-error">{this.state.import_password_message}</p>
                                    </div>) : null}
                                    <div className="button-group">
                                    <button className={cname("button", {disabled: !!this.state.no_file})} type="submit"><Translate content="wallet.submit" /></button>
                                    {cancelButton}
                                    </div>
                            </form>)}
                        </div>
                        <br/>


                        <br/>

                    </div>
                </div> : null}

                { this.state.genesis_filter_initalizing ? <div>
                    <div className="center-content">
                        <LoadingIndicator type="circle"/>
                    </div>
                </div>:null}

                { import_ready ?
                <div>

                    <div>
                        <div className="button-group">
                            <div className={cname("button success", {disabled: !import_ready})}
                               onClick={this._saveImport.bind(this)} >
                                <Translate content="wallet.import_keys" />
                            </div>
                            <div className="button secondary" onClick={this.reset.bind(this)}>
                                <Translate content="wallet.cancel" />
                            </div>
                        </div>
                    </div>

                    <h4><Translate content="wallet.unclaimed" /></h4>
                    <Translate component="p" content="wallet.claim_later" />
                    <div className="grid-block">


                        <div className="grid-content no-overflow">
                            <Translate component="label" content="wallet.totals" />
                            <BalanceClaimAssetTotal />
                        </div>
                    </div>
                    <br/>
                </div> : null}
            </div>
        );
    }
}

ImportKeys = connect(ImportKeys, {
    listenTo() {
        return [ImportKeysStore];
    },
    getProps() {
        return {
            importing: ImportKeysStore.getState().importing
        };
    }
});

export default ImportKeys;
