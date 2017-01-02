import React from "react";
import {PropTypes} from "react";
import classNames from "classnames";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import {ChainValidation} from "graphenejs-lib";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import AltContainer from "alt-container";

class AccountNameInput extends React.Component {

    static propTypes = {
        id: PropTypes.string,
        placeholder: PropTypes.string,
        initial_value: PropTypes.string,
        onChange: PropTypes.func,
        onEnter: PropTypes.func,
        accountShouldExist: PropTypes.bool,
        accountShouldNotExist: PropTypes.bool,
        cheapNameOnly: PropTypes.bool,
        noLabel: PropTypes.bool
    };

    static defaultProps = {
        noLabel: false
    };

    constructor() {
        super();
        this.state = {
            value: null,
            error: null,
            existing_account: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.value !== this.state.value
            || nextState.error !== this.state.error
            || nextState.account_name !== this.state.account_name
            || nextState.existing_account !== this.state.existing_account
            || nextProps.searchAccounts !== this.props.searchAccounts
    }

    componentDidUpdate() {
        if (this.props.onChange) this.props.onChange({valid: !this.getError()});
    }

    getValue() {
        return this.state.value;
    }

    setValue(value) {
        this.setState({value});
    }

    clear() {
        this.setState({ account_name: null, error: null, warning: null })
    }

    focus() {
        this.refs.input.focus();
    }

    valid() {
        return !this.getError();
    }

    getError() {
        if(this.state.value === null) return null;
        let error = null;
        if (this.state.error) {
            error = this.state.error;
        } else if (this.props.accountShouldExist || this.props.accountShouldNotExist) {
            let account = this.props.searchAccounts.find(a => a === this.state.value);
            if (this.props.accountShouldNotExist && account) {
                error = counterpart.translate("account.name_input.name_is_taken");
            }
            if (this.props.accountShouldExist && !account) {
                error = counterpart.translate("account.name_input.not_found");
            }
        }
        return error;
    }

    validateAccountName(value) {
        this.state.error = value === "" ?
            "Please enter valid account name" :
            ChainValidation.is_account_name_error(value)

        this.state.warning = null
        if(this.props.cheapNameOnly) {
            if( ! this.state.error && ! ChainValidation.is_cheap_name( value ))
                this.state.error = counterpart.translate("account.name_input.premium_name_faucet");
        } else {
            if( ! this.state.error && ! ChainValidation.is_cheap_name( value ))
                this.state.warning = counterpart.translate("account.name_input.premium_name_warning");
        }
        this.setState({value: value, error: this.state.error, warning: this.state.warning});
        if (this.props.onChange) this.props.onChange({value: value, valid: !this.getError()});
        if (this.props.accountShouldExist || this.props.accountShouldNotExist) AccountActions.accountSearch(value);
    }

    handleChange(e) {
        e.preventDefault();
        e.stopPropagation();
        // Simplify the rules (prevent typing of invalid characters)
        var account_name = e.target.value.toLowerCase()
        account_name = account_name.match(/[a-z0-9\.-]+/)
        account_name = account_name ? account_name[0] : null
        this.setState({ account_name })
        this.validateAccountName(account_name);

    }

    onKeyDown(e) {
        if (this.props.onEnter && event.keyCode === 13) this.props.onEnter(e);
    }

    render() {
        let error = this.getError() || "";
        let class_name = classNames("form-group", "account-name", {"has-error": false});
        let warning = this.state.warning;
        let {noLabel} = this.props;

        return (
            <div className={class_name}>
                {noLabel ? null : <label><Translate content="account.name" /></label>}
                <section>
                    <input
                        name="value"
                        type="text"
                        id={this.props.id}
                        ref="input"
                        autoComplete="off"
                        placeholder={this.props.placeholder}
                        onChange={this.handleChange}
                        onKeyDown={this.onKeyDown}
                        value={this.state.account_name || this.props.initial_value}
                    />
                </section>
                <div style={{textAlign: "left"}} className="facolor-error">{error}</div>
                <div style={{textAlign: "left"}} className="facolor-warning">{error ? null : warning}</div>
            </div>
        );
    }
}

export default class StoreWrapper extends React.Component {

    render() {

        return (
            <AltContainer stores={[AccountStore]}
                inject={{
                        searchAccounts: () => {
                            return AccountStore.getState().searchAccounts;
                        }
                    }}
            >
                <AccountNameInput
                    ref="nameInput"
                    {...this.props}
                />
            </AltContainer>
        )
    }
}
