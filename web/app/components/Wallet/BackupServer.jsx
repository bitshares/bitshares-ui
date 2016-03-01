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

let BackupAuthStore = AuthStore("Backup")

export default class Atl extends Component {
    render() {
        return (
            <AltContainer stores={{ backups: BackupServerStore, wallet_store: WalletDb, auth: BackupAuthStore }}>
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
        // this.props.auth.defaults()// <- pickup username from account creation
    }
    
    // componentWillReceiveProps(nextProps) { }
    
    componentWillUnmount() {
        this.props.auth.clear()
    }
    
    componentDidMount() {
        let em = ReactDOM.findDOMNode(this.refs.confirm_email)
        if(em) em.focus()
        this.props.auth.useEmailFromToken()// email change or the 1st email
    }
    
    render() {
        return <WalletUnlock>{ this.render_unlocked() }</WalletUnlock>
    }
    
    render_unlocked() {
        
        let wallet = this.props.wallet_store.wallet
        
        const requestCode = ()=> this.setState({ busy: true },
            ()=> wallet.api.requestCode(this.props.auth.email)
            .then(()=> this.setState({ busy: false }))
            .catch( error =>{
                this.setState({ busy: false })
                notify.error("Unable to request token: " + error.toString())
            })
        )
        
        const changePassword = ()=> this.setState({ busy: true },
            ()=> this.props.auth.changePassword()
            .then(()=> this.setState({ busy: false }))
            .catch( error =>{
                this.setState({ busy: false })
                notify.error("Unable to change password: " + error.toString())
            })
        )
        
        const weak_password = <div>
            {this.props.auth.email_verified ? <div>
                
                <p><Translate content="wallet.remember_auth"/></p>{/* You <b>must</b> remember... */}
                    
                {/* Password, Email, Username */}
                <AuthInput auth={this.props.auth} clearOnUnmount={false} />
                
                 <div className="center-content">
                     {this.state.busy ? <LoadingIndicator type="circle"/> : null }
                     <br/>
                 </div>
                
                <button className={cname("button", {disabled: this.state.busy || ! this.props.auth.valid }) }  onClick={changePassword.bind(this)}><Translate content="i_agree"/></button>
                
            </div>
            :
                <div>
                    
                    {/* E M A I L */}
                    <AuthInput auth={this.props.auth} clearOnUnmount={false} />
                     <div className="center-content">
                         {this.state.busy ? <LoadingIndicator type="circle"/> : null }
                         <br/>
                     </div>
                    <button 
                        className={cname("button", {disabled: ! this.props.auth.email_valid}) }
                        onClick={requestCode.bind(this)}><Translate content="wallet.email_token" />
                    </button>
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
                {/*<Link to="wallet/backup/create"><label className="inline">
                    <Translate content="wallet.local_backup"/>
                </label></Link>*/}
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
    
    wallet.keepRemoteCopy(null/*Leave remote copy (yes, no) unchanged*/, token)
    let auth = BackupAuthStore.getState()
    // auth.defaults()
    auth.useEmailFromToken()
}