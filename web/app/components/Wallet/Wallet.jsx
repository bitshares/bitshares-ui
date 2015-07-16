import React, {Component} from "react"

import WalletCreate from "components/Wallet/WalletCreate"
import WalletUnlock from "components/Wallet/WalletUnlock"

export default class Wallet extends Component {

    render() {
        //if( !WalletDb.getWallet()){
        //    this.context.router.transitionTo("create-wallet")
        //    return
        //}
        return <WalletCreate>
            <WalletUnlock>
                <div> {this.props.children} </div>
            </WalletUnlock>
        </WalletCreate>
    }
}
