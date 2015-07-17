import React, {Component, Link} from 'react'

import Identicon from "components/Account/Identicon"
import AccountStore from "stores/AccountStore"
import WalletDb from "stores/WalletDb"

import alt from "alt-instance"
import connectToStores from 'alt/utils/connectToStores'

class AccountSelect extends Component {

    static getStores() {
        return [accountSelectStore]
    }
    
    static getPropsFromStores() {
        return accountSelectStore.getState()
    }
    
    render() {
        var account_names = this.props.account_names
        var current_account = this.props.current_account
        
        return <div>
            <select id='account-selector' ref='account-selector'
                size={this.props.list_size || 1}
                style={this.props.selectStyle}
                className="form-control"
                value={current_account}
                onChange={this._onAccountChange.bind(this)}
            >
                <option value="" disabled>{
                    this.props.placeholder || "Select Account"
                }</option>
                {account_names.map((account_name) => {
                    if(!account_name || account_name == "")
                        return
                    return <option value={account_name}>{account_name}</option>
                })}
            </select>
        </div>

    }
    //Cannot read property 'getAttribute' of null
    //<Identicon account={current_account} size={
    //            {height: 150, width: 150}
    //        }/>
    _onAccountChange(e) {
        e.preventDefault()
        accountSelectActions.selected(e.target.value)
    }
    
}
AccountSelect = connectToStores(AccountSelect)
export default AccountSelect

AccountSelect.propTypes = {
    account_names: React.PropTypes.array,
    list_size: React.PropTypes.number
    //defaultAccount: React.PropTypes.string
}

export var accountSelectActions =
    alt.generateActions("selected","reset")

class AccountSelectStore {
    constructor() {
        this.bindActions(accountSelectActions)
    }
    onSelected(current_account) {
        this.setState({current_account})
    }
    onReset(){
        this.setState({current_account:null})
    }
}
export var accountSelectStore = alt.createStore(AccountSelectStore)


