import React, {Component} from "react";
import {RouteHandler, Link} from "react-router"
import connectToStores from "alt/utils/connectToStores"
import WalletManagerStore from "stores/WalletManagerStore"
import BalanceClaimActive from "components/Wallet/BalanceClaimActive"

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
                            <h1>Welcome to Graphene</h1>
                            {!has_wallet ?
                                <h3>Create a new wallet</h3>:
                                <h3>Setup your wallet</h3>}
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
                {!has_wallet ? <Link to="welcome-import-backup">
                <div className="button success">Import Backup</div></Link>:null}
                
                <Link to="welcome-import-keys">
                <div className="button success">Import Keys</div></Link>
                
                {/*<Link to="welcome-provide-brainkey">
                <div className="button success">Provide Brainkey</div></Link>*/}
                
                <BalanceClaimActive/>
                
                {!has_wallet ? <p>
                    <h5>Import your BTS 2.0+ BACKUP first<br/>(if you have one)</h5>
                </p>:null}
            </span>
        )
    }
}

export default ExistingAccount;
