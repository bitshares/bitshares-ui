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
            markets: [],
            currentAccountId: null,
            searchTerm: "",
            detailsSearchTerm: "",
            selectedMarket: null,
            opinions: [],
            preselectedOpinion: "no",
            preselectedAmount: 0,
            isCreateMarketModalOpen: false,
            isAddOpinionModalOpen: false,
            isResolveModalOpen: false
        };
        this._updateAssetsList("A");
    }

    componentWillReceiveProps(np) {
        if (np.currentAccount !== this.props.currentAccount) {
            this.setState({
                currentAccountId: ChainStore.getAccount(np.currentAccount).get(
                    "id"
                )
            });
        }
        let searchAsset = this.state.lastAssetSymbol;
        if (np.assets) {
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
            searchAsset = lastAsset ? lastAsset.symbol : "A";
            const assets = np.assets.filter(
                a => a.bitasset_data && a.bitasset_data.is_prediction_market
            );
            this.setState({
                assets: [...assets]
            });
            this.updateMarketsList();
        }
        if (
            !this.state.lastAssetSymbol ||
            this.state.lastAssetSymbol !== searchAsset
        ) {
            this._updateAssetsList(searchAsset);
            this.setState({
                lastAssetSymbol: searchAsset
            });
        }

        let orders = [];
        np.marketLimitOrders.forEach((order, order_id) => {
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

    async _updateAssetsList(lastAsset) {
        AssetActions.getAssetList.defer(lastAsset, 100);
    }

    updateMarketsList() {
        const markets = this.state.assets.map(item => ({
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
            markets
        });
    }

    async getMarketOpinions(market) {
        console.log("Fetching opinions");
        if (this.state.subscribedMarket) {
            console.log("Unsubscribe");
            await MarketsActions.unSubscribeMarket(
                this.state.subscribedMarket.base,
                this.state.subscribedMarket.quote
            );
        }
        const base = ChainStore.getAsset(
            market.options.core_exchange_rate.base.asset_id
        );
        const quote = ChainStore.getAsset(
            market.options.core_exchange_rate.quote.asset_id
        );
        console.log("Subscribe");
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
                    selectedMarket: market,
                    preselectedAmount: 0
                });
                this.onResolveModalOpen();
                break;
            }
            case "yes": {
                this.setState({
                    selectedMarket: market,
                    preselectedAmount: 0,
                    preselectedOpinion: "yes"
                });
                this.onAddOpinionModalOpen();
                break;
            }
            case "no": {
                this.setState({
                    selectedMarket: market,
                    preselectedAmount: 0,
                    preselectedOpinion: "no"
                });
                this.onAddOpinionModalOpen();
                break;
            }
            default: {
                this.setState({
                    selectedMarket: market,
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
        console.log(globalSettlementPrice);
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
                        onChange={this.onSearch.bind(this)}
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
                        onClick={this.onCreatePredictionMarketModalOpen.bind(
                            this
                        )}
                    >
                        {counterpart.translate(
                            "prediction.overview.create_market"
                        )}
                    </Button>
                </div>
                <PredictionMarketsOverviewTable
                    markets={this.state.markets}
                    currentAccount={this.props.currentAccount}
                    onMarketAction={this.onMarketAction.bind(this)}
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
                        onChange={this.onSearchDetails.bind(this)}
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
                        onClick={this.onAddOpinionModalOpen.bind(this)}
                    >
                        {counterpart.translate(
                            "prediction.details.add_opinion"
                        )}
                    </Button>
                </div>
                {this.state.opinions ? (
                    <PredictionMarketDetailsTable
                        marketData={{
                            market: this.state.selectedMarket,
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
                {this.state.selectedMarket ? this.getDetailsSection() : null}
                {this.state.isAddOpinionModalOpen ? (
                    <AddOpinionModal
                        show={this.state.isAddOpinionModalOpen}
                        onClose={this.onAddOpinionModalClose.bind(this)}
                        market={this.state.selectedMarket}
                        opinion={this.state.initialOpinion}
                        currentAccount={this.props.currentAccount}
                        submitNewOpinion={this.onSubmitNewOpinion}
                        preselectedOpinion={this.state.preselectedOpinion}
                        preselectedAmount={this.state.preselectedAmount}
                        baseAsset={this.state.subscribedMarket.base}
                        quoteAsset={this.state.subscribedMarket.quote}
                    />
                ) : null}
                {this.state.isCreateMarketModalOpen ? (
                    <CreateMarketModal
                        show={this.state.isCreateMarketModalOpen}
                        onClose={this.onCreatePredictionMarketModalClose.bind(
                            this
                        )}
                        currentAccount={this.props.currentAccount}
                    />
                ) : null}
                {this.state.isResolveModalOpen ? (
                    <ResolveModal
                        show={this.state.isResolveModalOpen}
                        onClose={this.onResolveModalClose.bind(this)}
                        market={this.state.selectedMarket}
                        onResolveMarket={this.onResolveMarket}
                    />
                ) : null}
            </div>
        );
    }
}
