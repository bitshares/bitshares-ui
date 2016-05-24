import React, {Component} from "react";
import {RouteHandler, Link} from "react-router";
import connectToStores from "alt/utils/connectToStores";
import WalletManagerStore from "stores/WalletManagerStore";
import BalanceClaimActive from "components/Wallet/BalanceClaimActive";
import Translate from "react-translate-component";

class ExistingAccountBaseComponent extends Component {
    static getStores() {
        return [WalletManagerStore]
    }

    static getPropsFromStores() {
        var wallet = WalletManagerStore.getState()
        return {wallet}
    }
}

@connectToStores
class ExistingAccount extends ExistingAccountBaseComponent {
    render() {
        var has_wallet = this.props.wallet.wallet_names.count() != 0
        return (
            <div className="grid-container">
                <div className="grid-content">
                    <div className="content-block center-content">
                        <div className="page-header">
                            <h1><Translate content="account.welcome" /></h1>
                            {!has_wallet ?
                                <h3><Translate content="wallet.create_wallet_backup" /></h3> :
                                <h3><Translate content="wallet.setup_wallet" /></h3>}
                        </div>
                        <div className="content-block">
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

    render() {
        var has_wallet = this.props.wallet.wallet_names.count() != 0
        return (
            <span>
                {!has_wallet ? <div>
                    <Link to="existing-account/import-backup"><Translate content="wallet.import_backup" /></Link><br/><br/>
                    <Link to="existing-account/import-keys"><Translate content="wallet.import_bts1" /></Link><br/><br/>
                    <Link to="existing-account/import-keys"><Translate content="wallet.create_wallet" /></Link><br/>
                    <hr/>
                </div>:null}

                {!has_wallet ? (null) : <BalanceClaimActive/>}

                {has_wallet ? <span>
                    <Link to="dashboard"><div className="button outline">
                        <Translate component="span" content="header.dashboard" /></div></Link>
                    <Link to="wallet"><div className="button outline">
                        <Translate content="settings.wallets" /></div></Link>
                </span>:null}
            </span>
        )
    }
}

export default ExistingAccount;
