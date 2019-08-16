import React, {Component} from "react";
import assetUtils from "common/asset_utils";
import AssetActions from "actions/AssetActions";
import MarketsActions from "actions/MarketsActions";
import counterpart from "counterpart";
import PredictionMarketsOverviewTable from "./PredictionMarketsOverviewTable";
import PredictionMarketDetailsTable from "./PredictionMarketDetailsTable";
import SearchInput from "../Utility/SearchInput";
import HelpContent from "../Utility/HelpContent";
import AddOpinionModal from "./AddOpinionModal";
import CreateMarketModal from "./CreateMarketModal";
import ResolveModal from "./ResolveModal";
import {ChainStore, FetchChainObjects} from "bitsharesjs";
import {Switch, Button, Radio, Icon, Tooltip} from "bitshares-ui-style-guide";
import {Asset, Price} from "../../lib/common/MarketClasses";
import Translate from "react-translate-component";
import {bindToCurrentAccount} from "../Utility/BindToCurrentAccount";
import AssetStore from "../../stores/AssetStore";
import MarketsStore from "../../stores/MarketsStore";
import {connect} from "alt-react";
import {getPredictionMarketIssuers} from "../../lib/chain/onChainConfig";

class PredictionMarkets extends Component {
    constructor(props) {
        super(props);
        this.state = {
            lastAssetSymbol: null,
            predictionMarkets: [],
            isFetchingFinished: false,
            searchTerm: "",
            detailsSearchTerm: "",
            selectedPredictionMarket: null,
            opinions: [],
            fetchedAssets: [],
            preselectedOpinion: "yes",
            preselectedAmount: 0,
            preselectedProbability: 0,
            isCreateMarketModalOpen: false,
            isAddOpinionModalOpen: false,
            isResolveModalOpen: false,
            isHideUnknownHousesChecked: true,
            isHideInvalidAssetsChecked: true,
            opinionFilter: "yes",
            predictionMarketAssetFilter: "open",
            whitelistedHouses: []
        };

        this.onCreatePredictionMarketModalOpen = this.onCreatePredictionMarketModalOpen.bind(
            this
        );
        this.onCreatePredictionMarketModalClose = this.onCreatePredictionMarketModalClose.bind(
            this
        );
        this.onAddOpinionModalOpen = this.onAddOpinionModalOpen.bind(this);
        this.onAddOpinionModalClose = this.onAddOpinionModalClose.bind(this);
        this.onSearch = this.onSearch.bind(this);
        this.onSearchDetails = this.onSearchDetails.bind(this);
        this.onMarketAction = this.onMarketAction.bind(this);
        this.onResolveModalOpen = this.onResolveModalOpen.bind(this);
        this.onResolveModalClose = this.onResolveModalClose.bind(this);
        this.updateAsset = this.updateAsset.bind(this);
        this.handleUnknownHousesToggleChange = this.handleUnknownHousesToggleChange.bind(
            this
        );
        this.handleInvalidAssetsChecked = this.handleInvalidAssetsChecked.bind(
            this
        );
    }

