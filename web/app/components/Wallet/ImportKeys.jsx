import React, {Component, Children} from "react"
import PrivateKey from "ecc/key_private"
import Aes from "ecc/aes"

import WalletDb from "stores/WalletDb"
import WalletActions from "actions/WalletActions"
import AccountSelect,{
    accountSelectStore,
    accountSelectActions
} from "components/Account/AccountSelect"

import connectToStores from 'alt/utils/connectToStores'
import notify from 'actions/NotificationActions'
import hash from "common/hash"
import cname from "classnames"

var wif_regex = /5[HJK][1-9A-Za-z]{49}/g
var accountSelectState = accountSelectStore.getState()

class ImportKeys extends Component {
    
    constructor() {
        super()
        this.state = this._getInitialState()
    }
    
    static getStores() {
        return [accountSelectStore]
    }
    
    static getPropsFromStores() {
        return accountSelectStore.getState()
    }
    
    _getInitialState() {
        return {
            wif_account_names: {},
            wif_count: 0,
            account_keys: [],
            reset_file_name: Date.now(),
            reset_password: Date.now(),
            password_checksum: null,
            password_message: null,
            wif_textarea_private_keys_message: null,
            wif_textarea_private_keys: ""
        }
    }
    
    render() {
        var has_keys = this.state.wif_count != 0
        var account_selected =
            this.props.current_account &&
            this.props.current_account != ""

        var importable = has_keys && account_selected
        
        return <div>
            <div>
                <KeyCount wif_count={this.state.wif_count}/>
                {!this.state.wif_count ? 
                    <div>Upload BitShares keys file...</div> :
                    <span> (<a onClick={this.reset.bind(this)}>reset</a>)</span>
                }
            </div>
            <br/>
            <div>
                <div>
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
                            type="password"
                            key={this.state.reset_password}
                            placeholder="Enter wallet password"
                            onChange={this._decryptPrivateKeys.bind(this)}
                        />
                        <div>{this.state.password_message}</div>
                    </div>
                </div>
                
                <br/>
                
                <AccountSelect
                    account_names={this.getAccountNames()}
                    placeholder="Select Primary Account"
                    selectStyle={{height: '100px'}}
                    list_size="5"
                />
                <div>
                    <a className={
                        cname("button", {disabled:!importable})}
                        onClick={this.importKeys.bind(this)} >
                        Import
                    </a>
                </div>
            </div>
        </div>
    }
    
//                <div>
//                    <textarea
//                        placeholder="Paste WIF private keys (optional)..."
//                        onChange={this._onWifTextChange.bind(this)}
//                        value={this.state.wif_textarea_private_keys}
//                    />
//                    <div>{this.state.wif_textarea_private_keys_message}</div>
//                </div>
//                <br/>

//                <hr/>
//                <h3>Load Brain Key</h3>
//                <ImportBrainKey/>

    importKeys() {
        if( WalletDb.isLocked()) {
            notify.error("Wallet is locked")
            return
        }
        var wifs = Object.keys(this.state.wif_account_names)
        WalletDb.importKeys( wifs ).then( result => {
            var {import_count, duplicate_count, private_key_ids} = result
            var message = ""
            if (import_count)
                message = `Successfully imported ${import_count} keys.`
            if (duplicate_count)
                message += `  ${duplicate_count} duplicates (Not Imported).`
            
            if(duplicate_count)
                notify.warning(message)
            else
                notify.success(message)
            
            this.reset()
            
        }).catch( error => {
            notify.error(`There was an error: ${error}`)
        })
    }
    
    reset() {
        this.setState(this._getInitialState())
        accountSelectActions.reset()
    }
    
    wifPrivateKeysUpdate() {
        var wif_count = Object.keys(this.state.wif_account_names).length
        this.setState({wif_count})
    }
    
    upload(evt) {
        var file = evt.target.files[0]
        var reader = new FileReader()
        this.setState({password_message: null})
        reader.onload = evt => {
            var contents = evt.target.result
            if(this.addByPattern(contents))
                return
            
            try {
                this._parseImportKeyUpload(contents, file) 
                // this._parseWalletJson(conents)
                
                // try empty password, also display "Enter wallet password"
                this._decryptPrivateKeys()
                
            } catch(message) {
                this.setState({password_message: message})
            }
        }
        reader.readAsText(file)
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
   
    _decryptPrivateKeys(evt) {
        if( ! this.state.account_keys.length)
            return
        
        var password = evt ? evt.target.value : ""
        var checksum = this.state.password_checksum
        this.setState({password_message: "Enter wallet password"})
        var new_checksum = hash.sha512(hash.sha512(password)).toString('hex')
        if(checksum != new_checksum) {
            if(password != "")
                this.setState({password_message: "Enter wallet password (keep going)"})
            return
        }
        this.setState({reset_password: Date.now()})
        
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
                        new Buffer(private_plainhex, 'hex'))
                    
                    var private_key_wif = private_key.toWif()
                    var account_names = this.state.wif_account_names[private_key_wif] || []
                    account_names.push(account_name)
                    this.state.wif_account_names[private_key_wif] = account_names
                } catch(e) {
                    var message = e.message || e
                    notify.error(`Account ${acccount_name} had a private key import error: `+message)
                }
            }
        }
        this.wifPrivateKeysUpdate()
        this.setState({
            password_message: null,
            password_checksum: null
        })
    }
    
    getAccountNames() {
        var account_names = {}
        var wif_account_names = this.state.wif_account_names
        for(let wif in wif_account_names)
            for(let account_name of wif_account_names[wif])
                account_names[account_name] = true
        
        return Object.keys(account_names)
    }
    
    _onWifTextChange(evt) {
        this.addByPattern(evt.target.value)
        this.setState({wif_textarea_private_keys: evt.target.value})
    }
    
    addByPattern(contents) {
        if( ! contents)
            return false
        
        var count = 0, invalid_count = 0
        for(let wif of contents.match(wif_regex) || [] ) {
            try { 
                PrivateKey.fromWif(wif) //throws 
                this.state.wif_account_names[wif] = []
                count++
            } catch(e) { invalid_count++ }
        }
        this.wifPrivateKeysUpdate()
        this.setState({
            wif_textarea_private_keys_message: 
                (!count ? "" : count + " keys found from text.") +
                (!invalid_count ? "" : "  " + invalid_count + " invalid keys.")
        })
        return count
    }
    
}
ImportKeys = connectToStores(ImportKeys)
export default ImportKeys

class KeyCount extends Component {
    render() {
        if( !this.props.wif_count) return <div/>
        return <span>Found {this.props.wif_count} private keys</span>
    }
}
/*
import tcomb from "tcomb"
var AccountEncyptedPrivateKeysTcomb = tcomb.struct({
    account_name: t.Str,
    encrypted_private_keys: t.Arr
})

var AccountPrivateKeysTcomb = tcomb.struct({
    account_name: t.Str,
    private_keys: t.Arr
})

var key_export_file = tcomb.struct({
    password_checksum: t.Str,
    account_keys: ?[]
*/
