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
            wif_count: 0,
            reset_file_name: Date.now(),
            reset_password: Date.now(),
            master_key: null,
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
                    <div>Upload a wallet backup or key export file</div> :
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
                            onChange={this._checkJsonPassword.bind(this)}
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
        WalletDb.importKeys( Object.keys(this.state.wifs) ).then( result => {
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
            
            var master_key, wallet_json
            try {
                wallet_json = JSON.parse(contents)
                for(let element of wallet_json) {
                    if( ! "master_key_record_type" == element.type)
                        continue
                    master_key = element
                    break
                }
                if( ! master_key)
                    throw file.name + " is missing master_key_record_type"
                if( ! master_key.data)
                    throw file.name + " invalid master_key_record_type record"
                if( ! master_key.data.checksum)
                    throw file.name + " is missing master_key_record_type.checksum"
                master_key = master_key.data
            } catch(e) {
                var message = e.message || e
                this.setState({password_message: message})
                return
            }
            this.setState({
                master_key,
                wallet_json,
                password_message: null
            })
            //check empty password, also display "Enter wallet password"
            this._checkJsonPassword()
        }
        reader.readAsText(file)
    }
    
    _checkJsonPassword(evt) {
        var password = evt ? evt.target.value : ""
        var checksum = this.state.master_key.checksum
        var new_checksum = hash.sha512(hash.sha512(password)).toString('hex')
        if(checksum != new_checksum) {
            this.setState({password_message: "Enter wallet password"})
            return
        }
        this.setState({reset_password: Date.now()})
        var password_aes = Aes.fromSeed(password)
        var wallet_json = this.state.wallet_json
        
        for(let element of wallet_json) {
            try {
                if( ! "key_record_type" == element.type)
                    continue
                var encrypted_private = element.data.encrypted_private_key
                var private_plainhex = password_aes.decryptHex(encrypted_private)
                var private_key = PrivateKey.fromBuffer(
                    new Buffer(private_plainhex, 'hex'))
                this.state.wifs[private_key.toWif()] = true
            } catch(e) {
                var message = e.message || e
                this.setState({password_message: message})
            }
        }
        this.updateWifCount()
        this.setState({
            password_message: null,
            master_key: null
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

class KeyCount extends Component {
    render() {
        if( !this.props.wif_count) return <div/>
        return <span>Found {this.props.wif_count} private keys</span>
    }
}
