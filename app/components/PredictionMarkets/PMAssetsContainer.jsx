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

const _convertPredictionMarketForUI = marketData => {
    let market_fee = 0;
    let max_market_fee = 0;
    const itemData = marketData;
    if (itemData.forPredictions.flagBooleans["charge_market_fee"]) {
        market_fee = itemData.options.market_fee_percent;
        max_market_fee = itemData.options.max_market_fee;
    }
    const bitassetData = marketData.bitasset_data || marketData.bitasset || {};
    let uiMarketData = {
        asset: itemData,
        short_baking_asset: bitassetData.options.short_backing_asset || "1.3.0",
        asset_id: itemData.id,
        issuer: itemData.issuer,
        description: itemData.forPredictions.description.main,
        symbol: itemData.symbol,
        condition: itemData.forPredictions.description.condition,
        expiry: itemData.forPredictions.description.expiry,
        options: itemData.options,
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
            whitelistedHouses: [],
            fetchAllAssets: false
        };
    }

    componentWillReceiveProps(np) {
        if (np.assets !== this.props.assets && this.state.fetchAllAssets) {
            console.log("get assets");
            const lastAsset = np.assets
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
            const predictionMarkets = [...np.assets]
                .map(asset => asset[1])
                .filter(this._isPredictionMarket)
                .map(this._normalizePredictionMarketAsset);
            AssetActions.getAssetList.defer(lastAsset.symbol, 100);
            const fetchingFinished =
                this.state.lastAssetSymbol === lastAsset.symbol;
            console.log(fetchingFinished, predictionMarkets);
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
        getPredictionMarketIssuers().then(whitelistedHouses => {
            whitelistedHouses = ["1.2.428447", "1.2.1099493", "1.2.160399"]; //!!!!!!!!!FOR TESTING!!!!!!!!!!!!!!!!!
            this._getWhitelistedAssets(whitelistedHouses).then(assets => {
                const predictionMarkets = assets
                    .filter(this._isPredictionMarket)
                    .map(this._normalizePredictionMarketAsset);
                this.setState({
                    whitelistedHouses,
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

    async _getWhitelistedAssets(whitelistedHouses) {
        let assets = [];
        let accountObjects = await FetchChainObjects(
            ChainStore.getAsset,
            whitelistedHouses,
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
        this.setState({fething: true, fetchAllAssets: true});
        AssetActions.getAssetList.defer("", 100);
    }

    render() {
        console.log(this.state.predictionMarkets);
        return (
            <PredictionMarkets
                assets={this.props.assets}
                whitelistedHouses={this.state.whitelistedHouses}
                predictionMarkets={this.state.predictionMarkets}
                fetching={this.state.fetching}
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
