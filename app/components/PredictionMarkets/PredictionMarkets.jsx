import React, {Component} from "react";
import assetUtils from "common/asset_utils";
import AssetActions from "actions/AssetActions";
import AssetStore from "stores/AssetStore";
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
import MarketsStore from "../../stores/MarketsStore";
import {connect} from "alt-react";

class PredictionMarkets extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            searchTerm: "",
            detailsSearchTerm: "",
            selectedPredictionMarket: null,
            opinions: [],
            preselectedOpinion: "yes",
            preselectedAmount: 0,
            preselectedProbability: 0,
            isCreateMarketModalOpen: false,
            isAddOpinionModalOpen: false,
            isResolveModalOpen: false,
            isHideUnknownHousesChecked: true,
            isHideInvalidAssetsChecked: true,
            opinionFilter: "yes",
            predictionMarketAssetFilter: "open"
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

    componentDidUpdate(prevProps) {
        if (prevProps.marketLimitOrders !== this.props.marketLimitOrders) {
            this._updateOpinionsList(this.props.marketLimitOrders);
        }
    }

    _isKnownIssuer(asset) {
        return this.props.whitelistedIssuers.includes(asset.issuer);
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
            () => this.props.fetchAllAssets()
        );
    }

    handleInvalidAssetsChecked() {
        this.setState({
            isHideInvalidAssetsChecked: !this.state.isHideInvalidAssetsChecked,
            selectedPredictionMarket: null
        });
    }

    onOppose = opinion => {
        this.setState({
            preselectedOpinion: opinion.opinion === "no" ? "yes" : "no",
            preselectedAmount: opinion.amount,
            preselectedProbability: opinion.probability
        });
        this.onAddOpinionModalOpen();
    };

    onCancelOpinion = opinion => {
        MarketsActions.cancelLimitOrders(this.props.currentAccount.get("id"), [
            opinion.order_id
        ]).catch(err => {
            console.log("cancel orders error:", err);
        });
    };

    onResolveMarket = market => {
        const account = this.props.currentAccount.get("id");
        const globalSettlementPrice = market.result === "yes" ? 1 : 0;
        const asset = ChainStore.getAsset(market.asset_id).toJS();
        let base = new Asset({
            real: 1,
            asset_id: asset.id,
            precision: asset.precision
        });
        let quoteAsset = ChainStore.getAsset(
            asset.bitasset.options.short_backing_asset
        );
        let quote = new Asset({
            real: globalSettlementPrice,
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

    _filterMarkets() {
        const filter = this.state.predictionMarketAssetFilter;
        const markets = this.props.predictionMarkets.filter(assetInfo => {
            const asset = assetInfo.asset;
            if (!asset) {
                return false;
            }
            const bitassetData = asset.bitasset_data || asset.bitasset || {};
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
                let accountName = ChainStore.getAccount(asset.issuer)
                    ? ChainStore.getAccount(asset.issuer).get("name")
                    : null;
                if (accountName && this.state.searchTerm) {
                    let noMatch =
                        (
                            accountName +
                            "\0" +
                            asset.condition +
                            "\0" +
                            asset.description
                        )
                            .toUpperCase()
                            .indexOf(this.state.searchTerm) !== -1;
                    if (noMatch) {
                        return false;
                    }
                }
                if (filter && filter !== "all") {
                    const resolutionDate = new Date(
                        asset.forPredictions.description.expiry
                    );
                    const settlementFund = bitassetData.settlement_fund || 0;
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
        });
        return markets;
    }

    getOverviewSection() {
        const setPredictionMarketAssetFilter = e => {
            this.setState({
                predictionMarketAssetFilter: e.target.value
            });
        };
        const predictionMarketsToShow = this._filterMarkets();
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
                                style={{marginLeft: "20px", cursor: "pointer"}}
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
                                style={{marginLeft: "20px", cursor: "pointer"}}
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
                    <div className="filter-status">
                        {counterpart.translate("utility.x_assets_hidden", {
                            count:
                                this.props.predictionMarkets.length -
                                predictionMarketsToShow.length,
                            total: this.props.predictionMarkets.length
                        })}
                    </div>
                </div>
                <div
                    className="header-selector"
                    style={{
                        display: "inline-block",
                        width: "100%",
                        paddingTop: "0rem"
                    }}
                >
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
                    predictionMarkets={predictionMarketsToShow}
                    currentAccount={this.props.currentAccount}
                    onMarketAction={this.onMarketAction}
                    selectedPredictionMarket={
                        this.state.selectedPredictionMarket
                    }
                    loading={this.props.loading}
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
                        currentAccount={this.props.currentAccount.get("id")}
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
