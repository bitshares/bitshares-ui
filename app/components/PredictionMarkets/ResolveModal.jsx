import React from "react";
import {Modal, Input, Form, Switch, Button} from "bitshares-ui-style-guide";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import counterpart from "counterpart";

export default class ResolveModal extends Modal {
    constructor(props) {
        super(props);
        this.state = {
            resolveParameters: {
                asset_id: this.props.market.asset_id,
                result: "no"
            },
            isChecked: false
        };

        this.handleResultChange = this.handleResultChange.bind(this);
    }

    handleResultChange() {
        const isChecked = !this.state.isChecked;
        const result =
            this.state.resolveParameters.result === "no" ? "yes" : "no";
        this.setState({
            resolveParameters: {
                ...this.state.resolveParameters,
                result
            },
            isChecked
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
                visible={this.props.show}
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
                                    value={this.props.market.symbol}
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.add_opinion_modal.condition" />
                                <Input
                                    type="text"
                                    disabled={true}
                                    tabIndex={2}
                                    value={this.props.market.condition}
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.add_opinion_modal.opinion" />
                            </label>
                            <Translate
                                content="prediction.add_opinion_modal.no"
                                style={{marginRight: "10px"}}
                            />
                            <Switch
                                checked={this.state.isChecked}
                                onChange={this.handleResultChange}
                            />
                            <Translate
                                content="prediction.add_opinion_modal.yes"
                                style={{marginLeft: "10px"}}
                            />
                        </Form.Item>
                    </Form>
                </div>
            </Modal>
        );
    }
}

ResolveModal.propTypes = {
    market: PropTypes.any.isRequired,
    onResolveMarket: PropTypes.func.isRequired,
    show: PropTypes.bool,
    onClose: PropTypes.func
};

ResolveModal.defaultProps = {
    show: false,
    market: null
};