    componentWillMount() {
        this.getWhitelistedHousesThroughAsset();
        //    this._checkAssets(this.props.assets);
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
                console.log(item);
                assets = [...assets, ...item.assets];
            }
        });
        let assetsObjects = await FetchChainObjects(
            ChainStore.getAsset,
            assets,
            undefined,
            {}
        );
        assetsObjects = assetsObjects.map(item => item.toJS());

        this._checkAssets(assetsObjects);
        this.setState({
            isFetchingFinished: true
        });
    }

    _checkAssets(fetchedAssets) {
        let searchAsset = this.state.lastAssetSymbol
            ? this.state.lastAssetSymbol
            : "A";

        if (fetchedAssets) {
            console.log(fetchedAssets);
            // TODO
            /*const lastAsset = fetchedAssets
                .sort((a, b) => {
                    if (a.symbol > b.symbol) {
                        return 1;
                    } else if (a.symbol < b.symbol) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
                .last();*/
            //searchAsset = lastAsset ? lastAsset.symbol : "A";

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
        // TODO
        /*if (
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
        }*/
    }

    _isKnownIssuer(asset) {
        return this.state.whitelistedHouses.includes(asset.issuer);
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
            const bitassetData = asset.bitasset_data || asset.bitasset || {};
            if (bitassetData.is_prediction_market) {
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
                    if (filter && filter !== "all") {
                        const resolutionDate = new Date(
                            asset.forPredictions.description.expiry
                        );
                        const settlementFund =
                            bitassetData.settlement_fund || 0;
                        const isExpiredOrResolved =
                            settlementFund > 0 || resolutionDate < new Date();
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

        console.log("passed filtering assets", assets);
        let predictionMarkets = [...assets].map(item => {
            let market_fee = 0;
            let max_market_fee = 0;
            const itemData = item[1] || item;
            if (itemData.forPredictions.flagBooleans["charge_market_fee"]) {
                market_fee = itemData.options.market_fee_percent;
                max_market_fee = itemData.options.max_market_fee;
            }
            const bitassetData = item.bitasset_data || item.bitasset || {};
            let predictionMarketTableRow = {
                asset: itemData,
                short_baking_asset:
                    bitassetData.options.short_backing_asset || "1.3.0",
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
            return predictionMarketTableRow;
        });

        this.setState({
            predictionMarkets
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

    async getMarketOpinions(market) {
        if (this.state.subscribedMarket) {
            await MarketsActions.unSubscribeMarket(
                this.state.subscribedMarket.quote.get("id"),
                this.state.subscribedMarket.base.get("id")
            );
        }
        const base = ChainStore.getObject(
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

    onMarketAction({market, action}) {
        if (typeof action === "string") {
            //on buttons action
            if (!this.state.selectedPredictionMarket) {
                this.setState({
                    selectedPredictionMarket: market
                });
            }

            switch (action) {
                case "resolve": {
                    this.setState({
                        preselectedAmount: 0,
                        preselectedProbability: 0
                    });
                    this.onResolveModalOpen();
                    break;
                }
                case "yes": {
                    if (this.state.subscribedMarket) {
                        this.setState({
                            preselectedAmount: 0,
                            preselectedProbability: 0,
                            preselectedOpinion: "yes"
                        });
                        this.onAddOpinionModalOpen();
                    }
                    break;
                }
                case "no": {
                    if (this.state.subscribedMarket) {
                        this.setState({
                            preselectedAmount: 0,
                            preselectedProbability: 0,
                            preselectedOpinion: "no"
                        });
                        this.onAddOpinionModalOpen();
                    }
                    break;
                }
                default: {
                    this.setState({
                        preselectedAmount: 0,
                        preselectedProbability: 0
                    });
                }
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

    onSearch(event) {
        this.setState({
            searchTerm: event.target.value || ""
        });
    }

    onSearchDetails(event) {
        this.setState({
            detailsSearchTerm: event.target.value || ""
        });
    }

    onCreatePredictionMarketModalOpen() {
        this.setState({
            isCreateMarketModalOpen: true
        });
    }

    onCreatePredictionMarketModalClose() {
        this.setState({
            isCreateMarketModalOpen: false
        });
    }

    onAddOpinionModalOpen() {
        this.setState({
            isAddOpinionModalOpen: true
        });
    }

    onAddOpinionModalClose() {
        this.setState({
            isAddOpinionModalOpen: false,
            preselectedOpinion: "no",
            preselectedAmount: 0,
            preselectedProbability: 0
        });
    }

    onResolveModalOpen() {
        this.setState({
            isResolveModalOpen: true
        });
    }

    onResolveModalClose() {
        this.setState({
            isResolveModalOpen: false
        });
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

    onOppose = opinion => {
        this.setState({
            preselectedOpinion: opinion.opinion === "no" ? "yes" : "no",
            preselectedAmount: opinion.amount,
            preselectedProbability: opinion.probability
        });
        this.onAddOpinionModalOpen();
    };

    // TODO extract to HOC component
    onCancelOpinion = opinion => {
        MarketsActions.cancelLimitOrders(this.props.currentAccount.get("id"), [
            opinion.order_id
        ]).catch(err => {
            console.log("cancel orders error:", err);
        });
    };

    // TODO extract to HOC component
    onResolveMarket = market => {
        const account = this.props.currentAccount.get("id");
        const globalSettlementPrice = market.result === "yes" ? 1 : 0;
        const asset = ChainStore.getAsset(market.asset_id).toJS();
        let base = new Asset({
            real: globalSettlementPrice,
            asset_id: asset.id,
            precision: asset.precision
        });
        let quoteAsset = ChainStore.getAsset(
            asset.bitasset.options.short_backing_asset
        );
        let quote = new Asset({
            real: 1,
            asset_id: asset.bitasset.options.short_backing_asset,
            precision: quoteAsset.get("precision")
        });
        let price = new Price({
            quote,
            base
        });

        AssetActions.assetGlobalSettle(asset, account, price).then(() => {
            let pause = new Promise(resolve => setTimeout(resolve, 1000));
            pause.then(() => {
                this.updateAsset(asset.symbol);
            });
        });
        this.setState({
            isResolveModalOpen: false
        });
    };

    updateAsset(symbol) {
        AssetActions.getAssetList.defer(symbol, 1);
    }

    getOverviewSection() {
        const setPredictionMarketAssetFilter = e => {
            this.setState(
                {
                    predictionMarketAssetFilter: e.target.value
                },
                this._updatePredictionMarketsList
            );
        };
        return (
            <div>
                <div
                    className="header-selector"
                    style={{display: "inline-block", width: "100%"}}
                >
                    <div className="filter-block">
                        <SearchInput
                            onChange={this.onSearch}
                            value={this.state.searchTerm}
                        />
                        <Radio.Group
                            style={{marginLeft: "20px"}}
                            value={this.state.predictionMarketAssetFilter}
                            onChange={setPredictionMarketAssetFilter}
                        >
                            <Radio value={"all"}>
                                {counterpart.translate(
                                    "prediction.overview.all"
                                )}
                            </Radio>
                            <Radio value={"open"}>
                                {counterpart.translate(
                                    "prediction.overview.open"
                                )}
                            </Radio>
                            <Radio value={"past_resolution_date"}>
                                {counterpart.translate(
                                    "prediction.overview.past_resolution_date"
                                )}
                            </Radio>
                        </Radio.Group>
                        <span>
                            <Switch
                                style={{marginLeft: "20px"}}
                                onChange={this.handleUnknownHousesToggleChange}
                                checked={this.state.isHideUnknownHousesChecked}
                            />
                            <Translate
                                onClick={this.handleUnknownHousesToggleChange}
                                content="prediction.overview.hide_unknown_houses"
                                style={{
                                    marginLeft: "10px",
                                    cursor: "pointer"
                                }}
                            />
                            <Tooltip
                                title={counterpart.translate(
                                    "prediction.tooltips.hide_unknown_houses"
                                )}
                            >
                                <Icon
                                    style={{
                                        marginLeft: "0.5rem"
                                    }}
                                    type="question-circle"
                                    theme="filled"
                                />
                            </Tooltip>
                            <Switch
                                style={{marginLeft: "20px"}}
                                onChange={this.handleInvalidAssetsChecked}
                                checked={this.state.isHideInvalidAssetsChecked}
                            />
                            <Translate
                                onClick={this.handleInvalidAssetsChecked}
                                content="prediction.overview.hide_invalid_asset"
                                style={{
                                    marginLeft: "10px",
                                    cursor: "pointer"
                                }}
                            />
                            <Tooltip
                                title={counterpart.translate(
                                    "prediction.tooltips.hide_invalid_asset"
                                )}
                            >
                                <Icon
                                    style={{
                                        marginLeft: "0.5rem"
                                    }}
                                    type="question-circle"
                                    theme="filled"
                                />
                            </Tooltip>
                        </span>
                    </div>
                    <span className="action-buttons">
                        <Tooltip
                            title={counterpart.translate(
                                "prediction.tooltips.create_prediction_market_asset"
                            )}
                        >
                            <Icon
                                style={{
                                    fontSize: "1.3rem",
                                    marginRight: "0.5rem"
                                }}
                                type="question-circle"
                                theme="filled"
                            />
                        </Tooltip>
                        <Button
                            onClick={this.onCreatePredictionMarketModalOpen}
                        >
                            {counterpart.translate(
                                "prediction.overview.create_market"
                            )}
                        </Button>
                    </span>
                </div>
                <PredictionMarketsOverviewTable
                    predictionMarkets={this.state.predictionMarkets}
                    currentAccount={this.props.currentAccount}
                    onMarketAction={this.onMarketAction}
                    searchTerm={this.state.searchTerm.toUpperCase()}
                    selectedPredictionMarket={
                        this.state.selectedPredictionMarket
                    }
                    hideUnknownHouses={this.state.isHideUnknownHousesChecked}
                    loading={!this.state.isFetchingFinished}
                    whitelistedHouses={this.state.whitelistedHouses}
                />
            </div>
        );
    }

    getDetailsSection() {
        const setOpinionFilter = e => {
            this.setState({
                opinionFilter: e.target.value
            });
        };
        return (
            <div>
                <h3>
                    {counterpart.translate(
                        "prediction.details.list_of_current_prediction_offers"
                    )}
                    <Tooltip
                        title={counterpart.translate(
                            "prediction.tooltips.what_is_a_prediction_offer"
                        )}
                    >
                        <Icon
                            style={{
                                marginLeft: "0.5rem"
                            }}
                            type="question-circle"
                            theme="filled"
                        />
                    </Tooltip>
                </h3>
                <div
                    className="header-selector"
                    style={{display: "inline-block", width: "100%"}}
                >
                    <div className="filter-block">
                        <SearchInput
                            onChange={this.onSearchDetails}
                            value={this.state.detailsSearchTerm}
                            autoComplete="off"
                        />
                        <Radio.Group
                            style={{marginLeft: "20px"}}
                            value={this.state.opinionFilter}
                            onChange={setOpinionFilter}
                        >
                            <Radio value={"all"}>
                                {counterpart.translate(
                                    "prediction.details.all"
                                )}
                            </Radio>
                            <Radio value={"yes"}>
                                {counterpart.translate(
                                    "prediction.details.proves_true"
                                )}
                            </Radio>
                            <Radio value={"no"}>
                                {counterpart.translate(
                                    "prediction.details.incorrect"
                                )}
                            </Radio>
                        </Radio.Group>
                    </div>
                    <span className="action-buttons">
                        <Tooltip
                            title={counterpart.translate(
                                "prediction.tooltips.add_prediction"
                            )}
                        >
                            <Icon
                                style={{
                                    fontSize: "1.3rem",
                                    marginRight: "0.5rem"
                                }}
                                type="question-circle"
                                theme="filled"
                            />
                        </Tooltip>
                        <Button onClick={this.onAddOpinionModalOpen}>
                            {counterpart.translate(
                                "prediction.details.add_prediction"
                            )}
                        </Button>
                    </span>
                </div>
                {this.state.opinions ? (
                    <PredictionMarketDetailsTable
                        predictionMarketData={{
                            predictionMarket: this.state
                                .selectedPredictionMarket,
                            opinions: this.state.opinions
                        }}
                        currentAccount={this.props.currentAccount}
                        onOppose={this.onOppose}
                        onCancel={this.onCancelOpinion}
                        detailsSearchTerm={this.state.detailsSearchTerm.toUpperCase()}
                        opinionFilter={this.state.opinionFilter}
                    />
                ) : null}
            </div>
        );
    }

    render() {
        const symbols = [...this.props.assets].map(item => item[1].symbol);

        return (
            <div
                className="prediction-markets grid-block vertical"
                style={{overflow: "visible", margin: "15px"}}
            >
                <div
                    className="grid-block small-12 shrink"
                    style={{overflow: "visible"}}
                >
                    <HelpContent path={"components/PredictionMarkets"} />
                </div>
                {this.getOverviewSection()}
                {this.state.selectedPredictionMarket
                    ? this.getDetailsSection()
                    : null}
                {this.state.isCreateMarketModalOpen ? (
                    <CreateMarketModal
                        visible={this.state.isCreateMarketModalOpen}
                        onClose={this.onCreatePredictionMarketModalClose}
                        currentAccount={this.props.currentAccount}
                        symbols={symbols}
                        onMarketCreated={this.updateAsset}
                    />
                ) : null}
                {this.state.isAddOpinionModalOpen ? (
                    <AddOpinionModal
                        visible={this.state.isAddOpinionModalOpen}
                        onClose={this.onAddOpinionModalClose}
                        predictionMarket={this.state.selectedPredictionMarket}
                        opinion={this.state.initialOpinion}
                        currentAccount={this.props.currentAccount}
                        preselectedOpinion={this.state.preselectedOpinion}
                        preselectedAmount={this.state.preselectedAmount}
                        preselectedProbability={
                            this.state.preselectedProbability
                        }
                        baseAsset={this.state.subscribedMarket.base}
                        quoteAsset={this.state.subscribedMarket.quote}
                    />
                ) : null}
                {this.state.isResolveModalOpen ? (
                    <ResolveModal
                        visible={this.state.isResolveModalOpen}
                        onClose={this.onResolveModalClose}
                        predictionMarket={this.state.selectedPredictionMarket}
                        onResolveMarket={this.onResolveMarket}
                    />
                ) : null}
            </div>
        );
    }
}

PredictionMarkets = connect(
    PredictionMarkets,
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

export default (PredictionMarkets = bindToCurrentAccount(PredictionMarkets));
