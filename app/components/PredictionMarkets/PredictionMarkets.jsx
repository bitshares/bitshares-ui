import React, {Component} from "react";
import counterpart from "counterpart";
import PredictionMarketsOverviewTable from "./PredictionMarketsOverviewTable";
import PredictionMarketDetailsTable from "./PredictionMarketDetailsTable";
import SearchInput from "../Utility/SearchInput";
import HelpContent from "../Utility/HelpContent";
import AddOpinionModal from "./AddOpinionModal";
import CreateMarketModal from "./CreateMarketModal";

import {Button} from "bitshares-ui-style-guide";

const STUB_ACCOUNT_ID = "1.2.23882";

const STUB_MARKETS = [
    {
        symbol: "TWW",
        asset_id: "1.3.0",
        issuer: STUB_ACCOUNT_ID,
        condition: "Tramp will win",
        description: "Some very long description ".repeat(4),
        odds: ""
    },
    {
        symbol: "TWW",
        asset_id: "1.3.1",
        issuer: "1.2.23881",
        condition: "Tramp will win",
        description: "Some very long description ".repeat(4),
        odds: ""
    },
    {
        symbol: "TWW",
        asset_id: "1.3.2",
        issuer: "1.2.23881",
        condition: "Tramp will win",
        description: "Some very long description ".repeat(4),
        odds: ""
    }
];

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
            markets: STUB_MARKETS,
            currentAccountId: STUB_ACCOUNT_ID,
            searchTerm: "",
            detailsSearchTerm: "",
            selectedMarket: null,
            opinions: [],
            action: "yes",
            isCreateMarketModalOpen: false,
            isAddOpinionModalOpen: false
        };
    }

    async getMarketOpinions(market) {
        let opinions = STUB_OPINIONS[market.asset_id];
        opinions = opinions === undefined ? [{}] : opinions;
        this.setState({opinions: opinions});
    }

    onMarketAction({market, action}) {
        this.setState({
            selectedMarket: market,
            action
        });
        this.getMarketOpinions(market);
    }

    onSearch(event) {
        this.setState({searchTerm: event.target.value});
    }

    onSearchDetails(event) {
        this.setState({detailsSearchTerm: event.target.value});
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

    getNewMarketParameters = value => {
        this.setState({
            markets: [...this.state.markets, value],
            isCreateMarketModalOpen: false
        });
    };

    getNewOpinionParameters = value => {
        if (this.state.opinions[0].order_id) {
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
                {this.state.opinions[0].order_id ? (
                    <PredictionMarketDetailsTable
                        marketData={{
                            market: this.state.selectedMarket,
                            opinions: this.state.opinions
                        }}
                        currentAccountId={this.state.currentAccountId}
                        onOppose={dataItem => {
                            console.log("Oppose", dataItem);
                        }}
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
            </div>
        );
    }
}
