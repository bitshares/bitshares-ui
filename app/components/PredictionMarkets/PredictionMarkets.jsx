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

class PredictionMarkets extends Component {
    constructor(props) {
        super(props);
        this.state = {
            searchTerm: "",
            detailsSearchTerm: "",
            preselectedOpinion: "yes",
            preselectedAmount: 0,
            preselectedProbability: 0,
            isCreateMarketModalOpen: false,
            isAddOpinionModalOpen: false,
            isResolveModalOpen: false,
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
    }

    onMarketAction({market, action}) {
        this.props.onMarketAction({market, action});
        if (typeof action === "string") {
            //on buttons action
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

    onOppose = opinion => {
        this.setState({
            preselectedOpinion: opinion.opinion === "no" ? "yes" : "no",
            preselectedAmount: opinion.amount,
            preselectedProbability: opinion.probability
        });
        this.onAddOpinionModalOpen();
    };

    onCancelOpinion = opinion => {
        this._cancelLimitOrders([opinion.order_id]);
    };

    _cancelLimitOrders(orderid) {
        MarketsActions.cancelLimitOrders(
            this.props.currentAccount.get("id"),
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
            pause.then(result => {
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
        // const setPredictionMarketAssetFilter = e => {
        //     this.setState(
        //         {
        //             predictionMarketAssetFilter: e.target.value
        //         },
        //         this._updatePredictionMarketsList
        //     );
        // };
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
                            //                     onChange={setPredictionMarketAssetFilter}
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
                    predictionMarkets={this.props.predictionMarkets}
                    currentAccount={this.props.currentAccount}
                    onMarketAction={this.onMarketAction}
                    searchTerm={this.state.searchTerm.toUpperCase()}
                    selectedPredictionMarket={
                        this.props.selectedPredictionMarket
                    }
                    hideUnknownHouses={this.state.isHideUnknownHousesChecked}
                    loading={!this.props.isFetchingFinished}
                    whitelistedHouses={this.props.whitelistedHouses}
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
                {this.props.opinions ? (
                    <PredictionMarketDetailsTable
                        predictionMarketData={{
                            predictionMarket: this.props
                                .selectedPredictionMarket,
                            opinions: this.props.opinions
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
        console.log(this.state);
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
                {this.props.selectedPredictionMarket
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
                        predictionMarket={this.props.selectedPredictionMarket}
                        opinion={this.state.initialOpinion}
                        currentAccount={this.props.currentAccount}
                        submitNewOpinion={this.onSubmitNewOpinion}
                        preselectedOpinion={this.state.preselectedOpinion}
                        preselectedAmount={this.state.preselectedAmount}
                        preselectedProbability={
                            this.state.preselectedProbability
                        }
                        baseAsset={this.props.subscribedMarket.base}
                        quoteAsset={this.props.subscribedMarket.quote}
                    />
                ) : null}
                {this.state.isResolveModalOpen ? (
                    <ResolveModal
                        visible={this.state.isResolveModalOpen}
                        onClose={this.onResolveModalClose}
                        predictionMarket={this.props.selectedPredictionMarket}
                        onResolveMarket={this.onResolveMarket}
                    />
                ) : null}
            </div>
        );
    }
}

export default PredictionMarkets;
