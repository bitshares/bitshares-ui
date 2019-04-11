/**
 * CBModal component
 *
 * Renders a modal dialog with a standard layout, the content provided by props.children,
 * and open & close functionality. It can be used to create other modal dialogs.
 */
import React, {Component} from "react";
import BaseModal from "components/Modal/BaseModal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";

class CBModal extends Component {
    constructor(props) {
        super(props);

        this.show = this.show.bind(this);
        this.close = this.close.bind(this);
    }

    /**
     * Displays the modal dialog
     */
    show = () => {
        ZfApi.publish(this.props.id, "open");
    };

    /**
     * Closes the modal dialog
     */
    close = () => {
        ZfApi.publish(this.props.id, "close");
    };

    render() {
        return (
            <BaseModal id={this.props.id} overlay={true} noLogo={true}>
                <div className="cb-modal__header">
                    {this.props.title ? (
                        <h1 className="cb-modal__title">{this.props.title}</h1>
                    ) : null}
                    <a href="#" className="close-button" onClick={this.close}>
                        ×
                    </a>
                </div>

                <div className="cb-modal__content">{this.props.children}</div>
            </BaseModal>
        );
    }
}

export default CBModal;
