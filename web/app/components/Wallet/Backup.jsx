import React, {PropTypes, Component} from "react"
import {FormattedDate} from "react-intl"
import {Link} from "react-router";
import Inspector from "react-json-inspector";
import connectToStores from "alt/utils/connectToStores"
import WalletUnlockActions from "actions/WalletUnlockActions"
import WalletActions from "actions/WalletActions"
import CachedPropertyActions from "actions/CachedPropertyActions"
import WalletManagerStore from "stores/WalletManagerStore"
import BackupStore from "stores/BackupStore"
import WalletDb from "stores/WalletDb"
import BackupActions, {backup, restore, decryptWalletBackup} from "actions/BackupActions"
import notify from "actions/NotificationActions"
import {saveAs} from "common/filesaver.js"
import cname from "classnames"
import hash from "common/hash"
import Translate from "react-translate-component";
import chain_config from "chain/config"

class BackupBaseComponent extends Component {
    
    static getStores() {
        return [WalletManagerStore, BackupStore]
    }
    
    static getPropsFromStores() {
        var wallet = WalletManagerStore.getState()
        var backup = BackupStore.getState()
        return { wallet, backup }
    }
    
}

//The default component is WalletManager.jsx 

@connectToStores
export class BackupCreate extends BackupBaseComponent {
    render() {
        return <span>

            <h3><Translate content="wallet.create_backup" /></h3>

            <Create>
                <NameSizeModified/>
                <Sha1/>
                <Download/>
                <Reset/>
            </Create>
            
        </span>
    }
}

@connectToStores
export class BackupVerify extends BackupBaseComponent {
    render() {
        return <span>

            <h3><Translate content="wallet.verify_prior_backup" /></h3>

            <Upload>
                <NameSizeModified/>
                <DecryptBackup saveWalletObject={true}>
                    <h4><Translate content="wallet.verified" /></h4>
                    <WalletObjectInspector
                        walletObject={this.props.backup.wallet_object}/>
                </DecryptBackup>
                <Reset/>
            </Upload>
        
        </span>
    }
}

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

@connectToStores
export class BackupRestore extends BackupBaseComponent {
    
    constructor() {
        super()
        this.state = {
            newWalletName: null
        }
    }
    
    render() {
        var new_wallet = this.props.wallet.new_wallet
        var has_new_wallet = this.props.wallet.wallet_names.has(new_wallet)
        var restored = has_new_wallet
        
        return <span>

            <h3><Translate content="wallet.import_backup" /></h3>

            <Upload>
                <NameSizeModified/>
                <DecryptBackup saveWalletObject={true}>
                    <NewWalletName>
                        <Restore/>
                    </NewWalletName>
                </DecryptBackup>
                <Reset label={restored ? <Translate content="wallet.done" /> : <Translate content="wallet.reset" />}/>
            </Upload>
        </span>
    }
    
}

@connectToStores
class Restore extends BackupBaseComponent {
    
    constructor() {
        super()
        this.state = { }
    }
    
    isRestored() {
        var new_wallet = this.props.wallet.new_wallet
        var has_new_wallet = this.props.wallet.wallet_names.has(new_wallet)
        return has_new_wallet
    }
    
    render() {
        var new_wallet = this.props.wallet.new_wallet
        var has_new_wallet = this.isRestored()
        
        if(has_new_wallet)
            return <span>
                <h5><Translate content="wallet.restore_success" name={new_wallet.toUpperCase()} /></h5>
                <div>{this.props.children}</div>
            </span>
        
        return <span>
            <h3><Translate content="wallet.ready_to_restore" /></h3>
            <div className="button success"
                onClick={this.onRestore.bind(this)}><Translate content="wallet.restore_wallet_of" name={new_wallet} /></div>
        </span>
    }
    
    onRestore() {
        WalletActions.restore(
            this.props.wallet.new_wallet,
            this.props.backup.wallet_object
        )
    }
    
}

