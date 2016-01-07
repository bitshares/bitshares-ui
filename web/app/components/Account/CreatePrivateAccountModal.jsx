import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";
import AccountActions from "actions/AccountActions";

class CreatePrivateAccountModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {label: ""};
        this._onCreateClick = this._onCreateClick.bind(this);
        this._onLabelChange = this._onLabelChange.bind(this);
    }

    _onCreateClick() {
        console.log("-- CreatePrivateAccountModal._onCreateClick -->");
        AccountActions.addPrivateAccount(this.state.label);
    }

    _onLabelChange(e) {
        this.setState({
            label: e.target.value
        });
    }

    render() {
        return (<Modal id="add_private_account_modal" overlay>
            <Trigger close="add_private_account_modal">
                <a href="#" className="close-button">&times;</a>
            </Trigger>
            <h3>Create Private Account</h3>
            <form style={{paddingTop: "1rem"}}>
                <div className="form-group">
                    <label>
                        Label
                        <input type="text" value={this.state.label} onChange={this._onLabelChange}/>
                    </label>
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
