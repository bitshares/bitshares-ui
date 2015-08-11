import React, {Component, PropTypes} from "react";
import PrivateKey from "ecc/key_private";
import Aes from "ecc/aes";
import alt from "alt-instance"

import WalletDb from "stores/WalletDb";
import PublicKey from "ecc/key_public";
import FormattedAsset from "components/Utility/FormattedAsset";

import config from "chain/config";
import notify from "actions/NotificationActions";
import hash from "common/hash";
import Apis from "rpc_api/ApiInstances";
import v from "chain/serializer_validation";
import lookup from "chain/lookup";
import cname from "classnames";
import AccountStore from "stores/AccountStore";
import AccountActions from "actions/AccountActions";

var api = Apis.instance();
//var wif_regex = /5[HJK][1-9A-Za-z]{49}/g

class ImportKeys extends Component {
    
    constructor() {
        super();
        this.state = this._getInitialState();
    }
    
    _getInitialState() {
        return {
            keys: {
                wif_count: 0,
                wifs_to_account: null,
                wif_to_balances: null
            },
            no_file: true,
            wif_count: 0,
            account_keys: [],
            wifs_to_account: {},
            //brainkey: null,
            //encrypted_brainkey: null,
            reset_file_name: Date.now(),
            reset_password: Date.now(),
            password_checksum: null,
            import_password_message: null,
            wif_text_message: null,
            wif_textarea_private_keys_message: null,
            wif_textarea_private_keys: ""
        };
    }
    
    reset() {
        var state = this._getInitialState();
        this.setState(state);
        this.updateOnChange({});
    }
    
    render() {
        var has_keys = this.state.wif_count !== 0;
        var import_ready = has_keys &&
            this.state.balances_known;
        var password_placeholder = "Enter import file password";
        if (this.state.wif_count) {
            password_placeholder = "";
        }

        var balance_rows = null;
        if(this.state.balance_by_asset) {
            balance_rows = [];
            // for(let asset_balance of this.state.balance_by_asset) {
            this.state.balance_by_asset.forEach((asset_balance, index) => {
                // var {symbol, balance, precision} = asset_balance;
                balance_rows.push(
                    <div className="align-right">
                        <div className="">
                            <FormattedAsset color="info"
                                amount={asset_balance.balance}
                                asset={asset_balance.asset_id}
                                />
                        </div>
                    </div>
                );
            });
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

        return (
            <div>
                <div className="content-block center-content">
                    <h3 className="no-border-bottom">Import Keys</h3>
                </div>

                {/* Key file upload */}
                <div className="center-content">
                    <KeyCount wif_count={this.state.wif_count}/>
                    {!this.state.wif_count ? 
                        <div>Upload BitShares keys file...</div> :
                        <span> (<a onClick={this.reset.bind(this)}>reset</a>)</span>
                    }
                </div>
                <br/>
                <div className="center-content">
                    {!this.state.wif_count ?
                        (<div>
                            <div>
                                <div>
                                    <input
                                        type="file" id="file_input"
                                        key={this.state.reset_file_name}
                                        onChange={this.upload.bind(this)}
                                    />
                                </div>
                            </div>
                            <br/>

                            {!this.state.no_file ?
                                (<div>
                                    <input
                                        type="password" ref="password"
                                        key={this.state.reset_password}
                                        placeholder={password_placeholder}
                                        onChange={this._passwordCheck.bind(this)}
                                    />
                                    <div>{this.state.import_password_message}</div>
                                    <div>{this.state.wif_text_message}</div>
                                </div>) : null}

                        </div>) : null}
                    
                </div>

                {this.state.keys.wif_count ? 
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

                        <h3 className="center-content">Unclaimed balances belonging to these keys:</h3>
                        {balance_rows ? 
                            (<div>
                                <div className="grid-block center-content">
                                    <div className="grid-container">
                                        <label>Asset Totals</label><br/>
                                        {balance_rows.length ? balance_rows : "No Balances"}
                                    </div>
                                </div>
                            </div>) : null}
                        <br/>
                        
                        <div className="button-group content-block center-content">
                            <div className={cname("button success", {disabled:!import_ready})}
                                onClick={this._saveImport.bind(this)} >
                                Import
                            </div>
                            <div className="button secondary" onClick={this.reset.bind(this)}>
                                Cancel
                            </div>
                        </div>
                    </div>) : null}
            </div>
        );
    }