@connectToStores
class NewWalletName extends BackupBaseComponent {
    
    constructor() {
        super()
        this.state = {
            new_wallet: null,
            accept: false
        }
    }
    
    componentWillMount() {
        var has_current_wallet = !!this.props.wallet.current_wallet
        if( ! has_current_wallet) {
            WalletManagerStore.setNewWallet("default")
            this.setState({accept: true})
        }
        if( has_current_wallet && this.props.backup.name && ! this.state.new_wallet) {
            // begning of the file name might make a good wallet name
            var new_wallet = this.props.backup.name.match(/[a-z0-9_-]*/)[0]
            if( new_wallet )
                this.setState({new_wallet})
        }
    }
    
    render() {
        if(this.state.accept)
            return <span>{this.props.children}</span>
        
        var has_wallet_name = !!this.state.new_wallet
        var has_wallet_name_conflict = has_wallet_name ?
            this.props.wallet.wallet_names.has(this.state.new_wallet) : false
        var name_ready = ! has_wallet_name_conflict && has_wallet_name
        
        return <span>
            <h5><Translate content="wallet.new_wallet_name" /></h5>
            <input type="text" id="new_wallet"
                onChange={this.formChange.bind(this)}
                value={this.state.new_wallet} />
            <p>{ has_wallet_name_conflict ? <Translate content="wallet.wallet_exist" /> : null}</p>
            <div className={cname("button success", {disabled: ! name_ready})}
                onClick={this.onAccept.bind(this)}><Translate content="wallet.accept" /></div>
        </span>
    }
    
    onAccept() {
        this.setState({accept: true})
        WalletManagerStore.setNewWallet(this.state.new_wallet)
    }
    
    formChange(event) {
        var key_id = event.target.id
        var value = event.target.value
        if(key_id === "new_wallet") {
            //case in-sensitive
            value = value.toLowerCase()
            // Allow only valid file name characters
            if( /[^a-z0-9_-]/.test(value) ) return
        }
        var state = {}
        state[key_id] = value
        this.setState(state)
    }
    
}

@connectToStores
class Download extends BackupBaseComponent {
    
    componentWillMount() {
        try { this.isFileSaverSupported = !!new Blob; } catch (e) {}
    }
    
    componentDidMount() {
        if( ! this.isFileSaverSupported )
            notify.error("File saving is not supported")
    }
    
    render() {
        return <span className="button success"
            onClick={this.onDownload.bind(this)}><Translate content="wallet.download" /></span>
    }
    
    onDownload() {
        var blob = new Blob([ this.props.backup.contents ], {
            type: "application/octet-stream; charset=us-ascii"})
        
        if(blob.size !== this.props.backup.size)
            throw new Error("Invalid backup to download conversion")
        
        saveAs(blob, this.props.backup.name);
        WalletActions.setBackupDate()
    }
}

@connectToStores
class Create extends BackupBaseComponent {
    
    render() {
        var has_backup = !!this.props.backup.contents
        if( has_backup ) return <div>{this.props.children}</div>
        
        var ready = WalletDb.getWallet() != null
        
        return <div>
            <div onClick={this.onCreateBackup.bind(this)}
                className={cname("button success", {disabled: !ready})}>
                <Translate content="wallet.create_backup_of" name={this.props.wallet.current_wallet} /></div>
            <LastBackupDate/>
        </div>
    }
    
    onCreateBackup() {
        var backup_pubkey = WalletDb.getWallet().password_pubkey
        backup(backup_pubkey).then( contents => {
            var name = this.props.wallet.current_wallet
            var address_prefix = chain_config.address_prefix.toLowerCase()
            if(name.indexOf(address_prefix) !== 0)
                name = address_prefix + "_" + name
            name = name + ".bin"
            BackupActions.incommingBuffer({name, contents})
        })
    }
    
}

