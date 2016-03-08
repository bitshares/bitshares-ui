import React from "react";
import ReactDOM from "react-dom";
import {PropTypes, Component} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import AltContainer from "alt-container"
import counterpart from "counterpart"
import cname from "classnames"
import bs58 from "bs58"
import { Apis } from "@graphene/chain"

import AuthInput from "components/Forms/AuthInput"
import WalletUnlock from "components/Wallet/WalletUnlock"
import VerifyPassword from "components/Wallet/VerifyPassword"
// import TokenRequest from "components/Wallet/TokenRequest"
import BackupServerStore from "stores/BackupServerStore"
import { validToken, extractSeed } from "@graphene/time-token"
import AuthStore from "stores/AuthStore"
import WalletDb from "stores/WalletDb"
import LoadingIndicator from "components/LoadingIndicator"
import WalletUnlockActions from "actions/WalletUnlockActions"
import notify from "actions/NotificationActions"

global.tabIndex = global.tabIndex || 0

let AuthEmail = AuthStore("Email", {hasEmail: true, hasPassword: false, hasUsername: false})
let AuthChange = AuthStore("AuthChange", {weak: false, hasConfirm: true})
let AuthPassword = AuthStore("AuthPassword", {weak: false})

export default class Atl extends Component {
    render() {
        return (
            <AltContainer stores={{
                    backups: BackupServerStore,
                    wallet_store: WalletDb,
                    auth_email: AuthEmail,
                    auth_change: AuthChange,
                    auth_password: AuthPassword,
                }}>
                <BackupServer/>
            </AltContainer>
        )
    }
}

class BackupServer extends Component {
    
    constructor() {
        super()
        this.init = ()=>({ busy: false, key: null,
            email_wallet_key: false, _entered: false,
            server_wallet: null,
            private_key: null, private_api_key: null,
            new_wallet_name: "default",
        })
        this.state = this.init()
    }
    
    componentWillUnmount() {
        this.setState(this.init())
    }
    
    componentDidMount() {
        let em = ReactDOM.findDOMNode(this.refs.restoreKeyInput)
        if(em) em.focus()
    }
    
