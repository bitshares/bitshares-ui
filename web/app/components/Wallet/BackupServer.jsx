import React from "react";
import ReactDOM from "react-dom";
import {PropTypes, Component} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import AltContainer from "alt-container"
import counterpart from "counterpart"
import cname from "classnames"

import AuthInput from "components/Forms/AuthInput"
import WalletUnlock from "components/Wallet/WalletUnlock"
import VerifyPassword from "components/Wallet/VerifyPassword"
import BackupServerStore from "stores/BackupServerStore"
import { validToken } from "@graphene/time-token"
import AuthStore from "stores/AuthStore"
import WalletDb from "stores/WalletDb"
import LoadingIndicator from "components/LoadingIndicator"
import notify from "actions/NotificationActions"

global.tabIndex = global.tabIndex || 0

let AuthEmail = AuthStore("Email", {hasEmail: true, hasPassword: false, hasUsername: false})
let AuthChange = AuthStore("AuthChange", {weak: false, hasConfirm: true})

export default class Atl extends Component {
    render() {
        return (
            <AltContainer stores={{
                    backups: BackupServerStore,
                    wallet_store: WalletDb,
                    auth_email: AuthEmail,
                    auth_change: AuthChange }}>
                <BackupServer/>
            </AltContainer>
        )
    }
}

class BackupServer extends Component {
    
    constructor() {
        super()
        this.state = { busy: false }
    }
    
    componentWillMount() {
        // this.props.auth_email.defaults()// <- pickup username from account creation
    }
    
    // componentWillReceiveProps(nextProps) { }
    
    componentWillUnmount() {
        this.props.auth_email.clear()
    }
    
    componentDidMount() {
        let em = ReactDOM.findDOMNode(this.refs.confirm_email)
        if(em) em.focus()
        // this.props.auth_email.useEmailFromToken()// email change or the 1st email
    }
    
    render() {
        return <WalletUnlock>{ this.render_unlocked() }</WalletUnlock>
    }
    
    render_unlocked() {
        
        let wallet = WalletDb.getState().wallet
        
        let connected = wallet.api && wallet.api.ws_rpc.status === "open"
        if( ! connected )
            return <div className="error">Not connected to the backup server</div>
        
        const onRequestCode = e=> {
            e.preventDefault()
            this.setState({ busy: true }, 
                ()=> wallet.api.requestCode(this.props.auth_email.email).then(()=>{
                    this.setState({ busy: false })
                    notify.success(counterpart.translate("wallet.token_emailed"))
                })
                .catch( error =>{
                    this.setState({ busy: false })
                    notify.error("Unable to request token: " + error.toString())
                })
            )
        }
        const token_request_form = <div>
            {/* E M A I L */}
            <form onSubmit={onRequestCode.bind(this)}>
                <AuthInput auth={this.props.auth_email} clearOnUnmount={false} />
            </form>
            <div className="center-content">
                 {this.state.busy ? <LoadingIndicator type="circle"/> : null }
                 <br/>
            </div>
            <button 
                className={cname("button success", {disabled: ! this.props.auth_email.email_valid}) }
                onClick={onRequestCode.bind(this)}><Translate content="wallet.email_token" />
            </button>
        </div>
        
        
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
                <Translate content="wallet.remember_auth1"/><br/>
                <Translate content="wallet.remember_auth2"/>
            </p>{/* You <b>must</b> remember... */}
                
            {/* Password, Username */}
            <AuthInput auth={this.props.auth_change} clearOnUnmount={false} />
            
             <div className="center-content">
                 {this.state.busy ? <LoadingIndicator type="circle"/> : null }
                 <br/>
             </div>
            
            <button className={cname("button", {disabled: this.state.busy || ! this.props.auth_change.valid }) }  onClick={changePassword.bind(this)}><Translate content="wallet.change_password"/></button>
        </div>
        
        const download_option = ! WalletDb.isEmpty() ? <div><br/><Link to="wallet/backup/download">
            <label className="secondary"><Translate content="wallet.download_backup" /></label></Link></div> : null
        
        const onRemoteCopy = ()=>
            wallet.keepRemoteCopy( ! wallet.storage.state.get("remote_copy"))
            .then(()=> this.setState({ busy: false }))
            .catch( error =>{
                this.setState({ busy: false })
                if( error.cause && error.cause.message === "expired") {
                    notify.error(counterpart.translate("wallet.token_expired"))
                    wallet.storage.setState("remote_token", null)
                }
                console.error("BackupServer\tERROR", error)
                throw error
            })
        
        const toggle_backups_form = <div>
            <label><Translate content="wallet.remote_backup"/></label>
            <p>
                <input type="checkbox"
                    className={cname({ disabled: this.state.busy })}
                    checked={wallet.storage.state.get("remote_copy")}
                    onChange={onRemoteCopy.bind(this)} />
                &nbsp;
                <Translate content={"wallet.server_toggle." +
                    (wallet.storage.state.get("remote_copy") === true ? "enabled" : "disabled")}/>
            </p>
            <div className="center-content">
                {this.state.busy ? <LoadingIndicator type="circle"/> : null }
            </div>
            <br/>
        </div>

        const show_restore_key = <div>
            <p>
                <Translate content="wallet.remember_restore_key"/>
                <pre className="no-overflow">{wallet.getTokenSeed()}</pre>
            </p>
        </div>
        
        const show_api_error = <div>
            <Translate content={"wallet.backup_status." + this.props.backups.api_error}/>
        </div>
        
        const show_remote_status = <div>
            <label><Translate content="wallet.remote_status"/></label>
            <Translate content={"wallet.backup_status." + this.props.backups.backup_status}/>
            {this.props.backups.api_error ? ` (${show_api_error})` : null}
        </div>
        
        // return <div/>
        let need_token =
            ! wallet.wallet_object.has("create_token") &&
            ! validToken(wallet.storage.state.get("remote_token"))// request another
        
        let weak_password = wallet.storage.state.get("weak_password") === true
        let in_sync = wallet.storage.state.get("remote_copy") === false ||
            wallet.storage.state.get("remote_status") === "Not Modified"
        
        const body = <div>{
            need_token ? token_request_form :
            weak_password ? change_password :
            in_sync ? <div>{toggle_backups_form} {show_restore_key}</div> :
            show_remote_status
        }</div>
        
        return (
            <div className="grid-block vertical medium-horizontal">
                <div className="grid-content full-width-content no-overflow">
                    <h4><Translate content={"wallet.server_backup"}/></h4>
                    <br/>{body}
                    <hr/>{download_option}
                </div>
            </div>
        )
    }
        
}

/** Target for React Route's onEnter event. */
export function readBackupToken(nextState, replaceState) {
    let token = nextState.params.token
    if( ! token )
        return
    
    let path = nextState.location.pathname
    path = path.replace(token, "")
    replaceState(null, path)
    let { wallet } = WalletDb.getState()
    if( ! wallet ) {
        console.error("BackupServer\tERROR Token parameter but no wallet");
        return
    }
    wallet.keepRemoteCopy(true, token)
}