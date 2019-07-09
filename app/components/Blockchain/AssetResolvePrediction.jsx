import React from "react";
import Translate from "react-translate-component";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import classnames from "classnames";
import AssetActions from "actions/AssetActions";
import counterpart from "counterpart";
import {Radio, Tooltip, Button, Form} from "bitshares-ui-style-guide";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";
import {ChainStore} from "bitsharesjs";
import {Asset, Price} from "../../lib/common/MarketClasses";
import assetUtils from "../../lib/common/asset_utils";

class AssetResolvePrediction extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };

    constructor() {
        super();

        this.state = {
            globalSettlementPrice: null,
            customPrice: false
        };
    }

    shouldComponentUpdate(np, ns) {
        return (
            np.asset.id !== this.props.asset.id ||
            ns.globalSettlementPrice !== this.state.globalSettlementPrice ||
            ns.customPrice !== this.state.customPrice
        );
    }

    onPriceChanged(value) {
        if (value == 2 && !this.state.customPrice) {
            this.setState({
                globalSettlementPrice: 1,
                customPrice: true
            });
        } else {
            this.setState({
                globalSettlementPrice: value
            });
        }
    }

    onPriceChangedObject(value) {
        this.onPriceChanged(value.toReal());
    }

    onSubmit() {
        const {asset, account} = this.props;

        let base = new Asset({
            real: this.state.globalSettlementPrice,
            asset_id: this.props.asset.id,
            precision: this.props.asset.precision
        });
        let quoteAsset = ChainStore.getAsset(
            asset.bitasset.options.short_backing_asset
        );
        let quote = new Asset({
            real: 1,
            asset_id: this.props.asset.bitasset.options.short_backing_asset,
            precision: quoteAsset.get("precision")
        });

        let price = new Price({
            quote,
            base
        });

        AssetActions.assetGlobalSettle(asset, account.get("id"), price).then(
            () => {
                this.onReset();
            }
        );
    }

    onReset() {
        this.setState({
            globalSettlementPrice: null,
            customPrice: false
        });
    }

    onChange({amount}) {
        this.onPriceChanged(amount);
    }

    onChangeRadio(e) {
        this.onPriceChanged(e.target.value);
    }

    render() {
        const {asset} = this.props;

        const base = ChainStore.getAsset(
            asset.bitasset.options.short_backing_asset
        );

        let description = assetUtils.parseDescription(
            asset.options.description
        );

        return (
            <div>
                <Form
                    style={{paddingBottom: "1rem"}}
                    className="full-width"
                    layout="vertical"
                >
                    <div>
                        <Tooltip
                            title={counterpart.translate(
                                "explorer.asset.prediction_market_asset.tooltip_prediction"
                            )}
                            placement={"topLeft"}
                        >
                            <Translate content="explorer.asset.prediction_market_asset.prediction" />
                            {": "}
                            <p>{description.condition}</p>
                        </Tooltip>
                    </div>
                    <div>
                        <Tooltip
                            title={counterpart.translate(
                                "explorer.asset.prediction_market_asset.tooltip_resolution_date"
                            )}
                            placement={"topLeft"}
                        >
                            <Translate content="explorer.asset.prediction_market_asset.resolution_date" />
                            {": "}
                            <p>{description.expiry}</p>
                        </Tooltip>
                    </div>
                    <Radio.Group
                        onChange={this.onChangeRadio.bind(this)}
                        value={this.state.globalSettlementPrice}
                    >
                        <Radio
                            value={1}
                            disabled={this.state.customPrice ? true : undefined}
                        >
                            <Translate content="boolean.true" />
                        </Radio>
                        <Radio
                            value={0}
                            disabled={this.state.customPrice ? true : undefined}
                        >
                            <Translate content="boolean.false" />
                        </Radio>
                        <Radio
                            value={
                                !this.state.customPrice
                                    ? 2
                                    : this.state.globalSettlementPrice
                            }
                        >
                            <Translate content="settings.custom" />
                        </Radio>
                    </Radio.Group>
                    <br />
                    <br />
                    <AmountSelector
                        disabled={this.state.customPrice ? undefined : true}
                        label="explorer.asset.price_feed.global_settlement_price"
                        amount={this.state.globalSettlementPrice}
                        onChange={this.onChange.bind(this)}
                        asset={base.get("id")}
                        base={asset.symbol}
                        isPrice
                        assets={[base.get("id")]}
                        placeholder="0.0"
                        style={{
                            width: "100%"
                        }}
                    />
                    <div style={{paddingTop: "1rem"}} className="button-group">
                        <Button
                            type="primary"
                            disabled={
                                this.state.globalSettlementPrice == null
                                    ? true
                                    : undefined
                            }
                            onClick={this.onSubmit.bind(this)}
                        >
                            <Translate content="account.perm.publish_prediction" />
                        </Button>
                        <Button
                            style={{marginLeft: "8px"}}
                            onClick={this.onReset.bind(this)}
                        >
                            <Translate content="account.perm.reset" />
                        </Button>
                    </div>
                </Form>
            </div>
        );
    }
}

AssetResolvePrediction = BindToChainState(AssetResolvePrediction);
export default AssetResolvePrediction;
