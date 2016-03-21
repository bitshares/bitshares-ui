import ReactDOM from "react-dom";
import React, {Component} from "react";
import {RouteHandler, Link} from "react-router";
import connectToStores from "alt/utils/connectToStores";
import WalletDb from "stores/WalletDb";
import BalanceClaimActive from "components/Wallet/BalanceClaimActive";
import LoadingIndicator from "components/LoadingIndicator";
// import TokenRequest from "components/Wallet/TokenRequest";
import Translate from "react-translate-component";
import notify from "actions/NotificationActions"
import AuthInput from "components/Forms/AuthInput"
import AuthStore from "stores/AuthStore"
import counterpart from "counterpart"
import cname from "classnames"

let RecoveryAuthStore = AuthStore("Recovery", {weak: false})

class ExistingAccountBaseComponent extends Component {
    static getStores() {
        return [WalletDb, RecoveryAuthStore]
    }

    static getPropsFromStores() {
        var wallet = WalletDb.getState()
        var auth = RecoveryAuthStore.getState()
        return {wallet, auth}
    }
}

@connectToStores
class ExistingAccount extends ExistingAccountBaseComponent {
    
    constructor() {
        super()
        this.state = {}
    }
    
    render() {
        var has_wallet = this.props.wallet.wallet_names.count() != 0
        return (
            <div className="grid-block vertical">
                <div className="grid-content">
                    <div className="content-block center-content">
                        <div className="page-header">
                            <h1><Translate content="account.welcome" /></h1>
                            {!has_wallet ?
                                <h3><Translate content="wallet.create_wallet" /></h3> :
                                <h3><Translate content="wallet.setup_wallet" /></h3>}
                        </div>
                        <div className="content-block" style={{width: '24em'}}>
                            {this.props.children}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}


@connectToStores
export class ExistingAccountOptions extends ExistingAccountBaseComponent {

    constructor() {
        super()
        this.state = { key: null, recover_key: false, server_restore: false, busy: false }
    }
    
    componentDidMount() {
        let r = ReactDOM.findDOMNode(this.refs.restoreKeyInput)
        if(r) r.focus()
    }
    
    render() {
        
        const loading_indicator = <div className="center-content">
            {this.state.busy ? <LoadingIndicator type="circle"/> : null }
        </div>
        
        const serverRestoreClick = e =>{
            e.preventDefault()
            this.setState({ server_restore: true })
        }
            // <a onClick={serverRestoreClick.bind(this)}><Translate content="wallet.restore_from_server" /></a><br/><br/>
        const importLinks = <div>
            <Link to="wallet/backup/server"><Translate content="wallet.restore_from_server" /></Link>
            <br/><br/>
            <Link to="existing-account/import-backup"><Translate content="wallet.import_backup" /></Link>
            <br/><br/>
            <Link to="existing-account/import-keys"><Translate content="wallet.import_bts1" /></Link>
            <br/><br/>
            <Link to="existing-account/import-keys"><Translate content="wallet.create_wallet" /></Link>
            <br/><br/>
        </div>
        
        const otherWalletLinks = <span>
            <Link to="dashboard"><div className="button outline">
                <Translate component="span" content="header.dashboard" /></div></Link>
            <Link to="wallet"><div className="button outline">
                <Translate content="settings.wallets" /></div></Link>
        </span>
        
        //Import your BTS 2.0+ BACKUP first (if you have one)
        const backupImportNotice = <div>
            <h6>
                <Translate content="wallet.import_20_notice1" />
                <br/>
                <Translate content="wallet.import_20_notice2" />
            </h6>
        </div>
        
        // const recoverKeyLinkClick = e =>{
        //     e.preventDefault()
        //     this.setState({ recover_key: true })
        // }
        // const recoverKeyLink = <div>
        //     <label onClick={recoverKeyLinkClick.bind(this)}><Translate content="wallet.recover_wallet_key" /></label>
        //     <br/><br/>
        // </div>
        
                    // {this.state.server_restore ? <div>
                    //     <TokenRequest/>
                    // </div>
                    // :
        var has_wallet = this.props.wallet.wallet_names.count() != 0
        return (
            <span>
                {loading_indicator}
                {has_wallet ? <div>
                    <BalanceClaimActive/>
                    {otherWalletLinks}
                </div>
                :
                <div>
                    <div>
                        {importLinks}
                        <hr/>
                        {backupImportNotice}
                    </div>
                </div>}
            </span>
        )
    }
}

export default ExistingAccount;
