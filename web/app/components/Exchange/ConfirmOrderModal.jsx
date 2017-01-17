import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import utils from "common/utils";
import Translate from "react-translate-component";

export default class ConfirmModal extends React.Component {

    show() {
        let modalId = "modal_confirm_" + this.props.type;
        ZfApi.publish(modalId, "open");
    }

    _onForce(value, e) {
        let modalId = "modal_confirm_" + this.props.type;
        e.preventDefault();

        ZfApi.publish(modalId, "close");
        this.props.onForce(value);
    }

    render() {
        let {type, diff} = this.props;

        return (
            <Modal id={"modal_confirm_" + type} overlay={true}>
                <Trigger close={"modal_confirm_" + type}>
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <Translate component="h3" content="transaction.confirm" />
                <div className="grid-block vertical">
                    <Translate content={"exchange.confirm_" + type} diff={utils.format_number(diff, 2)} />
                    <div className="button-group" style={{paddingTop: "2rem"}}>
                        <input onClick={this._onForce.bind(this, false)} className="button info" type="submit" value="No" />
                        <input onClick={this._onForce.bind(this, true)} className="button success" type="submit" value="Yes" />
                    </div>
                </div>
            </Modal>
        );
    }
}
