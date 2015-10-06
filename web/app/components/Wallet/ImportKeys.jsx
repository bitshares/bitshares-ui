import React, {Component, PropTypes} from "react";
import PrivateKey from "ecc/key_private";
import Address from "ecc/address"
import Aes from "ecc/aes";
import alt from "alt-instance"
import cname from "classnames"
import config from "chain/config";
import notify from "actions/NotificationActions";
import hash from "common/hash";

import Apis from "rpc_api/ApiInstances"
import PrivateKeyStore from "stores/PrivateKeyStore"
import ImportKeysActions from "actions/ImportKeysActions";
import WalletUnlockActions from "actions/WalletUnlockActions"
import WalletCreate from "components/Wallet/WalletCreate"
import LoadingIndicator from "components/LoadingIndicator"
import Translate from "react-translate-component";

import BalanceClaimActiveActions from "actions/BalanceClaimActiveActions"
import BalanceClaimAssetTotal from "components/Wallet/BalanceClaimAssetTotal"
import WalletDb from "stores/WalletDb";
import PublicKey from "ecc/key_public";

require("./ImportKeys.scss");

var api = Apis.instance();
var import_keys_assert_checking = false

var TRACE = false

export default class ImportKeys extends Component {
    
    constructor() {
        super();
        this.state = this._getInitialState();
    }
    
    _getInitialState() {
        return {
            pubkeys: new Set(),
            wifs_to_account: { },
            wif_count: 0,
            no_file: true,
            account_keys: [],
            //brainkey: null,
            //encrypted_brainkey: null,
            reset_file_name: Date.now(),
            reset_password: Date.now(),
            password_checksum: null,
            import_password_message: null,
            imported_keys_public: {},
            wif_text_message: null,
            wif_textarea_private_keys_message: null,
            wif_textarea_private_keys: ""
        };
    }
    
    reset(e) {
        if(e) e.preventDefault()
        var state = this._getInitialState();
        this.setState(state);
        this.updateOnChange({});
    }
    
    render() {
        
        if(this.state.save_import_loading) {
            return <div>
                <h3><Translate content="wallet.import_keys" /></h3>
                <div className="center-content">
                    <LoadingIndicator type="circle"/>
                </div>
            </div>
        }
        
        var has_keys = this.state.wif_count !== 0;
        var import_ready = has_keys
        var password_placeholder = "Enter import file password";
        if (this.state.wif_count) {
            password_placeholder = "";
        }

        var account_rows = null;
        if(this.state.account_keycount) {
            account_rows = [];
            var account_keycount = this.state.account_keycount;
            for (let account_name in account_keycount) {
                account_rows.push(
                    <tr key={account_name}>
                        <td>{account_name}</td>
                        <td>{account_keycount[account_name]}</td>
                    </tr>);
            }
        }
        // Create wallet prior to the import keys (helps keep the layout clean)
        return (
            <div>
                <WalletCreate hideTitle={true}>
                <h3><Translate content="wallet.import_keys" /></h3>
                {/* Key file upload */}
                <div>
                    <KeyCount wif_count={this.state.wif_count}/>
                    {!this.state.wif_count ? 
                        null :
                        <span> (<a onClick={this.reset.bind(this)}>reset</a>)</span>
                    }
                </div>
                <br/>
                <div className="center-content">
                    { ! this.state.wif_count ?
                        (<div>
                            <div>
                                <div>
                                    <label>BTS 1.0 key export file
                                    {this.state.no_file ? null : <span>&nbsp;
                                        (<a onClick={this.reset.bind(this)}>Reset</a>)</span>}
                                    </label>
                                    <input
                                        type="file" id="file_input"
                                        style={{ border: 'solid' }}
                                        key={this.state.reset_file_name}
                                        onChange={this.upload.bind(this)}
                                    />
                                </div>
                                { this.state.no_file ? <span>
                                <br/><br/>
                                <div>
                                    <label>Paste Private keys (Wallet Import Format - WIF)</label>
                                    <input type="password" onChange={this.onWif.bind(this)} id="wif" />
                                </div>
                                </span>:null}
                            </div>
                            <br/>

                            { ! this.state.no_file ?
                                (<div>
                                    <input
                                        type="password" ref="password" autoComplete="off"
                                        key={this.state.reset_password}
                                        placeholder={password_placeholder}
                                        onChange={this._passwordCheck.bind(this)}
                                    />
                                    <div>{this.state.import_password_message}</div>
                                    <div>{this.state.wif_text_message}</div>
                                </div>) : null}
                            <br/>
                            <a href className="button success" onClick={this.onBack.bind(this)}>
                                Done </a>
                        </div>) : null}
                    
                </div>

                {this.state.wif_count ? 
                    (<div>
                        {account_rows ? 
                        (<div>
                            <div>
                                {account_rows.length ? <div>
                                    <table className="table center-content">
                                        <thead>
                                            <tr>
                                                <th style={{textAlign: "center"}}>Account</th>
                                                <th style={{textAlign: "center"}}># of keys</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {account_rows}
                                        </tbody>
                                    </table>
                                </div> : "No Accounts"}
                            </div>
                        </div>) : null}
                        <br/>

                        <h4 className="center-content">Unclaimed balances belonging to these keys:</h4>
                        {this.state.wif_count ?
                            (<div>
                                <div className="grid-block center-content">
                                    <div className="grid-content no-overflow">
                                        <label>Asset Totals</label>
                                        <BalanceClaimAssetTotal />
                                    </div>
                                </div>
                            </div>) : null}
                        <br/>

                        <div className="center-content" style={{width: "100%"}}>
                            <div className="button-group content-block">
                                <a href className={cname("button success", {disabled:!import_ready})}
                                   onClick={this._saveImport.bind(this)} >
                                    Import
                                </a>
                                <a href className="button secondary" onClick={this.reset.bind(this)}>
                                    Cancel
                                </a>
                            </div>
                        </div>
                    </div>) : null}
                </WalletCreate>
            </div>
        );
    }
    
