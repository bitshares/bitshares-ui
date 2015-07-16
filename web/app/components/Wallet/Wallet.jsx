import React, {Component} from "react"

import WalletDb from "stores/WalletDb"
import WalletCreate from "./WalletCreate"
import WalletUnlock from "./WalletUnlock"

export default class Wallet extends Component {

    render() {
        if( !WalletDb.getWallet()){
            this.context.router.transitionTo("create-wallet")
            return
        }
        return <WalletUnlock relock_button={this.props.relock_button}>
            <div> {this.props.children} </div>
        </WalletUnlock>
    }
}

Wallet.propTypes = {
    relock_button: React.PropTypes.bool
}
