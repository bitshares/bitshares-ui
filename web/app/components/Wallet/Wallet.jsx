import React from "react";

import WalletCreate from "components/Wallet/WalletCreate";
import WalletUnlock from "components/Wallet/WalletUnlock";

export default class Wallet extends React.Component {

    render() {
        //if( !WalletDb.getWallet()){
        //    this.context.router.transitionTo("create-wallet")
        //    return
        //}
        return (
            <WalletCreate>
                <WalletUnlock>
                    {this.props.children}
                </WalletUnlock>
            </WalletCreate>
        );
    }
}
