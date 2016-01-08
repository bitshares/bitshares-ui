import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";
import AccountActions from "actions/AccountActions";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountNameInput from "../Forms/AccountNameInput";

class CreatePrivateAccountModal extends React.Component {

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
        console.log("-- CreatePrivateAccountModal._onCreateClick -->");
        AccountActions.addPrivateAccount(this.state.label);
        ZfApi.publish("add_private_account_modal", "close");
    }

    _onLabelChange({value}) {
        if (!value) return;
        console.log("-- CreatePrivateAccountModal._onLabelChange -->",  value);
        this.setState({label: value});
    }

    render() {
        return (<Modal id="add_private_account_modal" overlay>
            <Trigger close="add_private_account_modal">
                <a href="#" className="close-button">&times;</a>
            </Trigger>
            <h3>Create Private Account</h3>
            <form style={{paddingTop: "1rem"}}>
                <div className="form-group">
                    <AccountNameInput ref="label" cheapNameOnly={false}
                                      onChange={this._onLabelChange}
                                      accountShouldNotExist={false}
                                      labelMode
                    />
                </div>
                <div className="form-group">
                    <label>
                        Private Key
                        <input type="text"/>
                    </label>
                </div>
                <div className="form-group">
                    <label>
                        Public Key
                        <input type="text"/>
                    </label>
                </div>
                <div className="button-group">
                    <a className="button" href onClick={this._onCreateClick}>Create Account</a>
                    <Trigger close="add_private_account_modal"><a href className="secondary button">Cancel</a></Trigger>
                </div>
            </form>
        </Modal>);
    }

}

export default CreatePrivateAccountModal;
