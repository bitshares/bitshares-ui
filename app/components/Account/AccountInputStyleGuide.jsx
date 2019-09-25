import React, {Component} from "react";
import {Input, Form, Select} from "bitshares-ui-style-guide";
import counterpart from "counterpart";
import ChainStore from "tuscjs/es/chain/src/ChainStore";
import accountUtils from "../../lib/common/account_utils";

class AccountInputStyleGuide extends Component {
    constructor(props) {
        super(props);

        this.state = {
            // is user cursor on input or not
            isInputActive: false
        };

        this.handleBlur = this.handleBlur.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    componentDidUpdate() {
        if (this.props.focus) {
            this.refs.input.focus();
        }
    }

    handleBlur() {
        this.setState({
            isInputActive: false
        });
    }

    handleFocus() {
        this.setState({
            isInputActive: true
        });
    }

    handleInputChange(e) {
        this.props.onChange(e.target.value);
    }

    isAccountScammer() {
        let account = ChainStore.getAccount(this.props.value);

        if (account && account.get) {
            return accountUtils.isKnownScammer(account.get("name"));
        }

        return false;
    }

    getAccountStatus() {
        let account = ChainStore.getAccount(this.props.value);

        if (account && account.get) {
            // is scammer
            let isKnownScammer = this.isAccountScammer();

            if (isKnownScammer) {
                return counterpart.translate(
                    "account.member.suspected_scammer"
                );
            }

            // get status (basic or lifetime member)
            let accountStatus = ChainStore.getAccountMemberStatus(account);

            return (
                counterpart.translate("account.member." + accountStatus) +
                " #" +
                account.get("id").substring(4)
            );
        }

        return null;
    }

    isAccountFound() {
        let account = ChainStore.getAccount(this.props.value);

        return !!account;
    }

    getValidateStatus() {
        if (this.state.isInputActive || !this.props.value) return "";

        if (this.isAccountFound()) return "success";

        return "error";
    }

    getHelp() {
        if (this.state.isInputActive || !this.props.value) return "";

        if (!this.isAccountFound())
            return counterpart.translate("account.errors.unknown");

        return "";
    }

    getPlaceholder() {
        if (this.props.placeholder)
            return counterpart.translate(this.props.placeholder);

        return "";
    }

    input() {
        const value = this.props.value;
        const onChange = this.handleInputChange;

        return (
            <Input
                ref="input"
                placeholder={this.getPlaceholder()}
                value={value}
                onChange={onChange}
                onBlur={this.handleBlur}
                onFocus={this.handleFocus}
            />
        );
    }

    labelComponent() {
        let accountStatus = this.getAccountStatus();

        let getStatus = () => {
            if (this.isAccountScammer())
                return "account-input-style-guide--account-status--scammer";
        };

        let getLabel = () => {
            return (
                <span className="account-input-style-guide--label">
                    {counterpart.translate(this.props.label)}
                    <span
                        className={`account-input-style-guide--account-status ${getStatus()}`}
                    >
                        {accountStatus}
                    </span>
                </span>
            );
        };

        return (
            <Form.Item
                style={{textAlign: "left"}}
                label={getLabel()}
                help={this.getHelp()}
                validateStatus={this.getValidateStatus()}
            >
                {this.input()}
            </Form.Item>
        );
    }

    simpleComponent() {
        this.input();
    }

    render() {
        return (
            <div className="account-input-style-guide">
                {this.props.label
                    ? this.labelComponent()
                    : this.simpleComponent()}
            </div>
        );
    }
}

export default AccountInputStyleGuide;
