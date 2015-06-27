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
        return <WalletList/>
    
        return <div>
            <RowTop>
                <Column>
                    <label>WALLET</label>
                    {wallet_public_name.toUpperCase()}
                </Column>
                <Column>
                <ul className="menu-bar">
                    <li><Link to="wallet-import" params={{wallet_public_name:wallet_public_name}}>Import</Link>
                    </li>
                </ul>
                </Column>
            </RowTop>
            <Row>
                <RouteHandler wallet_public_name={wallet_public_name} />
            </Row>
        </div>
    }
    
}

class WalletList extends Component {

    render() {
        var wallets = WalletStore.getState().wallets
        return <div>
            <label>WALLETS ({wallets.count()})</label>
            { wallets.map( (wallet, public_name) => {
                return <div>
                    <pre>
                        <Link to="wallet-named" params={{ 
                            wallet_public_name: public_name 
                        }}>
                            {public_name.toUpperCase()}
                        </Link>
                    </pre>
                </div>
            }).toArray()}
            (<Link to="wallet-create">create</Link>)
        </div>
    }
}

// move to new file
class RowTop extends Component {
    render() {
        return <div className="grid-block page-layout transfer-top small-horizontal">
            {this.props.children}
        </div>
    }
}

// move to new file
class Row extends Component {
    render() {
        return <div className="grid-block page-layout transfer-bottom small-horizontal">
            {this.props.children}
        </div>
    }
}

// move to new file
class Column extends Component {
    render() {
        return <div className="grid-block medium-3">
            <div className="grid-content">
                {this.props.children}    
            </div>
        </div>
    }
}

