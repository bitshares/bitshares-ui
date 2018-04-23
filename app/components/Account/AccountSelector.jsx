import React from "react";
import utils from "common/utils";
import {connect} from "alt-react";
import AccountImage from "../Account/AccountImage";
import AccountStore from "stores/AccountStore";
import AccountActions from "actions/AccountActions";
import Translate from "react-translate-component";
import {ChainStore, PublicKey, ChainValidation} from "bitsharesjs/es";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import classnames from "classnames";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";
import accountUtils from "common/account_utils";
import FloatingDropdown from "../Utility/FloatingDropdown";
import TypeAhead from "../Utility/TypeAhead";
import cnames from "classnames";

/**
 * @brief Allows the user to enter an account by name or #ID
 *
 * This component is designed to be stateless as possible.  It's primary responsbility is to
 * manage the layout of data and to filter the user input.
 *
 */

class AccountSelector extends React.Component {
    static propTypes = {
        label: React.PropTypes.string, // a translation key for the label
        error: React.PropTypes.element, // the error message override
        placeholder: React.PropTypes.string, // the placeholder text to be displayed when there is no user_input
        onChange: React.PropTypes.func, // a method to be called any time user input changes
        onAccountChanged: React.PropTypes.func, // a method to be called when existing account is selected
        onAction: React.PropTypes.func, // a method called when Add button is clicked
        accountName: React.PropTypes.string, // the current value of the account selector, the string the user enters
        account: ChainTypes.ChainAccount, // account object retrieved via BindToChainState decorator (not input)
        tabIndex: React.PropTypes.number, // tabindex property to be passed to input tag
        disableActionButton: React.PropTypes.bool, // use it if you need to disable action button,
        allowUppercase: React.PropTypes.bool, // use it if you need to allow uppercase letters
        typeahead: React.PropTypes.bool
    };

    static defaultProps = {
        autosubscribe: false
    };

    constructor(props) {
        super(props);
        this.state = {
            inputChanged: false
        };
    }

    componentDidMount() {
        let {account, accountName} = this.props;

        if (typeof account === "undefined")
            account = ChainStore.getAccount(accountName);

        if (this.props.onAccountChanged && account)
            this.props.onAccountChanged(account);

        if (!this.props.typeahead && !!accountName)
            this.onInputChanged(accountName);
    }

    componentWillReceiveProps(newProps) {
        if (newProps.account && newProps.account !== this.props.account) {
            this.props.onAccountChanged(newProps.account);
        }
    }

    // can be used in parent component: this.refs.account_selector.getAccount()
    getAccount() {
        return this.props.account;
    }

    getError() {
        let {account, error} = this.props;

        if (!error && account && !this.getInputType(account.get("name")))
            error = counterpart.translate("account.errors.invalid");

        return error;
    }

    getInputType(value) {
        // OK
        if (!value) return null;
        if (value[0] === "#" && utils.is_object_id("1.2." + value.substring(1)))
            return "id";
        if (ChainValidation.is_account_name(value, true)) return "name";
        if (this.props.allowPubKey && PublicKey.fromPublicKeyString(value))
            return "pubkey";
        return null;
    }

    onSelected(e) {
        this.setState({inputChanged: false});
        let _accountName = this.getVerifiedAccountName(e);
        let _account = ChainStore.getAccount(_accountName);
        if (_account) {
            this.props.onChange(_accountName);
            this.props.onAccountChanged(_account);
        }
    }

    onInputChanged(e) {
        let {onChange, onAccountChanged, accountName, typeahead} = this.props;
        this.setState({inputChanged: true});

        let _accountName = this.getVerifiedAccountName(e);
        let _account = ChainStore.getAccount(_accountName);

        if (onChange && _accountName !== accountName) onChange(_accountName);

        // None-Typeahead Component compatibility
        // - Always returns account object
        if (!typeahead) {
            if (onChange) onChange(_accountName);
            if (onAccountChanged) onAccountChanged(_account);
        }
    }

    getVerifiedAccountName(e) {
        let {allowUppercase} = this.props;

        let value = null;
        if (typeof e === "string") {
            value = e;
        } else if (e && e.target) {
            value = e.target.value.trim();
        } else {
            value = "";
        }

        if (!allowUppercase) value = value.toLowerCase();

        // If regex matches ^.*#/account/account-name/.*$, parse out account-name
        let _value = value
            .replace("#", "")
            .match(/(?:\/account\/)(.*)(?:\/overview)/);
        if (_value) value = _value[1];

        return value;
    }

