import React from "react";
import {Modal, Input, Form, Button} from "bitshares-ui-style-guide";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import AssetSelect from "../Utility/AssetSelect";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";
import counterpart from "counterpart";
import AssetActions from "actions/AssetActions";
import assetUtils from "common/asset_utils";
import assetConstants from "chain/asset_constants";
import {ChainStore} from "bitsharesjs";

const IS_BITASSET = true;

export default class CreateMarketModal extends Modal {
    constructor(props) {
        super(props);
        this.state = {
            marketOptions: {
                precision: "5",
                max_supply: 100000,
                max_market_fee: 0,
                market_fee_percent: 0,
                description: {main: ""},
                reward_percent: 0,
                symbol: ""
            },
            showWarning: false,
            core_exchange_rate: {
                quote: {
                    asset_id: null,
                    amount: 1
                },
                base: {
                    asset_id: "1.3.0", //TODO
                    amount: 1
                }
            },
            bitasset_opts: {
                feed_lifetime_sec: 60 * 60 * 24,
                minimum_feeds: 7,
                force_settlement_delay_sec: 60 * 60 * 24,
                force_settlement_offset_percent:
                    1 * assetConstants.GRAPHENE_1_PERCENT,
                maximum_force_settlement_volume:
                    20 * assetConstants.GRAPHENE_1_PERCENT,
                short_backing_asset: "1.3.0"
            },
            inProgress: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleAssetChange = this.handleAssetChange.bind(this);
        this.handleFeeChange = this.handleFeeChange.bind(this);
        this.onOk = this.onOk.bind(this);
    }

    _getPermissions() {
        let flagBooleans = assetUtils.getFlagBooleans(0, IS_BITASSET);
        let permissionBooleans = assetUtils.getFlagBooleans("all", IS_BITASSET);

        return {
            flagBooleans,
            permissionBooleans
        };
    }

    _createAsset(e) {
        if (e) {
            e.preventDefault();
        }
        const {flagBooleans, permissionBooleans} = this._getPermissions();

        let {marketOptions, core_exchange_rate, bitasset_opts} = this.state;

        const accountId = ChainStore.getAccount(this.props.currentAccount).get(
            "id"
        );

        let flags = assetUtils.getFlags(flagBooleans, IS_BITASSET);
        let permissions = assetUtils.getPermissions(
            permissionBooleans,
            IS_BITASSET
        );

        const description = JSON.stringify(
            this.state.marketOptions.description
        );
        this.setState({inProgress: true});
        const creationPromise = AssetActions.createAsset(
            accountId,
            marketOptions,
            flags,
            permissions,
            core_exchange_rate,
            IS_BITASSET,
            true,
            bitasset_opts,
            description
        );
        creationPromise
            .then(result => {
                this.setState({inProgress: false});
                console.log(
                    "... AssetActions.createAsset(account_id, update)",
                    accountId,
                    marketOptions,
                    flags,
                    permissions
                );
            })
            .catch(error => {
                console.error(error);
                this.setState({inProgress: false});
            });
    }

    handleChange(event) {
        let newMarket = this.state.marketOptions;
        switch (event.target.name) {
            case "main":
            case "condition":
            case "expiry":
                newMarket.description[event.target.name] = event.target.value;
                break;
            default:
                newMarket[event.target.name] = event.target.value;
                break;
        }
        this.setState({marketOptions: newMarket});
    }

    handleAssetChange(asset) {
        if (asset) {
            let newBitassetOpts = this.state.bitasset_opts;
            let newMarketOptions = this.state.marketOptions;
            let newCoreExchangeRate = this.state.core_exchange_rate;
            newBitassetOpts.short_backing_asset = asset;
            newMarketOptions.precision = ChainStore.getAsset(asset).get(
                "precision"
            );
            newCoreExchangeRate.base.asset_id = asset;
            this.setState({
                bitasset_opts: newBitassetOpts,
                core_exchange_rate: newCoreExchangeRate,
                marketOptions: newMarketOptions
            });
        }
    }

    handleFeeChange({asset}) {
        // let newMarket = this.state.marketOptions;
        // newMarket.feeAsset = asset;
        // if (typeof asset === "string") {
        //     this.setState({marketOptions: newMarket}, handleWarning);
        // }
    }

    _isFormValid() {
        return (
            this.state.marketOptions.symbol &&
            this.state.marketOptions.description.main &&
            this.state.marketOptions.description.condition &&
            this.state.marketOptions.description.expiry
        );
    }

    onOk(e) {
        if (this._isFormValid()) {
            this._createAsset.call(this, e);
        } else {
            this.setState({showWarning: true});
        }
    }

    render() {
        const {showWarning, marketOptions} = this.state;

        const footer = [
            <Button
                type="primary"
                key="submit"
                onClick={this.onOk}
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
                title={
                    <Translate content="prediction.create_market_modal.title" />
                }
                visible={this.props.show}
                onCancel={this.props.onClose}
                overlay={true}
                closable={!this.state.inProgress}
                footer={footer}
            >
                <div>
                    <Form className="full-width" layout="vertical">
                        <Form.Item>
                            <span
                                className={
                                    !marketOptions.symbol && showWarning
                                        ? "has-error"
                                        : ""
                                }
                            >
                                <label className="left-label">
                                    <Translate content="prediction.create_market_modal.symbol" />
                                    <Input
                                        name="symbol"
                                        type="text"
                                        onChange={this.handleChange}
                                        tabIndex={1}
                                    />
                                </label>
                            </span>
                        </Form.Item>
                        <Form.Item>
                            <span
                                className={
                                    !marketOptions.description.condition &&
                                    showWarning
                                        ? "has-error"
                                        : ""
                                }
                            >
                                <label className="left-label">
                                    <Translate content="prediction.create_market_modal.condition" />
                                    <Input
                                        name="condition"
                                        type="text"
                                        onChange={this.handleChange}
                                        tabIndex={2}
                                    />
                                </label>
                            </span>
                        </Form.Item>
                        <Form.Item>
                            <span
                                className={
                                    !marketOptions.description.main &&
                                    showWarning
                                        ? "has-error"
                                        : ""
                                }
                            >
                                <label className="left-label">
                                    <Translate content="prediction.create_market_modal.description" />
                                    <Input.TextArea
                                        name="main"
                                        onChange={this.handleChange}
                                        tabIndex={3}
                                    />
                                </label>
                            </span>
                        </Form.Item>
                        <Form.Item>
                            <span
                                className={
                                    !marketOptions.description.expiry &&
                                    showWarning
                                        ? "has-error"
                                        : ""
                                }
                            >
                                <label className="left-label">
                                    <Translate content="prediction.create_market_modal.resolution_date" />
                                    <Input
                                        name="expiry"
                                        type="date"
                                        onChange={this.handleChange}
                                        tabIndex={4}
                                    />
                                </label>
                            </span>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.create_market_modal.backing_asset" />
                                <AssetSelect
                                    assets={[
                                        "1.3.0",
                                        "1.3.1",
                                        "1.3.2",
                                        "1.3.3",
                                        "1.3.4"
                                    ]}
                                    value={
                                        this.state.bitasset_opts
                                            .short_backing_asset
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
                                    asset={this.state.marketOptions.feeAsset}
                                    onChange={this.handleFeeChange}
                                />
                            </label>
                        </Form.Item>
                        {this.state.inProgress ? (
                            <Translate content="footer.loading" />
                        ) : null}
                    </Form>
                </div>
            </Modal>
        );
    }
}

CreateMarketModal.propTypes = {
    show: PropTypes.bool,
    onClose: PropTypes.func,
    currentAccount: PropTypes.string,
    newMarketId: PropTypes.string
};

CreateMarketModal.defaultProps = {
    show: false
};
