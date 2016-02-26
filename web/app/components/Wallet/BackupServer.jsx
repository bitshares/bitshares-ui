import React from "react";
import ReactDOM from "react-dom";
import {PropTypes, Component} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import AltContainer from "alt-container"
import cname from "classnames"

// import AuthInput from "components/Forms/AuthInput"
import BackupServerStore from "stores/BackupServerStore"
import WalletDb from "stores/WalletDb"

global.tabIndex = global.tabIndex || 0

export default class Atl extends Component {
    render() {
        return (
            <AltContainer stores={{ backups: BackupServerStore, wallet_store: WalletDb }}>
                <BackupServer/>
            </AltContainer>
        )
    }
}

class BackupServer extends Component {
    
    static propTypes = {
    }
    
    static defaultProps = {
    }
    
    constructor() {
        super()
    }
    
    render() {
        const requestCode = ()=>
            this.props.wallet_store.wallet.api.requestCode(this.props.backups.email)
        
        return (
            <div>
                <div>
                    <h4><Translate content="wallet.server_backup"/></h4>
                    {this.emailForm()}
                    <button 
                        className={cname("button", {disabled: ! this.props.backups.email_valid}) }
                        onClick={requestCode.bind(this)}><Translate content="wallet.confirm_email" />
                    </button>
                </div>
                <br/>
                <br/>
                <Link to="wallet/backup/create"><label className="inline">
                    <Translate content="wallet.local_backup"/>
                </label></Link>
            </div>
        )
    }
    
    componentDidMount() {
        ReactDOM.findDOMNode(this.refs.confirm_email).focus()
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

class BackupStatus extends Component {
    render() {
        return <AltContainer store={ BackupServerStore }>
            <small><Translate content="wallet.backup.status"/>:</small>
            <Translate content={"wallet.backup." + this.props.ui_status}/>
        </AltContainer>
    }
}

class RemoteUrl extends Component {
    
    render() {
        const change = event => BackupServerStore.update({ remote_url: event.target.value })
        return <div>
            <input onChange={change.bind(this)}/>
        </div>
    }
}

class Settings extends Component {
    render() { return (
        <div className="grid-block page-layout">
            <div className="grid-block main-content small-12 medium-10 medium-offset-1 large-6 large-offset-3">
                <div className="grid-content">
                    {this.props.children}
                </div>
            </div>
        </div>
    )}
}

class Setting extends Component {
    static propTypes = { header: PropTypes.string }
    render() { return (
        <section className="block-list">
            <header><Translate component="span" content={this.props.header} /></header>
            {this.props.children}
        </section>
    )}
}