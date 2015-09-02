import React from "react"
import connectToStores from "alt/utils/connectToStores"
import BackupActions from "actions/BackupActions"
import WalletUnlockActions from "actions/WalletUnlockActions"
import WalletStore from "stores/WalletStore"
import WalletDb from "stores/WalletDb"
import {backup, restore} from "actions/BackupActions"
import notify from "actions/NotificationActions"
import {saveAs} from "filesaver.js"
import cname from "classnames"
import hash from "common/hash"


class Backup extends React.Component {
    
    constructor() {
        super()
        this.state = {}
    }
    
    static getStores() {
        return [WalletStore]
    }
    
    static getPropsFromStores() {
        var props = WalletStore.getState()
        return props
    }
    
    render() {
        return <div className="grid-block vertical full-width-content">
            <div className="grid-content shrink" style={{paddingTop: "2rem"}}>
            
                <h5>Current Wallet</h5>
                <label>{this.props.current_wallet}</label>
                
                <h5>Available Wallets</h5>
                <label>{this.props.wallet_names.join(', ')}</label>
                
                <hr/>
                
                <h3>Backup</h3>
                <BackupDisk/>
                
                <hr/>
                
                <h3>Verify / Restore</h3>
                <RestoreDisk/>
                
            </div>
        </div>
    }
}
export default connectToStores(Backup)

@connectToStores
class BackupDisk extends React.Component {
    
    constructor() {
        super()
        this.state = { }
    }
    
    static getStores() {
        return [WalletStore]
    }
    
    static getPropsFromStores() {
        var props = WalletStore.getState()
        return props
    }
    
    componentWillMount() {
        try { var isFileSaverSupported = !!new Blob; } catch (e) {}
        this.setState({isFileSaverSupported})
    }
    
    componentDidMount() {
        if( ! this.state.isFileSaverSupported )
            notify.error("File saving is not supported")
    }
    
    render() {
        var has_wallet = WalletDb.getWallet() != null
        var has_saveas = this.state.isFileSaverSupported
        var save_ready = has_wallet && has_saveas
        var current_wallet = this.props.current_wallet
        return <div>
            <div onClick={this.backupClick.bind(this)}
                className={cname("button success", {disabled:!save_ready})}>
                Create Backup ({current_wallet} Wallet)</div>
            
            { this.state.file_name ? <span>
            <h5>Backup File</h5>
            <pre className="no-overflow">
                {this.state.file_name} ({this.state.size} bytes)<br/>
                {this.state.sha1} SHA1
            </pre>
            </span> : null}
            
        </div>
    }
    
    backupClick() {
        var backup_pubkey = WalletDb.getWallet().brainkey_pubkey
        backup(backup_pubkey).then( backup => {
            var current_wallet = this.props.current_wallet
            var file_name = current_wallet + ".bin"
            var sha1 = hash.sha1(backup).toString('hex')
            
            this.setState({ sha1, file_name, size: backup.length })
            
            var blob = new Blob([ backup ], {
                type: "application/octet-stream; charset=us-ascii"})
            
            if(blob.size !== backup.length)
                throw new Error("Invalid backup format")
            
            saveAs(blob, file_name);
        })
    }
}

@connectToStores
class RestoreDisk extends React.Component {
    
    constructor() {
        super()
        this.state = {
            wallet_public_name: null,
            reset_file_name: 0,
            restore: null
        }
        //this.validate()
    }
    
    static getStores() {
        return [WalletStore]
    }
    
    static getPropsFromStores() {
        var props = WalletStore.getState()
        return props
    }
    
    render() {
        var has_file = !!this.state.restore
        var has_wallet_name = !!this.state.wallet_public_name
        var has_unique_wallet_name = has_wallet_name ?
            ! this.props.wallet_names.has(this.state.wallet_public_name) : undefined
        
        var errors_wallet_name =
            has_unique_wallet_name === false ? "Wallet exists, choose a new name" : null
        
        var restore_ready = has_file && has_unique_wallet_name
        return <div>
            <input type="file" id="file_input" key={this.state.reset_file_name}
                onChange={this.restoreFileUpload.bind(this)} />
            
            { this.state.restore ? <span>
            <h5>Restore File</h5>
            <pre className="no-overflow">
                {this.state.restore.file.name} ({this.state.restore.contents.length} bytes)<br/>
                {hash.sha1(this.state.restore.contents).toString('hex')} SHA1<br/>
                {this.state.restore.file.lastModifiedDate.toString()}
            </pre>
            </span> : null}
            
            <h5>New Wallet Name</h5>
            <input type="text" id="wallet_public_name"
                value={this.state.wallet_public_name}
                onChange={this.formChange.bind(this)} />
            
            <p>{errors_wallet_name}</p>
            
            <div className={cname("button success", {disabled:!restore_ready})}
                onClick={this.restoreClick.bind(this)}>Restore</div>
        </div>
    }
    
    restoreClick() {
        WalletUnlockActions.unlock().then( ()=> {
            var private_key = WalletDb.getBrainKey_PrivateKey()
            var contents = this.state.restore.contents
            var wallet_name = this.state.wallet_public_name
            restore(private_key.toWif(), contents, wallet_name).then(()=> {
                notify.success("Restored wallet " + wallet_name.toUpperCase())
                this.forceUpdate()
            }).catch( error => {
                console.error("Error restoring wallet " + wallet_name,
                    error, error.stack)
                notify.error(""+error)
            })
        })
    }
    
    restoreFileUpload(evt) {
        var file = evt.target.files[0]
        var reader = new FileReader()
        reader.onload = evt => {
            var contents = new Buffer(evt.target.result, 'binary')
            this.setState({restore: { file, contents } })
            if( ! this.state.wallet_public_name) {
                var wallet_public_name = file.name.match(/[a-z0-9_-]*/)[0]
                if( wallet_public_name )
                    this.setState({wallet_public_name})
            }
        }
        reader.readAsBinaryString(file)
    }

    formChange(event) {
        let key_id = event.target.id
        let value = event.target.value
        if(key_id === "wallet_public_name") {
            //case in-sensitive
            value = value.toLowerCase()
            // Allow only valid file name characters
            if( /[^a-z0-9_-]/.test(value) ) return
        }
        this.state[key_id] = value
        //this.validate()
        this.forceUpdate()
    }
    
}