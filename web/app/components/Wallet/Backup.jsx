import React from "react"
import connectToStores from "alt/utils/connectToStores"
import BackupActions from "actions/BackupActions"
import WalletUnlockActions from "actions/WalletUnlockActions"
import WalletStore from "stores/WalletStore"
import BackupStore from "stores/BackupStore"
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
        var wallet = WalletStore.getState()
        return { wallet }
    }
    
    render() {
        return <div className="grid-block vertical full-width-content">
            <div className="grid-content shrink" style={{paddingTop: "2rem"}}>
            
                <h5>Current Wallet</h5>
                <label>{this.props.wallet.current_wallet}</label>
                
                <hr/>
                
                <h3>Backup</h3>
                <BackupDisk/>
                
            </div>
        </div>
    }
}
export default connectToStores(Backup)

@connectToStores
export class BackupDisk extends React.Component {
    
    constructor() {
        super()
        this.state = { }
    }
    
    static getStores() {
        return [WalletStore, BackupStore]
    }
    
    static getPropsFromStores() {
        var wallet = WalletStore.getState()
        var backup = BackupStore.getState()
        return { wallet, backup }
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
        
        var current_wallet = this.props.wallet.current_wallet
        var action_label = this.props.backup.contents ? "Save Backup" : "Create Backup"
        
        return <div>
            <div onClick={this.onActionClick.bind(this)}
                className={cname("button success", {disabled:!save_ready})}>
                {action_label} ({current_wallet} Wallet)</div>
            
            { this.state.name ? <span>
            <h5>Backup File</h5>
            <pre className="no-overflow">
                {this.props.backup.name} ({this.props.backup.size} bytes)<br/>
                {this.props.backup.sha1} * SHA1
            </pre>
            </span> : null}
            
            {this.props.backup.contents ? <p>
            <label><a onClick={this.onReset.bind(this)}>Reset</a></label>
            </p> : null}
            
        </div>
    }
    
    onActionClick() {
        this.props.backup.contents ?
            this.saveBackup() :
            this.createAndSaveBackup()
    }
    
    onReset() {
        BackupActions.reset()
    }
    
    createAndSaveBackup() {
        var backup_pubkey = WalletDb.getWallet().password_pubkey
        backup(backup_pubkey).then( contents => {
            var current_wallet = this.props.wallet.current_wallet
            var name = current_wallet + ".bin"
            BackupActions.incommingBuffer({name, contents})
            this.setState({ componentDidUpdateAction : "saveBackup" })
        })
    }
    
    saveBackup() {
        var blob = new Blob([ this.props.backup.contents ], {
            type: "application/octet-stream; charset=us-ascii"})
        
        if(blob.size !== this.props.backup.size)
            throw new Error("Invalid backup to download conversion")
        
        saveAs(blob, this.props.backup.name);
    }
    
    componentDidUpdate() {
        if(this.state.componentDidUpdateAction) {
            this.setState({componentDidUpdateAction: undefined})
            this[this.state.componentDidUpdateAction]()
        }
    }
    
}

@connectToStores
export class RestoreDisk extends React.Component {
    
    constructor() {
        super()
        this.state = {
            wallet_public_name: null,
            reset_name: 0,
            backup_password: null
        }
    }
    
    static contextTypes = {
        router: React.PropTypes.func.isRequired
    }
    
    static getStores() {
        return [WalletStore, BackupStore]
    }
    
    static getPropsFromStores() {
        var wallet = WalletStore.getState()
        var backup = BackupStore.getState()
        return { wallet, backup }
    }
    
    render() {
        var has_contents = !!this.props.backup.contents
        var has_current_wallet = !!this.props.wallet.current_wallet
        var has_wallet_name = !!this.state.wallet_public_name
        var has_unique_wallet_name = has_wallet_name ?
            ! this.props.wallet.wallet_names.has(this.state.wallet_public_name) : undefined
        
        var has_invalid_format = has_contents && ! this.props.backup.public_key
        
        var restore_ready = has_contents && ! has_invalid_format && (
            ( has_current_wallet && has_unique_wallet_name ) ||
            ! has_current_wallet
        )
        
        return <form onChange={this.formChange.bind(this)}>
        
            { ! this.props.backup.name || has_invalid_format ? <span>
                <input type="file" id="backup_input_file" key={this.state.reset_name}
                    style={{ border: 'solid' }}
                    onChange={this.restoreFileUpload.bind(this)} />
            </span> : null}
            
            { has_invalid_format ? <h5>Invalid Format</h5> : has_contents ? <div>
                <h5>Restore File</h5>
                <p>
                    <b>{this.props.backup.name}</b> ({this.props.backup.size} bytes)<br/>
                    {this.props.backup.last_modified}
                </p>
                
                <label>Password</label>
                <input type="password" id="backup_password"
                    value={this.state.backup_password}/>
                
                <pre className="no-overflow">{this.props.backup.sha1} * SHA1</pre>
            </div> : null}
            
            { has_current_wallet ? <div>
                <h5>New Wallet Name</h5>
                <input type="text" id="wallet_public_name"
                    value={this.state.wallet_public_name} />
                
                <p>{! has_unique_wallet_name ? "Wallet exists, choose a new name" : null}</p>
            </div> : null }
            
            {has_contents ? <div>
                <br></br>
                { restore_ready ? <span>
                    <div className="button success"
                        onClick={this.restoreClick.bind(this)}>Restore</div>
                    &nbsp;&nbsp;
                </span> : null}
                <span className="button cancel"
                    onClick={this.onReset.bind(this)}>Reset</span>
            </div>: null}
        </form>
    }
    
    restoreClick() {
        //var private_key = WalletDb.getBrainKey_PrivateKey()
        var private_key = PrivateKey.fromSeed(this.state.backup_password || "")
        var contents = this.props.backup.contents
        var wallet_name = this.state.wallet_public_name || "default"
        restore(private_key.toWif(), contents, wallet_name).then(()=> {
            notify.success("Restored wallet " + wallet_name.toUpperCase())
            this.context.router.transitionTo("dashboard")
        }).catch( error => {
            console.error("Error restoring wallet " + wallet_name,
                error, error.stack)
            if(error === "invalid_decryption_key")
                notify.error("Invalid Password")
            else
                notify.error(""+error)
        })
    }
    
    restoreFileUpload(evt) {
        var file = evt.target.files[0]
        if( ! this.state.wallet_public_name) {
            if(WalletDb.getWallet()){
                var wallet_public_name = file.name.match(/[a-z0-9_-]*/)[0]
                if( wallet_public_name )
                    this.setState({wallet_public_name})
            }
        }
        BackupActions.incommingWebFile(file)
    }
    
    onReset() {
        BackupActions.reset()
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
        this.forceUpdate()
    }
    
}