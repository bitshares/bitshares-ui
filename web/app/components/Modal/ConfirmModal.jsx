import React from "react";
import Notification from "react-foundation-apps/src/notification";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";

class ConfirmModal extends React.Component {
    constructor() {
        super();
        this.state = {};
    }

    show(content, confirmText, callback) {
        this.setState({
            content: content,
            confirmText: confirmText,
            callback: callback
        });

        ZfApi.publish(this.props.modalId, "open");
    }

    confirmClicked(e) {
        e.preventDefault();
        ZfApi.publish(this.props.modalId, "close");       
        this.state.callback();   
    }

    render() {
        return (
            <Modal id={this.props.modalId} overlay={true}>
                <Trigger close={this.props.modalId}>
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <div className="grid-block vertical">
                    <div className="shrink grid-content">
                        <p>{this.state.content}</p>
                    </div>
                    <div className="grid-content button-group">
                        <a className="button" href onClick={this.confirmClicked.bind(this)}>{this.state.confirmText}</a>
                        <Trigger close={this.props.modalId}>
                            <a href className="secondary button">Cancel</a>
                        </Trigger>
                    </div>
                </div>
            </Modal>
        );
    }
}

export default ConfirmModal;