    onWif(event) {
        var value = event.target.value
        this.addByPattern(value)
    }
    
    onBack() {
        window.history.back()
    }
    
    updateOnChange(wifs_to_account = this.state.wifs_to_account) {
        var wif_count = Object.keys(wifs_to_account).length
        this.setState({wif_count})
        this._importKeysChange(wifs_to_account)
        BalanceClaimActiveActions.setPubkeys(Object.keys(this.state.imported_keys_public))
    }

    _importKeysChange(wifs_to_account) {
        this.setState({
            account_keycount: this.getImportAccountKeyCount(wifs_to_account)
        });
    }

    getImportAccountKeyCount(wifs_to_account) {
        var account_keycount = {}
        for(let wif in wifs_to_account)
        for(let account_name of wifs_to_account[wif].account_names) {
            account_keycount[account_name] =
                (account_keycount[account_name] || 0) + 1
        }
        return account_keycount
    }
    
    upload(evt) {
        var file = evt.target.files[0]
        var reader = new FileReader()
        reader.onload = evt => {
            var contents = evt.target.result
            try {
                try {
                    this._parseWalletJson(contents)
                } catch(e) {
                    //DEBUG console.log("... _parseWalletJson",e)
                    try {
                        this._parseImportKeyUpload(contents, file)
                    } catch(ee) {
                        if( ! this.addByPattern(contents))
                            throw ee
                    }
                }
                var pwNode = React.findDOMNode(this.refs.password)
                if(pwNode) pwNode.focus()
                // try empty password, also display "Enter import file password"
                this._passwordCheck()
                
            } catch(message) {
                console.log("... ImportKeys upload error", message)
                this.setState({import_password_message: message})
            }
        }
        reader.readAsText(file);
        this.setState({import_password_message: null, no_file: false});
    }
    
    /** BTS 1.0 client wallet_export_keys format. */
    _parseImportKeyUpload(contents, file) {
        var password_checksum, account_keys
        try {
            var import_keys = JSON.parse(contents)
            password_checksum = import_keys.password_checksum
            if( ! password_checksum)
                throw file.name + " is an unrecognized format"
            
            if( ! Array.isArray(import_keys.account_keys))
                throw file.name + " is an unrecognized format"
            
            account_keys = import_keys.account_keys

        } catch(e) { throw e.message || e }
        
        this.setState({
            password_checksum,
            account_keys
        })
    }
    