class LastBackupDate extends Component {
    render() {
        var backup_date = WalletDb.getWallet().backup_date
        var last_modified = WalletDb.getWallet().last_modified
        var backup_time = backup_date ?
            <h4><Translate content="wallet.last_backup" /> <FormattedDate value={backup_date}/></h4>:
            <h4><Translate content="wallet.never_backed_up" /></h4>
        var needs_backup = null
        if( backup_date ) {
            needs_backup = last_modified.getTime() > backup_date.getTime() ?
                <h4><Translate content="wallet.need_backup" /></h4>:
                <h4 className="success"><Translate content="wallet.noneed_backup" /></h4>
        }
        return <span>
            <p>{backup_time}</p>
            <p>{needs_backup}</p>
        </span>
    }
}

@connectToStores
class Upload extends BackupBaseComponent {
    
    render() {
        if(
            this.props.backup.contents &&
            this.props.backup.public_key
        )
            return <span>{this.props.children}</span>
        
        var is_invalid =
            this.props.backup.contents &&
            ! this.props.backup.public_key

        return <span>
            <input type="file" id="backup_input_file" style={{ border: 'solid' }}
                onChange={this.onFileUpload.bind(this)} />
            { is_invalid ? <h5><Translate content="wallet.invalid_format" /></h5> : null }
        </span>
    }
    
    onFileUpload(evt) {
        var file = evt.target.files[0]
        BackupActions.incommingWebFile(file)
        this.forceUpdate()
    }
}


@connectToStores
class NameSizeModified extends BackupBaseComponent {
    render() {
        return <span>
            <h5><b>{this.props.backup.name}</b> ({this.props.backup.size} bytes)</h5>
            {this.props.backup.last_modified ?
                <div>{this.props.backup.last_modified}</div> : null }
            <br/>
        </span>
    }
}

@connectToStores
class DecryptBackup extends BackupBaseComponent {
    
    static propTypes = {
        saveWalletObject: PropTypes.bool
    }
    
    constructor() {
        super()
        this.state = this._getInitialState()
    }
    
    _getInitialState() {
        return {
            backup_password: null,
            verified: false
        }
    }
    
    render() {
        if(this.state.verified) return <span>{this.props.children}</span>
        return <span>
            <label><Translate content="wallet.enter_password" /></label>
            <input type="password" id="backup_password"
                onChange={this.formChange.bind(this)}
                value={this.state.backup_password}/>
            <Sha1/>
            <span className="button success"
                onClick={this.onPassword.bind(this)}><Translate content="wallet.verify" /></span>
        </span>
    }
    
    onPassword() {
        var private_key = PrivateKey.fromSeed(this.state.backup_password || "")
        var contents = this.props.backup.contents
        decryptWalletBackup(private_key.toWif(), contents).then( wallet_object => {
            this.setState({verified: true})
            if(this.props.saveWalletObject)
                BackupStore.setWalletObjct(wallet_object)
            
        }).catch( error => {
            console.error("Error verifying wallet " + this.props.backup.name,
                error, error.stack)
            if(error === "invalid_decryption_key")
                notify.error("Invalid Password")
            else
                notify.error(""+error)
        })
    }
    
    formChange(event) {
        var state = {}
        state[event.target.id] = event.target.value
        this.setState(state)
    }
    
}

@connectToStores
export class Sha1 extends BackupBaseComponent {
    render() { 
        return <div>
            <pre className="no-overflow">{this.props.backup.sha1} * SHA1</pre>
            <br/>
        </div>
    }
}

@connectToStores
class Reset extends BackupBaseComponent {
    
    // static contextTypes = {router: React.PropTypes.func.isRequired}
    
    render() {
        var label = this.props.label || <Translate content="wallet.reset" />
        return  <span className="button cancel"
            onClick={this.onReset.bind(this)}>{label}</span>
    }
    
    onReset() {
        BackupActions.reset()
        window.history.back()
        // this.context.router.transitionTo("backup")
    }
}
