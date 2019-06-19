import React from "react";
import {Modal, Input, Form} from "bitshares-ui-style-guide";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import AssetSelect from "../Utility/AssetSelect";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";

export default class CreateMarketModal extends Modal {
    constructor(props) {
        super(props);
        this.state = {
            newMarketParameters: {
                asset_id: null,
                issuer: null,
                condition: null,
                description: null,
                odds: null,
                symbol: null,
                resolution_date: null,
                backing_asset: null,
                participation_fee: null
            }
        };

        this.handleSymbolChange = this.handleSymbolChange.bind(this);
        this.handleConditionChange = this.handleConditionChange.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
        this.handleDateChange = this.handleDateChange.bind(this);
        this.onAssetChange = this.onAssetChange.bind(this);
        this.onFeeChange = this.onFeeChange.bind(this);
    }

    handleSymbolChange(event) {
        let newMarket = this.state.newMarketParameters;
        newMarket.symbol = event.target.value;
        this.setState({newMarketParameters: newMarket});
    }

    handleConditionChange(event) {
        let newMarket = this.state.newMarketParameters;
        newMarket.condition = event.target.value;
        this.setState({newMarketParameters: newMarket});
    }

    handleDescriptionChange(event) {
        let newMarket = this.state.newMarketParameters;
        newMarket.description = event.target.value;
        this.setState({newMarketParameters: newMarket});
    }

    handleDateChange(event) {
        let newMarket = this.state.newMarketParameters;
        newMarket.resolution_date = event.target.value;
        this.setState({newMarketParameters: newMarket});
    }

    onAssetChange() {}

    onFeeChange() {}

    render() {
        return (
            <Modal
                title={
                    <Translate content="prediction.create_market_modal.title" />
                }
                visible={this.props.show}
                onOk={() => {
                    this.props.getNewMarketParameters(
                        this.state.newMarketParameters
                    );
                }}
                onCancel={this.props.onClose}
                overlay={true}
            >
                <div>
                    <Form className="full-width" layout="vertical">
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.create_market_modal.symbol" />
                                <Input
                                    type="text"
                                    onChange={this.handleSymbolChange}
                                    tabIndex={1}
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.create_market_modal.condition" />
                                <Input
                                    type="text"
                                    onChange={this.handleConditionChange}
                                    tabIndex={2}
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.create_market_modal.description" />
                                <Input.TextArea
                                    onChange={this.handleDescriptionChange}
                                    tabIndex={3}
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.create_market_modal.resolution_date" />
                                <Input
                                    type="date"
                                    onChange={this.handleDateChange}
                                    tabIndex={4}
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.create_market_modal.backing_asset" />
                                <AssetSelect
                                    assets={[
                                        "1.3.113",
                                        "1.3.120",
                                        "1.3.121",
                                        "1.3.1325",
                                        "1.3.105",
                                        "1.3.106",
                                        "1.3.103"
                                    ]}
                                    onChange={this.onAssetChange}
                                    tabIndex={5}
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.create_market_modal.participation_fee" />
                                <AmountSelector
                                    onChange={this.onFeeChange}
                                    tabIndex={6}
                                    disabled={true}
                                    assets={[
                                        "1.3.113",
                                        "1.3.120",
                                        "1.3.121",
                                        "1.3.1325",
                                        "1.3.105",
                                        "1.3.106",
                                        "1.3.103"
                                    ]}
                                />
                            </label>
                        </Form.Item>
                    </Form>
                </div>
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
