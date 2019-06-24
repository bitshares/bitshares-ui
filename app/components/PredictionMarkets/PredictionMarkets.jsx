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

const STUB_MARKETS = [
    {
        symbol: "TWW",
        asset_id: "1.3.0",
        issuer: STUB_ACCOUNT_ID,
        condition: "T will win",
        description:
            "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque ",
        odds: ""
    },
    {
        symbol: "TWW",
        asset_id: "1.3.1",
        issuer: "1.2.23881",
        condition: "Tr will win",
        description:
            "natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut,",
        odds: ""
    },
    {
        symbol: "TWW",
        asset_id: "1.3.2",
        issuer: "1.2.23881",
        condition: "Tra will win",
        description:
            "imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus",
        odds: ""
    },
    {
        symbol: "TWW",
        asset_id: "1.3.2",
        issuer: "1.2.23881",
        condition: "Tram will win",
        description:
            "Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus",
        odds: ""
    },
    {
        symbol: "TWW",
        asset_id: "1.3.2",
        issuer: "1.2.23881",
        condition: "Tramp will win",
        description:
            " Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque",
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
            preselectedOpinion: "no",
            preselectedAmount: 0,
            isCreateMarketModalOpen: false,
            isAddOpinionModalOpen: false,
            isResolveModalOpen: false
        };
        AssetActions.getAssetList.defer("M", 100);
    }

    shouldComponentUpdate(np, ns) {
        return !Immutable.is(np.assets, this.props.assets);
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
