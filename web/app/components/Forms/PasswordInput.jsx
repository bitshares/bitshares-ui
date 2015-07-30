import React from "react";
import {PropTypes, Component} from "react";
import classNames from "classnames";

class PasswordInput extends Component {

    constructor() {
        super();
        this.handleChange = this.handleChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.state = {error: null, wrong: false, doesnt_match: false};
    }

    value() {
        return React.findDOMNode(this.refs.password).value;
    }

    clear() {
        React.findDOMNode(this.password.input).value = "";
        if(this.props.confirmation) React.findDOMNode(this.confirm_password.input).value = "";
    }

    focus() {
        React.findDOMNode(this.password.password).focus();
    }

    valid() {
        return !(this.state.error || this.state.wrong || this.state.doesnt_match);
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
        if (this.props.onChange) this.props.onChange({
            valid: !this.state.error && !this.state.wrong
                   && !(this.props.confirmation && this.state.doesnt_match)
                   && confirmation,
            value: password
        });
    }

    onKeyDown(e) {
        if(this.props.onEnter && event.keyCode === 13) this.props.onEnter(e);
    }

    render() {
        let password_error = null, confirmation_error = null;
        if(this.state.wrong || this.props.wrongPassword) password_error = <div>Incorrect password</div>;
        else if(this.state.error) password_error = <div>{this.state.error}</div>;
        if(this.state.doesnt_match) confirmation_error = <div>Confirmation doesn't match Password</div>;
        let password_class_name = classNames("form-group", {"has-error": password_error});
        let password_confirmation_class_name = classNames("form-group", {"has-error": this.state.doesnt_match});
        return (
            <div>
                <div className={password_class_name}>
                    <label>Password</label>
                    <input name="password" type="password" ref="password"
                           onChange={this.handleChange} onKeyDown={this.onKeyDown}/>
                    {password_error}
                </div>
                { this.props.confirmation ?
                <div className={password_confirmation_class_name}>
                    <label>Confirm Password</label>
                    <input name="confirm_password" type="password" ref="confirm_password"
                           onChange={this.handleChange}/>
                    {confirmation_error}
                </div> : null}
            </div>
        );
    }
}

PasswordInput.propTypes = {
    onChange: PropTypes.func,
    onEnter: PropTypes.func,
    confirmation: PropTypes.bool,
    wrongPassword: PropTypes.bool
};

export default PasswordInput;