    _importKeysChange(keys) {
        var wifs = Object.keys(keys.wifs_to_account);
        if( ! wifs.length) {
            // this.reset();
            return;
        }
        this.lookupBalances(wifs).then( wif_to_balances => {
            //this.lookupAccounts(wifs).then( blockchain_accounts => {
            //    this.setState({blockchain_accounts, accounts_known:true})
            //})
            
            var assetid_balance = this.balanceByAsset(wif_to_balances);
            var asset_ids = Object.keys(assetid_balance);
            var balance_by_asset = [];
            for(let i = 0; i < asset_ids.length; i++) {
                var asset_id = asset_ids[i];
                var balance = assetid_balance[asset_id];
                balance_by_asset.push({balance, asset_id});
            }
            keys.wif_to_balances = wif_to_balances;
            this.setState({
                keys,
                wif_to_balances,
                balance_by_asset,
                balances_known: true,
                account_keycount:
                    this.getImportAccountKeyCount(keys.wifs_to_account)
            });
        });
    }

    lookupBalances(wif_keys) {
        return new Promise((resolve, reject)=> {
            var address_params = [], wif_owner = {};
            for(let wif of wif_keys) {
                try {
                    var private_key = PrivateKey.fromWif(wif);
                    var public_key = private_key.toPublicKey();
                    var address_str = public_key.toBtsAddy();
                    address_params.push( address_str );
                    wif_owner[address_str] = wif;
                } catch(e) {
                    console.error("ImportKeys: Invalid private key error",e)
                }
            }
            //DEBUG  console.log("... get_balance_objects", address_params)
            var db = api.db_api();
            if(db == null) {
                notify.error("No witness node connection.");
                resolve(undefined);
                return;
            }
            var p = db.exec("get_balance_objects", [address_params]).then( result => {
                //DEBUG  console.log("... get_balance_objects",result)
                var wif_to_balances = {};
                for(let i = 0; i < result.length; i++) {
                    var balance = result[i];
                    var wif = wif_owner[balance.owner];
                    var balances = wif_to_balances[wif] || [];
                    balances.push(balance);
                    wif_to_balances[wif] = balances;
                }
                //DEBUG console.log("... wif_to_balances",wif_to_balances)
                this.setState({wif_to_balances});
                return wif_to_balances;

            });
            resolve(p);
        });
    }

    balanceByAsset(wif_to_balances) {
        var asset_balance = {}
        if( ! wif_to_balances)
            return asset_balance
        for(let wif of Object.keys(wif_to_balances))
        for(let b of wif_to_balances[wif]) {
            var total = asset_balance[b.balance.asset_id] || 0
            //    if(b.vesting_policy)
            //        continue //todo
            //    //var total_claimed = "0"
            //    //if( ! b.vesting_policy)
            //    //    total_claimed = b.balance
            //    ////'else' Zero total_claimed is understood to mean that your
            //    ////claiming the vesting balance on vesting terms.
            //DEBUG 
            total += v.to_number(b.balance.amount)
            asset_balance[b.balance.asset_id] = total 
        }
        return asset_balance
    }

    getImportAccountKeyCount(wifs_to_account) {
        var account_keycount = {}
        for(let wif in wifs_to_account)
        for(let account_name of wifs_to_account[wif]) {
            account_keycount[account_name] =
                (account_keycount[account_name] || 0) + 1
        }
        return account_keycount
    }

    updateOnChange(wifs_to_account = this.state.wifs_to_account) {
        var wif_count = Object.keys(wifs_to_account).length
        this.setState({wif_count})
        this._importKeysChange({
            wifs_to_account: wifs_to_account,
            wif_count
        })
    }
    
