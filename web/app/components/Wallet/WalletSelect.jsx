import React, {Component, Link} from 'react'

import WalletCreate from "components/Wallet/WalletCreate"
import WalletStore from "stores/WalletStore"
import Icon from "components/Icon/Icon"

export default class WalletSelect extends Component {

    constructor() {
        super()
        this.wallets = WalletStore.getState().wallets
        this.state = {
            current_wallet: WalletStore.getCurrentWallet()
        }
    }
    
    render() {
        this.unlock = this.props.unlock
        
        //<Link to="create-wallet">Create Wallet</Link>
        if( ! this.wallets.count())
            return <div className="grid-block vertical">
                <div className="grid-content">
                    <label>Wallet Setup Required</label>
                    <div>
                        <a href="/#/create-wallet">Create Wallet</a>
                    </div>
                </div>
            </div>
        
        const CHOICES = this.wallets.map((wallet) => {
            return [wallet.public_name,wallet.public_name]
        }).toArray()
        
        return <div>
            <label>Select Wallet</label>
            <select id='wallet-selector' ref='wallet-selector'
                className="form-control"
                value={this.state.current_wallet}
                onChange={this._onWalletChange.bind(this)}
            >
                {this.wallets.map((wallet) => {
                    return <option value={wallet.public_name}>
                        {wallet.public_name}
                    </option>
                }).toArray()}
            </select>
            { ! WalletStore.isLocked(this.state.current_wallet) ?
            <div>
                <button className="button" onClick={this._lock.bind(this)}>
                    Lock {this.state.current_wallet}
                </button>
            </div>
            :
            <div>
                <label>Unlock Password</label>
                <form onSubmit={this._passSubmit.bind(this)}>
                    <input type="password" onChange={this._passChange.bind(this)}/>
                    <button className="button" onClick={this._passSubmit.bind(this)}>
                        Unlock {this.state.current_wallet}
                    </button>
                </form>
            </div>
            }
        </div>

    }
    
    isSelecedAndUnlocked() {
        return ! WalletStore.isLocked(this.state.current_wallet)
    }
    
    _lock() {
        WalletStore.onLock(this.state.current_wallet)
        this.forceUpdate()
    }
    
    _onWalletChange(e) {
        e.preventDefault()
        this.setState({current_wallet: e.target.value})
    }
    
    _passChange(e) {
        this.password_ui = e.target.value
    }
    
    _passSubmit(e) {
        e.preventDefault()
        var wallet = this.wallets[this.state.current_wallet]
        WalletStore.validatePassword(
            this.state.current_wallet, //wallet_public_name
            this.password_ui || "",//password
            true //unlock
        )
        this.forceUpdate()
    }
}

