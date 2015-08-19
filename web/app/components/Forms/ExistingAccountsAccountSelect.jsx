import React, {Component, Link} from 'react';
//import Identicon from "components/Account/Identicon"

import cname from "classnames"

class ExistingAccountsAccountSelect extends Component {

    constructor(props) {
        super(props);
        this.state = {selected: null};
        this.default_placeholder = "Select Account..."
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
        var placeholder = this.props.placeholder || this.default_placeholder
        if(this.props.list_size > 1)
            placeholder = <option value="" disabled>{placeholder}</option>
        else
            //When disabled and list_size was 1, chrome was skipping the 
            //placeholder and selecting the 1st item automatically (not shown)
            placeholder = <option value="">{placeholder}</option>
        
        return (
            <select
                key={selected_account}
                value={selected_account}
                size={this.props.list_size}
                className="form-control existing-accounts-select"
                onChange={this._onAccountChange.bind(this)}
                style={{backgroundImage: 'none'}}
            >
                {placeholder}
                {account_names
                    .sort()
                    .map((account_name) => {
                    if(!account_name || account_name == "") return null;
                    return <option key={account_name} value={account_name}>{account_name}</option>
                })}
            </select>
        );
        //Cannot read property 'getAttribute' of null
        //<Identicon account={current_account} size={
        //            {height: 150, width: 150}
        //        }/>
    }
    
    _onAccountChange(e) {
        //DEBUG console.log('... _onAccountChange',e.target.value)
        e.preventDefault();
        let value = e.target.value;
        var placeholder = this.props.placeholder || this.default_placeholder
        if(value == placeholder)
            value = null
        this.state.selected = value
        if(this.props.onChange)
            this.props.onChange(value);
    }
    
}

ExistingAccountsAccountSelect.propTypes = {
    account_names: React.PropTypes.array,
    list_size: React.PropTypes.number,
    onChange: React.PropTypes.func,
    placeholder: React.PropTypes.string
    //defaultAccount: React.PropTypes.string
};

export default ExistingAccountsAccountSelect;
