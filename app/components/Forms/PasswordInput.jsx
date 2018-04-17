import React from "react";
import {PropTypes, Component} from "react";
import cname from "classnames";
import Translate from "react-translate-component";
import zxcvbnAsync from "zxcvbn-async";

class PasswordInput extends Component {
    static propTypes = {
        onChange: PropTypes.func,
        onEnter: PropTypes.func,
        confirmation: PropTypes.bool,
        wrongPassword: PropTypes.bool,
        noValidation: PropTypes.bool,
        noLabel: PropTypes.bool,
        passwordLength: PropTypes.number,
        checkStrength: PropTypes.bool
    };

    static defaultProps = {
        confirmation: false,
        wrongPassword: false,
        noValidation: false,
        noLabel: false,
        passwordLength: 8,
        checkStrength: false
    };

    constructor() {
        super();
        this.handleChange = this.handleChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.state = {
            value: "",
            error: null,
            wrong: false,
            doesnt_match: false
        };
    }

    value() {
        let node = this.refs.password;
        return node ? node.value : "";
    }

    clear() {
        this.refs.password.value = "";
        if (this.props.confirmation) this.refs.confirm_password.value = "";
    }

    focus() {
        this.refs.password.focus();
    }

    valid() {
        return (
            !(
                this.state.error ||
                this.state.wrong ||
                this.state.doesnt_match
            ) && this.state.value.length >= this.props.passwordLength
        );
    }

    handleChange(e) {
        e.preventDefault();
        e.stopPropagation();
        const confirmation = this.props.confirmation
            ? this.refs.confirm_password.value
            : true;
        const password = this.refs.password.value;
        const doesnt_match = this.props.confirmation
            ? confirmation && password !== confirmation
            : false;

        let strength = 0,
            score;
        if (this.props.checkStrength) {
            if (this.state.value.length > 100) {
                strength = {score: 4};
            } else {
                let zxcvbn = zxcvbnAsync.load({sync: true});
                strength = zxcvbn(this.state.value || "");
            }
            /* Require a length of passwordLength + 50% for the max score */
            score = Math.min(
                5,
                strength.score +
                    Math.floor(
                        this.state.value.length /
                            (this.props.passwordLength * 1.5)
                    )
            );
        }

        let state = {
            valid:
                !this.state.error &&
                !this.state.wrong &&
                !(this.props.confirmation && doesnt_match) &&
                confirmation &&
                password.length >= this.props.passwordLength,
            value: password,
            score,
            doesnt_match
        };
        if (this.props.onChange) this.props.onChange(state);
        this.setState(state);
    }

    onKeyDown(e) {
        if (this.props.onEnter && e.keyCode === 13) this.props.onEnter(e);
    }

    render() {
        let {score} = this.state;
        let password_error = null,
            confirmation_error = null;
        if (this.state.wrong || this.props.wrongPassword)
            password_error = (
                <div>
                    <Translate content="wallet.pass_incorrect" />
                </div>
            );
        else if (this.state.error)
            password_error = <div>{this.state.error}</div>;
        if (
            !this.props.noValidation &&
            !password_error &&
            (this.state.value.length > 0 &&
                this.state.value.length < this.props.passwordLength)
        )
            password_error = (
                <div>
                    <Translate
                        content="wallet.pass_length"
                        minLength={this.props.passwordLength}
                    />
                </div>
            );
        if (this.state.doesnt_match)
            confirmation_error = (
                <div>
                    <Translate content="wallet.confirm_error" />
                </div>
            );
        let password_class_name = cname("form-group", {
            "has-error": password_error
        });
        let password_confirmation_class_name = cname("form-group", {
            "has-error": this.state.doesnt_match
        });
        // let {noLabel} = this.props;

        let confirmMatch = false;
        if (
            this.refs.confirm_password &&
            this.refs.confirm_password.value &&
            !this.state.doesnt_match
        ) {
            confirmMatch = true;
        }

        return (
            <div className="account-selector">
                <div className={password_class_name}>
                    {/* {noLabel ? null : <Translate component="label" content="wallet.password" />} */}
                    <section>
                        <label className="left-label">
                            <Translate content="wallet.enter_password" />
                        </label>
                        <input
                            style={{
                                marginBottom: this.props.checkStrength
                                    ? 0
                                    : null
                            }}
                            id="password"
                            name="password"
                            type="password"
                            ref="password"
                            autoComplete="off"
                            onChange={this.handleChange}
                            onKeyDown={this.onKeyDown}
                        />
                        {this.props.checkStrength ? (
                            <progress
                                style={{height: 10}}
                                className={
                                    score === 5
                                        ? "high"
                                        : score === 4 ? "medium" : "low"
                                }
                                value={score}
                                max="5"
                                min="0"
                            />
                        ) : null}
                    </section>

                    {password_error}
                </div>
                {this.props.confirmation ? (
                    <div className={password_confirmation_class_name}>
                        {/* {noLabel ? null : <Translate component="label" content="wallet.confirm" />} */}
                        <label className="left-label">
                            <Translate content="wallet.confirm_password" />
                        </label>
                        <section
                            style={{position: "relative", maxWidth: "30rem"}}
                        >
                            <input
                                id="confirm_password"
                                name="confirm_password"
                                type="password"
                                ref="confirm_password"
                                autoComplete="off"
                                onChange={this.handleChange}
                            />
                            {confirmMatch ? (
                                <div className={"ok-indicator success"}>OK</div>
                            ) : null}
                        </section>
                        {confirmation_error}
                    </div>
                ) : null}
            </div>
        );
    }
}

export default PasswordInput;
