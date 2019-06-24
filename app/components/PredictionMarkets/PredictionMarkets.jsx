import React, {Component} from "react";
import AssetActions from "actions/AssetActions";
import counterpart from "counterpart";
import PredictionMarketsOverviewTable from "./PredictionMarketsOverviewTable";
import PredictionMarketDetailsTable from "./PredictionMarketDetailsTable";
import SearchInput from "../Utility/SearchInput";
import HelpContent from "../Utility/HelpContent";
import AddOpinionModal from "./AddOpinionModal";
import CreateMarketModal from "./CreateMarketModal";
import ResolveModal from "./ResolveModal";
import {Button} from "bitshares-ui-style-guide";
import Immutable from "immutable";

const STUB_ACCOUNT_ID = "1.2.23882";

const STUB_OPINIONS = {
    "1.3.0": [
        {
            order_id: "1.4.1234",
            opinionator: "1.2.23881",
            opinion: "yes",
            amount: 100,
            fee: 0.1
        },
        {
            order_id: "1.4.1235",
            opinionator: STUB_ACCOUNT_ID,
            opinion: "no",
            amount: 100500,
            fee: 0.11
        }
    ],
    "1.3.1": [
        {
            order_id: "1.4.1236",
            opinionator: "1.2.23881",
            opinion: "yes",
            amount: 200,
            fee: 0.1
        }
    ],
    "1.3.2": [
        {
            order_id: "1.4.1237",
            opinionator: "1.2.23881",
            opinion: "no",
            amount: 666,
            fee: 0.13
        }
    ]
};

export default class PredictionMarkets extends Component {
    constructor(props) {
        super(props);
        this.state = {
            assets: [],
            lastAssetSymbol: null,
            markets: [],
            currentAccountId: STUB_ACCOUNT_ID,
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
        let searchAsset = this.state.lastAssetSymbol;
        if (np.assets) {
            const assets = np.assets;
            const lastAsset = assets
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
            this.setState({
                assets: [
                    ...this.state.assets,
                    ...assets.filter(
                        a =>
                            a.bitasset_data &&
                            a.bitasset_data.is_prediction_market
                    )
                ]
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
    }

    async _updateAssetsList(lastAsset) {
        AssetActions.getAssetList.defer(lastAsset, 100);
    }

    updateMarketsList() {
        let markets = [];
        for (let item of this.state.assets) {
            let market = {};
            market.asset_id = item[1]["id"];
            market.issuer = item[1]["issuer"];
            //    market.condition =
            try {
                market.description = JSON.parse(
                    item[1]["options"]["description"]
                ).main;
            } catch (e) {
                market.description = item[1]["options"]["description"];
            }
            market.symbol = item[1]["symbol"];

            markets.push(market);
        }
        this.setState({
            markets
        });
    }

    async getMarketOpinions(market) {
        let opinions = STUB_OPINIONS[market.asset_id];
        opinions = !opinions ? [] : opinions;
        this.setState({opinions});
    }

    onMarketAction({market, action}) {
        switch (action) {
            case "resolve": {
                this.setState({
                    selectedMarket: market,
                    preselectedAmount: 0,
                    isResolveModalOpen: true
                });
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
        console.log(this.props.assets);
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

    onOppose = value => {
        this.setState({
            preselectedOpinion: value.opinion === "no" ? "yes" : "no",
            preselectedAmount: value.amount
        });
    };

    getNewMarketParameters = value => {
        this.setState({
            markets: [...this.state.markets, value],
            isCreateMarketModalOpen: false
        });
    };

    getNewOpinionParameters = value => {
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

    getResolveParameters = value => {
        console.log(`Resolved ${value.asset_id}:${value.result}`);
        this.setState({
            isResolveModalOpen: false
        });
    };

    getNewAssetId() {
        //TODO
        return String(Math.random());
    }

    getNewOpinionId() {
        //TODO
        return String(Math.random());
    }

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
                        getNewOpinionParameters={this.getNewOpinionParameters}
                        newOpinionId={this.getNewOpinionId()}
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
                        getNewMarketParameters={this.getNewMarketParameters}
                        newMarketId={this.getNewAssetId()}
                    />
                ) : null}
                {this.state.isResolveModalOpen ? (
                    <ResolveModal
                        show={this.state.isResolveModalOpen}
                        onClose={this.onResolveModalClose.bind(this)}
                        market={this.state.selectedMarket}
                        currentAccountId={this.state.currentAccountId}
                        getResolveParameters={this.getResolveParameters}
                    />
                ) : null}
            </div>
        );
    }
}
