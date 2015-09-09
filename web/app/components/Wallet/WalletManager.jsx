import React, {Component} from "react";
import {Link} from "react-router"
import connectToStores from "alt/utils/connectToStores"
import WalletActions from "actions/WalletActions"
import WalletCreate from "components/Wallet/WalletCreate";
import WalletManagerStore from "stores/WalletManagerStore"

export default class WalletManager extends Component {

    render() {
        var has_wallet = !!WalletManagerStore.getState().current_wallet
        return <div className="grid-block vertical full-width-content">
            <div className="grid-content shrink no-overflow-padding">
                
            <h3>Wallet Management Console</h3>
            
            <h5>Active Wallet</h5>
            <ChangeActiveWallet/>
            
            <hr/>
            
            <Link to="create-wallet">
            <div className="button success">Create Wallet</div></Link>
            
            {has_wallet ? <Link to="backup-create">
            <div className="button success">Create Backup</div></Link>:null}
            
            <Link to="backup-verify">
            <div className="button success">Verify Prior Backup</div></Link>
            
            <Link to="backup-restore">
            <div className="button success">Import Backup</div></Link>
            
            <Link to="existing-account">
            <div className="button success">Import Keys</div></Link>
            
        </div></div>
    }

}

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
export class ChangeActiveWallet extends WalletBaseComponent {
    
    constructor() {
        super()
        this.state = { }
    }
    
    componentWillMount() {
        var current_wallet = WalletManagerStore.getState().current_wallet
        console.log("... current_wallet", current_wallet)
        this.setState({current_wallet})
    }
    
    render() {
        var state = WalletManagerStore.getState()
        if(state.wallet_names.size === 1)
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