    /**
    BTS 1.0 hosted wallet backup (wallet.bitshares.org) is supported.
    
    BTS 1.0 native wallets should use wallet_export_keys instead of a wallet backup.
    
    Note,  Native wallet backups will be rejected.  The logic below does not
    capture assigned account names (for unregisted accounts) and does not capture
    signing keys.  The hosted wallet has only registered accounts and no signing
    keys.
    
    */
    _parseWalletJson(contents) {
        var password_checksum
        var encrypted_brainkey
        var address_to_enckeys = {}
        var account_addresses = {}
        
        var savePubkeyAccount = function (pubkey, account_name) {
            //replace BTS with GPH
            pubkey = config.address_prefix + pubkey.substring(3)
            var address = PublicKey.fromPublicKeyString(pubkey).toAddressString()
            var addresses = account_addresses[account_name] || []
            address = "BTS" + address.substring(3)
            //DEBUG console.log("... address",address,account_name)
            addresses.push(address)
            account_addresses[account_name] = addresses
        }
        
        try {
            var wallet_json = JSON.parse(contents)
            if(! Array.isArray(wallet_json)) {
                //DEBUG console.log('... wallet_json',wallet_json)
                throw new Error("Invalid wallet format")
            }
            for(let element of wallet_json) {
                
                if( "key_record_type" == element.type &&
                    element.data.account_address &&
                    element.data.encrypted_private_key
                ) {
                    var address = element.data.account_address
                    var enckeys = address_to_enckeys[address] || []
                    enckeys.push(element.data.encrypted_private_key)
                    //DEBUG console.log("... address",address,enckeys)
                    address_to_enckeys[address] = enckeys
                    continue
                }
                
                if( "account_record_type" == element.type) {
                    var account_name = element.data.name
                    savePubkeyAccount(element.data.owner_key, account_name)
                    for(let history of element.data.active_key_history) {
                        savePubkeyAccount(history[1], account_name)
                    }
                    continue
                }
                
                if ( "property_record_type" == element.type &&
                    "encrypted_brainkey" == element.data.key
                ) {
                    encrypted_brainkey = element.data.value
                    continue
                }
                
                if( "master_key_record_type" == element.type) {
                    if( ! element.data)
                        throw file.name + " invalid master_key_record record"
                    
                    if( ! element.data.checksum)
                        throw file.name + " is missing master_key_record checksum"
                    
                    password_checksum = element.data.checksum
                }
                
            }
            if( ! encrypted_brainkey)
                throw "Please use a BTS 1.0 wallet_export_keys file instead"
            
            if( ! password_checksum)
                throw file.name + " is missing password_checksum"
            
            if( ! enckeys.length)
                throw file.name + " does not contain any private keys"
            
        } catch(e) { throw e.message || e }
        
        var account_keys = []
        for(let account_name in account_addresses) {
            var encrypted_private_keys = []
            for(let address of account_addresses[account_name]) {
                var enckeys = address_to_enckeys[address]
                if( ! enckeys) continue
                for(let enckey of enckeys)
                    encrypted_private_keys.push(enckey)
            }
            account_keys.push({
                account_name,
                encrypted_private_keys
            })
        }
        // We could prompt for this brain key instead on first use.  The user
        // may already have a brainkey at this point so with a single brainkey
        // wallet we can't use it now.
        this.setState({
            password_checksum,
            account_keys
            //encrypted_brainkey
        })
    }
   
    _passwordCheck(evt) {
        if( ! this.state.account_keys.length)
            return
        
        var password = evt ? evt.target.value : ""
        var checksum = this.state.password_checksum
        this.setState({import_password_message: "Enter import file password"})
        var new_checksum = hash.sha512(hash.sha512(password)).toString("hex")
        if(checksum != new_checksum) {
            if(password != "")
                this.setState({import_password_message: "Enter import file password (keep going)"})
            return
        }
        this.setState({
            reset_password: Date.now(),
            import_password_message: "Password matches. Loading..."
        })
        setTimeout(()=> this._decryptPrivateKeys(password), 250)
    }
    
