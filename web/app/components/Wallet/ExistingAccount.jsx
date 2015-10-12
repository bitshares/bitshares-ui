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
            <div className="grid-block vertical">
                <div className="grid-container">
                    <div className="content-block center-content">
                        <div className="page-header">
                            <h1><Translate content="account.welcome" /></h1>
                            {!has_wallet ?
                                <h3><Translate content="wallet.create_wallet" /></h3> :
                                <h3><Translate content="wallet.setup_wallet" /></h3>}
                        </div>
                        <div className="content-block">
                            <RouteHandler/>
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
                {!has_wallet ? <span>
                    <Link to="welcome-import-backup">
                    <div className="button success"><Translate content="wallet.import_backup" /></div></Link>

                    <Link to="welcome-import-keys">
                    <div className="button success"><Translate content="wallet.create_wallet" /></div></Link>

                    <hr/>
                </span>:null}

                { has_wallet ? <BalanceClaimActive/>:null}

                {!has_wallet ? <p>
                    <h5><Translate content="wallet.import_20_notice1" /><br/><Translate content="wallet.import_20_notice2" /></h5>
                </p>:null}

                {has_wallet ? <span>
                    <Link to="dashboard"><div className="button success">
                        <Translate component="span" content="header.dashboard" /></div></Link>
                    <Link to="wallet"><div className="button success">
                        <Translate content="settings.wallets" /></div></Link>
                </span>:null}
            </span>
        )
    }
}

export default ExistingAccount;
