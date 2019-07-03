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
        console.log(np.markets);
        if (this.state.assets) {
            console.log(this.state.assets[0]);
        }
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
        console.log(this.props.markets);
        const asks = this.props.markets.asks.map(element => ({
            order_id: element.id,
            opinionator: element.seller,
            opinion: "yes",
            amount: element.for_sale,
            fee: element.fee
        }));
        const bids = this.props.markets.bids.map(element => ({
            order_id: element.id,
            opinionator: element.seller,
            opinion: "no",
            amount: element.for_sale,
            fee: element.fee
        }));
        this.setState({opinions: [...asks, ...bids]});
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
                break;
            }
            case "no": {
                this.setState({
                    selectedMarket: market,
                    preselectedAmount: 0,
                    preselectedOpinion: "no"
                });
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
        console.log(this.props.markets);
        this.setState({
            searchTerm: (event.target.value || "").toUpperCase(),
            selectedMarket: null,
            preselectedAmount: 0
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
            isAddOpinionModalOpen: false
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
        // TODO implement required logic for opinion cancelation
        console.log("Cancel", opinion);
    };

    onSubmitNewOpinion = value => {
        // TODO implement handling of new opinion
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
        // TODO implement handling of market resolvement
        console.log(`Resolved ${market.asset_id}:${market.result}`);
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
                    currentAccountId={this.state.currentAccountId}
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
                        currentAccountId={this.state.currentAccountId}
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
                        currentAccountId={this.state.currentAccountId}
                        submitNewOpinion={this.onSubmitNewOpinion}
                        preselectedOpinion={this.state.preselectedOpinion}
                        preselectedAmount={this.state.preselectedAmount}
                    />
                ) : null}
                {this.state.isCreateMarketModalOpen ? (
                    <CreateMarketModal
                        show={this.state.isCreateMarketModalOpen}
                        onClose={this.onCreatePredictionMarketModalClose.bind(
                            this
                        )}
                        currentAccountId={this.state.currentAccountId}
                    />
                ) : null}
                {this.state.isResolveModalOpen ? (
                    <ResolveModal
                        show={this.state.isResolveModalOpen}
                        onClose={this.onResolveModalClose.bind(this)}
                        market={this.state.selectedMarket}
                        currentAccountId={this.state.currentAccountId}
                        onResolveMarket={this.onResolveMarket}
                    />
                ) : null}
            </div>
        );
    }
}
