import React from "react";
import {
    Modal,
    Input,
    Form,
    Switch,
    Button,
    Radio
} from "bitshares-ui-style-guide";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import counterpart from "counterpart";

export default class ResolveModal extends Modal {
    constructor(props) {
        super(props);
        this.state = {
            resolveParameters: {
                asset_id: this.props.predictionMarket.asset_id,
                result: "yes"
            },
            result: "yes"
        };

        this.handleResultChange = this.handleResultChange.bind(this);
    }

    handleResultChange() {
        const result = this.state.result;
        this.setState({
            resolveParameters: {
                ...this.state.resolveParameters,
                result
            },
            result
        });
    }

    render() {
        const footer = [
            <Button
                type="primary"
                key="submit"
                onClick={() =>
                    this.props.onResolveMarket(this.state.resolveParameters)
                }
                disabled={this.state.inProgress}
            >
                {counterpart.translate("global.confirm")}
            </Button>,
            <Button
                key="cancel"
                onClick={this.props.onClose}
                disabled={this.state.inProgress}
            >
                {counterpart.translate("global.cancel")}
            </Button>
        ];

        return (
            <Modal
                title={<Translate content="prediction.resolve_modal.title" />}
                visible={this.props.visible}
                onCancel={this.props.onClose}
                overlay={true}
                closable={!this.state.inProgress}
                footer={footer}
            >
                <div>
                    <Form className="full-width" layout="vertical">
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.add_opinion_modal.symbol" />
                                <Input
                                    type="text"
                                    disabled={true}
                                    tabIndex={1}
                                    value={this.props.predictionMarket.symbol}
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.resolve_modal.prediction" />
                                <Input
                                    type="text"
                                    disabled={true}
                                    tabIndex={2}
                                    value={
                                        this.props.predictionMarket.condition
                                    }
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.resolve_modal.the_prediction_has" />
                            </label>
                            <Radio.Group
                                value={this.state.result}
                                onChange={this.handleResultChange}
                            >
                                <Radio value={"yes"}>
                                    {counterpart.translate(
                                        "prediction.resolve_modal.proven_true"
                                    )}
                                </Radio>
                                <Radio value={"no"}>
                                    {counterpart.translate(
                                        "prediction.resolve_modal.was_incorrect"
                                    )}
                                </Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Form>
                </div>
            </Modal>
        );
    }
}

ResolveModal.propTypes = {
    predictionMarket: PropTypes.any.isRequired,
    onResolveMarket: PropTypes.func.isRequired,
    visible: PropTypes.bool,
    onClose: PropTypes.func
};

ResolveModal.defaultProps = {
    visible: false,
    predictionMarket: null
};
