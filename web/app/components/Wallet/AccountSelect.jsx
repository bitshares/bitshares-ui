import React, {Component, Link} from 'react'

import AccountImage from "../Account/AccountImage"
import AccountStore from "stores/AccountStore"
import WalletDb from "stores/WalletDb"

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
            <WalletUnlock ref="wallet-unlock"/>
            
            <AccountImage id="abc" accounmt="abc" size={
                {height: 150, width: 150}}/>
            
        </div>

    }
    
    _onAccountChange(e) {
        e.preventDefault()
        this.setState({current_account: e.target.value})
    }
    
    
}

