import React from "react";
import {connect} from "alt-react";
import {bindToCurrentAccount} from "../Utility/BindToCurrentAccount";
import AssetActions from "actions/AssetActions";
import AssetStore from "stores/AssetStore";
import PredictionMarkets from "./PredictionMarkets";
import MarketsStore from "../../stores/MarketsStore";
import {getPredictionMarketIssuers} from "../../lib/chain/onChainConfig";
import {ChainStore, FetchChainObjects} from "bitsharesjs";
import assetUtils from "common/asset_utils";

const _convertPredictionMarketForUI = asset => {
    let market_fee = 0;
    let max_market_fee = 0;
    if (asset.forPredictions.flagBooleans["charge_market_fee"]) {
        market_fee = asset.options.market_fee_percent;
        max_market_fee = asset.options.max_market_fee;
    }
    const bitassetData = asset.bitasset_data || asset.bitasset || {};
    let uiMarketData = {
        asset: asset,
        short_backing_asset:
            bitassetData.options.short_backing_asset || "1.3.0",
        asset_id: asset.id,
        issuer: asset.issuer,
        description: asset.forPredictions.description.main,
        symbol: asset.symbol,
        condition: asset.forPredictions.description.condition,
        expiry: asset.forPredictions.description.expiry,
        options: asset.options,
        marketConfidence: 0,
        marketLikelihood: 0,
        market_fee,
        max_market_fee
    };
    return uiMarketData;
};

class PMAssetsContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            lastAssetSymbol: "",
            predictionMarkets: [],
            fetching: true,
            whitelistedIssuers: [],
            fetchAllAssets: false
        };
    }

    _getPredictionMarketList(assets) {
        return [...assets]
            .map(asset => asset[1])
            .filter(this._isPredictionMarket)
            .map(this._normalizePredictionMarketAsset);
    }

    componentDidUpdate(prevProps) {
        if (
            prevProps.assets !== this.props.assets &&
            this.state.fetchAllAssets
        ) {
            const lastAsset = this.props.assets
                .sort((a, b) => {
                    if (a.symbol > b.symbol) {
                        return 1;
                    } else if (a.symbol < b.symbol) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
                .last();
            const predictionMarkets = this._getPredictionMarketList(
                this.props.assets
            );
            AssetActions.getAssetList.defer(lastAsset.symbol, 100);
            const fetchingFinished =
                this.state.lastAssetSymbol === lastAsset.symbol;
            setTimeout(() => {
                this.setState({
                    predictionMarkets: predictionMarkets,
                    lastAssetSymbol: lastAsset.symbol,
                    fetchAllAssets: !fetchingFinished,
                    fetching: !fetchingFinished
                });
            }, 0);
        }
    }

    componentWillMount() {
        getPredictionMarketIssuers().then(whitelistedIssuers => {
            this._getWhitelistedAssets(whitelistedIssuers).then(assets => {
                const predictionMarkets = assets
                    .filter(this._isPredictionMarket)
                    .map(this._normalizePredictionMarketAsset);
                this.setState({
                    whitelistedIssuers: whitelistedIssuers,
                    predictionMarkets,
                    fetching: false
                });
            });
        });
    }

    _normalizePredictionMarketAsset(asset) {
        if (!asset.forPredictions) {
            asset.forPredictions = {
                description: assetUtils.parseDescription(
                    asset.options.description
                ),
                flagBooleans: assetUtils.getFlagBooleans(
                    asset.options.flags,
                    true
                )
            };
        }
        return _convertPredictionMarketForUI(asset);
    }

    _isPredictionMarket(asset) {
        if (!asset) {
            return false;
        }
        const bitassetData = asset.bitasset_data || asset.bitasset || {};
        return bitassetData.is_prediction_market;
    }

    async _getWhitelistedAssets(whitelistedIssuers) {
        let assets = [];
        let accountObjects = await FetchChainObjects(
            ChainStore.getAccount,
            whitelistedIssuers,
            undefined,
            {}
        );
        accountObjects.forEach(item => {
            if (item) {
                item = item.toJS();
                assets = [...assets, ...item.assets];
            }
        });
        let assetsObjects = await FetchChainObjects(
            ChainStore.getAsset,
            assets,
            undefined,
            {}
        );
        return assetsObjects.map(item => item.toJS());
    }

    fetchAllAssets() {
        this.setState(
            {
                fetching: true,
                fetchAllAssets: true
            },
            () => {
                // wait for 150ms to make sure loading is displayed
                // (BindToCurrentAccount and PredictioMarketsOverviewTable are both debounced)
                setTimeout(() => AssetActions.getAssetList("", 100), 300);
            }
        );
    }

    render() {
        return (
            <PredictionMarkets
                assets={this.props.assets}
                whitelistedIssuers={this.state.whitelistedIssuers}
                predictionMarkets={this.state.predictionMarkets}
                loading={this.state.fetching}
                fetchAllAssets={() => {
                    this.fetchAllAssets();
                }}
            />
        );
    }
}

PMAssetsContainer = connect(
    PMAssetsContainer,
    {
        listenTo() {
            return [AssetStore, MarketsStore];
        },
        getProps() {
            return {
                assets: AssetStore.getState().assets,
                bucketSize: MarketsStore.getState().bucketSize,
                currentGroupOrderLimit: MarketsStore.getState()
                    .currentGroupLimit,
                marketLimitOrders: MarketsStore.getState().marketLimitOrders
            };
        }
    }
);

export default (PMAssetsContainer = bindToCurrentAccount(PMAssetsContainer));
