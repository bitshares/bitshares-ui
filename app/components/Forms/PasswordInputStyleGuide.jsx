import React from "react";
import {Component} from "react";
import PropTypes from "prop-types";
import zxcvbnAsync from "zxcvbn-async";
import counterpart from "counterpart";
import {Button, Progress, Form, Input} from "bitshares-ui-style-guide";

class PasswordInput extends Component {
    static propTypes = {
        onChange: PropTypes.func,
        onEnter: PropTypes.func,
        confirmation: PropTypes.bool,
        wrongPassword: PropTypes.bool,
        noValidation: PropTypes.bool,
        noLabel: PropTypes.bool,
        passwordLength: PropTypes.number,
        checkStrength: PropTypes.bool,
        value: PropTypes.string,
        copy: PropTypes.bool,
        visible: PropTypes.bool,
        readonly: PropTypes.bool
    };

    static defaultProps = {
        confirmation: false,
        wrongPassword: false,
        noValidation: false,
        noLabel: false,
        passwordLength: 8,
        checkStrength: false,
        value: "",
        copy: false,
        visible: false,
        readonly: false
    };

    constructor() {
        super();
        this.onKeyDown = this.onKeyDown.bind(this);
        this.state = {
            password: "",
            confirmPassword: "",
            isPasswordInputActive: false,
            isConfirmPasswordInputActive: false
        };

        this.handlePasswordBlur = this.handlePasswordBlur.bind(this);
        this.handlePasswordFocus = this.handlePasswordFocus.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleValidationChange = this.handleValidationChange.bind(this);
        this.handleConfirmPasswordBlur = this.handleConfirmPasswordBlur.bind(
            this
        );
        this.handleConfirmPasswordFocus = this.handleConfirmPasswordFocus.bind(
            this
        );
        this.handleConfirmPasswordChange = this.handleConfirmPasswordChange.bind(
            this
        );
    }

    handleConfirmPasswordBlur() {
        this.setState({
            isConfirmPasswordInputActive: false
        });
    }

    handleConfirmPasswordFocus() {
        this.setState({
            isConfirmPasswordInputActive: true
        });
    }

    handlePasswordBlur() {
        this.setState({
            isPasswordInputActive: false
        });
    }

    handlePasswordFocus() {
        this.setState({
            isPasswordInputActive: true
        });
    }

    handlePasswordChange(e) {
        this.setState(
            {
                password: e.target.value
            },
            () => {
                if (this.props.onChange)
                    this.props.onChange(this.state.password);

                this.calculatePasswordScore(this.state.password || "");

                this.handleValidationChange();
            }
        );
    }

    handleConfirmPasswordChange(e) {
        this.setState(
            {
                confirmPassword: e.target.value
            },
            () => {
                this.handleValidationChange();
            }
        );
    }

    handleValidationChange() {
        let validation = {
            errorMessage:
                this.getPasswordErrorMessage() ||
                this.getConfirmPasswordErrorMessage() ||
                " ",
            valid:
                !this.getPasswordErrorMessage() &&
                !this.getConfirmPasswordErrorMessage()
        };

        console.log(validation);

        if (this.props.onValidationChange)
            this.props.onValidationChange(validation);
    }

    calculatePasswordScore(password) {
        let {passwordLength} = this.props;

        let zxcvbn = zxcvbnAsync.load({sync: true});

        let strength = zxcvbn(password || "");

        // passwordLength is min required length
        // to reach max score password length should be higher by 50% from min length
        let passwordScore = Math.floor(
            password.length / (passwordLength * 1.5)
        );

        let score = Math.min(5, strength.score + passwordScore);

        console.log(score, strength.score, passwordScore, password);

        this.setState({
            score: score
        });
    }

    onKeyDown(e) {
        if (this.props.onEnter && e.keyCode === 13) this.props.onEnter(e);
    }

    getPasswordErrorMessage() {
        let {password} = this.state;

        if (password.length < this.props.passwordLength) {
            return counterpart.translate("wallet.pass_length", {
                minLength: this.props.passwordLength
            });
        }

        return "";
    }

    getConfirmPasswordErrorMessage() {
        let {password, confirmPassword} = this.state;

        console.log(password, confirmPassword, password !== confirmPassword);

        if (password !== confirmPassword) {
            return counterpart.translate("wallet.confirm_error");
        }

        return "";
    }

    render() {
        let {score} = this.state;

        let {readonly, visible} = this.props;

        let passwordErrorMessage = this.getPasswordErrorMessage();

        let confirmPasswordErrorMessage = this.getConfirmPasswordErrorMessage();

        const getPasswordHelp = () => {
            if (this.state.isPasswordInputActive || !this.state.password)
                return "";

            return passwordErrorMessage || "";
        };

        const getPasswordValidateStatus = () => {
            if (this.state.isPasswordInputActive || !this.state.password)
                return "";

            return passwordErrorMessage && passwordErrorMessage.length
                ? "error"
                : "";
        };

        const getConfirmPasswordHelp = () => {
            if (!this.state.confirmPassword || !this.state.password) return "";

            return confirmPasswordErrorMessage || "";
        };

        const getConfirmPasswordValidateStatus = () => {
            if (
                this.state.isConfirmPasswordInputActive ||
                !this.state.confirmPassword ||
                !this.state.password
            )
                return "";

            return confirmPasswordErrorMessage &&
                confirmPasswordErrorMessage.length
                ? "error"
                : "";
        };

        return [
            <Form.Item
                label={
                    this.props.label ||
                    counterpart.translate("wallet.enter_password")
                }
                key="password-field"
                help={getPasswordHelp()}
                validateStatus={getPasswordValidateStatus()}
            >
                <Input
                    id="current-password"
                    onBlur={this.handlePasswordBlur}
                    onFocus={this.handlePasswordFocus}
                    type={visible ? "text" : "password"}
                    name="password"
                    placeholder={counterpart.translate("wallet.enter_password")}
                    ref="password"
                    onChange={this.handlePasswordChange}
                    onKeyDown={this.onKeyDown}
                    value={this.state.password}
                    readOnly={readonly}
                />
                <Progress percent={score * 20} showInfo={false} />
            </Form.Item>,
            <Form.Item
                label={counterpart.translate("wallet.confirm")}
                key="confirm-password-field"
                help={getConfirmPasswordHelp()}
                validateStatus={getConfirmPasswordValidateStatus()}
            >
                <Input
                    id="confirm-password"
                    onBlur={this.handleConfirmPasswordBlur}
                    onFocus={this.handleConfirmPasswordFocus}
                    type={visible ? "text" : "password"}
                    name="confirmPassword"
                    placeholder={counterpart.translate("wallet.enter_password")}
                    ref="confirmPassword"
                    onChange={this.handleConfirmPasswordChange}
                    onKeyDown={this.onKeyDown}
                    value={this.state.confirmPassword}
                    readOnly={readonly}
                />
            </Form.Item>
        ];
    }
}

export default PasswordInput;
