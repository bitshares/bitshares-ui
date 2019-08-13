import React from "react";
import PropTypes from "prop-types";
import counterpart from "counterpart";
import {Modal, Button} from "bitshares-ui-style-guide";
import Inspector from "react-json-inspector";

export default function JSONModal({operation, visible, hideModal, title}) {
    return (
        <Modal
            title={title || counterpart.translate("explorer.block.op")}
            onCancel={hideModal}
            overlay
            footer={[
                <Button key="cancel" onClick={hideModal}>
                    {counterpart.translate("modal.close")}
                </Button>
            ]}
            visible={visible}
        >
            <Inspector data={operation} search={false} />
        </Modal>
    );
}

JSONModal.propTypes = {
    visible: PropTypes.bool.isRequired,
    hideModal: PropTypes.func.isRequired,
    operation: PropTypes.array,
    title: PropTypes.string
};

JSONModal.defaultProps = {
    title: null,
    operation: []
};
