import React from "react";
import utils from "common/utils";
import AccountImage from "../Account/AccountImage";
import Translate from "react-translate-component";
import {ChainStore, PublicKey, ChainValidation} from "graphenejs-lib";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import classnames from "classnames";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";

/**
 * @brief Allows the user to enter an account by name or #ID
 *
 * This component is designed to be stateless as possible.  It's primary responsbility is to
 * manage the layout of data and to filter the user input.
 *
 */

class AccountSelector extends React.Component {

    static propTypes = {
        label: React.PropTypes.string.isRequired, // a translation key for the label
        error: React.PropTypes.element, // the error message override
        placeholder: React.PropTypes.string, // the placeholder text to be displayed when there is no user_input
        onChange: React.PropTypes.func, // a method to be called any time user input changes
        onAccountChanged: React.PropTypes.func, // a method to be called when existing account is selected
        onAction: React.PropTypes.func, // a method called when Add button is clicked
        accountName: React.PropTypes.string, // the current value of the account selector, the string the user enters
        account: ChainTypes.ChainAccount, // account object retrieved via BindToChainState decorator (not input)
        tabIndex: React.PropTypes.number, // tabindex property to be passed to input tag
        disableActionButton: React.PropTypes.bool, // use it if you need to disable action button,
        allowUppercase: React.PropTypes.bool // use it if you need to allow uppercase letters
    }

    // can be used in parent component: this.refs.account_selector.getAccount()
    getAccount() {
        return this.props.account;
    }

    getError() {
        let error = this.props.error;
        if (!error && this.props.accountName && !this.getNameType(this.props.accountName))
            error = counterpart.translate("account.errors.invalid");
        return error;
    }

    getNameType(value) {
        if(!value) return null;
        if(value[0] === "#" && utils.is_object_id("1.2." + value.substring(1))) return "id";
        if(ChainValidation.is_account_name(value, true)) return "name";
        if(this.props.allowPubKey && PublicKey.fromPublicKeyString(value)) return "pubkey";
        return null;
    }

    onInputChanged(event) {
        let value = event.target.value.trim();
        if (!this.props.allowUppercase) {
            value = value.toLowerCase();
        }
        // If regex matches ^.*#/account/account-name/.*$, parse out account-name
        let newValue = value.match(/(?:#\/account\/)(.*)(?:\/overview)/);
        if (newValue) value = newValue[1];

        if (this.props.onChange && value !== this.props.accountName) this.props.onChange(value);
    }

    onKeyDown(event) {
        if (event.keyCode === 13) this.onAction(event);
    }

    componentDidMount() {
        if(this.props.onAccountChanged && this.props.account)
            this.props.onAccountChanged(this.props.account);
    }

    componentWillReceiveProps(newProps) {
        if((this.props.onAccountChanged && newProps.account) && newProps.account !== this.props.account)
            this.props.onAccountChanged(newProps.account);
    }

    onAction(e) {
        e.preventDefault();
        if(this.props.onAction && !this.getError() && !this.props.disableActionButton) {
            if (this.props.account)
                this.props.onAction(this.props.account);
            else if (this.getNameType(this.props.accountName) === "pubkey")
                this.props.onAction(this.props.accountName);
        }
    }

    render() {
        let error = this.getError();
        let type = this.getNameType(this.props.accountName);
        let lookup_display;
        if (this.props.allowPubKey) {
            if (type === "pubkey") lookup_display = "Public Key";
        } else if (this.props.account) {
            if(type === "name") lookup_display = "#" + this.props.account.get("id").substring(4);
            else if (type === "id") lookup_display = this.props.account.get("name");
        } else if (!error && this.props.accountName) error = counterpart.translate("account.errors.unknown");

        let member_status = null;
        if (this.props.account)
            member_status = counterpart.translate("account.member." + ChainStore.getAccountMemberStatus(this.props.account));

        let action_class = classnames("button", {"disabled" : !(this.props.account || type === "pubkey") || error || this.props.disableActionButton});

        let scamAccountsPolo = [
            "polonie-wallet",
            "polonie-xwallet",
            "poloniex-deposit",
            "poloniex-wallet",
            "poloniexwall-et",
            "poloniexwallett",
            "poloniexwall-t",
            "poloniexwalle",
            "poloniex"
        ];

        let scamAccountsBittrex = [
            "bittrex-deopsit",
            "bittrex-deposi",
            "bittrex-depositt",
            "bittrex-dposit",
            "bittrex"
        ];

        if (scamAccountsPolo.indexOf(this.props.accountName) !== -1) {
            error = counterpart.translate("account.polo_scam");
        }

        if (scamAccountsBittrex.indexOf(this.props.accountName) !== -1) {
            error = counterpart.translate("account.bittrex_scam");
        }

        return (
            <div className="account-selector no-overflow" style={this.props.style}>
                 <div className="content-area">
                    <div className="header-area">
                        {error ? null : <div className="right-label"><span>{member_status}</span> &nbsp; <span>{lookup_display}</span></div>}
                        <Translate component="label" content={this.props.label}/>
                    </div>
                    <div className="input-area">
                      <div className="inline-label">
                          <input type="text"
                                 value={this.props.accountName || ""}
                                 placeholder={this.props.placeholder || counterpart.translate("account.name")}
                                 ref="user_input"
                                 onChange={this.onInputChanged.bind(this)}
                                 onKeyDown={this.onKeyDown.bind(this)}
                                 tabIndex={this.props.tabIndex}/>
                              { this.props.children }
                              { this.props.onAction ? (
                                  <button className={action_class}
                                          onClick={this.onAction.bind(this)}>
                                      <Translate content={this.props.action_label}/></button>
                              ) : null }
                      </div>
                    </div>

                    <div className="error-area">
                        <span>{error}</span>
                    </div>
                </div>
                {type === "pubkey" ? <div className="account-image"><Icon name="key" size="4x"/></div> :
                <AccountImage size={{height: this.props.size || 80, width: this.props.size || 80}}
                              account={this.props.account ? this.props.account.get("name") : null} custom_image={null}/>}
            </div>
        );

    }
}

export default BindToChainState(AccountSelector, {keep_updating: true});
