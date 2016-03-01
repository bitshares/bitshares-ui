import React from "react";
import ReactDOM from "react-dom";
import {PropTypes, Component} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import AltContainer from "alt-container"
import cname from "classnames"

import AuthInput from "components/Forms/AuthInput"
import WalletUnlock from "components/Wallet/WalletUnlock"
import VerifyPassword from "components/Wallet/VerifyPassword"
import BackupServerStore from "stores/BackupServerStore"
import { extractSeed } from "@graphene/time-token"
import AuthStore from "stores/AuthStore"
import WalletDb from "stores/WalletDb"
import LoadingIndicator from "components/LoadingIndicator"

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
        this.props.auth.defaults()// <- pickup username from account creation
        this.props.auth.useEmailFromToken()// email change or the 1st email
    }
    
    // componentWillReceiveProps(nextProps) { }
    
    componentWillUnmount() {
        this.props.auth.clear()
    }
    
    componentDidMount() {
        let em = ReactDOM.findDOMNode(this.refs.confirm_email)
        if(em) em.focus()
    }
    
    render() {
        return <WalletUnlock>{ this.render_unlocked() }</WalletUnlock>
    }
    
    render_unlocked() {
        let wallet = this.props.wallet_store.wallet
        const requestCode = ()=> wallet.api.requestCode(this.props.auth.email)
        const weak_password = <div>
            {this.props.auth.email_verified ? <div>
                
                <p>You <b>must</b> remember this information.  This will be<br/>your new password.  Please write it down.</p>
                    
                <AuthInput auth={this.props.auth} weak={false} />
                
                {this.state.busy ? <LoadingIndicator type="circle"/> : null }
                <button className="button" className={ cname({disabled: ! this.state.busy}) }  onClick={this.changePassword.bind(this)}><Translate content="i_agree"/></button>
                
            </div>
            :
                <div>
                    <AuthInput auth={this.props.auth} hasPassword={false} hasUsername={false} hasEmail={true} />
                    <button 
                        className={cname("button", {disabled: ! this.props.auth.email_valid}) }
                        onClick={requestCode.bind(this)}><Translate content="wallet.email_token" />
                    </button>
                </div>
            }
        </div>
        
        const enable_remote_copy = evt => // toggle
            wallet.keepRemoteCopy( ! wallet.storage.state.get("remote_copy"))
        
        return (
            <div className="grid-block vertical medium-horizontal">
                <div className="grid-content full-width-content no-overflow">
                    
                    <h4>Enable Server Backups</h4>
                    
                    {wallet.storage.state.get("weak_password") === false ?  <div>
                        
                        <label><Translate content="wallet.enable_remote_copy"/></label>
                        <input type="checkbox" checked={wallet.storage.state.get("remote_copy")}
                            onClick={enable_remote_copy.bind(this)} />
                        
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
    
    
    changePassword() {
        this.setState({ busy: true }), ()=>(
            this.props.auth.changePassword()
            .then(()=> this.setState({ busy: false }) )
        )
    }
    
    emailForm() {
        let emailChange = event => BackupServerStore.update({ email: event.target.value })
        return <div className={cname("grid-content", "no-overflow", {"has-error": false})}>
            <div className="content-block">
                <Translate component="label" content="wallet.confirm_email" />
                <input type="text" value={this.props.backups.email} onChange={emailChange.bind(this)} autoComplete="on" tabIndex={++global.tabIndex} ref="confirm_email"/>
            </div>
            { this.props.backups.email_valid ? null :
            <p className="grid-content has-error">
                <Translate content={this.props.backups.email_error}/>
            </p>}
        </div>
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
    auth.defaults()
    auth.useEmailFromToken()
}

// class BackupStatus extends Component {
//     render() {
//         return <AltContainer store={ BackupServerStore }>
//             <small><Translate content="wallet.backup.status"/>:</small>
//             <Translate content={"wallet.backup." + this.props.ui_status}/>
//         </AltContainer>
//     }
// }
// 
// class RemoteUrl extends Component {
//     
//     render() {
//         const change = event => BackupServerStore.update({ remote_url: event.target.value })
//         return <div>
//             <input onChange={change.bind(this)}/>
//         </div>
//     }
// }
// 
// class Settings extends Component {
//     render() { return (
//         <div className="grid-block page-layout">
//             <div className="grid-block main-content small-12 medium-10 medium-offset-1 large-6 large-offset-3">
//                 <div className="grid-content">
//                     {this.props.children}
//                 </div>
//             </div>
//         </div>
//     )}
// }
// 
// class Setting extends Component {
//     static propTypes = { header: PropTypes.string }
//     render() { return (
//         <section className="block-list">
//             <header><Translate component="span" content={this.props.header} /></header>
//             {this.props.children}
//         </section>
//     )}
// }