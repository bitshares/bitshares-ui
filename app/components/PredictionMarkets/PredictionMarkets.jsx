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
import {ChainStore} from "bitsharesjs";
import {Button} from "bitshares-ui-style-guide";
import {Asset, Price} from "../../lib/common/MarketClasses";

export default class PredictionMarkets extends Component {
    constructor(props) {
        super(props);
        this.state = {
            assets: [],
            lastAssetSymbol: null,
            predictionMarkets: [],
            currentAccountId: null,
            searchTerm: "",
            detailsSearchTerm: "",
            selectedMarket: null,
            opinions: [],
            preselectedOpinion: "no",
            preselectedAmount: 0,
            isCreateMarketModalOpen: false,
            isAddOpinionModalOpen: false,
            isResolveModalOpen: false,
            symbols: []
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
    }

    componentWillMount() {
        this._checkAssets(this.props.assets);
    }

    componentWillReceiveProps(np) {
        if (np.currentAccount !== this.props.currentAccount) {
            this.setState({
                currentAccountId: ChainStore.getAccount(np.currentAccount).get(
                    "id"
                )
            });
        }

        if (np.assets !== this.props.assets) {
            this._checkAssets(np.assets);
            this._updateSymbolsList();
        }

        if (np.marketLimitOrders !== this.props.marketLimitOrders) {
            this._updateOpinionsList(np.marketLimitOrders);
        }
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
            const assets = fetchedAssets.filter(
                a => a.bitasset_data && a.bitasset_data.is_prediction_market
            );
            this.setState({
                assets: [...assets]
            });
            this._updatePredictionMarketsList();
        }
        if (
            !this.state.lastAssetSymbol ||
            this.state.lastAssetSymbol !== searchAsset
        ) {
            AssetActions.getAssetList.defer(searchAsset, 100);
            this.setState({
                lastAssetSymbol: searchAsset
            });
        }
    }

    _updatePredictionMarketsList() {
        const predictionMarkets = this.state.assets.map(item => ({
            asset_id: item[1].id,
            issuer: item[1].issuer,
            description: assetUtils.parseDescription(
                item[1].options.description
            ).main,
            symbol: item[1].symbol,
            condition: assetUtils.parseDescription(item[1].options.description)
                .condition,
            options: item[1].options
        }));
        this.setState({
            predictionMarkets
        });
    }

    _updateOpinionsList(fetchedOpinions) {
        let orders = [];
        fetchedOpinions.forEach((order, order_id) => {
            const opinion =
                order.market_base === order.sell_price.base.asset_id
                    ? "yes"
                    : "no";
            orders.push({
                order_id,
                opinionator: order.seller,
                opinion,
                amount: order.for_sale,
                fee: order.fee
            });
        });
        this.setState({opinions: [...orders]});
    }

    _updateSymbolsList() {
        let assets = this.props.assets.toJS();
        let symbols = [];
        for (let item in assets) {
            symbols.push(assets[item].symbol);
        }
        this.setState({symbols});
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

    onMarketAction({market, action}) {
        switch (action) {
            case "resolve": {
                this.setState({
                    selectedPredictionMarket: market,
                    preselectedAmount: 0
                });
                this.onResolveModalOpen();
                break;
            }
            case "yes": {
                this.setState({
                    selectedPredictionMarket: market,
                    preselectedAmount: 0,
                    preselectedOpinion: "yes"
                });
                this.onAddOpinionModalOpen();
                break;
            }
            case "no": {
                this.setState({
                    selectedPredictionMarket: market,
                    preselectedAmount: 0,
                    preselectedOpinion: "no"
                });
                this.onAddOpinionModalOpen();
                break;
            }
            default: {
                this.setState({
                    selectedPredictionMarket: market,
                    preselectedAmount: 0
                });
            }
        }
        this.getMarketOpinions(market);
    }

    onSearch(event) {
        this.setState({
            searchTerm: (event.target.value || "").toUpperCase()
        });
    }

    onSearchDetails(event) {
        this.setState({
            detailsSearchTerm: (event.target.value || "").toUpperCase()
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
            preselectedAmount: 0
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

    onOppose = opinion => {
        this.setState({
            preselectedOpinion: opinion.opinion === "no" ? "yes" : "no",
            preselectedAmount: opinion.amount
        });
        this.onAddOpinionModalOpen();
    };

    onCancelOpinion = opinion => {
        this._cancelLimitOrders([opinion.order_id]);
    };

    _cancelLimitOrders(orderid) {
        MarketsActions.cancelLimitOrders(
            ChainStore.getAccount(this.props.currentAccount).get("id"),
            orderid
        ).catch(err => {
            console.log("cancel orders error:", err);
        });
    }

    onSubmitNewOpinion = value => {
        if (this.state.opinions) {
            this.setState({
                opinions: [...this.state.opinions, value],
                isAddOpinionModalOpen: false
            });
        } else {
            this.setState({
                opinions: [value],
                isAddOpinionModalOpen: false
            });
        }
    };

    onResolveMarket = market => {
        const account = ChainStore.getAccount(this.props.currentAccount).get(
            "id"
        );
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
            console.log(`Resolved ${asset}`);
        });

        this.setState({
            isResolveModalOpen: false
        });
    };

    getOverviewSection() {
        return (
            <div>
                <div style={{paddingTop: "20px"}}>
                    <SearchInput
                        style={{width: "60%", float: "left"}}
                        onChange={this.onSearch}
                        onClear={() => {
                            this.setState({searchTerm: ""});
                        }}
                        value={this.state.searchTerm}
                        maxLength={256}
                        autoComplete="off"
                        placeholder={counterpart.translate("exchange.filter")}
                    />
                    <Button
                        style={{float: "right"}}
                        onClick={this.onCreatePredictionMarketModalOpen}
                    >
                        {counterpart.translate(
                            "prediction.overview.create_market"
                        )}
                    </Button>
                </div>
                <PredictionMarketsOverviewTable
                    predictionMarkets={this.state.predictionMarkets}
                    currentAccount={this.props.currentAccount}
                    onMarketAction={this.onMarketAction}
                    searchTerm={this.state.searchTerm}
                />
            </div>
        );
    }

    getDetailsSection() {
        return (
            <div>
                <div style={{paddingTop: "20px"}}>
                    <SearchInput
                        style={{width: "60%", float: "left"}}
                        onChange={this.onSearchDetails}
                        onClear={() => {
                            this.setState({detailsSearchTerm: ""});
                        }}
                        value={this.state.detailsSearchTerm}
                        maxLength={256}
                        autoComplete="off"
                        placeholder={counterpart.translate("exchange.filter")}
                    />
                    <Button
                        style={{float: "right"}}
                        onClick={this.onAddOpinionModalOpen}
                    >
                        {counterpart.translate(
                            "prediction.details.add_opinion"
                        )}
                    </Button>
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
                        detailsSearchTerm={this.state.detailsSearchTerm}
                    />
                ) : null}
            </div>
        );
    }

    render() {
        return (
            <div
                className="grid-block vertical"
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
                        symbols={this.state.symbols}
                    />
                ) : null}
                {this.state.isAddOpinionModalOpen ? (
                    <AddOpinionModal
                        visible={this.state.isAddOpinionModalOpen}
                        onClose={this.onAddOpinionModalClose}
                        predictionMarket={this.state.selectedPredictionMarket}
                        opinion={this.state.initialOpinion}
                        currentAccount={this.props.currentAccount}
                        submitNewOpinion={this.onSubmitNewOpinion}
                        preselectedOpinion={this.state.preselectedOpinion}
                        preselectedAmount={this.state.preselectedAmount}
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