    onKeyDown(e) {
        if (e.keyCode === 13) this.onAction(e);
    }

    _onAddContact() {
        AccountActions.addAccountContact(this.props.accountName);
    }

    _onRemoveContact() {
        AccountActions.removeAccountContact(this.props.accountName);
    }

    onAction(e) {
        let {onAction, disableActionButton, account, accountName} = this.props;
        e.preventDefault();
        if (!this.getError() && onAction && !disableActionButton) {
            if (account) onAction(account);
            else if (this.getInputType(accountName) === "pubkey")
                onAction(accountName);
        }
    }

    render() {
        let {
            accountName,
            account,
            allowPubKey,
            typeahead,
            disableActionButton,
            contacts,
            myActiveAccounts
        } = this.props;

        const inputType = this.getInputType(accountName);

        let typeAheadAccounts = [];
        let error = this.getError();
        let linkedAccounts = myActiveAccounts;
        linkedAccounts = linkedAccounts.concat(contacts);

        // Selected Account
        let displayText;
        if (account) {
            account.isKnownScammer = accountUtils.isKnownScammer(
                account.get("name")
            );
            account.accountType = this.getInputType(account.get("name"));
            account.accountStatus = ChainStore.getAccountMemberStatus(account);
            account.statusText = !account.isKnownScammer
                ? counterpart.translate(
                      "account.member." + account.accountStatus
                  )
                : counterpart.translate("account.member.suspected_scammer");
            displayText =
                account.accountType === "name"
                    ? "#" + account.get("id").substring(4)
                    : account.accountType === "id" ? account.get("name") : null;
        }

        // Without Typeahead Error Handling
        if (!typeahead) {
            if (!account && accountName && inputType !== "pubkey") {
                error = counterpart.translate("account.errors.unknown");
            }
        } else {
            if (
                !(allowPubKey && inputType === "pubkey") &&
                !error &&
                accountName &&
                !account
            )
                error = counterpart.translate("account.errors.unknown");
        }
        if (allowPubKey && inputType === "pubkey") displayText = "Public Key";

        if (account && linkedAccounts)
            account.isFavorite =
                myActiveAccounts.has(account.get("name")) ||
                contacts.has(account.get("name"));

        if (typeahead && linkedAccounts) {
            linkedAccounts.map(function(accountName) {
                let account = ChainStore.getAccount(accountName);
                let account_status = ChainStore.getAccountMemberStatus(account);
                let account_status_text = !accountUtils.isKnownScammer(
                    accountName
                )
                    ? "account.member." + account_status
                    : "account.member.suspected_scammer";

                typeAheadAccounts.push({
                    id: accountName,
                    label: accountName,
                    status: counterpart.translate(account_status_text),
                    className: accountUtils.isKnownScammer(accountName)
                        ? "negative"
                        : "positive"
                });
            });
        }

        let typeaheadHasAccount = !!accountName
            ? typeAheadAccounts.reduce((boolean, a) => {
                  return boolean || a.label === accountName;
              }, false)
            : false;

        if (!!accountName && !typeaheadHasAccount && this.state.inputChanged) {
            let _account = ChainStore.getAccount(accountName);
            let _account_status = _account
                ? ChainStore.getAccountMemberStatus(_account)
                : null;
            let _account_status_text = _account
                ? !accountUtils.isKnownScammer(_account.get("name"))
                    ? counterpart.translate("account.member." + _account_status)
                    : counterpart.translate("account.member.suspected_scammer")
                : counterpart.translate("account.errors.unknown");

            typeAheadAccounts.push({
                id: this.props.accountName,
                label: this.props.accountName,
                status: _account_status_text,
                className:
                    accountUtils.isKnownScammer(accountName) || !_account
                        ? "negative"
                        : null,
                disabled: !_account ? true : false
            });
        }

        typeAheadAccounts.sort((a, b) => {
            if (a.label > b.label) return 1;
            else return -1;
        });

        let linked_status = !this.props.account ? null : myActiveAccounts.has(
            account.get("name")
        ) || contacts.has(account.get("name")) ? (
            <span
                className="tooltip green"
                data-place="top"
                data-tip={counterpart.translate("tooltip.follow_user")}
                onClick={this._onRemoveContact.bind(this)}
            >
                <Icon
                    style={{
                        position: "absolute",
                        top: "-0.15em",
                        right: ".2em"
                    }}
                    name="user"
                />
            </span>
        ) : (
            <span
                className="tooltip"
                data-place="top"
                data-tip={counterpart.translate("tooltip.follow_user_add")}
                onClick={this._onAddContact.bind(this)}
            >
                <Icon
                    style={{
                        position: "absolute",
                        top: "-0.05em",
                        right: ".2em"
                    }}
                    name="plus-circle"
                />
            </span>
        );

        let action_class = classnames("button", {
            disabled:
                !(account || inputType === "pubkey") ||
                error ||
                disableActionButton
        });

        return (
            <div className="account-selector" style={this.props.style}>
                <div className="content-area">
                    {this.props.label ? (
                        <div
                            className={
                                "header-area" +
                                (this.props.hideImage ? " no-margin" : "")
                            }
                        >
                            <label
                                className={cnames(
                                    "right-label",
                                    account && account.isFavorite
                                        ? "positive"
                                        : null,
                                    account && account.isKnownScammer
                                        ? "negative"
                                        : null
                                )}
                            >
                                <span style={{paddingRight: "1.5rem"}}>
                                    {account && account.statusText}&nbsp;{!!displayText &&
                                        displayText}
                                </span>
                                {linked_status}
                            </label>

                            <Translate
                                className="left-label"
                                component="label"
                                content={this.props.label}
                            />
                        </div>
                    ) : null}
                    <div className="input-area">
                        <div className="inline-label input-wrapper">
                            {account && account.accountType === "pubkey" ? (
                                <div className="account-image">
                                    <Icon name="key" size="4x" />
                                </div>
                            ) : this.props.hideImage ? null : (
                                <AccountImage
                                    size={{
                                        height: this.props.size || 80,
                                        width: this.props.size || 80
                                    }}
                                    account={
                                        account ? account.get("name") : null
                                    }
                                    custom_image={null}
                                />
                            )}
                            {typeof this.props.typeahead !== "undefined" ? (
                                <TypeAhead
                                    items={typeAheadAccounts}
                                    style={{
                                        textTransform:
                                            this.getInputType(accountName) ===
                                            "pubkey"
                                                ? null
                                                : "lowercase",
                                        fontVariant: "initial"
                                    }}
                                    name="username"
                                    id="username"
                                    defaultValue={this.props.accountName || ""}
                                    placeholder={
                                        this.props.placeholder ||
                                        counterpart.translate("account.name")
                                    }
                                    ref="user_input"
                                    onSelect={this.onSelected.bind(this)}
                                    onChange={this.onInputChanged.bind(this)}
                                    onKeyDown={this.onKeyDown.bind(this)}
                                    tabIndex={this.props.tabIndex}
                                    inputProps={{
                                        placeholder: "Search for an account"
                                    }}
                                    {...this.props.typeaheadOptions || {}}
                                />
                            ) : (
                                <input
                                    style={{
                                        textTransform:
                                            this.getInputType(accountName) ===
                                            "pubkey"
                                                ? null
                                                : "lowercase",
                                        fontVariant: "initial"
                                    }}
                                    name="username"
                                    id="username"
                                    type="text"
                                    value={this.props.accountName || ""}
                                    placeholder={
                                        this.props.placeholder ||
                                        counterpart.translate("account.name")
                                    }
                                    ref="user_input"
                                    onChange={this.onInputChanged.bind(this)}
                                    onKeyDown={this.onKeyDown.bind(this)}
                                    tabIndex={this.props.tabIndex}
                                />
                            )}
                            {this.props.dropDownContent ? (
                                <div className="form-label select floating-dropdown">
                                    <FloatingDropdown
                                        entries={this.props.dropDownContent}
                                        values={this.props.dropDownContent.reduce(
                                            (map, a) => {
                                                if (a) map[a] = a;
                                                return map;
                                            },
                                            {}
                                        )}
                                        singleEntry={
                                            this.props.dropDownContent[0]
                                        }
                                        value={this.props.dropDownValue || ""}
                                        onChange={this.props.onDropdownSelect}
                                    />
                                </div>
                            ) : null}
                            {this.props.children}
                            {this.props.onAction ? (
                                <button
                                    className={action_class}
                                    onClick={this.onAction.bind(this)}
                                >
                                    <Translate
                                        content={this.props.action_label}
                                    />
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {error ? (
                        <div className="error-area">
                            <span>{error}</span>
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }
}

AccountSelector = BindToChainState(AccountSelector, {keep_updating: true});

AccountSelector = connect(AccountSelector, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        return {
            myActiveAccounts: AccountStore.getState().myActiveAccounts,
            contacts: AccountStore.getState().accountContacts
        };
    }
});

export default AccountSelector;
