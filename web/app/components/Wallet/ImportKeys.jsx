import React, {Component, Children} from "react"
import PrivateKey from "ecc/key_private"
import Aes from "ecc/aes"

import Wallet from "components/Wallet/Wallet"
import WalletDb from "stores/WalletDb"
import WalletActions from "actions/WalletActions"
import notify from 'actions/NotificationActions'

import hash from "common/hash"
import cname from "classnames"


var wif_regex = /5[HJK][1-9A-Za-z]{49}/g

export default class ImportKeys extends Component {
    
    constructor() {
        super()
        this.state = this._getInitialState()
    }
    
    _getInitialState() {
        return {
            wifs: {},
            wif_accounts: {},
            wif_count: 0,
            reset_file_name: Date.now(),
            reset_password: Date.now(),
            password_checksum: null,
            password_message: null,
            wif_textarea_message: null,
            wif_textarea: ""
        }
    }
    
    render() {
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
                
                <div>
                    <textarea
                        placeholder="Paste WIF private keys (optional)..."
                        onChange={this._onWifTextChange.bind(this)}
                        value={this.state.wif_textarea}
                    />
                    <div>{this.state.wif_textarea_message}</div>
                </div>
                <br/>
            </div>
        </div>
    }
    
    reset() {
        this.setState(this._getInitialState())
        this.props.setWifCount(0)
    }
    
    updateWifCount() {
        var wif_count = Object.keys(this.state.wifs).length
        this.setState({wif_count})
        this.props.setWifCount(wif_count)
    }
    
    importKeys() {
        if( ! WalletDb.isLocked()) {
            notify.error("wallet is locked")
            return
        }
        WalletDb.importKeys(
            Object.keys(this.state.wifs),
            this.state.wif_accounts
        ).then( result => {
            var {import_count, duplicate_count} = result
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
    
    upload(evt) {
        var file = evt.target.files[0]
        var reader = new FileReader()
        reader.onload = evt => {
            var contents = evt.target.result
            if(this.addByPattern(contents))
                return
            
            try {
                this._parseImportKeys(contents) 
                // this._parseWalletJson(conents)
                
                // try empty password, also display "Enter wallet password"
                this._decryptPrivateKeys()
                
            } catch(message) {
                this.setState({password_message: message})
            }
        }
        reader.readAsText(file)
    }
    
    _parseImportKeys(contents){
        var password_checksum, account_keys
        try {
            var import_keys = JSON.parse(contents)
            password_checksum = import_keys.password_checksum
            if( ! password_checksum)
                throw file.name + " is missing password_checksum"
            
            if( ! Array.isArray(import_keys.account_keys))
                throw file.name + " is missing account_keys"
            
            account_keys = import_keys.account_keys

        } catch(e) { throw e.message || e }
        
        this.setState({
            password_checksum,
            account_keys
        })
    }
    
    /** testnet only .. todo, replace withimport_keys 
    _parseWalletJson(content) {
        var password_checksum, encrypted_keys = [], encrypted_brainkey
        try {
            var wallet_json = JSON.parse(contents)
            for(let element of wallet_json) {
                
                //
                if( "master_key_record_type" == element.type) {
                    
                    if( ! element.data)
                        throw file.name + " invalid master_key_record record"
                    
                    if( ! element.data.checksum)
                        throw file.name + " is missing master_key_record checksum"
                    
                    password_checksum = element.data.checksum
                }
                
                if ( "property_record_type" == element.type &&
                    "encrypted_brainkey" == element.data.key
                ) {
                    // The BTS 0.9 hosted wallet has 100% brain-key
                    // derivied keys.. 
                    encrypted_brainkey = element.data.value
                }
                
                if( "key_record_type" == element.type) {
                    encrypted_keys.push(element.data.encrypted_private_key)
                }
                
            }
            if( ! password_checksum)
                throw file.name + " is missing password_checksum"
            
            if( ! encrypted_keys.length)
                throw file.name + " does not contain any private keys"
            
        } catch(e) {
            var message = e.message || e
            throw message
        }
        this.setState({
            password_checksum,
            encrypted_keys,
            encrypted_brainkey,
            password_message: null
        })
    }*/
    
    _decryptPrivateKeys(evt) {
        var password = evt ? evt.target.value : ""
        var checksum = this.state.password_checksum
        var new_checksum = hash.sha512(hash.sha512(password)).toString('hex')
        if(checksum != new_checksum) {
            this.setState({password_message: "Enter wallet password"})
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
                    
                    var wif_private_key = private_key.toWif()
                    var account_names = this.state.wifs[wif_private_key] || []
                    account_names.push(account_name)
                    this.state.wifs[wif_private_key] = account_names
                } catch(e) {
                    var message = e.message || e
                    notify.error(`Account ${acccount_name} had a private key import error: `+message)
                }
            }
        }
        this.updateWifCount()
        this.setState({
            password_message: null,
            password_checksum: null
        })
    }
    
    _onWifTextChange(evt) {
        this.addByPattern(evt.target.value)
        this.setState({wif_textarea: evt.target.value})
    }
    
    addByPattern(contents) {
        if( ! contents)
            return false
        
        var count = 0, invalid_count = 0
        for(let wif of contents.match(wif_regex) || [] ) {
            try { 
                PrivateKey.fromWif(wif) //throws 
                this.state.wifs[wif] = true
                count++
            } catch(e) { invalid_count++ }
        }
        this.updateWifCount()
        this.setState({
            wif_textarea_message: 
                (!count ? "" : count + " keys found from text.") +
                (!invalid_count ? "" : "  " + invalid_count + " invalid keys.")
        })
        return count
    }
    
}

ImportKeys.propTypes = {
    setWifCount: React.PropTypes.object.isRequired
}

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