    upload(evt) {
        var file = evt.target.files[0]
        var reader = new FileReader()
        reader.onload = evt => {
            var contents = evt.target.result
            try {
                //if(this.addByPattern(contents)) return
                
                try {
                    this._parseWalletJson(contents)
                } catch(e) {
                    //DEBUG console.log("... _parseWalletJson",e)
                    this._parseImportKeyUpload(contents, file) 
                }
                React.findDOMNode(this.refs.password).focus()
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
    
    /** BTS 1.0 hosted wallet backup (wallet.bitshares.org).
    
    Note,  not fully tested for the native wallet backup.  This does not include
    BTS 1.0 client signing keys.  
    */
    _parseWalletJson(contents) {
        var password_checksum
        var encrypted_brainkey
        var address_to_enckeys = {}
        var account_addresses = {}
        
        var savePubkeyAccount = function (pubkey, account_name) {
            //replace BTS with GPH
            pubkey = config.address_prefix + pubkey.substring(3)
            var address = PublicKey.fromBtsPublic(pubkey).toBtsAddy()
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
            for(let encrypted_private of account.encrypted_private_keys) {
                try {
                    var private_plainhex = password_aes.decryptHex(encrypted_private)
                    var private_key = PrivateKey.fromBuffer(
                        new Buffer(private_plainhex, "hex"))
                    
                    //var pub = private_key.toPublicKey()
                    //var addy = pub.toBtsAddy()
                    //var pubby = pub.toBtsPublic()
                    //if(
                    //    addy.indexOf("GPH..") == 0 ||
                    //    pubby.indexOf("GPH..") == 0
                    //)
                    //    console.log("NOTE\t",pubby, addy)
                    //else
                        //console.log("\t",pubby, addy)
                        
                    var private_key_wif = private_key.toWif()
                    var account_names = this.state.wifs_to_account[private_key_wif] || []
                    var dup = false
                    for(let _name of account_names)
                        if(_name == account_name)
                            dup = true
                    if(dup) continue
                    account_names.push(account_name)
                    this.state.wifs_to_account[private_key_wif] = account_names
                } catch(e) {
                    console.log(e)
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

    _saveImport() {
        var linkedAccounts = AccountStore.getState().linkedAccounts
        for(let account_name in this.state.account_keycount) {
            if( ! linkedAccounts.get(account_name)) {
                try {
                    AccountActions.addAccountName(account_name)
                } catch(e) {
                    console.log("WARN", e)
                }
            }
        }
        
        var wifs_to_account = this.state.keys.wifs_to_account
        var wif_to_balances = this.state.wif_to_balances
        var private_key_objs = []
        for(let wif of Object.keys(wifs_to_account)) {
            var import_account_names = wifs_to_account[wif]
            var import_balances = wif_to_balances[wif]
            private_key_objs.push({
                wif,
                import_account_names,
                import_balances
            })
            //DEBUG if(import_account_names.join('')=="") console.log('... import_balances empty account',import_balances)
        }
        
        WalletDb.importKeys( private_key_objs ).then( result => {
            var {import_count, duplicate_count, private_key_ids} = result
            try {
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
                    ImportKeysActions.change()
                }
            } finally {
                this.reset()
            }
            
        }).catch( error => {
            console.log("error:", error)
            var message = error
            try { message = error.target.error.message } catch (e){}
            notify.error(`Key import error: ${message}`)
        })
    }

//    addByPattern(contents) {
//        if( ! contents)
//            return false
//        
//        var count = 0, invalid_count = 0
//        for(let wif of contents.match(wif_regex) || [] ) {
//            try { 
//                PrivateKey.fromWif(wif) //throws 
//                this.state.wifs_to_account[wif] = []
//                count++
//            } catch(e) { invalid_count++ }
//        }
//        this.updateOnChange()
//        this.setState({
//            wif_text_message: 
//                (!count ? "" : count + " keys found from text.") +
//                (!invalid_count ? "" : "  " + invalid_count + " invalid keys.")
//        })
//        return count
//    }

}

export var ImportKeysActions = alt.generateActions('change')
class ImportKeysStore_ {
    constructor() {
        this.bindActions(ImportKeysActions)
    }
    onChange() {
    }
}
export var ImportKeysStore = alt.createStore(ImportKeysStore_)
export default ImportKeys


class KeyCount extends Component {
    render() {
        if( !this.props.wif_count) return <div/>
        return <span>Found {this.props.wif_count} private keys</span>
    }
}

