import React from "react";
import {Modal} from "bitshares-ui-style-guide";
import PropTypes from "prop-types";

export default class AddOpinionModal extends Modal {
    render() {
        return (
            <Modal
                visible={this.props.show}
                onCancel={this.props.onClose}
                overlay={true}
            >
                <div>AddOpinionModal</div>
            </Modal>
        );
    }
}

AddOpinionModal.propTypes = {
    show: PropTypes.bool,
    onClose: PropTypes.func,
    market: PropTypes.any.isRequired,
    opinion: PropTypes.any,
    currentAccountId: PropTypes.string
};

AddOpinionModal.defaultProps = {
    show: false,
    market: null,
    opinion: {}
};
