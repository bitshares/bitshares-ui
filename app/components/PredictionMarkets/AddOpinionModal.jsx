import React from "react";
import {Modal, Input, Form, Switch} from "bitshares-ui-style-guide";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";

export default class AddOpinionModal extends Modal {
    constructor(props) {
        super(props);
        this.state = {
            newOpinionParameters: {
                order_id: null,
                opinionator: null,
                opinion: this.props.preselectedOpinion,
                amount: this.props.preselectedAmount,
                fee: null
            },
            bool_opinion:
                this.props.preselectedOpinion === "yes" ? true : false,
            showWarning: true,
            selectedAsset: null
        };

        this.handleOpinionChange = this.handleOpinionChange.bind(this);
        this.handleAmountChange = this.handleAmountChange.bind(this);
    }

    handleOpinionChange() {
        let newOpinion = this.state.newOpinionParameters;
        newOpinion.opinion = newOpinion.opinion === "no" ? "yes" : "no";
        newOpinion.opinionator = this.props.currentAccountId;
        newOpinion.order_id = this.props.newOpinionId;
        this.setState({
            newOpinionParameters: newOpinion,
            bool_opinion: !this.state.bool_opinion
        });
    }

    handleAmountChange({amount, asset}) {
        function handleWarning() {
            if (this.checkFullBlank()) {
                this.setState({showWarning: false});
            } else {
                this.setState({showWarning: true});
            }
        }

        if (amount) {
            let newOpinion = this.state.newOpinionParameters;
            newOpinion.amount = amount;
            newOpinion.opinionator = this.props.currentAccountId;
            newOpinion.order_id = this.props.newOpinionId;
            this.setState({newOpinionParameter: newOpinion}, handleWarning);
        }

        if (typeof asset === "string") {
            this.setState({selectedAsset: asset}, handleWarning);
        }
    }

    checkFullBlank() {
        return this.state.newOpinionParameters.amount &&
            this.state.selectedAsset
            ? true
            : false;
    }

    render() {
        let onOkFunction;

        if (this.checkFullBlank()) {
            onOkFunction = () =>
                this.props.getNewOpinionParameters(
                    this.state.newOpinionParameters
                );
        } else {
            onOkFunction = () => {};
        }

        return (
            <Modal
                title={
                    <Translate content="prediction.add_opinion_modal.title" />
                }
                visible={this.props.show}
                onOk={() => {
                    onOkFunction();
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
                                checked={this.state.bool_opinion}
                                onChange={this.handleOpinionChange}
                            />
                            <Translate
                                content="prediction.add_opinion_modal.yes"
                                style={{marginLeft: "10px"}}
                            />
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.add_opinion_modal.amount" />
                                <AmountSelector
                                    onChange={this.handleAmountChange}
                                    placeholder="0.0"
                                    tabIndex={6}
                                    amount={
                                        this.state.newOpinionParameters.amount
                                    }
                                    assets={[
                                        "1.3.113",
                                        "1.3.120",
                                        "1.3.121",
                                        "1.3.1325",
                                        "1.3.105",
                                        "1.3.106",
                                        "1.3.103"
                                    ]}
                                    asset={this.state.selectedAsset}
                                />
                            </label>
                        </Form.Item>
                        <div>
                            {this.state.showWarning ? (
                                <Translate content="prediction.add_opinion_modal.warning" />
                            ) : null}
                        </div>
                    </Form>
                </div>
            </Modal>
        );
    }
}

AddOpinionModal.propTypes = {
    show: PropTypes.bool,
    onClose: PropTypes.func,
    market: PropTypes.any.isRequired,
    opinion: PropTypes.any,
    currentAccountId: PropTypes.string,
    getNewOpinionParameters: PropTypes.func,
    newOpinionId: PropTypes.string,
    preselectedOpinion: PropTypes.string,
    preselectedAmount: PropTypes.number
};

AddOpinionModal.defaultProps = {
    show: false,
    market: null,
    opinion: {}
};
