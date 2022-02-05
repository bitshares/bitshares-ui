import React from "react";
import {
    Modal,
    Input,
    Form,
    Button,
    Tooltip,
    Icon,
    DatePicker
} from "bitshares-ui-style-guide";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import AssetSelect from "../Utility/AssetSelect";
import counterpart from "counterpart";
import AssetActions from "actions/AssetActions";
import assetUtils from "common/asset_utils";
import assetConstants from "chain/asset_constants";
import {ChainStore} from "bitsharesjs";
import moment from "moment";

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
                taker_fee_percent: 0,
                symbol: ""
            },
            showWarning: false,
            wrongSymbol: false,
            wrongDate: false,
            core_exchange_rate: {
                quote: {
                    asset_id: null,
                    amount: 1
                },
                base: {
                    asset_id: "1.3.0",
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
        this.onSubmit = this.onSubmit.bind(this);
    }

    _getPermissionsAndFlags() {
        let flagBooleans = assetUtils.getFlagBooleans(0, IS_BITASSET);
        let permissionBooleans = assetUtils.getFlagBooleans("all", IS_BITASSET);

        flagBooleans["charge_market_fee"] = true;
        let flags = assetUtils.getFlags(flagBooleans, IS_BITASSET);
        return {
            flags,
            permissions: assetUtils.getPermissions(
                permissionBooleans,
                IS_BITASSET
            )
        };
    }

    _createAsset() {
        let {marketOptions, core_exchange_rate, bitasset_opts} = this.state;

        const {permissions, flags} = this._getPermissionsAndFlags();
        const description = JSON.stringify(
            this.state.marketOptions.description
        );

        this.setState({inProgress: true});
        const accountId = ChainStore.getAccount(this.props.currentAccount).get(
            "id"
        );
        AssetActions.createAsset(
            accountId,
            marketOptions,
            flags,
            permissions,
            core_exchange_rate,
            IS_BITASSET,
            true,
            bitasset_opts,
            description
        )
            .then(result => {
                this.setState({inProgress: false});
                console.log(
                    "... AssetActions.createAsset(account_id, update)",
                    accountId,
                    marketOptions,
                    flags,
                    permissions
                );
                this.props.onMarketCreated(marketOptions.symbol);
            })
            .catch(error => {
                console.error(error);
                this.setState({inProgress: false});
            });
    }

    handleChange(event) {
        let marketOptions = this.state.marketOptions;
        if (event instanceof moment) {
            event.set("milliseconds", 0);
            event = {
                target: {
                    name: "expiry",
                    value: event.toISOString()
                }
            };
        }
        switch (event.target.name) {
            case "symbol":
                marketOptions[
                    event.target.name
                ] = event.target.value.toUpperCase();
                break;
            case "main":
            case "condition":
            case "expiry":
                marketOptions.description[event.target.name] =
                    event.target.value;
                break;
            default:
                marketOptions[event.target.name] = event.target.value;
                break;
        }
        this.setState({marketOptions});
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

    _forcePositive(number) {
        return parseFloat(number) < 0 ? "0" : number;
    }

    handleFeeChange(event) {
        console.log(event);

        let newMarketOptions = this.state.marketOptions;
        newMarketOptions.market_fee_percent = this._forcePositive(
            event.target.value
        );

        this.setState({
            marketOptions: newMarketOptions
        });
    }

    _isFormValid() {
        if (this.props.symbols.includes(this.state.marketOptions.symbol)) {
            this.setState({wrongSymbol: true});
            return false;
        } else {
            this.setState({wrongSymbol: false});
        }

        let now = new Date();
        let expiry = new Date(this.state.marketOptions.description.expiry);
        if (now > expiry) {
            this.setState({wrongDate: true});
            return false;
        } else {
            this.setState({wrongDate: false});
        }

        return (
            this.state.marketOptions.symbol &&
            this.state.marketOptions.description.main &&
            this.state.marketOptions.description.condition &&
            this.state.marketOptions.description.expiry
        );
    }

    onSubmit(e) {
        if (this._isFormValid()) {
            if (e) {
                e.preventDefault();
            }
            this._createAsset().call(this);
        } else {
            this.setState({showWarning: true});
        }
    }

    render() {
        const {showWarning, marketOptions, wrongSymbol, wrongDate} = this.state;

        const footer = [
            <Button
                type="primary"
                key="submit"
                onClick={this.onSubmit}
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
                visible={this.props.visible}
                onCancel={this.props.onClose}
                overlay={true}
                closable={!this.state.inProgress}
                footer={footer}
            >
                <div className="prediction-markets--create-prediction-market">
                    <Form className="full-width" layout="vertical">
                        <Form.Item>
                            <span
                                className={
                                    (!marketOptions.symbol && showWarning) ||
                                    wrongSymbol
                                        ? "has-error"
                                        : ""
                                }
                            >
                                <label className="left-label">
                                    <Tooltip
                                        title={counterpart.translate(
                                            "prediction.create_market_modal.tooltip_symbol"
                                        )}
                                        placement="topLeft"
                                    >
                                        <Translate content="prediction.create_market_modal.symbol" />
                                        <Icon
                                            style={{
                                                marginLeft: "0.5rem"
                                            }}
                                            theme="filled"
                                            type="question-circle"
                                        />
                                    </Tooltip>
                                    <Input
                                        name="symbol"
                                        type="text"
                                        onChange={this.handleChange}
                                        tabIndex={1}
                                        value={this.state.marketOptions.symbol}
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
                                    <Tooltip
                                        title={counterpart.translate(
                                            "prediction.create_market_modal.tooltip_condition"
                                        )}
                                        placement="topLeft"
                                    >
                                        <Translate content="prediction.create_market_modal.condition" />
                                        <Icon
                                            style={{
                                                marginLeft: "0.5rem"
                                            }}
                                            theme="filled"
                                            type="question-circle"
                                        />
                                    </Tooltip>
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
                                    <Tooltip
                                        title={counterpart.translate(
                                            "prediction.create_market_modal.tooltip_description"
                                        )}
                                        placement="topLeft"
                                    >
                                        <Translate content="prediction.create_market_modal.description" />
                                        <Icon
                                            style={{
                                                marginLeft: "0.5rem"
                                            }}
                                            theme="filled"
                                            type="question-circle"
                                        />
                                    </Tooltip>
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
                                    (!marketOptions.description.expiry &&
                                        showWarning) ||
                                    wrongDate
                                        ? "has-error"
                                        : ""
                                }
                            >
                                <label className="left-label">
                                    <Tooltip
                                        title={counterpart.translate(
                                            "prediction.create_market_modal.tooltip_resolution_date"
                                        )}
                                        placement="topLeft"
                                    >
                                        <Translate content="prediction.create_market_modal.resolution_date" />
                                        <Icon
                                            style={{
                                                marginLeft: "0.5rem"
                                            }}
                                            theme="filled"
                                            type="question-circle"
                                        />
                                    </Tooltip>
                                    <div>
                                        <DatePicker
                                            style={{
                                                width: "100%"
                                            }}
                                            name="expiry"
                                            showTime
                                            placeholder={counterpart.translate(
                                                "prediction.create_market_modal.select_date_and_time"
                                            )}
                                            onChange={this.handleChange}
                                            onOk={this.handleChange}
                                            tabIndex={4}
                                        />
                                    </div>
                                </label>
                            </span>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Tooltip
                                    title={counterpart.translate(
                                        "prediction.create_market_modal.tooltip_backing_asset"
                                    )}
                                    placement="topLeft"
                                >
                                    <Translate content="prediction.create_market_modal.backing_asset" />
                                    <Icon
                                        style={{
                                            marginLeft: "0.5rem"
                                        }}
                                        theme="filled"
                                        type="question-circle"
                                    />
                                </Tooltip>
                                <AssetSelect
                                    assets={[
                                        "1.3.0",
                                        "1.3.113",
                                        "1.3.120",
                                        "1.3.121"
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
                                <Tooltip
                                    title={counterpart.translate(
                                        "prediction.create_market_modal.tooltip_commission"
                                    )}
                                    placement="topLeft"
                                >
                                    <Translate content="prediction.create_market_modal.commission" />
                                    <Icon
                                        style={{
                                            marginLeft: "0.5rem"
                                        }}
                                        theme="filled"
                                        type="question-circle"
                                    />
                                </Tooltip>
                                <Input
                                    tabIndex={6}
                                    type="number"
                                    value={
                                        this.state.marketOptions
                                            .market_fee_percent
                                    }
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
    visible: PropTypes.bool,
    onClose: PropTypes.func,
    currentAccount: PropTypes.string,
    symbols: PropTypes.array,
    onMarketCreated: PropTypes.func
};

CreateMarketModal.defaultProps = {
    visible: false
};
