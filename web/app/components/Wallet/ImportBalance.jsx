import React, {Component, Children} from "react"
import PrivateKey from "ecc/key_private"
import Aes from "ecc/aes"
import WalletActions from "actions/WalletActions"
import AccountSelect from "components/Wallet/AccountSelect"
import hash from "common/hash"

var wif_regex = /5[HJK][1-9A-Za-z]{49}/g
var private_wifs = []

export default class ImportBalance extends Component {
    
    constructor() {
        super()
        this.state = this.getInitialState()
    }
    
    getInitialState() {
        return {
            wif_private_keys: null,
            file_name: null,
            reset_file_name: Date.now(),
            master_key: null,
            wallet_json_password_message: null,
            wallet_json_imported: null
        }
    }
    
    discard() {
        this.setState(this.getInitialState())
    }
    
    /*shouldComponentUpdate() {
        return true
    }*/
    
    render() {
        private_wifs.length = 0
        var keys = { valid: private_wifs, invalid: [] }
        if(this.state.wif_private_keys) {
            for(let key of Object.keys(this.state.wif_private_keys)) {
                try {
                    PrivateKey.fromWif(key)
                    keys.valid.push(key)
                } catch (e) {
                    keys.invalid.push(key)
                }
            }
        }
        keys.balances = this.balances(0, keys.valid)
        
        return <div className="grid-block page-layout">
            <div className="grid-block vertical medium-8 medium-offset-2">
                <label>Import Balance</label>
                <AccountSelect ref="account_selector"/>
                <KeyPreview keys={keys}/>
                
                { this.state.wallet_json_imported ? "" : <div>
                    <input
                        type="file" id="file_input"
                        key={this.state.reset_file_name}
                        onChange={this.upload.bind(this)}
                    />
                    <span>Upload BitShares Wallet (wallet.json)</span>
                    { ! this.state.master_key ? "" : <div>
                        <input 
                            type="password"
                            placeholder="Enter wallet password"
                            onChange={this._walletJsonPassword.bind(this)}
                        />
                    </div>}
                    <div>{this.state.wallet_json_password_message}</div>
                </div>}
                <br/>
                
                <textarea
                    placeholder="Paste WIF private keys (optional)..."
                    onChange={this._onWifTextChange.bind(this)}
                    value={this.state.wif_textarea}
                />
                { this.state.wif_textarea == "" ? "" :  // Add Button...
                    <button className="button"
                        onClick={this._addWifText.bind(this)}>Add</button>
                }
                { ! this.state.wif_private_keys ? "" :
                    <a onClick={this.discard.bind(this)}>RESET (import private keys)</a>
                }
            </div>
        </div>
    }
    
    balances(account, valid_keys) {
        //this.state.wif_private_keys
        if(valid_keys.length == 0)
            return
        
        WalletActions.importBalance(
            account, 
            valid_keys, 
            false/*broadcast*/
        ).then((transaction)=> {
            console.log('... balance_claim_transaction',transaction)
            //preview transaction
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
                if( ! master_key.data.encrypted_key)
                    throw file.name + " is missing master_key_record_type.encrypted_key"
                if( ! master_key.data.checksum)
                    throw file.name + " is missing master_key_record_type.checksum"
                master_key = master_key.data
            } catch(e) {
                var message = e.message || e
                this.setState({wallet_json_password_message: message})
                return
            }
            this.setState({
                master_key,
                wallet_json,
                wallet_json_password_message: null
            })
        }
        reader.readAsText(file)
    }
    
    _walletJsonPassword(evt) {
        var password = evt.target.value
        var checksum = this.state.master_key.checksum
        var new_checksum = hash.sha512(hash.sha512(password)).toString('hex')
        if(checksum != new_checksum) {
            this.setState({wallet_json_password_message: "Wrong Password"})
            return
        }
        var password_aes = Aes.fromSeed(password)
        var wallet_json = this.state.wallet_json
        if( ! this.state.wif_private_keys)
            this.state.wif_private_keys = {}
        
        for(let element of wallet_json) {
            try {
                if( ! "key_record_type" == element.type)
                    continue
                var encrypted_private = element.data.encrypted_private_key
                var private_plainhex = password_aes.decryptHex(encrypted_private)
                var private_key = PrivateKey.fromBuffer(
                    new Buffer(private_plainhex, 'hex'))
                this.state.wif_private_keys[private_key.toWif()] = true
            } catch(e) {
                var message = e.message || e
                this.setState({wallet_json_password_message: message})
            }
        }
        this.setState({
            wallet_json_password_message: null,
            wallet_json_imported: true,
            master_key: null
        })
    }
    
    _onWifTextChange(evt) {
        this.setState({wif_textarea: evt.target.value})
    }
    
    _addWifText() {
        this.addByPattern(this.state.wif_textarea)
        this.setState({wif_textarea: ""})
    }
    
    addByPattern(contents) {
        if( ! this.state.wif_private_keys)
            this.state.wif_private_keys = {}
        
        var added = false
        for(let wif of contents.match(wif_regex) || [] ) {
            this.state.wif_private_keys[wif] = true
            added = true
        }
        
        this.setState({wif_private_keys: this.state.wif_private_keys})
        return added
    }
    
    
    
}

// https://github.com/cryptonomex/graphene-ui/issues/19
// ImportBalance.private_wifs = React.PropTypes.array.isRequired


class KeyPreview extends Component {
    
    constructor() {
        super()
        this.state = { max_rows: 3 }
    }

    render() {
        if( ! (this.props.keys.valid.length || this.props.keys.invalid.length))
            return <div/>
        
        return <Row>
            <Column>{this.renderByType('valid')}</Column>
            <Column>{this.renderByType('invalid')}</Column>
        </Row>
    }
    
    renderByType(type) {
        var keys = this.props.keys
        var max_rows = this.state.max_rows
        return <div>
            <label>{type} Keys ({keys[type].length})</label>
            { keys[type].map( key => {
                max_rows--
                if(max_rows == 0)
                    return <div onClick={this.expand.bind(this)}>&hellip;</div>
                if(max_rows < 0) return null
                if(key.length > 7)
                    // show just enough for debugging
                    key = key.substring(0, 7)
                
                return <div className="monospace">{key}&hellip;</div>
            })}
        </div>
    }
    
    expand() {
        this.setState({max_rows: 10*1000})
    }
}

/*class Importer extends Component {
    
    render() {
        var child = Children.only(this.props.children)
        
    }
    
}*/

// move to new file
class Row extends Component {
    render() {
        return <div className="grid-block page-layout small-horizontal">
            {this.props.children}
        </div>
    }
}

// move to new file
class Column extends Component {
    render() {
        return <div className="grid-block medium-3">
            <div className="grid-content">
                {this.props.children}    
            </div>
        </div>
    }
}
