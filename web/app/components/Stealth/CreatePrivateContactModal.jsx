import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountNameInput from "../Forms/AccountNameInput";
import AccountSelect from "../Forms/AccountSelect";
import Translate from "react-translate-component";
import PrivateKeyInput from "../Forms/PrivateKeyInput";
import WalletDb from "stores/WalletDb";
import {PublicKey} from "@graphene/ecc";

class CreatePrivateContactModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = { label: "", public_key: "" };
        
        ZfApi.subscribe("add_private_contact_modal", (name, msg) => {
            if(name !== "add_private_contact_modal") return
            if (msg === "open") { setTimeout(()=> this.refs.label.focus(), 100) }
        })
        
        this._onCreateClick = this._onCreateClick.bind(this);
        this._onLabelChange = this._onLabelChange.bind(this);
        this._onKeyChange = this._onKeyChange.bind(this);
    }

    clear() {
        this.refs.label.clear();
        this.setState({label: "", public_key: ""});
    }

    _onCreateClick() {
        ZfApi.publish("add_private_contact_modal", "close");
        const label = this.state.label.slice(1);
        try {
            AccountActions.addPrivateContact(label, this.state.public_key);
        }
        catch (error) {
            console.error("-- CreatePrivateContactModal._onCreateClick -->", error);
            alert(error);
        }
    }

    _onLabelChange({value}) {
        if (!value) return;
        this.setState({ label: value });
    }

    _onKeyChange({ private_key, public_key }) {
        this.setState({ public_key });
    }

    render() {
        const pubkey = this.state.public_key;
        let error = PublicKey.fromPublicKeyString(pubkey) ? null : (pubkey ? "Not valid key" : null);
        const cwallet = WalletDb.getState().cwallet;
        const existing_label = !WalletDb.isLocked() && cwallet.getKeyLabel(pubkey);
        if(!error && existing_label) error = "Key exists";
        const submit_class = error ? "button disabled" : "button";

        return (<Modal id="add_private_contact_modal" overlay>
            <Trigger close="add_private_contact_modal">
                <a href="#" className="close-button">&times;</a>
            </Trigger>
            <h3>Create Private Contact</h3>
            <form style={{paddingTop: "1rem"}} autoComplete="off">
                <div className="form-group">
                    <AccountNameInput ref="label" cheapNameOnly={false}
                        onChange={this._onLabelChange}
                        onEnter={this._onCreateClick}
                        accountShouldNotExist={false}
                        prefixSymbol="~"
                        labelMode
                    />
                </div>
                <div className="full-width-content form-group">
                    <PrivateKeyInput ref="key" onChange={this._onKeyChange} publicKeyOnly onEnter={this._onCreateClick} pubKeyError={error} />
                </div>
                <div className="button-group">
                    <a className={submit_class} href onClick={this._onCreateClick}>Create Contact</a>
                    <Trigger close="add_private_contact_modal"><a href className="secondary button">Cancel</a></Trigger>
                </div>
            </form>
        </Modal>);
    }

}

export default CreatePrivateContactModal;
