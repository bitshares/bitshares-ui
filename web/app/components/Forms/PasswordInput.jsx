import React from "react";
import {PropTypes, Component} from "react";
import classNames from "classnames";
import Translate from "react-translate-component";

class PasswordInput extends Component {
    
    static propTypes = {
        onChange: PropTypes.func,
        onEnter: PropTypes.func,
        confirmation: PropTypes.bool,
        wrongPassword: PropTypes.bool
    }
    
    constructor() {
        super();
        this.handleChange = this.handleChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.state = {value: "", error: null, wrong: false, doesnt_match: false};
    }
    
    value() {
        let node = React.findDOMNode(this.refs.password);
        return node ? node.value : "";
    }

    clear() {
        React.findDOMNode(this.refs.password).value = "";
        if(this.props.confirmation) React.findDOMNode(this.refs.confirm_password).value = "";
    }

    focus() {
        React.findDOMNode(this.password.password).focus();
    }

    valid() {
        return !(this.state.error || this.state.wrong || this.state.doesnt_match) && this.state.value.length >= 8;
    }

    checkPasswordConfirmation() {
        let confirmation = React.findDOMNode(this.refs.confirm_password).value;
        let password = React.findDOMNode(this.refs.password).value;
        this.state.doesnt_match = confirmation && password !== confirmation;
        this.setState({doesnt_match: this.state.doesnt_match});
    }

    handleChange(e) {
        e.preventDefault();
        e.stopPropagation();
        let confirmation = this.props.confirmation ? React.findDOMNode(this.refs.confirm_password).value : true;
        let password = React.findDOMNode(this.refs.password).value;
        if(this.props.confirmation) this.checkPasswordConfirmation();
        let state = {
            valid: !this.state.error && !this.state.wrong
            && !(this.props.confirmation && this.state.doesnt_match)
            && confirmation && password.length >= 8,
            value: password
        };
        if (this.props.onChange) this.props.onChange(state);
        this.setState(state);
    }

    onKeyDown(e) {
        if(this.props.onEnter && e.keyCode === 13) this.props.onEnter(e);
    }

    render() {
        let password_error = null, confirmation_error = null;
        if(this.state.wrong || this.props.wrongPassword) password_error = <div>Incorrect password</div>;
        else if(this.state.error) password_error = <div>{this.state.error}</div>;
        if (!password_error && (this.state.value.length > 0 && this.state.value.length < 8))
            password_error = "Password must be 8 characters or more";
        if(this.state.doesnt_match) confirmation_error = <div>Confirmation doesn't match Password</div>;
        let password_class_name = classNames("form-group", {"has-error": password_error});
        let password_confirmation_class_name = classNames("form-group", {"has-error": this.state.doesnt_match});
        return (
            <div>
                <div className={password_class_name}>
                    <Translate component="label" content="wallet.password" />
                    <input name="password" type="password" ref="password" autoComplete="off"
                           onChange={this.handleChange} onKeyDown={this.onKeyDown}/>
                    {password_error}
                </div>
                { this.props.confirmation ?
                <div className={password_confirmation_class_name}>
                    <Translate component="label" content="wallet.confirm" />
                    <input name="confirm_password" type="password" ref="confirm_password" autoComplete="off"
                           onChange={this.handleChange}/>
                    {confirmation_error}
                </div> : null}
            </div>
        );
    }
}

export default PasswordInput;
