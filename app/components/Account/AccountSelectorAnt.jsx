import React from "react";
import utils from "common/utils";
import {connect} from "alt-react";
import AccountStore from "stores/AccountStore";
import AccountActions from "actions/AccountActions";
import {ChainStore, PublicKey, ChainValidation, FetchChain} from "tuscjs";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import classnames from "classnames";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";
import accountUtils from "common/account_utils";
import PropTypes from "prop-types";
import {Form, Input, Tooltip} from "bitshares-ui-style-guide";

/**
 * @brief Allows the user to enter an account by name or #ID
 *
 * This component is designed to be stateless as possible.  It's primary responsbility is to
 * manage the layout of data and to filter the user input.
 *
 */

class AccountSelector extends React.Component {
    static propTypes = {
        label: PropTypes.string, // a translation key for the label
        error: PropTypes.element, // the error message override
        placeholder: PropTypes.string, // the placeholder text to be displayed when there is no user_input
        onChange: PropTypes.func, // a method to be called any time user input changes
        onAccountChanged: PropTypes.func, // a method to be called when existing account is selected
        onAction: PropTypes.func, // a method called when Add button is clicked
        accountName: PropTypes.string, // the current value of the account selector, the string the user enters
        account: ChainTypes.ChainAccount, // account object retrieved via BindToChainState decorator (not input)
        tabIndex: PropTypes.number, // tabindex property to be passed to input tag
        disableActionButton: PropTypes.bool, // use it if you need to disable action button,
        allowUppercase: PropTypes.bool, // use it if you need to allow uppercase letters
        typeahead: PropTypes.bool,
        excludeAccounts: PropTypes.array // array of accounts to exclude from the typeahead
    };

    static defaultProps = {
        autosubscribe: false,
        excludeAccounts: []
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

        if (!this.props.typeahead && accountName)
            this.onInputChanged(accountName);
    }

    componentWillReceiveProps(newProps) {
        if (newProps.account && newProps.account !== this.props.account) {
            if (this.props.onAccountChanged)
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
        this._notifyOnChange(e);
    }

    _notifyOnChange(e) {
        let {onChange, onAccountChanged, accountName} = this.props;

        let _accountName = this.getVerifiedAccountName(e);

        if (_accountName === accountName) {
            // nothing has changed, don't notify
            return;
        }

        // Synchronous onChange for input change
        if (!!onChange && (!!_accountName || _accountName === ""))
            onChange(_accountName);

        // asynchronous onAccountChanged for checking on chain
        if (!!onAccountChanged) {
            FetchChain("getAccount", _accountName, undefined, {
                [_accountName]: false
            })
                .then(_account => {
                    if (!!_account) {
                        onAccountChanged(_account);
                    }
                })
                .catch(err => {
                    // error fetching
                    console.log(err);
                });
        }
    }

    onInputChanged(e) {
        this.setState({inputChanged: true});
        this._notifyOnChange(e);
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
        let _value = value.replace("#", "").match(/(?:\/account\/)(.*)/);
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
        let labelWrapper = children =>
            this.props.label ? (
                <div>
                    <Form.Item
                        label={counterpart.translate(this.props.label)}
                        hasFeedback
                        validateStatus={
                            error ? "error" : account ? "success" : ""
                        }
                        help={
                            error ? (
                                error
                            ) : account ? (
                                <span className="positive">
                                    {account && account.statusText}{" "}
                                    {!!displayText && displayText}
                                </span>
                            ) : (
                                false
                            )
                        }
                    >
                        {children}
                    </Form.Item>
                </div>
            ) : (
                children
            );

        let {
            accountName,
            account,
            allowPubKey,
            typeahead,
            disableActionButton,
            contacts,
            myActiveAccounts,
            noPlaceHolder,
            useHR,
            labelClass,
            reserveErrorSpace
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
                    : account.accountType === "id"
                    ? account.get("name")
                    : null;
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
            linkedAccounts
                .map(accountName => {
                    if (this.props.excludeAccounts.indexOf(accountName) !== -1)
                        return null;
                    let account = ChainStore.getAccount(accountName);
                    let account_status = ChainStore.getAccountMemberStatus(
                        account
                    );
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
                })
                .filter(a => !!a);
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
            <Tooltip
                placement="top"
                title={counterpart.translate("tooltip.follow_user")}
                onClick={this._onRemoveContact.bind(this)}
            >
                <span className="tooltip green">
                    <Icon
                        style={{
                            position: "absolute",
                            top: "-0.15em",
                            right: ".2em"
                        }}
                        name="user"
                        title="icons.user.following"
                    />
                </span>
            </Tooltip>
        ) : (
            <Tooltip
                placement="top"
                title={counterpart.translate("tooltip.follow_user_add")}
                onClick={this._onAddContact.bind(this)}
            >
                <span className="tooltip">
                    <Icon
                        style={{
                            position: "absolute",
                            top: "-0.05em",
                            right: ".2em"
                        }}
                        name="plus-circle"
                        title="icons.plus_circle.add_contact"
                    />
                </span>
            </Tooltip>
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
                    {labelWrapper(
                        <Input
                            style={{
                                textTransform:
                                    this.getInputType(accountName) === "pubkey"
                                        ? null
                                        : "lowercase",
                                fontVariant: "initial"
                            }}
                            name="username"
                            id="username"
                            autoComplete="username"
                            type="text"
                            value={this.props.accountName || ""}
                            placeholder={
                                this.props.placeholder ||
                                counterpart.translate("account.name")
                            }
                            ref={this.props.inputRef || "user_input"}
                            onChange={this.onInputChanged.bind(this)}
                            onKeyDown={this.onKeyDown.bind(this)}
                            tabIndex={this.props.tabIndex}
                        />
                    )}
                </div>
            </div>
        );
    }
}

AccountSelector = BindToChainState(AccountSelector);

AccountSelector = connect(
    AccountSelector,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps() {
            return {
                myActiveAccounts: AccountStore.getState().myActiveAccounts,
                contacts: AccountStore.getState().accountContacts
            };
        }
    }
);

export default AccountSelector;
