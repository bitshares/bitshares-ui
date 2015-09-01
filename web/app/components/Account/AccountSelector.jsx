import React from "react";
import utils from "common/utils"
import validation from "common/validation"
import AccountImage from "../Account/AccountImage";
import Translate from "react-translate-component";
import ChainStore from "api/ChainStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";

/**
 * @brief Allows the user to enter an account by name or #ID
 *
 * This component is designed to be stateless as possible.  It's primary responsbility is to
 * manage the layout of data and to filter the user input.
 *
 * Properties:
 *    label         - a translation key for the label
 *    error         - a transaltion key for the error message override, displayed when there is otherwise no error
 *    onChange      - a method to be called any time user input changes
 *    placeholder   - the placeholder text to be displayed when there is no user_input
 *    accountName   - the current value of the account selector, the string the user enters
 *    account       - account object retrieved via BindToChainState decorator
 *    tabIndex      - tabindex property to be passed to input tag
 *
 */

@BindToChainState()
class AccountSelector extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount
    }

    // can be used in parent component: this.refs.account_selector.getAccount()
    getAccount() {
        return this.props.account;
    }

    getNameType(value) {
        if(!value) return null;
        if(value[0] === "#" && utils.is_object_id("1.2." + value.substring(1))) return "id";
        if(validation.is_account_name(value)) return "name";
        return null;
    }

    onInputChanged(event) {
        let value = event.target.value.trim().toLowerCase();
        if
        (   this.props.onChange
            && (value.length < 4 || this.getNameType(value))
            && value !== this.props.accountName
        ) this.props.onChange(value);
    }

    onKeyDown(e) {
        if (event.keyCode === 13) this.onInputChanged(e);
    }

    render() {
        //console.log("-- AccountSelector.render -->", this.props.accountName, this.props.account ? this.props.account.toJS().name : "-");
        let error = this.props.error;
        if (!error && this.props.accountName && !this.getNameType(this.props.accountName))
            error = "invalid account name";

        let lookup_display = null;
        if(this.props.account) {
            let type = this.getNameType(this.props.accountName);
            if(type === "name") lookup_display = "#" + this.props.account.get("id").substring(4);
            else if(type === "id") lookup_display = this.props.account.get("name");
        }

        let member_status = null;
        if (this.props.account)
            member_status = ChainStore.getAccountMemberStatus(this.props.account);

        return (
            <div className="account-selector no-overflow">
                <AccountImage size={{height: 80, width: 80}}
                              account={this.props.account?this.props.account.get('name'):null} custom_image={null}/>

                <div className="content-area">
                    <div className="header-area">
                        <div className="right-label"><span>{member_status}</span> &nbsp; <span>{lookup_display}</span></div>
                        <Translate component="label" content={this.props.label}/>
                    </div>
                    <div className="input-area">
                      <span className="inline-label">
                      <input type="text"
                             value={this.props.accountName}
                             defaultValue={this.props.accountName}
                             placeholder={this.props.placeholder}
                             ref="user_input"
                             onChange={this.onInputChanged.bind(this)}
                             onKeyDown={this.onKeyDown.bind(this)}
                             tabIndex={this.props.tabIndex}
                          />
                          { !this.props.onAction ? null : (
                              <button className={this.props.action_class}
                                      onClick={this.props.onAction}>
                                  <Translate content={this.props.action_label}/></button>
                          )}
                      </span>
                    </div>
                    <div className="error-area">
                        <span>{error}</span>
                    </div>
                </div>
            </div>
        )

    }

}
export default AccountSelector;
