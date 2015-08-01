import React, {Component, PropTypes} from "react";
import PrivateKey from "ecc/key_private";
import Aes from "ecc/aes";

import WalletDb from "stores/WalletDb";
// import WalletActions from "actions/WalletActions";
import PublicKey from "ecc/key_public";
import FormattedAsset from "components/Utility/FormattedAsset";

import config from "chain/config";
// import alt from "alt-instance";
// import connectToStores from "alt/utils/connectToStores";
import notify from "actions/NotificationActions";
import hash from "common/hash";
// import cname from "classnames";
import Apis from "rpc_api/ApiInstances";
import v from "chain/serializer_validation";
import lookup from "chain/lookup";
import cname from "classnames";
import AccountStore from "stores/AccountStore";

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
                    <div key={index}>
                        <FormattedAsset color="info" amount={asset_balance.balance} asset={asset_balance}/>
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
                <div className="content-block">
                    <h3>Import keys:</h3>
                </div>
                <br/>

                {/* Key file upload */}
                <div>
                    <KeyCount wif_count={this.state.wif_count}/>
                    {!this.state.wif_count ? 
                        <div>Upload BitShares keys file...</div> :
                        <span> (<a onClick={this.reset.bind(this)}>reset</a>)</span>
                    }
                </div>
                <br/>
                <div>
                    {this.state.wif_count ? "" : <div>
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
                        <div>
                            <input 
                                type="password" ref="password"
                                key={this.state.reset_password}
                                placeholder={password_placeholder}
                                onChange={this._decryptPrivateKeys.bind(this)}
                            />
                            <div>{this.state.import_password_message}</div>
                            <div>{this.state.wif_text_message}</div>
                        </div>
                    </div>}
                    
                </div>
                                {this.state.keys.wif_count ? <div>
                                    {account_rows ? <div>
                                        <div>
                                            {account_rows.length ? <div>
                                                <table className="table">
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
                                    </div> : null}
                                    
                                    <br/>
                                    <h3>Unclaimed balances belonging to these keys:</h3>
                                    {balance_rows ? <div>
                                        <div>
                                            <label>Assets</label>
                                            {balance_rows.length ? balance_rows : "No Balances"}
                                        </div>
                                    </div> : null}
                                    <br/>
                                    <div className="button-group">
                                        <div className={cname("button success", {disabled:!import_ready})} onClick={this._saveImport.bind(this)} >
                                            Import
                                        </div>
                                        &nbsp; &nbsp;
                                        <div className="button secondary" onClick={this.reset.bind(this)}>
                                            Cancel
                                        </div>
                                    </div>
                                </div> : null}
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
            var asset_symbol_precisions = [];
            for(let asset_id of asset_ids) {
                asset_symbol_precisions.push(
                    lookup.asset_symbol_precision(asset_id)
                );
            }
            lookup.resolve().then(()=> {
                var balance_by_asset = [];
                for(let i = 0; i < asset_ids.length; i++) {
                    var symbol = asset_symbol_precisions[i].resolve[0];
                    var precision = asset_symbol_precisions[i].resolve[1];
                    var asset_id = asset_ids[i];
                    var balance = assetid_balance[asset_id];
                    balance_by_asset.push({symbol, balance, precision});
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
        });
    }

    lookupBalances(wif_keys) {
        return new Promise((resolve, reject)=> {
            var address_params = [], wif_owner = {};
            for(let wif of wif_keys) {
                var private_key = PrivateKey.fromWif(wif);
                var public_key = private_key.toPublicKey();
                var address_str = public_key.toBtsAddy();
                address_params.push( address_str );
                wif_owner[address_str] = wif;
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
        this.setState({import_password_message: null})
        reader.onload = evt => {
            var contents = evt.target.result
            try {
                //if(this.addByPattern(contents)) return
                
                try {
                    this._parseWalletJson(contents)
                } catch(e) {
                    console.log("... _parseWalletJson",e)
                    this._parseImportKeyUpload(contents, file) 
                }
                // try empty password, also display "Enter import file password"
                this._decryptPrivateKeys()
                
            } catch(message) {
                console.log("... ImportKeys upload error",message)
                this.setState({import_password_message: message})
            }
        }
        reader.readAsText(file)
        React.findDOMNode(this.refs.password).focus()
    }
    
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
    
    _parseWalletJson(contents) {
        var password_checksum
        //var encrypted_brainkey
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
                
                // At this point the wallet is already created .. so importing
                // the brainkey does not help us...
                
                //if ( "property_record_type" == element.type &&
                //    "encrypted_brainkey" == element.data.key
                //) {
                //    encrypted_brainkey = element.data.value
                //    continue
                //}
                
                if( "master_key_record_type" == element.type) {
                    if( ! element.data)
                        throw file.name + " invalid master_key_record record"
                    
                    if( ! element.data.checksum)
                        throw file.name + " is missing master_key_record checksum"
                    
                    password_checksum = element.data.checksum
                }
                
            }
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
        this.setState({
            password_checksum,
            account_keys
            //encrypted_brainkey
        })
    }
   
    _decryptPrivateKeys(evt) {
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
            import_password_message:null
        })
        
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
                    notify.error(`Account ${acccount_name} had a private key import error: `+message)
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
        
    }

    _saveImport() {
        if( WalletDb.isLocked()) {
            notify.error("Wallet is locked")
            return
        }
        for(let account_name in this.state.account_keycount) {
            AccountStore.onCreateAccount(account_name)
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
                
                //if (import_count)
                //    this.refs.balance_claim.updateBalances()
            
            } finally {
                // this.reset()
                this.setState({import_active: false, balance_claim_active: true});
                this.props.exportState({import_active: false, balance_claim_active: true});
            }
            
        }).catch( error => {
            console.log("error:", error);
            notify.error(`There was an error: ${error}`)
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

export default ImportKeys

ImportKeys.propTypes = {
    exportState: PropTypes.func.isRequired
}

class KeyCount extends Component {
    render() {
        if( !this.props.wif_count) return <div/>
        return <span>Found {this.props.wif_count} private keys</span>
    }
}

