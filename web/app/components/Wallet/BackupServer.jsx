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
import { extractSeed } from "@graphene/time-token"
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
        
        let wallet = this.props.wallet_store.wallet

        const requestCode = ()=> this.setState({ busy: true },
            ()=> wallet.api.requestCode(this.props.auth_email.email)
            .then(()=> this.setState({ busy: false }))
            .catch( error =>{
                this.setState({ busy: false })
                notify.error("Unable to request token: " + error.toString())
            })
        )
        const email_token = <div>
            {/* E M A I L */}
            <AuthInput auth={this.props.auth_email} clearOnUnmount={false} />
             <div className="center-content">
                 {this.state.busy ? <LoadingIndicator type="circle"/> : null }
                 <br/>
             </div>
            <button 
                className={cname("button success", {disabled: ! this.props.auth_email.email_valid}) }
                onClick={requestCode.bind(this)}><Translate content="wallet.email_token" />
            </button>
        </div>
        
        const changePassword = ()=> this.setState({ busy: true },
            ()=> this.props.auth_email.changePassword()
            .then(()=> this.setState({ busy: false }))
            .catch( error =>{
                this.setState({ busy: false })
                notify.error("Unable to change password: " + error.toString())
            })
        )
        const change_password = <div>
            <p><Translate content="wallet.remember_auth"/></p>{/* You <b>must</b> remember... */}
                
            {/* Password, Username */}
            <AuthInput auth={this.props.auth_change} clearOnUnmount={false} />
            
             <div className="center-content">
                 {this.state.busy ? <LoadingIndicator type="circle"/> : null }
                 <br/>
             </div>
            
            <button className={cname("button", {disabled: this.state.busy || ! this.props.auth_email.valid }) }  onClick={changePassword.bind(this)}><Translate content="i_agree"/></button>
        </div>
        
        const download_option = ! WalletDb.isEmpty() ? <div><br/><Link to="wallet/backup/download">
            <label className="secondary"><Translate content="wallet.download_backup" /></label></Link></div> : null
        
        const weak_password = <div>
            { ! this.props.auth_email.email_verified ? <div>
                { email_token }
                { download_option }
            </div>
            :
            <div>
                { change_password }
            </div>
            }
        </div>
        
        const remote_copy_toggle = ()=>
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
        
        return (
            <div className="grid-block vertical medium-horizontal">
                <div className="grid-content full-width-content no-overflow">
                    
                    <h4>Enable Server Backups</h4>
                    
                    {wallet.storage.state.get("weak_password") === false ?  <div>
                        
                        <label><Translate content="wallet.remote_copy"/></label>
                        
                        <input type="checkbox"
                            className={cname({ disabled: this.state.busy })}
                            checked={wallet.storage.state.get("remote_copy")}
                            onChange={remote_copy_toggle.bind(this)} />
                        &nbsp;
                        <Translate content={"wallet." + this.props.backups.ui_status}/>
                    
                        <div className="center-content">
                            {this.state.busy ? <LoadingIndicator type="circle"/> : null }
                            <br/>
                        </div>
                    </div> : weak_password }
                </div>
                <br/>
                <br/>
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
    if( ! wallet )
        console.error("BackupServer\tERROR Token parameter but their is no wallet");
    
    wallet.keepRemoteCopy(true, token)
    // let auth = BackupAuthStore.getState()
    // auth.defaults()
    // auth.useEmailFromToken()
}