    render() {
        
        const download_option = ! WalletDb.isEmpty() ? <div>
            <hr/><br/>
            <Link to="wallet/backup/download">
            <label className="secondary"><Translate content="wallet.download_backup" /></label></Link>
        </div> : null
        
        if( ! WalletDb.isLocked()) {
            let wallet = WalletDb.getState().wallet
            let connected = wallet.api && wallet.api.ws_rpc.status === "open"
            if(! connected )
                //Link to Settings?
                return <div>
                    <div className="error">Not connected to the backup server</div>
                    {download_option}    
                </div>
        }
        
        let wallet = ()=> WalletDb.getState().wallet
        
        // const unlockClick = e => {
        //     e.preventDefault()
        //     WalletUnlockActions.unlock()
        // }
        // const unlockButton = WalletDb.isLocked() ? 
        //     <button 
        //         className={cname("button secondary") }
        //         onClick={unlockClick.bind(this)}><Translate content="unlock" />
        //     </button>
        // : <span/>
        
        const changePassword = ()=> this.setState({ busy: true },
            ()=> this.props.auth_change.changePassword()
            .then(()=> this.setState({ busy: false }))
            .catch( error =>{
                this.setState({ busy: false })
                notify.error("Unable to change password: " + error.toString())
            })
        )
        const change_password = <div>
            <p>
                {/* You <b>must</b> remember... */}
                <Translate content="wallet.remember_auth1"/><br/>
                <Translate content="wallet.remember_auth2"/>
            </p>
            {/* Password, Username */}
            <AuthInput auth={this.props.auth_change} clearOnUnmount={false} />
            
            <div className="center-content">
                {this.state.busy ? <LoadingIndicator type="circle"/> : null }
                <br/>
            </div>
            <button className={cname("button", {disabled: this.state.busy || ! this.props.auth_change.valid }) }  onClick={changePassword.bind(this)}><Translate content="wallet.change_password"/></button>
        </div>
        
        const onRemoteCopy = ()=>
            new Promise( resolve =>{
                this.setState({ busy: true }, ()=> {
                    let p = wallet().keepRemoteCopy( ! wallet().storage.state.get("remote_copy"))
                    .then(()=> this.setState({ busy: false }))
                    .catch( error =>{
                        this.setState({ busy: false })
                        if( error.cause && error.cause.message === "expired") {
                            notify.error(counterpart.translate("wallet.token_expired"))
                            wallet().storage.setState("remote_token", null)
                        }
                        console.error("BackupServer\tERROR", error, "stack", error.stack)
                        throw error
                    })
                    resolve(p)
                })
            })
        
        const loading_indicator = <div className="center-content">
            {this.state.busy ? <LoadingIndicator type="circle"/> : null }
        </div>

        const show_wallet_key = ()=> <div>
            <div>
                {url_token ? <Translate content="wallet.remember_wallet_key"/> : null}
                <br/>
                <pre className="no-overflow">{!WalletDb.isLocked() ? wallet().getTokenSeed() : url_token ? extractSeed(url_token): this.state.key}</pre>
                <br/>
            </div>
        </div>
        
        const show_api_error =this.props.backups.api_error ?
            <Translate content={"wallet." + this.props.backups.api_error}/> : null

        const onRequestCode = e=> {
            e.preventDefault()
            let api = WalletDb.api()
            this.setState({ busy: true }, 
                ()=> api.requestCode(this.props.auth_email.email).then(()=>{
                    api.ws_rpc.close()
                    this.setState({ busy: false })
                    notify.success(counterpart.translate("wallet.token_emailed"))
                })
                .catch( error =>{
                    api.ws_rpc.close()
                    this.setState({ busy: false })
                    notify.error("Unable to request token: " + error.toString())
                })
            )
        }
        
        const emailRestoreKeyBack = e => {
            e.preventDefault()
            this.setState({ email_wallet_key: false })
        }
        const emailRestoreKey = <div>
            {/* E M A I L */}
            <form onSubmit={onRequestCode.bind(this)}>
                <AuthInput auth={this.props.auth_email} clearOnUnmount={false} />
            </form>
            <br/>
            <button 
                className={cname("button success", {disabled: ! this.props.auth_email.email_valid}) }
                onClick={onRequestCode.bind(this)}><Translate content="wallet.email_token" />
            </button>
            <button 
                className={cname("button secondary") }
                onClick={emailRestoreKeyBack.bind(this)}><Translate content="back" />
            </button>
        </div>
        
        const token_request_initial = <div>
            <p><Translate content={"wallet.server_backup_description1"}/></p>
            {/*<div className="error">{counterpart.translate(this.props.backups.api_error)}</div>*/}
            {emailRestoreKey}
            <br/>
            <br/>
            <p><Translate content={"wallet.server_backup_description2"}/></p>
        </div>
        
        const restoreKeyRecover = e =>{
            e.preventDefault()
            this.setState({ email_wallet_key: true })
        }
        const restoreKeyOk = e =>{
            e.preventDefault()
            if(wallet()) wallet().keepRemoteCopy(true)
            this.setState({ wallet_key_entered: true })
        }
        const restoreKeyInvalid = ()=> this.state.key == null || this.state.key.trim() === "" || this.state.key.length !== 4
        const restoreKeyInputChange = e =>{
            e.preventDefault()
            let key = e.target.value
            key = key.trim()
            key = key.substring(0, 4)
            try {
                bs58.decode(key)
                this.setState({ key })
            }catch(e){}
        }
        const restoreKeyInput = <div>
            <label><Translate content="wallet.wallet_key" /></label>
            <div className="center-content">
                <form onSubmit={restoreKeyOk.bind(this)}>
                    <input type="text" ref="restoreKeyInput" value={this.state.key} onChange={restoreKeyInputChange.bind(this)} tabIndex={1}></input>
                    <button className={cname("button", {disabled: restoreKeyInvalid()})} onClick={restoreKeyOk.bind(this)}><Translate content="ok"/></button>
                    <button className="button secondary" onClick={restoreKeyRecover.bind(this)}><Translate content="wallet.email_wallet_key"/></button>
                </form>
            </div>
            <br/>
        </div>
        
        const openWalletErrorMessage = ()=> WalletDb.getState().wallet_names.has(this.state.new_wallet_name) ?
            counterpart.translate("wallet.exists_change_name", { wallet_name: this.state.new_wallet_name}) :
            null
        const openWalletSubmit = e=>{
            e.preventDefault()
            let { server_wallet, private_key, private_api_key, username, password } = this.state
            
            WalletDb.openWallet(this.state.new_wallet_name)
            .then(()=> wallet().saveServerWallet(server_wallet, private_key, private_api_key, Apis.chainId()))
            .then(()=> wallet().keepRemoteCopy(true))
            .then(()=> wallet().login(username, password))
            .catch(error=>{
                let tr_error = counterpart.translate("wallet.backup_status." + error)
                notify.error(tr_error ? counterpart.translate("wallet.restore_error") : tr_error)
                if(error === "chain_id_missmatch")
                    this.setState({ server_wallet: null, private_key: null, private_api_key: null, username: null, password: null })
            })
            .then(()=> this.setState({ busy: false }))
        }
        const openWalletChange = e =>{
            e.preventDefault()
            let value = e.target.value

            value = value.toLowerCase()
            if( /[^a-z0-9_-]/.test(value) ) return
            
            // console.log('current_wallet, wallet_names', current_wallet, wallet_names)
            // var current_wallet = WalletDb.getState().current_wallet
            this.setState({
                new_wallet_name: value,
            })
        }
        const openWallet = <div>
            <label><Translate content="wallet.name" /></label>
            <form onSubmit={openWalletSubmit.bind(this)}>
                <input type="text" value={this.state.new_wallet_name} onChange={openWalletChange.bind(this)}/>
            </form>
            <div className="error">{openWalletErrorMessage()}</div>
            <br/>
            <button
                onClick={openWalletSubmit.bind(this)} 
                className={cname("button", {disabled: !!openWalletErrorMessage()})}>
                <Translate content="ok"/>
            </button>
        </div>
        
        const getApiKey = ()=> {
            let seed = ! WalletDb.isLocked() ? wallet().getTokenSeed() : url_token ? extractSeed(url_token) : null
            if(seed) {
                let [,api_key] = seed.split("\t")
                return api_key
            }
            return this.state.key
        }
        const checkServerDownloadClick = e => {
            e.preventDefault()
            let username = this.props.auth_password.username.toLowerCase().trim()
            let password = this.props.auth_password.password
            let private_key = PrivateKey.fromSeed(username + "\t" + password)
            let private_api_key = PrivateKey.fromSeed(private_key.toWif() + getApiKey())
            let pubkey
            {
                let public_key_api = private_api_key.toPublicKey()
                pubkey = public_key_api.toString(""/*address_prefix*/)
            }
            let api = WalletDb.api()
            let local_hash = null
            this.setState({ busy: true }, ()=>{
                setTimeout(()=> api.fetchWallet(pubkey, local_hash, server_wallet =>{
                    this.setState({ busy: false })
                    api.ws_rpc.close()
                    if(server_wallet.statusText === "No Content")
                        notify.error(counterpart.translate("wallet.not_found"))
                    else if(server_wallet.statusText === "OK") {
                        this.setState({ server_wallet, private_key, private_api_key, username, password })
                    } else
                        console.error("Unknown Response", server_wallet)
                }), 600)
            })
        }
        const checkServerDownload = <div>
            {show_wallet_key()}
            <form onSubmit={checkServerDownloadClick.bind(this)}>
                <AuthInput auth={this.props.auth_password}/>
                <button onClick={checkServerDownloadClick.bind(this)}
                    className={cname("button", {disabled: this.state.busy || ! this.props.auth_password.valid})}>
                    <Translate content="wallet.check_server"/>
                </button>
            </form>
        </div>
        
                // checked={wallet().storage.state.get("remote_copy")}
        // <label><Translate content="wallet().remote_backup"/></label>
        const toggle_backups_form = ()=> <div>
            <button
                className={cname("button success", { disabled: this.state.busy,
                    secondary: ! wallet().storage.state.get("remote_copy") })}
                    onClick={onRemoteCopy.bind(this)}>
                <Translate content={"wallet.server_toggle." +
                    (wallet().storage.state.get("remote_copy") === true ? "enabled" : "disabled")}/>
            </button>
            <br/>
        </div>
        
        const remoteBackupEnable = e => {
            e.preventDefault()
            wallet().keepRemoteCopy(true)
        }
        const remoteBackupStatus = <div>
            <label><Translate content="wallet.remote_status"/></label>
            <Translate content={"wallet.backup_status." + this.props.backups.backup_status}/>
            <br/>
            <br/>
            {this.props.backups.backup_status === "disabled" ? 
                <button className="button" onClick={remoteBackupEnable.bind(this)}>
                    <Translate content="wallet.enable_server_backup"/>
                </button>
            :null}
        </div>
        
        let have_token = 
            this.state.wallet_key_entered ||
            url_token ||
            (!WalletDb.isLocked() && (
                wallet().wallet_object.has("create_token") || 
                wallet().storage.state.has("remote_token")
            ))
        
        let weak_password = ()=> wallet().storage.state.get("weak_password") === true
        let in_sync = ()=> wallet().storage.state.get("remote_copy") === false ||
            wallet().remote_status === "Not Modified"
        
        const body = WalletDb.isLocked() ?
            ! WalletDb.isEmpty() ? <WalletUnlock/> :
            ! have_token ? (this.state.email_wallet_key ? emailRestoreKey : restoreKeyInput ) :
            this.state.server_wallet ? openWallet :
            checkServerDownload
        :
            // backup_wallet
            ! have_token ? token_request_initial :
            weak_password() ? change_password :
            in_sync() ? <div>{toggle_backups_form()}<br/>{show_wallet_key()}</div> :
            remoteBackupStatus
        
                    // <p><Translate content={"wallet.backup_download_description"}/></p>
        return (
            <div className="grid-block vertical medium-horizontal">
                <div className="grid-content full-width-content no-overflow" style={{width: "150px"}}>
                    <h4><Translate content={"wallet.server_backup"}/></h4>
                    <span className="error">{show_api_error}</span>
                    {body}
                    <br/>
                    {loading_indicator}
                    {download_option}
                </div>
            </div>
        )
    }
        
}
// function api_error() {
//     console.log('this.last_api_error, this.props.backups.api_error', this.last_api_error, this.props.backups.api_error)
//     if(this.last_api_error != this.props.backups.api_error) {
//         this.last_api_error = this.props.backups.api_error
//         // don't dispatch during render
//         setTimeout(()=> notify.error(counterpart.translate("wallet." + this.props.backups.api_error)), 100)
//     }
// }

let url_token = null

/** Target for React Route's onEnter event. */
export function readBackupToken(nextState, replaceState) {
    let token = nextState.params.token
    if( ! token )
        return
    
    if( ! validToken(token) )
        throw new Error("invalid_token")
    
    let path = nextState.location.pathname
    path = path.replace(token, "")
    url_token = token
    replaceState(null, path)
    if(WalletDb.getState().wallet)
        WalletDb.getState().wallet.keepRemoteCopy(true, token)

}