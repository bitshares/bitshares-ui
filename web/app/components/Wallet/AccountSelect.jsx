import React, {Component, Link} from 'react'

import AccountImage from "../Account/AccountImage"
import AccountStore from "stores/AccountStore"
import WalletDb from "stores/WalletDb"
import Icon from "components/Icon/Icon"

export default class AccountSelect extends Component {

    constructor() {
        super()
        var store = AccountStore.getState()
        this.accounts = store.linkedAccounts
        this.state = {
            current_account: store.currentAccount ?
                store.currentAccount.name : null
        }
    }
    
    render() {
        if( ! this.accounts.count())
            return <div className="grid-block vertical">
                <div className="grid-content">
                    <label>Account Setup Required</label>
                    <div>
                        <a href="/#/create-account">Create Account</a>
                    </div>
                </div>
            </div>
        
        return <div>
            <label>Select Account</label>
            <select id='account-selector' ref='account-selector'
                className="form-control"
                value={this.state.current_account}
                onChange={this._onAccountChange.bind(this)}
            >
                {this.accounts.map((account) => {
                    return <option value={account}> {account} </option>
                }).toArray()}
            </select>
            { ! WalletDb.isLocked() ?
            <div>
                <button className="button" onClick={this._lock.bind(this)}>
                    Lock Wallet
                </button>
            </div>
            :
            <div>
                <label>Wallet</label>
                <form onSubmit={this._passSubmit.bind(this)}>
                    <input type="password" placeholder="password"
                        onChange={this._passChange.bind(this)}/>
                    <button className="button" onClick={this._passSubmit.bind(this)}>
                        Unlock
                    </button>
                </form>
            </div>
            }
            
            <AccountImage id="abc" accounmt="abc" size={
                {height: 150, width: 150}}/>
            
        </div>

    }
    
    isSelecedAndUnlocked() {
        return ! WalletDb.isLocked()
    }
    
    _lock() {
        WalletDb.onLock(this.state.current_account)
        this.forceUpdate()
    }
    
    _onAccountChange(e) {
        e.preventDefault()
        this.setState({current_account: e.target.value})
    }
    
    _passChange(e) {
        this.password_ui = e.target.value
    }
    
    _passSubmit(e) {
        e.preventDefault()
        var account = this.accounts[this.state.current_account]
        WalletDb.validatePassword(
            this.password_ui || "",
            true //unlock
        )
        this.forceUpdate()
    }
}

