import React, {Component, Link} from 'react';
//import Identicon from "components/Account/Identicon"

class AccountSelect extends Component {

    constructor(props) {
        super(props);
        this.state = {selected: null};
    }

    value() {
        return this.state.selected;
    }

    reset() {
        this.setState({selected: null});
    }
    
    render() {
        var account_names = this.props.account_names;
        var selected_account = this.props.selected;
        
        return <div>
            <select id='account-selector' ref='account-selector'
                size={this.props.list_size || 1}
                className="form-control"
                value={selected_account}
                onChange={this._onAccountChange.bind(this)}
            >
                <option value="" disabled>{
                    this.props.placeholder || "Select Account"
                }</option>
                {account_names.map((account_name) => {
                    if(!account_name || account_name == "") return null;
                    return <option value={account_name}>{account_name}</option>
                })}
            </select>
        </div>;

    }
    //Cannot read property 'getAttribute' of null
    //<Identicon account={current_account} size={
    //            {height: 150, width: 150}
    //        }/>
    _onAccountChange(e) {
        e.preventDefault();
        let value = e.target.value;
        this.state.selected = value
        if(this.props.onChange) this.props.onChange(value);
    }
    
}

AccountSelect.propTypes = {
    account_names: React.PropTypes.array,
    list_size: React.PropTypes.number,
    onChange: React.PropTypes.func
    //defaultAccount: React.PropTypes.string
};

export default AccountSelect;
