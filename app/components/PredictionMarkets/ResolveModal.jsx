import React from "react";
import {Modal, Input, Form, Switch} from "bitshares-ui-style-guide";
import PropTypes from "prop-types";
import Translate from "react-translate-component";

export default class ResolveModal extends Modal {
    constructor(props) {
        super(props);
        this.state = {
            resolveParameters: {
                asset_id: this.props.market.asset_id,
                result: "no"
            },
            bool_result: false
        };

        this.handleResultChange = this.handleResultChange.bind(this);
    }

    handleResultChange() {
        let newResolveParameters = this.state.resolveParameters;
        newResolveParameters.result =
            newResolveParameters.result === "no" ? "yes" : "no";
        this.setState({
            newResolveParameters,
            bool_result: !this.state.bool_result
        });
    }

    render() {
        return (
            <Modal
                title={<Translate content="prediction.resolve_modal.title" />}
                visible={this.props.show}
                onOk={() => {
                    this.props.getResolveParameters(
                        this.state.resolveParameters
                    );
                }}
                onCancel={this.props.onClose}
                overlay={true}
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
                                checked={this.state.bool_result}
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
    show: PropTypes.bool,
    onClose: PropTypes.func,
    currentAccountId: PropTypes.string,
    market: PropTypes.any.isRequired,
    getResolveParameters: PropTypes.func
};

ResolveModal.defaultProps = {
    show: false,
    market: null
};
