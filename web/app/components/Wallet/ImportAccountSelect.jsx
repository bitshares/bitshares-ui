import React, {Component, Link} from 'react'

import Identicon from "components/Account/Identicon"
import AccountStore from "stores/AccountStore"
import WalletDb from "stores/WalletDb"

import alt from "alt-instance"
import connectToStores from 'alt/utils/connectToStores'

class ImportAccountSelect extends Component {

    constructor(props) {
        super(props)
        var selected = this.props.account_names.length ?
            this.props.account_names[0] : null
        this.state = {selected}
    }

    static getStores() {
        return [accountSelectStore]
    }
    
    static getPropsFromStores() {
        return accountSelectStore.getState()
    }

    value() {
        return this.state.selected
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
        this.state.selected = e.target.value
        accountSelectActions.selected(e.target.value)
    }
    
}
//ImportAccountSelect = connectToStores(ImportAccountSelect)
export default ImportAccountSelect

ImportAccountSelect.propTypes = {
    account_names: React.PropTypes.array,
    list_size: React.PropTypes.number
    //defaultAccount: React.PropTypes.string
}

export var accountSelectActions =
    alt.generateActions("selected","reset")

class ImportAccountSelectStore {
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
export var accountSelectStore = alt.createStore(ImportAccountSelectStore)
