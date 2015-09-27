import React from "react";
import counterpart from "counterpart";

export default class AccountSelect extends React.Component {

    static propTypes = {
        account_names: React.PropTypes.array,
        list_size: React.PropTypes.number,
        onChange: React.PropTypes.func,
        placeholder: React.PropTypes.string,
        center: React.PropTypes.bool
        //defaultAccount: React.PropTypes.string
    }
    
    constructor(props) {
        super(props);
        this.state = {selected: null};
        this.default_placeholder = counterpart.translate("account.select_placeholder");
    }

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.selected !== this.props.selected ||
            nextProps.list_size !== this.props.list_size ||
            nextProps.placeholder !== this.props.placeholder ||
            nextProps.account_names !== this.props.account_names
        );
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
        var placeholder = this.props.placeholder || this.default_placeholder;
        var ikey
        if (this.props.list_size > 1) {
            placeholder = <option value="" disabled>{placeholder}</option>;
        }
        else {
            //When disabled and list_size was 1, chrome was skipping the 
            //placeholder and selecting the 1st item automatically (not shown)
            placeholder = <option value="">{placeholder}</option>;
        }
        return (
            <select
                ref='account-selector'
                key={selected_account}
                defaultValue={selected_account}
                className="form-control account-select"
                onChange={this._onAccountChange.bind(this)}
                style={this.props.center?{margin: '0 auto'}:null}
            >
                {placeholder}
                {account_names
                    .sort()
                    .map((account_name) => {
                        if (!account_name || account_name === "") {return null; }
                        return <option value={account_name}>{account_name}</option>;
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
        var placeholder = this.props.placeholder || this.default_placeholder;
        if (value === placeholder) {
            value = null;
        }
        this.state.selected = value;
        if (this.props.onChange) {
            this.props.onChange(value);
        }
    }
    
}
