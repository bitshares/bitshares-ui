import React from "react";
import PropTypes from "prop-types";
import counterpart from "counterpart";
import {Modal, Button} from "bitshares-ui-style-guide";

class ChoiceModal extends React.Component {
    static propTypes = {
        choices: PropTypes.array.isRequired,
        content: PropTypes.object
    };

    static defaultProps = {
        content: null
    };

    confirmClicked(callback, e) {
        e.preventDefault();
        setTimeout(() => {
            this.props.hideModal();
        }, 500);
        callback();
    }

    render() {
        const footer = [];

        this.props.choices.map((child, key) => {
            footer.push(
                <Button
                    type="primary"
                    key={key}
                    onClick={this.confirmClicked.bind(this, child.callback)}
                >
                    {counterpart.translate(child.translationKey)}
                </Button>
            );
        });

        footer.push(
            <Button key="cancel" onClick={this.props.hideModal}>
                {counterpart.translate("modal.cancel")}
            </Button>
        );

        return (
            <Modal
                width={600}
                title={counterpart.translate("connection.title_out_of_sync")}
                visible={this.props.visible}
                onCancel={this.props.hideModal}
                footer={footer}
                id={this.props.modalId}
                overlay={true}
            >
                <div className="grid-block vertical">
                    {this.props.content}
                    {React.Children.map(this.props.children, (child, i) => {
                        let props = {};
                        props["key"] = i + "";
                        return React.cloneElement(child, props);
                    })}
                </div>
            </Modal>
        );
    }
}

export default ChoiceModal;
