import React, {Component} from "react";
import {Link, RouteHandler} from "react-router"
import connectToStores from "alt/utils/connectToStores"
import WalletActions from "actions/WalletActions"
import WalletCreate from "components/Wallet/WalletCreate";
import WalletManagerStore from "stores/WalletManagerStore"
import BalanceClaim from "components/Wallet/BalanceClaim"

class WalletBaseComponent extends Component {
    
    static getStores() {
        return [WalletManagerStore]
    }
    
    static getPropsFromStores() {
        var wallet = WalletManagerStore.getState()
        return wallet
    }
    
}

@connectToStores
export default class WalletManager extends WalletBaseComponent {

    render() {
        return (
            <div className="grid-block vertical">
                <div className="grid-container">
                    <div className="content-block center-content">
                        <div className="page-header">
                            <h3>Wallet Management Console</h3>
                        </div>
                        <div className="content-block">
                            <RouteHandler/>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

@connectToStores
export class WalletOptions extends WalletBaseComponent {

    render() {
        var has_wallet = !!this.props.current_wallet
        var has_wallets = this.props.wallet_names.count() != 0
        return <span>
                
            {has_wallets ? <span>
            <h5>Active Wallet</h5>
            <ChangeActiveWallet/>
            <hr/>
            </span>:null}
            
            {has_wallet ? <Link to="wmc-backup-create">
            <div className="button success">Create Backup</div></Link>:null}
            
            <Link to="wmc-backup-verify-restore">
            <div className="button success">Verify Restore Backup</div></Link>
            
            {has_wallet ? <Link to="wmc-import-keys">
            <div className="button success">Import Keys</div></Link>:null}
            
            {/*<Link to="wmc-brainkey">
            <div className="button success">Brainkey</div></Link>*/}
            
            <Link to="wmc-wallet-create">
            <div className="button success">Create Wallet</div></Link>
            
            <BalanceClaim/>
            
        </span>
    }

}

@connectToStores
export class ChangeActiveWallet extends WalletBaseComponent {
    
    constructor() {
        super()
        this.state = { }
    }
    
    componentWillMount() {
        var current_wallet = this.props.current_wallet
        this.setState({current_wallet})
    }
    
    render() {
        var state = WalletManagerStore.getState()
        if(state.wallet_names.count() === 1)
            return <label>{this.state.current_wallet}</label>
        
        var options = []
        state.wallet_names.forEach( wallet_name => {
            options.push(<option value={wallet_name}>{wallet_name.toUpperCase()}</option>)
        })
        
        var is_dirty = this.state.current_wallet !== this.props.current_wallet
        
        return <span>
            <select value={this.state.current_wallet} onChange={this.onChange.bind(this)}>
                { options }
            </select>
            { is_dirty ? <div className="button success"
                onClick={this.onConfirm.bind(this)}>Change ({this.state.current_wallet} Wallet)</div> :null}
        </span>
    }
    
    onConfirm() {
        WalletActions.setWallet(this.state.current_wallet)
    }
    
    onChange(event) {
        var current_wallet = event.target.value
        this.setState({current_wallet})
    }
    
}