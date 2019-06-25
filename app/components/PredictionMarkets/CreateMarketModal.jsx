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
                symbol: null,
                resolution_date: null,
                backing_asset: null,
                participation_fee: null,
                feeAsset: null
            },
            showWarning: true
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleAssetChange = this.handleAssetChange.bind(this);
        this.handleFeeChange = this.handleFeeChange.bind(this);
    }

    handleChange(event) {
        let newMarket = this.state.newMarketParameters;
        newMarket.issuer = this.props.currentAccountId;
        newMarket.asset_id = this.props.newMarketId;
        switch (event.target.name) {
            case "symbol":
                newMarket.symbol = event.target.value;
                break;
            case "condition":
                newMarket.condition = event.target.value;
                break;
            case "description":
                newMarket.description = event.target.value;
                break;
            case "resolution_date":
                newMarket.resolution_date = event.target.value;
                break;
        }
        if (this.checkFullBlank()) {
            this.setState({
                newMarketParameters: newMarket,
                showWarning: false
            });
        } else {
            this.setState({
                newMarketParameters: newMarket,
                showWarning: true
            });
        }
    }

    handleAssetChange(asset) {
        if (asset) {
            let newMarket = this.state.newMarketParameters;
            newMarket.backing_asset = asset;
            newMarket.issuer = this.props.currentAccountId;
            newMarket.asset_id = this.props.newMarketId;
            this.setState({newMarketParameters: newMarket});
            if (this.checkFullBlank()) {
                this.setState({showWarning: false});
            } else {
                this.setState({showWarning: true});
            }
        }
    }

    handleFeeChange({asset}) {
        function handleWarning() {
            if (this.checkFullBlank()) {
                this.setState({showWarning: false});
            } else {
                this.setState({showWarning: true});
            }
        }

        let newMarket = this.state.newMarketParameters;
        newMarket.feeAsset = asset;
        if (typeof asset === "string") {
            this.setState({newMarketParameters: newMarket}, handleWarning);
        }
    }

    checkFullBlank() {
        return this.state.newMarketParameters.symbol &&
            this.state.newMarketParameters.asset_id &&
            this.state.newMarketParameters.issuer &&
            this.state.newMarketParameters.condition &&
            this.state.newMarketParameters.description &&
            this.state.newMarketParameters.resolution_date &&
            typeof this.state.newMarketParameters.backing_asset === "string" &&
            typeof this.state.newMarketParameters.feeAsset === "string"
            ? true
            : false;
    }

    render() {
        let onOkFunction;

        if (this.checkFullBlank()) {
            onOkFunction = () =>
                this.props.getNewMarketParameters(
                    this.state.newMarketParameters
                );
        } else {
            onOkFunction = () => {};
        }

        return (
            <Modal
                title={
                    <Translate content="prediction.create_market_modal.title" />
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
                                <Translate content="prediction.create_market_modal.symbol" />
                                <Input
                                    name="symbol"
                                    type="text"
                                    onChange={this.handleChange}
                                    tabIndex={1}
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.create_market_modal.condition" />
                                <Input
                                    name="condition"
                                    type="text"
                                    onChange={this.handleChange}
                                    tabIndex={2}
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.create_market_modal.description" />
                                <Input.TextArea
                                    name="description"
                                    onChange={this.handleChange}
                                    tabIndex={3}
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.create_market_modal.resolution_date" />
                                <Input
                                    name="resolution_date"
                                    type="date"
                                    onChange={this.handleChange}
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
                                    asset={
                                        this.state.newMarketParameters
                                            .backing_asset
                                    }
                                    onChange={this.handleAssetChange}
                                    tabIndex={5}
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.create_market_modal.participation_fee" />
                                <AmountSelector
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
                                    asset={
                                        this.state.newMarketParameters.feeAsset
                                    }
                                    onChange={this.handleFeeChange}
                                />
                            </label>
                        </Form.Item>
                        <div>
                            {this.state.showWarning ? (
                                <Translate content="prediction.create_market_modal.warning" />
                            ) : null}
                        </div>
                    </Form>
                </div>
            </Modal>
        );
    }
}

CreateMarketModal.propTypes = {
    show: PropTypes.bool,
    onClose: PropTypes.func,
    currentAccountId: PropTypes.string,
    getNewMarketParameters: PropTypes.func,
    newMarketId: PropTypes.string
};

CreateMarketModal.defaultProps = {
    show: false
};