    _decryptPrivateKeys(password) {
        var password_aes = Aes.fromSeed(password)
        for(let account of this.state.account_keys) {
            if(! account.encrypted_private_keys) {
                notify.error(`Account ${account.acccount_name} missing encrypted_private_keys`)
                continue
            }
            var account_name = account.account_name.trim()
            for(let i = 0; i < account.encrypted_private_keys.length; i++) {
                let encrypted_private = account.encrypted_private_keys[i]
                let public_key_string = account.public_keys ?
                    account.public_keys[i] : null // performance gain
                
                try {
                    var private_plainhex = password_aes.decryptHex(encrypted_private)
                    var private_key = PrivateKey.fromBuffer(
                        new Buffer(private_plainhex, "hex"))
                    
                    if(import_keys_assert_checking && public_key_string) {
                        var pub = private_key.toPublicKey()
                        var addy = pub.toAddressString()
                        var pubby = pub.toPublicKeyString()
                        var error = ""

                        let address_string = account.addresses ?
                            account.addresses[i] : null // assert checking
                        
                        if(address_string && addy.substring(3) != address_string.substring(3))
                            error = "address imported " + address_string + " but calculated " + addy + ". "
                        
                        if(pubby.substring(3) != public_key_string.substring(3))
                            error += "public key imported " + public_key_string + " but calculated " + pubby
                        
                        if(error != "")
                            console.log("ERROR Miss-match key",error)
                    }
                    
                    var public_key
                    if( ! public_key_string) {
                        public_key = private_key.toPublicKey()// S L O W
                        public_key_string = public_key.toPublicKeyString()
                    } else {
                        var previous_address_prefix = config.address_prefix
                        try {
                            config.address_prefix = "BTS"
                            public_key = PublicKey.fromPublicKeyString(public_key_string)
                            public_key_string = previous_address_prefix +
                                public_key_string.substring(3)
                        } finally {
                            config.address_prefix = previous_address_prefix
                        }
                    }
                    this.state.imported_keys_public[public_key_string] = true
                        
                    var private_key_wif = private_key.toWif()
                    var {account_names} = this.state.wifs_to_account[private_key_wif] || 
                        {account_names: []}
                    var dup = false
                    for(let _name of account_names)
                        if(_name == account_name)
                            dup = true
                    if(dup) continue
                    account_names.push(account_name)
                    var public_key = 
                    this.state.wifs_to_account[private_key_wif] = 
                        {account_names, public_key, public_key_string}
                } catch(e) {
                    console.log(e, e.stack)
                    var message = e.message || e
                    notify.error(`Account ${account_name} had a private key import error: `+message)
                }
            }
        }
        //var enc_brainkey = this.state.encrypted_brainkey
        //if(enc_brainkey){
        //    this.setState({
        //        brainkey: password_aes.decryptHexToText(enc_brainkey)
        //    })
        //}
        this.updateOnChange()
        this.setState({
            import_password_message: null,
            password_checksum: null
        })
        //})
    }

    _saveImport(e) {
        e.preventDefault()
        var keys = PrivateKeyStore.getState().keys
        for(let public_key_string in this.state.imported_keys_public) {
            if(keys.get(public_key_string)) {
                notify.error("This wallet has already been imported")
                return
            }
        }
        WalletUnlockActions.unlock().then(()=> {
            this.setState({save_import_loading: true})
            // show the loading indicator
            setTimeout(()=> this.saveImport(), 200)
        })
    }
    
    saveImport() {
        
        // Lookup and add accounts referenced by the wifs
        var imported_keys_public = this.state.imported_keys_public
        var db = api.db_api()
        
        if(TRACE) console.log('... ImportKeys._saveImport START')
        ImportKeysActions.setStatus("saving")
        
        var wifs_to_account = this.state.wifs_to_account
        var private_key_objs = []
        for(let wif of Object.keys(wifs_to_account)) {
            var {account_names, public_key_string} = wifs_to_account[wif]
            //DEBUG console.log('... account_names',account_names,public_key_string)
            private_key_objs.push({
                wif,
                import_account_names: account_names,
                public_key_string
            })
        }
        
        this.reset()
        
        WalletDb.importKeys( private_key_objs ).then( result => {
            this.setState({save_import_loading: false})
            var {import_count, duplicate_count, private_key_ids} = result
            if( ! import_count && ! duplicate_count) {
                notify.warning(`There where no keys to import`)
                return
            }
            if( ! import_count && duplicate_count) {
                notify.warning(`${duplicate_count} duplicates (Not Imported)`)
                return
            }
            var message = ""
            if (import_count)
                message = `Successfully imported ${import_count} keys.`
            if (duplicate_count)
                message += `  ${duplicate_count} duplicates (Not Imported)`
            
            if(duplicate_count)
                notify.warning(message)
            else
                notify.success(message)
            
            if (import_count) {
                ImportKeysActions.setStatus("saveDone")
                this.onBack() // back to claim balances
            }
        }).catch( error => {
            ImportKeysActions.setStatus("saveError")
            console.log("error:", error)
            var message = error
            try { message = error.target.error.message } catch (e){}
            notify.error(`Key import error: ${message}`)
        })
    }

    addByPattern(contents) {
        if( ! contents)
            return false
        
        var count = 0, invalid_count = 0
        var wif_regex = /5[HJK][1-9A-Za-z]{49}/g
        for(let wif of contents.match(wif_regex) || [] ) {
            try { 
                PrivateKey.fromWif(wif) //could throw and error 
                this.state.wifs_to_account[wif] = {account_names: []}
                count++
            } catch(e) { invalid_count++ }
        }
        this.updateOnChange()
        this.setState({
            wif_text_message: 
                (!count ? "" : count + " keys found from text.") +
                (!invalid_count ? "" : "  " + invalid_count + " invalid keys.")
        })
        return count
    }

}

class KeyCount extends Component {
    render() {
        if( !this.props.wif_count) return <span/>
        return <span>Found {this.props.wif_count} private keys</span>
    }
}

