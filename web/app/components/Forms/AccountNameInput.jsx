import React from "react";
import {PropTypes, Component} from "react";
import classNames from "classnames";
import AccountStore from "stores/AccountStore";

class AccountNameInput extends Component {

    constructor() {
        super();
        this.handleChange = this.handleChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.state = {error: null, existing_account: false};
    }

    value() {
        return React.findDOMNode(this.refs.input).value;
    }

    setValue(value) {
        return React.findDOMNode(this.refs.input).value = value;
    }

    clear() {
        React.findDOMNode(this.refs.input).value = "";
    }

    focus() {
        React.findDOMNode(this.refs.input).focus();
    }

    valid() {
        return !this.state.error;
    }

    validateAndGetError(value) {
        if (value && !(/^[a-z]+(?:[a-z0-9\-\.])*$/.test(value) && /[a-z0-9]$/.test(value))) {
            return "Account name can only contain lowercase alphanumeric characters, dots, and dashes.\nMust start with a letter and cannot end with a dash.";
        }
        if (this.props.accountShouldExist || this.props.accountShouldNotExist) {
            let account_name_to_id = AccountStore.getState().account_name_to_id;
            let account_id = account_name_to_id[value];
            console.log("[AccountNameInput.jsx:47] ----- validateAndGetError ----->", account_id);
            if(this.props.accountShouldNotExist && account_id) {
                return "Account name is already taken."
            }
            if(this.props.accountShouldExist && !account_id) {
                return "Account not found."
            }
        }
        return null;
    }

    handleChange(e) {
        e.preventDefault();
        e.stopPropagation();
        this.state.error = this.validateAndGetError(e.target.value);
        this.setState({error: this.state.error});
        if (this.props.onChange) this.props.onChange(e);
    }

    onKeyDown(e) {
        if(this.props.onEnter && event.keyCode === 13) this.props.onEnter(e);
    }

    render() {
        let error = null;
        if(this.state.error) {
            error = <div>{this.state.error}</div>;
        }
        let class_name = classNames("form-group", "account-name", {"has-error": this.state.error});
        return (
            <div className={class_name}>
                <label>Account Name</label>
                <input name="value" type="text" id={this.props.id} ref="input"
                       placeholder={this.props.placeholder} defaultValue={this.props.initial_value}
                       onChange={this.handleChange} onKeyDown={this.onKeyDown}/>
                {error}
            </div>
        );
    }
}

AccountNameInput.propTypes = {
    id: PropTypes.string,
    placeholder: PropTypes.string,
    initial_value: PropTypes.string,
    onChange: PropTypes.func,
    onEnter: PropTypes.func,
    accountShouldExist: PropTypes.bool,
    accountShouldNotExist: PropTypes.bool
};

export default AccountNameInput;
