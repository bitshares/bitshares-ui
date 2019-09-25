import React, {PureComponent} from "react";
import {Apis} from "tuscjs-ws";

import AssetWrapper from "./AssetWrapper";
import {Asset, Price} from "common/MarketClasses";
import asset_utils from "../../lib/common/asset_utils";

const withShortBackingAsset = WrappedComponent => {
    const WrappedComponentWithShortBackingAsset = AssetWrapper(
        WrappedComponent,
        {propNames: ["shortBackingAsset"]}
    );
    return AssetWrapper(props => (
        <WrappedComponentWithShortBackingAsset
            {...props}
            shortBackingAsset={props.asset.getIn([
                "bitasset",
                "options",
                "short_backing_asset"
            ])}
        />
    ));
};

const withWorthLessSettlementFlag = WrappedComponent =>
    withShortBackingAsset(
        class extends PureComponent {
            state = {worthLessSettlement: undefined};
            updateFlag() {
                const {asset, shortBackingAsset} = this.props;
                const assetId = asset.get("id");
                const shortBackingAssetId = shortBackingAsset.get("id");

                // TODO: maybe properly subscribe to market instead of calling api directly?
                const realMarketPricePromise = Apis.instance()
                    .db_api()
                    .exec("get_order_book", [shortBackingAssetId, assetId, 1])
                    .then(orderBook =>
                        orderBook.bids.length === 0
                            ? 0
                            : Number(orderBook.bids[0].price)
                    );

                let feedPrice = null;
                let factor = 1;
                let offset = 0;
                if (
                    !!asset.get("bitasset") &&
                    asset.get("bitasset").get("settlement_fund") > 0
                ) {
                    // if globally settled, feed price == settlement price
                    feedPrice = asset.get("bitasset").get("settlement_price");
                } else {
                    feedPrice = asset_utils.extractRawFeedPrice(asset);
                    offset = asset
                        .get("bitasset")
                        .get("options")
                        .get("force_settlement_offset_percent");
                    factor = 1 - offset / 10000;
                }

                const realSettlementPrice =
                    new Price({
                        base: new Asset({
                            asset_id: shortBackingAssetId,
                            amount: feedPrice.getIn(["quote", "amount"]),
                            preicision: shortBackingAsset.get("precision")
                        }),
                        quote: new Asset({
                            asset_id: assetId,
                            amount: feedPrice.getIn(["base", "amount"]),
                            precision: asset.get("precision")
                        })
                    }).toReal() * factor;

                // TODO: compare fractional price instead of real price
                realMarketPricePromise.then(realMarketPrice =>
                    this.setState({
                        worthLessSettlement:
                            realMarketPrice > realSettlementPrice,
                        marketPrice: realMarketPrice,
                        settlementPrice: realSettlementPrice
                    })
                );
            }
            componentWillMount() {
                this.updateFlag();
            }
            componentDidUpdate() {
                this.updateFlag();
            }
            render() {
                const {
                    props,
                    state: {worthLessSettlement, marketPrice, settlementPrice}
                } = this;
                return (
                    <WrappedComponent
                        {...props}
                        worthLessSettlement={worthLessSettlement}
                        marketPrice={marketPrice}
                        settlementPrice={settlementPrice}
                    />
                );
            }
        }
    );

export default withWorthLessSettlementFlag;
