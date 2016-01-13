import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountNameInput from "../Forms/AccountNameInput";
import AccountSelect from "../Forms/AccountSelect";
import Translate from "react-translate-component";

class CreatePrivateContactModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {label: ""};
        this._onCreateClick = this._onCreateClick.bind(this);
        this._onLabelChange = this._onLabelChange.bind(this);
    }

    clear() {
        this.refs.label.clear();
        this.setState({label: ""});
    }

    _onCreateClick() {
        console.log("-- CreatePrivateContactModal._onCreateClick -->");
        AccountActions.addPrivateContact(this.state.label);
        ZfApi.publish("add_private_contact_modal", "close");
    }

    _onLabelChange({value}) {
        if (!value) return;
        console.log("-- CreatePrivateAccountModal._onLabelChange -->", value);
        this.setState({label: value});
    }

    _onPayFromChange(account) {
        console.log("-- CreatePrivateContactModal._onPayFromChange -->", account);
    }

    render() {
        let my_accounts = AccountStore.getMyAccounts();
        return (<Modal id="add_private_contact_modal" overlay>
            <Trigger close="add_private_contact_modal">
                <a href="#" className="close-button">&times;</a>
            </Trigger>
            <h3>Create Private Contact</h3>
            <form style={{paddingTop: "1rem"}}>
                <div className="form-group">
                    <AccountNameInput ref="label" cheapNameOnly={false}
                        onChange={this._onLabelChange}
                        accountShouldNotExist={false}
                        labelMode
                    />
                </div>
                <div className="full-width-content form-group">
                    <label><Translate content="account.pay_from" /></label>
                    <AccountSelect account_names={my_accounts}
                        onChange={this._onPayFromChange.bind(this)}
                    />
                </div>
                <div className="button-group">
                    <a className="button" href onClick={this._onCreateClick}>Create Contact</a>
                    <Trigger close="add_private_contact_modal"><a href className="secondary button">Cancel</a></Trigger>
                </div>
            </form>
        </Modal>);
    }

}

export default CreatePrivateContactModal;
