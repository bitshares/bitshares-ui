import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";

class CreatePrivateContactModal extends React.Component {

    constructor(props) {
        super(props);
        this._onCreateClick = this._onCreateClick.bind(this);
    }

    _onCreateClick() {
        console.log("-- CreatePrivateContactModal._onCreateClick -->");
    }

    render() {
        return (<Modal id="add_private_contact_modal" overlay={true}>
            <Trigger close="add_private_contact_modal">
                <a href="#" className="close-button">&times;</a>
            </Trigger>
            <h3>Create Private Contact</h3>
            <form style={{paddingTop: "1rem"}}>
                <div className="form-group">
                    <label>
                        Label
                        <input type="text"/>
                    </label>
                </div>
                <div className="form-group">
                    <label>
                        Pay From
                        <input type="text"/>
                    </label>
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
