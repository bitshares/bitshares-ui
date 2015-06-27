import React, {Component, RouteHandler} from "react"
import {Link} from "react-router"

//import WalletActions from "actions/WalletActions"
import WalletStore from "stores/WalletStore"
import WalletCreate from './WalletCreate'
import WalletImport from './WalletImport'

export default class Wallet extends Component {

    render() {
        var wallet_public_name = this.props.params.wallet_public_name
        var wallets = WalletStore.getState().wallets
        
        if( ! wallet_public_name)
        return <div>
            <label>WALLETS ({wallets.count()})</label>
            { wallets.map( (wallet, public_name) => {
                return <div>
                    <pre>
                        <Link to="wallet-named" params={{ 
                            wallet_public_name: public_name 
                        }}>
                            {public_name}
                        </Link>
                    </pre>
                </div>
            }).toArray()}
            (<Link to="wallet-create">create</Link>)
        </div>
        //<RouteHandler wallet_public_name={wallet_public_name} />
        console.log('... wallet_public_name',wallet_public_name)
        return <div>
        <label>{wallet_public_name}</label>
            
        </div>
    }
    
}

class WalletList extends Component {

    render() {
        var wallets = WalletStore.getState().wallets
        
    }
}
