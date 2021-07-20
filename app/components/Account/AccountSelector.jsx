import React from "react";
import utils from "common/utils";
import {connect} from "alt-react";
import AccountImage from "../Account/AccountImage";
import AccountStore from "stores/AccountStore";
import AccountActions from "actions/AccountActions";
import Translate from "react-translate-component";
import {
    ChainStore,
    PublicKey,
    ChainValidation,
    FetchChain,
    FetchChainObjects
} from "bitsharesjs";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";
import accountUtils from "common/account_utils";
import cnames from "classnames";
import PropTypes from "prop-types";
import {
    Tooltip,
    Button,
    Input,
    Icon as AntIcon,
    Select,
    Form
} from "bitshares-ui-style-guide";

const MAX_LOOKUP_ATTEMPTS = 5;
/*
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
        excludeAccounts: PropTypes.array, // array of accounts to exclude from the typeahead
        includeMyActiveAccounts: PropTypes.bool, // whether to include my active accounts in the list
        focus: PropTypes.bool,
        disabled: PropTypes.bool,
        editable: PropTypes.bool,
        locked: PropTypes.bool,
        requireActiveSelect: PropTypes.bool,
        noForm: PropTypes.bool
    };

    static defaultProps = {
        autosubscribe: false,
        excludeAccounts: [],
        includeMyActiveAccounts: true,
        disabled: null,
        editable: null,
        locked: false,
        requireActiveSelect: true, // Should not be set to false, required for fallback
        noForm: false
    };

    constructor(props) {
        super(props);
        this.state = {
            accountIndex: [],
            locked: null
        };
        this.timer = null;
    }

    componentDidMount() {
        let {account, accountName} = this.props;

        // Populate account search array, fetch only once
        if (accountName) {
            this._addThisToIndex(accountName);
        }
        if (this.props.includeMyActiveAccounts) {
            this.props.myActiveAccounts.map(a => {
                this._addThisToIndex(a);
            });
        }
        this.props.contacts.map(a => {
            this._addThisToIndex(a);
        });
        this._fetchAccounts();

        if (this.props.onAccountChanged && account)
            this.props.onAccountChanged(account);

        if (!this.props.typeahead && accountName)
            this.onInputChanged(accountName);
    }

    componentDidUpdate(prevProps) {
        if (this.props.focus && !!this.props.editable && !this.props.disabled) {
            this.refs.user_input.focus();
        }

        if (prevProps.account && prevProps.account !== this.props.account) {
            if (this.props.onAccountChanged) {
                this.props.onAccountChanged(this.props.account);
            }
        }
    }

    _addToIndex(accountName, noDelay = false) {
        if (noDelay) {
            this._addThisToIndex(accountName);
            this._fetchAccounts();
        } else {
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                this._addToIndex(accountName, true);
            }, 500);
        }
    }

    _addThisToIndex(accountName) {
        let {accountIndex} = this.state;

        if (!accountName) return;

        let inAccountList = accountIndex.find(a => a.name === accountName);

        if (accountName && !inAccountList) {
            accountIndex.push({
                name: accountName,
                data: null,
                attempts: 0
            });
        }
    }

    _getIndex(name, index) {
        return index.findIndex(a => a.name === name);
    }

    _getSearchArray() {
        let {accountIndex} = this.state;

        // For all objects in search_array, query with FetchChainObjects
        // Update results for each object with returned data and remove from search_array
        // Update search_array for all remaining objects with increased attempts count
        // which is when account does not exists, but can also be if node failed to send results
        // back in time, so we query at least `MAX_LOOKUP_ATTEMPTS` times before we stop

        // Filter out what objects we still require data for
        let search_array = accountIndex
            .filter(search => {
                return !search.data && search.attempts < MAX_LOOKUP_ATTEMPTS
                    ? search.name
                    : null;
            })
            .map(search => {
                return search.name;
            });

        return search_array;
    }

    _fetchAccounts() {
        let {accountIndex} = this.state;

        let search_array = this._getSearchArray();

        if (search_array.length > 0) {
            if (__DEV__)
                console.log("Looked for " + search_array.length + " accounts");
            FetchChainObjects(
                ChainStore.getAccount,
                search_array,
                3000,
                {}
            ).then(accounts => {
                for (let i = 0; i < accounts.length; i++) {
                    let account = accounts[i];
                    if (account) {
                        let objectIndex = this._getIndex(
                            account.get("name"),
                            accountIndex
                        );
                        let result = this._populateAccountIndex(account);

                        if (result) {
                            accountIndex[objectIndex] = result;
                            search_array.splice(account.get("name"));
                        }
                    } else {
                        let objectIndex = this._getIndex(
                            search_array[i],
                            accountIndex
                        );
                        let result = this._populateAccountIndexWithPublicKey(
                            search_array[i]
                        );

                        if (result) {
                            accountIndex[objectIndex] = result;
                            search_array.splice(search_array[i]);
                        }
                    }
                }
                search_array.forEach(account_to_find => {
                    let objectIndex = this._getIndex(
                        account_to_find,
                        accountIndex
                    );
                    accountIndex[objectIndex].attempts++;
                });
                this.setState({
                    accountIndex: accountIndex
                });

                // Run another fetch of accounts if data is still missing
                let isDataMissing = this.state.accountIndex.find(
                    a => !a.data && a.attempts < MAX_LOOKUP_ATTEMPTS
                );

                if (isDataMissing) {
                    setTimeout(() => {
                        this._fetchAccounts();
                    }, 500);
                }
            });
        }
    }

    _populateAccountIndexWithPublicKey(publicKey) {
        let accountType = this.getInputType(publicKey);
        let rightLabel = "Public Key";

        return {
            name: publicKey,
            attempts: 0,
            data: {
                name: publicKey,
                type: accountType,
                rightLabel: rightLabel
            }
        };
    }

    _populateAccountIndex(accountResult) {
        let {myActiveAccounts, contacts} = this.props;

        // Should not happen, just failsafe
        if (!accountResult) return null;

        let accountName = accountResult.get("name");
        let accountStatus = ChainStore.getAccountMemberStatus(accountResult);
        let accountType = this.getInputType(accountName);

        let statusLabel = !accountUtils.isKnownScammer(accountName)
            ? counterpart.translate("account.member." + accountStatus)
            : counterpart.translate("account.member.suspected_scammer");

        let rightLabel =
            accountType === "name"
                ? "#" + accountResult.get("id").substring(4)
                : accountType === "id"
                    ? accountResult.get("name")
                    : accountType == "pubkey" && this.props.allowPubKey
                        ? "Public Key"
                        : null;

        return {
            name: accountName,
            attempts: 0,
            data: {
                id: accountResult.get("id"),
                name: accountName,
                type: accountType,
                status: accountStatus,
                isOwnAccount: myActiveAccounts.has(accountName),
                isContact: contacts.has(accountName),
                isKnownScammer: accountUtils.isKnownScammer(accountName),
                statusLabel: statusLabel,
                rightLabel: rightLabel,
                className:
                    accountUtils.isKnownScammer(accountName) || !accountResult
                        ? "negative"
                        : null
            }
        };
    }

    // can be used in parent component: this.refs.account_selector.getAccount()
    getAccount() {
        return this.props.account;
    }

    getError() {
        let {account, accountName, error, typeahead} = this.props;

        let inputType = accountName ? this.getInputType(accountName) : null;

        if (!typeahead) {
            if (!account && accountName && inputType !== "pubkey") {
                error = counterpart.translate("account.errors.unknown");
            }
        } else {
            // Typeahead can't select an unknown account!
            // if (
            //     !(allowPubKey && inputType === "pubkey") &&
            //     !error &&
            //     accountName &&
            //     !account
            // )
            //     error = counterpart.translate("account.errors.unknown");
        }

        if (!error && account && !inputType)
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

    _notifyOnChange(selectedAccountName, inputType) {
        let {props} = this;

        // Clear selected account when we have new input data if we require an active select
        if (
            inputType == "input" &&
            this.props.typeahead &&
            this.props.requireActiveSelect
        ) {
            if (!!props.onAccountChanged) {
                props.onAccountChanged(null);
            }
            if (!!props.onChange) {
                props.onChange(null);
            }
        }

        let accountName = this.getVerifiedAccountName(selectedAccountName);

        // Synchronous onChange for input change
        if (!!props.onChange && (!!accountName || accountName === "")) {
            props.onChange(accountName);
        }

        // asynchronous onAccountChanged for checking on chain
        if (!!props.onAccountChanged) {
            FetchChain("getAccount", accountName, undefined, {
                [accountName]: false
            })
                .then(account => {
                    if (
                        !!account &&
                        ((this.props.requireActiveSelect &&
                            inputType == "select") ||
                            !this.props.requireActiveSelect)
                    ) {
                        props.onAccountChanged(account);
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }

    onSelect(selectedAccountName) {
        this._notifyOnChange(selectedAccountName, "select");
    }

    onInputChanged(e) {
        this._addToIndex(this.getVerifiedAccountName(e));
        this._notifyOnChange(e, "input");
    }

    onKeyDown(e) {
        if (e.keyCode === 13 || e.keyCode === 9) {
            this.onAction(e);
        }
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
        let {accountIndex} = this.state;

        let {account, accountName, disableActionButton} = this.props;

        let searchInProgress = this.state.accountIndex.find(
            a => !a.data && a.attempts < MAX_LOOKUP_ATTEMPTS
        );

        const lockedState =
            this.state.locked !== null ? this.state.locked : this.props.locked;

        let error = this.getError(),
            formContainer,
            selectedAccount,
            disabledAction,
            disabledInput,
            editableInput,
            linked_status;

        editableInput = !!lockedState
            ? false
            : this.props.editable != null
                ? this.props.editable
                : undefined;

        disabledInput = !!lockedState
            ? true
            : this.props.disabled != null
                ? this.props.disabled
                : undefined;

        // Selected Account
        if (account) {
            let objectIndex = this._getIndex(account.get("name"), accountIndex);

            selectedAccount =
                accountIndex && accountIndex[objectIndex]
                    ? accountIndex[objectIndex].data
                    : null;
        }
        if (this.props.allowPubKey) {
            let objectIndex = accountIndex.findIndex(
                a => a.name === accountName
            );

            selectedAccount =
                accountIndex && accountIndex[objectIndex]
                    ? accountIndex[objectIndex].data
                    : null;
        }
        disabledAction =
            !(
                account ||
                (selectedAccount && selectedAccount.type === "pubkey")
            ) ||
            error ||
            disableActionButton;

        if (selectedAccount && selectedAccount.isKnownScammer) {
            linked_status = (
                <Tooltip
                    placement="top"
                    title={counterpart.translate("tooltip.scam_account")}
                >
                    <span className="tooltip red">
                        <AntIcon type="warning" theme="filled" />
                    </span>
                </Tooltip>
            );
        } else if (selectedAccount && selectedAccount.isContact) {
            linked_status = (
                <Tooltip
                    placement="top"
                    title={counterpart.translate("tooltip.follow_user")}
                    onClick={this._onRemoveContact.bind(this)}
                >
                    <span className="tooltip green">
                        <AntIcon type="star" theme="filled" />
                    </span>
                </Tooltip>
            );
        } else if (selectedAccount && selectedAccount.isOwnAccount) {
            linked_status = (
                <Tooltip
                    placement="top"
                    title={counterpart.translate("tooltip.own_account")}
                >
                    <span className="tooltip green">
                        <AntIcon type="user" />
                    </span>
                </Tooltip>
            );
        } else if (selectedAccount) {
            linked_status = (
                <Tooltip
                    placement="top"
                    title={counterpart.translate("tooltip.follow_user_add")}
                    onClick={this._onAddContact.bind(this)}
                >
                    <span className="tooltip">
                        <AntIcon type="star" />
                    </span>
                </Tooltip>
            );
        }

        if (this.props.typeahead) {
            let optionsContainer = accountIndex
                .filter(account => {
                    // Filter accounts based on
                    // - Exclude without results (missing chain data at the moment)
                    // - Excluded accounts (by props)
                    // - Include users own accounts (isOwnAccount)
                    // - Include users contacts (isContact) unless it's a previously locked input
                    // - Include current input

                    if (!account.data) {
                        return null;
                    }
                    if (this.props.excludeAccounts.indexOf(account.id) !== -1) {
                        return null;
                    }
                    if (
                        (this.props.includeMyActiveAccounts &&
                            account.data.isOwnAccount) ||
                        (!this.props.locked && account.data.isContact) ||
                        (accountName && account.data.name === accountName)
                    ) {
                        return account;
                    }
                })
                .sort((a, b) => {
                    if (a.data.isOwnAccount < b.data.isOwnAccount) {
                        if (a.data.name > b.data.name) {
                            return 1;
                        } else {
                            return -1;
                        }
                    } else {
                        return -1;
                    }
                })
                .map(account => {
                    return (
                        <Select.Option
                            key={account.data.id}
                            value={account.data.name}
                            disabled={account.data.disabled ? true : undefined}
                        >
                            {account.data.isKnownScammer ? (
                                <AntIcon type="warning" />
                            ) : account.data.isContact ? (
                                <AntIcon type="star" />
                            ) : account.data.isOwnAccount ? (
                                <AntIcon type="user" />
                            ) : null}
                            &nbsp;
                            {account.data.name}
                            <span style={{float: "right"}}>
                                {account.data.statusLabel}
                            </span>
                        </Select.Option>
                    );
                });

            formContainer = (
                <Select
                    showSearch
                    optionLabelProp={"value"}
                    onSelect={this.onSelect.bind(this)}
                    onSearch={this.onInputChanged.bind(this)}
                    placeholder={counterpart.translate("account.search")}
                    notFoundContent={counterpart.translate("global.not_found")}
                    value={selectedAccount ? selectedAccount.name : null}
                    disabled={disabledInput ? true : undefined}
                >
                    {optionsContainer}
                </Select>
            );
        } else {
            formContainer = (
                <Input
                    style={{
                        textTransform:
                            selectedAccount && selectedAccount.type === "pubkey"
                                ? null
                                : "lowercase",
                        fontVariant: "initial"
                    }}
                    name="username"
                    id="username"
                    autoComplete={
                        !!this.props.editable ? "username" : undefined
                    }
                    type="text"
                    value={this.props.accountName || ""}
                    placeholder={
                        this.props.placeholder ||
                        counterpart.translate("account.name")
                    }
                    disabled={this.props.disabled ? true : undefined}
                    ref="user_input"
                    onChange={this.onInputChanged.bind(this)}
                    onKeyDown={this.onKeyDown.bind(this)}
                    tabIndex={
                        !this.props.editable || !!this.props.disabled
                            ? -1
                            : this.props.tabIndex
                    }
                    editable={
                        !!editableInput ? editableInput.toString() : undefined
                    }
                    readOnly={
                        !!editableInput
                            ? (!editableInput).toString()
                            : undefined
                    }
                />
            );
        }

        let accountImageContainer = this.props
            .hideImage ? null : selectedAccount &&
        selectedAccount.type === "pubkey" ? (
            <div className="account-image">
                <Icon name="key" title="icons.key" size="4x" />
            </div>
        ) : (
            <AccountImage
                size={{
                    height: this.props.size || 33,
                    width: this.props.size || 33
                }}
                account={selectedAccount ? selectedAccount.name : null}
                custom_image={null}
            />
        );

        let lockedStateContainer = !lockedState ? null : (
            <Tooltip
                title={counterpart.translate("tooltip.unlock_account_name")}
            >
                <div
                    style={{
                        lineHeight: "2rem",
                        marginLeft: "10px",
                        cursor: "pointer"
                    }}
                    onClick={() => this.setState({locked: false})}
                >
                    <AntIcon style={{fontSize: "1rem"}} type={"edit"} />
                </div>
            </Tooltip>
        );

        let rightLabelContainer =
            !this.props.label || !selectedAccount ? null : (
                <div
                    className={
                        "header-area" +
                        (this.props.hideImage ? " no-margin" : "")
                    }
                >
                    <label
                        className={cnames(
                            "right-label",
                            selectedAccount.isKnownScammer
                                ? "negative"
                                : selectedAccount.isContact ||
                                  selectedAccount.isOwnAccount
                                    ? "positive"
                                    : null
                        )}
                        style={{marginTop: -30}}
                    >
                        <span style={{paddingRight: "0.5rem"}}>
                            {selectedAccount.rightLabel}
                        </span>
                        {linked_status}
                    </label>
                </div>
            );

        const FormWrapper = this.props.noForm ? React.Fragment : Form;
        const formWrapperProps = this.props.noForm
            ? {}
            : {
                  className: "full-width",
                  layout: "vertical",
                  style: this.props.style
              };

        return (
            <Tooltip
                className="input-area"
                title={this.props.tooltip}
                mouseEnterDelay={0.5}
            >
                <FormWrapper {...formWrapperProps}>
                    <Form.Item
                        label={
                            this.props.label
                                ? counterpart.translate(this.props.label)
                                : ""
                        }
                        validateStatus={error ? "error" : null}
                        help={error ? error : null}
                    >
                        {rightLabelContainer}
                        {this.props.useHR && <hr />}
                        <div className="inline-label input-wrapper">
                            {accountImageContainer}
                            {formContainer}
                            {searchInProgress ? (
                                <AntIcon type="loading" style={{padding: 10}} />
                            ) : null}
                            {lockedStateContainer}
                            {this.props.children}
                            {this.props.onAction ? (
                                <Tooltip
                                    title={counterpart.translate(
                                        "tooltip.required_input",
                                        {
                                            type: counterpart.translate(
                                                "global.field_type.account"
                                            )
                                        }
                                    )}
                                >
                                    <Button
                                        type="primary"
                                        disabled={disabledAction}
                                        onClick={this.onAction.bind(this)}
                                    >
                                        <Translate
                                            content={this.props.action_label}
                                        />
                                    </Button>
                                </Tooltip>
                            ) : null}
                        </div>
                    </Form.Item>
                </FormWrapper>
            </Tooltip>
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
