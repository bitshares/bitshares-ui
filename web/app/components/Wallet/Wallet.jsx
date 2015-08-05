import React from "react";

import WalletCreate from "components/Wallet/WalletCreate";

export default class Wallet extends React.Component {

    render() {
        //if( !WalletDb.getWallet()){
        //    this.context.router.transitionTo("create-wallet")
        //    return
        //}
        return (
            <WalletCreate>
                {this.props.children}
            </WalletCreate>
        );
    }
}
