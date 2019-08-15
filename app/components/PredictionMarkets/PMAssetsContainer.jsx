import React from "react";
import AssetStore from "../../stores/AssetStore";
import MarketsStore from "../../stores/MarketsStore";
import {bindToCurrentAccount} from "../Utility/BindToCurrentAccount";
import PredictionMarkets from "./PredictionMarkets";
import {getPredictionMarketIssuers} from "../../lib/chain/onChainConfig";
import {connect} from "alt-react";
import {ChainStore, FetchChainObjects} from "bitsharesjs";
import AssetActions from "actions/AssetActions";
import assetUtils from "common/asset_utils";
import MarketsActions from "actions/MarketsActions";
import {Asset, Price} from "../../lib/common/MarketClasses";

class PMAssetsContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            lastAssetSymbol: null,
            predictionMarkets: [],
            selectedPredictionMarket: null,
            isFetchingFinished: false,
            fetchedAssets: [],
            opinions: [],
            isHideUnknownHousesChecked: false,
            isHideInvalidAssetsChecked: true,
            whitelistedHouses: []
        };

        this.handleUnknownHousesToggleChange = this.handleUnknownHousesToggleChange.bind(
            this
        );
        this.handleInvalidAssetsChecked = this.handleInvalidAssetsChecked.bind(
            this
        );
        this.onMarketAction = this.onMarketAction.bind(this);
    }

    componentWillMount() {
        //    this.getWhitelistedHousesThroughAsset();
        this._checkAssets(this.props.assets);
    }

    componentWillReceiveProps(np) {
        if (np.assets !== this.props.assets) {
            this._checkAssets(np.assets);
        }

        if (np.marketLimitOrders !== this.props.marketLimitOrders) {
            this._updateOpinionsList(np.marketLimitOrders);
        }
    }

    async getWhitelistedHousesThroughAsset() {
        let whitelistedHouses = await getPredictionMarketIssuers();
        whitelistedHouses = ["1.2.428447", "1.2.1099493", "1.2.160399"]; //!!!!!!!!!FOR TESTING!!!!!!!!!!!!!!!!!
        this.setState({
            whitelistedHouses
        });
        this._getWhitelistedAssets(whitelistedHouses);
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
        assetsObjects = assetsObjects
            .map(item => item.toJS())
            .filter(
                item => item.bitasset && item.bitasset.is_prediction_market
            );

        console.log("assetsObjects", assetsObjects);
    }

    _checkAssets(fetchedAssets) {
        let searchAsset = this.state.lastAssetSymbol
            ? this.state.lastAssetSymbol
            : "A";

        if (fetchedAssets) {
            const lastAsset = fetchedAssets
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
            searchAsset = lastAsset ? lastAsset.symbol : "A";

            // parse flags and description
            fetchedAssets.forEach(item => {
                if (!item.forPredictions) {
                    item.forPredictions = {
                        description: assetUtils.parseDescription(
                            item.options.description
                        ),
                        flagBooleans: assetUtils.getFlagBooleans(
                            item.options.flags,
                            true
                        )
                    };
                }
            });

            this._updatePredictionMarketsList(fetchedAssets);
        }
        if (
            !this.state.lastAssetSymbol ||
            this.state.lastAssetSymbol !== searchAsset
        ) {
            AssetActions.getAssetList.defer(searchAsset, 100);
            this.setState({
                lastAssetSymbol: searchAsset
            });
        } else {
            this.setState({
                isFetchingFinished: true,
                fetchedAssets
            });
        }
    }

    _isKnownIssuer(asset) {
        return true;
        //this.state.whitelistedHouses.includes(asset.issuer);
    }

    _isValidPredictionMarketAsset(asset) {
        // must have valid date
        const resolutionDate = new Date(
            asset.forPredictions.description.expiry
        );
        if (resolutionDate instanceof Date && isNaN(resolutionDate.getTime())) {
            return false;
        }
        // must have description and prediction filled
        if (!asset.forPredictions.description.condition) {
            return false;
        }
        if (!asset.forPredictions.description.main) {
            return false;
        }
        // must have meaningfull description and prediction
        if (asset.forPredictions.description.condition.length < 10) {
            return false;
        }
        if (asset.forPredictions.description.main.length < 20) {
            return false;
        }
        // market fee may not be crazy
        if (asset.options.market_fee_percent / 100 >= 10) {
            return false;
        }
        return true;
    }

    _updatePredictionMarketsList(fetchedAssets = null) {
        if (fetchedAssets == null) {
            fetchedAssets = this.state.fetchedAssets;
        }
        const filter = this.state.predictionMarketAssetFilter;
        const assets = fetchedAssets.filter(asset => {
            if (
                asset.bitasset_data &&
                asset.bitasset_data.is_prediction_market
            ) {
                if (
                    this.state.isHideUnknownHousesChecked &&
                    !this._isKnownIssuer(asset)
                ) {
                    return false;
                } else if (
                    this.state.isHideInvalidAssetsChecked &&
                    !this._isValidPredictionMarketAsset(asset)
                ) {
                    return false;
                } else {
                    if (filter && !(filter === "all")) {
                        const resolutionDate = new Date(
                            asset.forPredictions.description.expiry
                        );
                        const isExpiredOrResolved =
                            asset.bitasset_data.settlement_fund > 0 ||
                            resolutionDate < new Date();
                        if (filter === "open") {
                            return !isExpiredOrResolved;
                        } else if (filter === "past_resolution_date") {
                            return isExpiredOrResolved;
                        } else {
                            return false;
                        }
                    } else {
                        return true;
                    }
                }
            } else {
                return false;
            }
        });
        let predictionMarkets = [...assets].map(item => {
            let market_fee = 0;
            let max_market_fee = 0;
            if (item[1].forPredictions.flagBooleans["charge_market_fee"]) {
                market_fee = item[1].options.market_fee_percent;
                max_market_fee = item[1].options.max_market_fee;
            }
            let predictionMarketTableRow = {
                asset: item,
                asset_id: item[1].id,
                issuer: item[1].issuer,
                description: item[1].forPredictions.description.main,
                symbol: item[1].symbol,
                condition: item[1].forPredictions.description.condition,
                expiry: item[1].forPredictions.description.expiry,
                options: item[1].options,
                marketConfidence: 0,
                marketLikelihood: 0,
                market_fee,
                max_market_fee
            };
            return predictionMarketTableRow;
        });

        this.setState({
            predictionMarkets
        });
    }

    async getMarketOpinions(market) {
        if (this.state.subscribedMarket) {
            await MarketsActions.unSubscribeMarket(
                this.state.subscribedMarket.quote.get("id"),
                this.state.subscribedMarket.base.get("id")
            );
        }
        const base = ChainStore.getAsset(
            market.options.core_exchange_rate.base.asset_id
        );
        const quote = ChainStore.getAsset(
            market.options.core_exchange_rate.quote.asset_id
        );
        await MarketsActions.subscribeMarket(
            base,
            quote,
            this.props.bucketSize,
            this.props.currentGroupOrderLimit
        );
        this.setState({
            subscribedMarket: {
                base,
                quote
            }
        });
    }

    _updateOpinionsList(fetchedOpinions) {
        let orders = [];
        const selectedMarket = this.state.selectedPredictionMarket;
        fetchedOpinions.forEach((order, order_id) => {
            const opinion =
                order.market_base === order.sell_price.base.asset_id
                    ? "no"
                    : "yes";
            const refPrice =
                order.market_base === order.sell_price.base.asset_id
                    ? order.sell_price.invert().toReal()
                    : order.sell_price.toReal();
            const amount =
                order.market_base === order.sell_price.base.asset_id
                    ? order.amountForSale()
                    : order.amountToReceive();
            const premium =
                order.market_base === order.sell_price.base.asset_id
                    ? order.amountToReceive()
                    : order.amountForSale();
            const flagBooleans = assetUtils.getFlagBooleans(
                selectedMarket.options.flags,
                true
            );
            let fee = 0;
            if (flagBooleans["charge_market_fee"]) {
                fee = Math.min(
                    selectedMarket.options.max_market_fee,
                    (amount.amount *
                        selectedMarket.options.market_fee_percent) /
                        10000
                );
            }

            if (refPrice < 1) {
                orders.push({
                    order_id,
                    opinionator: order.seller,
                    opinion,
                    amount,
                    likelihood: refPrice,
                    potentialProfit: new Asset({
                        amount: amount.amount,
                        asset_id: premium.asset_id,
                        precision: premium.precision
                    }),
                    premium: premium,
                    commission: new Asset({
                        amount: fee * refPrice,
                        asset_id: premium.asset_id,
                        precision: premium.precision
                    })
                });
            }
        });
        this.setState({opinions: [...orders]});
    }

    handleUnknownHousesToggleChange() {
        const isHideUnknownHousesChecked = !this.state
            .isHideUnknownHousesChecked;
        this.setState(
            {
                isHideUnknownHousesChecked,
                selectedPredictionMarket: null
            },
            () => this._updatePredictionMarketsList()
        );
    }

    handleInvalidAssetsChecked() {
        const isHideInvalidAssetsChecked = !this.state
            .isHideInvalidAssetsChecked;
        this.setState(
            {
                isHideInvalidAssetsChecked,
                selectedPredictionMarket: null
            },
            () => this._updatePredictionMarketsList()
        );
    }

    onMarketAction({market, action}) {
        if (typeof action === "string") {
            //on buttons action
            if (!this.state.selectedPredictionMarket) {
                this.setState({
                    selectedPredictionMarket: market
                });
            }
        } else {
            //on row action
            if (this.state.selectedPredictionMarket) {
                this.setState({
                    selectedPredictionMarket: null
                });
            } else {
                this.setState(
                    {
                        selectedPredictionMarket: market
                    },
                    () => this.getMarketOpinions(market)
                );
            }
        }
    }

    render() {
        return (
            <PredictionMarkets
                predictionMarkets={this.state.predictionMarkets}
                currentAccount={this.props.currentAccount}
                whitelistedHouses={this.state.whitelistedHouses}
                isFetchingFinished={this.state.isFetchingFinished}
                assets={this.props.assets}
                bucketSize={this.props.bucketSize}
                currentGroupOrderLimit={this.props.currentGroupOrderLimit}
                selectedPredictionMarket={this.state.selectedPredictionMarket}
                opinions={this.state.opinions}
                onMarketAction={this.onMarketAction}
                subscribedMarket={this.state.subscribedMarket}
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
                markets: MarketsStore.getState().marketData,
                bucketSize: MarketsStore.getState().bucketSize,
                currentGroupOrderLimit: MarketsStore.getState()
                    .currentGroupLimit,
                marketLimitOrders: MarketsStore.getState().marketLimitOrders
            };
        }
    }
);

export default (PMAssetsContainer = bindToCurrentAccount(PMAssetsContainer));
