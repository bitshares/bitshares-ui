import React, {Component} from "react";
import Translate from "react-translate-component";
import Immutable from "immutable";
import cname from "classnames";
import PropTypes from "prop-types";

export default class PasswordConfirm extends Component {
    static propTypes = {
        // Called everytime a valid password is provided and matches a confirmed password
        onValid: PropTypes.func.isRequired
    };

    constructor() {
        super();
        this.state = {
            password: "",
            confirm: "",
            errors: Immutable.Map(),
            // An empty form has no errors but is still invaid
            valid: false
        };
    }

    componentDidMount() {
        if (this.refs.firstPassword) {
            this.refs.firstPassword.focus();
        }
    }

    formChange(event) {
        let key =
            event.target.id === "current-password" ? "password" : "confirm";
        let state = {};
        state[key] = event.target.value;
        this.setState(state, this.validate);
    }

    validate(state = this.state) {
        let {password, confirm} = state;
        confirm = confirm.trim();
        password = password.trim();

        let errors = Immutable.Map();
        // Don't report until typing begins
        if (password.length !== 0 && password.length < 8)
            errors = errors.set(
                "password_length",
                "Password must be 8 characters or more"
            );

        // Don't report it until the confirm is populated
        if (password !== "" && confirm !== "" && password !== confirm)
            errors = errors.set("password_match", "Passwords do not match");

        let valid = password.length >= 8 && password === confirm;
        this.setState({errors, valid});
        this.props.onValid(valid ? password : null);
    }

    render() {
        const {password, confirm, errors} = this.state;
        let {newPassword} = this.props;
        let tabIndex = 1;

        return (
            <div className={cname({"has-error": errors.size})}>
                <Translate
                    component="label"
                    content={
                        newPassword ? "wallet.new_password" : "wallet.password"
                    }
                />
                <section>
                    <input
                        type="password"
                        id="current-password"
                        autoComplete="current-password"
                        ref="firstPassword"
                        onChange={this.formChange.bind(this)}
                        value={password}
                        tabIndex={tabIndex++}
                    />
                </section>

                <Translate
                    component="label"
                    content={
                        newPassword ? "wallet.new_confirm" : "wallet.confirm"
                    }
                />
                <section>
                    <input
                        type="password"
                        id="new-password"
                        autoComplete="new-password"
                        onChange={this.formChange.bind(this)}
                        value={confirm}
                        tabIndex={tabIndex++}
                    />
                </section>

                <div style={{paddingBottom: 10}}>
                    {errors.get("password_match") ||
                        errors.get("password_length")}
                </div>

                {this.props.children}
                <br />
            </div>
        );
    }
}
