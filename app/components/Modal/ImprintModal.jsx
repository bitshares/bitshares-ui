import React from "react";
import PropTypes from "prop-types";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import BaseModal from "./BaseModal";
import Translate from "react-translate-component";

class ImprintModal extends React.Component {
    _onConfirm = e => {
        e.preventDefault();
        ZfApi.publish(this.props.modalId, "close");
    };

    show() {
        ZfApi.publish(this.props.modalId, "open");
    }

    render() {
        return (
            <BaseModal id={this.props.modalId} overlay={true}>
                <h1>Imprint</h1>
                <strong>Liquidblocks ApS</strong>
                <br />
                Gl. Kongevej 60<br />
                1850 Frederiksberg<br />
                <br />
                Denmark<br />
                <br />
                CVR: 39950030<br />
                <br />
                <a href="https://liquid-blocks.com" target="_blank">
                    www.liquid-blocks.com
                </a>
                <br />
                <br />
                <a href="mailto:info@liquid-blocks.com">
                    info@liquid-blocks.com
                </a>
                <br />
                <br />
                <br />
                <button className="button" onClick={this._onConfirm}>
                    <Translate content="modal.ok" />
                </button>
            </BaseModal>
        );
    }
}

ImprintModal.defaultProps = {
    modalId: "imprint_modal"
};

ImprintModal.propTypes = {
    modalId: PropTypes.string.isRequired
};

export default ImprintModal;
