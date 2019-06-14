import React from "react";
import {Modal} from "bitshares-ui-style-guide";
import PropTypes from "prop-types";

export default class CreateMarketModal extends Modal {
    render() {
        return (
            <Modal
                visible={this.props.show}
                onCancel={this.props.onClose}
                overlay={true}
            >
                <div>CreateMarketModal</div>
            </Modal>
        );
    }
}

CreateMarketModal.propTypes = {
    show: PropTypes.bool,
    onClose: PropTypes.func,
    currentAccountId: PropTypes.string
};

CreateMarketModal.defaultProps = {
    show: false
};
