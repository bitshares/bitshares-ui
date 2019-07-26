import React, {Component} from "react";
import PropTypes from "prop-types";
import counterpart from "counterpart";
import LinkToAssetById from "../Utility/LinkToAssetById";
import LinkToAccountById from "../Utility/LinkToAccountById";
import {Table, Button} from "bitshares-ui-style-guide";
import {ChainStore} from "bitsharesjs";
import PaginatedList from "components/Utility/PaginatedList";
import ChainTypes from "../Utility/ChainTypes";
import MarketsActions from "../../actions/MarketsActions";
import debounceRender from "react-debounce-render";
import FormattedAsset from "../Utility/FormattedAsset";
import utils from "../../lib/common/utils";

require("./prediction.scss");

const ISSUERS_WHITELIST = ["1.2.1634961"]; // "iamredbar1", "sports-owner", "twat123"

class PredictionMarketsOverviewTable extends Component {
    constructor(props) {
        super(props);
        this.state = {
            ticker: {}
        };
        this.tickersLoaded = {};
    }

    onMarketAction(dataItem, option = "yes") {
        this.props.onMarketAction({
            market: dataItem,
            action: option
        });
    }

    onRowAction = dataItem => {
        return {
            onClick: this.onMarketAction.bind(this, dataItem)
        };
    };

    getHeader() {
        const isOwnedByCurrent = id =>
            this.props.currentAccount.get("id") === id;
        return [
            {
                title: "#",
                dataIndex: "asset_id",
                align: "left",
                defaultSortOrder: "ascend",
                sorter: (a, b) => {
                    return a.symbol > b.symbol
                        ? 1
                        : a.symbol < b.symbol
                            ? -1
                            : 0;
                },
                render: item => {
                    return (
                        <div
                            style={{
                                whiteSpace: "nowrap"
                            }}
                        >
                            <LinkToAssetById asset={item} />
                        </div>
                    );
                }
            },
            {
                title: counterpart.translate("prediction.overview.issuer"),
                dataIndex: "issuer",
                align: "left",
                sorter: (a, b) => {
                    let a_issuer = ChainStore.getAccount(a.issuer);
                    let b_issuer = ChainStore.getAccount(b.issuer);
                    let a_name = null,
                        b_name = null;
                    if (a_issuer && b_issuer) {
                        a_name = a_issuer.get("name");
                        b_name = b_issuer.get("name");
                    }
                    return a_name > b_name ? 1 : a_name < b_name ? -1 : 0;
                },
                render: item => {
                    return (
                        <div
                            style={{
                                whiteSpace: "nowrap"
                            }}
                        >
                            <LinkToAccountById account={item} />
                        </div>
                    );
                }
            },
            {
                title: counterpart.translate("prediction.overview.prediction"),
                dataIndex: "condition",
                align: "left",
                sorter: (a, b) => {
                    if (!a.condition || a.condition === "") return -1;
                    if (!b.condition || b.condition === "") return 1;
                    return a.condition.localeCompare(b.condition);
                },
                render: item => {
                    return (
                        <div
                            style={{
                                whiteSpace: "normal"
                            }}
                        >
                            <span>{item}</span>
                        </div>
                    );
                }
            },
            {
                title: counterpart.translate(
                    "prediction.overview.market_confidence"
                ),
                dataIndex: "marketConfidence",
                align: "left",
                sorter: (a, b) => {
                    return a.marketConfidence > b.marketConfidence
                        ? 1
                        : a.marketConfidence < b.marketConfidence
                            ? -1
                            : 0;
                },
                render: (item, row) => {
                    const ticker = Object.assign(
                        {},
                        this.state.ticker[row.asset_id]
                    );

                    if (ticker) {
                        if (
                            !ticker.quote_volume ||
                            ticker.quote_volume === "0" ||
                            ticker.quote_volume === "1" ||
                            ticker.quote_volume === "NaN" ||
                            ticker.quote_volume === "-NaN"
                        ) {
                            ticker.quote_volume = 0;
                        } else {
                            ticker.quote_volume = utils.convert_typed_to_satoshi(
                                parseFloat(ticker.quote_volume),
                                ChainStore.getAsset(
                                    row.asset[1].bitasset_data.options
                                        .short_backing_asset
                                )
                            );
                        }
                        if (
                            !ticker.percent_change ||
                            ticker.percent_change === "NaN" ||
                            ticker.percent_change === "-NaN"
                        ) {
                            ticker.percent_change = "-";
                        } else {
                            if (ticker.percent_change == "0") {
                                ticker.percent_change = "0%";
                            } else {
                                ticker.percent_change =
                                    (parseFloat(ticker.latest) > 0
                                        ? "+"
                                        : "-") +
                                    ticker.percent_change +
                                    "%";
                            }
                        }
                        return (
                            <span>
                                {counterpart.translate("exchange.vol_short")}
                                &nbsp;
                                <FormattedAsset
                                    amount={ticker.quote_volume}
                                    asset={
                                        row.asset[1].bitasset_data.options
                                            .short_backing_asset
                                    }
                                />
                                &nbsp;
                                {/*({ticker.percent_change})&nbsp;*/}
                            </span>
                        );
                    } else {
                        return null;
                    }
                }
            },
            {
                title: counterpart.translate(
                    "prediction.overview.market_predicated_likelihood"
                ),
                dataIndex: "marketLikelihood",
                align: "left",
                sorter: (a, b) => {
                    return a.marketLikelihood > b.marketLikelihood
                        ? 1
                        : a.marketLikelihood < b.marketLikelihood
                            ? -1
                            : 0;
                },
                render: (item, row) => {
                    const ticker = Object.assign(
                        {},
                        this.state.ticker[row.asset_id]
                    );

                    if (ticker) {
                        if (
                            !ticker.latest ||
                            ticker.latest === "0" ||
                            ticker.latest === "1" ||
                            ticker.latest === "NaN" ||
                            ticker.latest === "-NaN"
                        ) {
                            ticker.latest = "-";
                        } else {
                            ticker.latest =
                                (parseFloat(ticker.latest) * 100).toPrecision(
                                    3
                                ) + "%";
                        }
                        if (
                            !ticker.highest_bid ||
                            ticker.highest_bid === "0" ||
                            ticker.highest_bid === "1" ||
                            ticker.highest_bid === "NaN" ||
                            ticker.highest_bid === "-NaN"
                        ) {
                            ticker.highest_bid = "-";
                        } else {
                            ticker.highest_bid =
                                (
                                    parseFloat(ticker.highest_bid) * 100
                                ).toPrecision(3) + "%";
                        }
                        if (
                            !ticker.lowest_ask ||
                            ticker.lowest_ask === "0" ||
                            ticker.lowest_ask === "1" ||
                            ticker.lowest_ask === "NaN" ||
                            ticker.lowest_ask === "-NaN"
                        ) {
                            ticker.lowest_ask = "-";
                        } else {
                            ticker.lowest_ask =
                                (
                                    parseFloat(ticker.lowest_ask) * 100
                                ).toPrecision(3) + "%";
                        }
                        return ticker.latest !== "-" ? (
                            <React.Fragment>
                                <span>
                                    {ticker.latest}
                                    &nbsp;
                                </span>
                                <span className="supsub">
                                    <sup className="superscript">
                                        {ticker.highest_bid}
                                    </sup>
                                    <sub className="subscript">
                                        {ticker.lowest_ask}
                                    </sub>
                                </span>
                                &nbsp;&nbsp;&nbsp;
                            </React.Fragment>
                        ) : (
                            "-"
                        );
                    } else {
                        return null;
                    }
                }
            },
            {
                title: counterpart.translate("prediction.overview.description"),
                dataIndex: "description",
                align: "left",
                sorter: (a, b) => {
                    if (!a.description || a.description === "") return -1;
                    if (!b.description || b.description === "") return 1;
                    return a.description.localeCompare(b.description);
                },
                render: item => {
                    return (
                        <div
                            style={{
                                whiteSpace: "normal"
                            }}
                        >
                            <span>{item}</span>
                        </div>
                    );
                }
            },
            {
                title: counterpart.translate("prediction.overview.expiry"),
                dataIndex: "expiry",
                align: "left",
                sorter: (a, b) => {
                    if (!a.expiry || a.expiry === "") return -1;
                    if (!b.expiry || b.expiry === "") return 1;
                    return a.expiry.localeCompare(b.expiry);
                },
                render: item => {
                    return (
                        <div
                            style={{
                                whiteSpace: "normal"
                            }}
                        >
                            <span>{item}</span>
                        </div>
                    );
                }
            },
            {
                title: counterpart.translate("prediction.overview.action"),
                align: "center",
                render: dataItem => {
                    return (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center"
                            }}
                        >
                            {isOwnedByCurrent(dataItem.issuer) ? (
                                <Button
                                    style={{width: "170px"}}
                                    className="align-middle"
                                    type="primary"
                                    onClick={() =>
                                        this.onMarketAction(dataItem, "resolve")
                                    }
                                >
                                    {counterpart.translate(
                                        "prediction.overview.resolve"
                                    )}
                                </Button>
                            ) : (
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "center"
                                    }}
                                >
                                    <Button
                                        style={{marginRight: "5px"}}
                                        className="align-middle"
                                        onClick={() =>
                                            this.onMarketAction(dataItem, "yes")
                                        }
                                    >
                                        Details
                                    </Button>
                                    {/*<Button*/}
                                    {/*style={{marginLeft: "5px"}}*/}
                                    {/*className="align-middle"*/}
                                    {/*onClick={() =>*/}
                                    {/*this.onMarketAction(dataItem, "no")*/}
                                    {/*}*/}
                                    {/*>*/}
                                    {/*{counterpart.translate(*/}
                                    {/*"prediction.overview.no"*/}
                                    {/*)}*/}
                                    {/*</Button>*/}
                                </div>
                            )}
                        </div>
                    );
                }
            }
        ];
    }

    _decideRowClassName(row, index) {
        return this.props.selectedPredictionMarket ? "selected-row" : "";
    }

    componentDidUpdate(prevProps) {
        if (
            prevProps.predictionMarkets.length !==
            this.props.predictionMarkets.length
        ) {
            this.props.predictionMarkets.forEach(market => {
                if (!(market.asset[1].id in Object.keys(this.tickersLoaded))) {
                    this.tickersLoaded[market.asset[1].id] = {};
                    MarketsActions.getTicker(
                        market.asset[1].bitasset_data.options
                            .short_backing_asset,
                        market.asset[1].id
                    ).then(result => {
                        let ticker = Object.assign(
                            this.tickersLoaded,
                            this.state.ticker
                        );
                        ticker[market.asset[1].id] = result;
                        this.tickersLoaded[market.asset[1].id] = result;
                        this.setState({ticker});
                    });
                }
            });
        }
    }

    render() {
        const header = this.getHeader();

        let filteredMarkets = [];

        if (this.props.selectedPredictionMarket) {
            filteredMarkets = [this.props.selectedPredictionMarket];
        } else {
            if (this.props.predictionMarkets) {
                filteredMarkets = this.props.predictionMarkets;
                if (this.props.hideUnknownHouses) {
                    filteredMarkets = filteredMarkets.filter(item => {
                        return ISSUERS_WHITELIST.includes(item.issuer);
                    });
                }
                filteredMarkets = filteredMarkets.filter(item => {
                    let accountName = ChainStore.getAccount(item.issuer)
                        ? ChainStore.getAccount(item.issuer).get("name")
                        : null;
                    return (
                        (
                            accountName +
                            "\0" +
                            item.condition +
                            "\0" +
                            item.description
                        )
                            .toUpperCase()
                            .indexOf(this.props.searchTerm) !== -1
                    );
                });

                let i = 0;
                filteredMarkets = filteredMarkets.map(item => ({
                    ...item,
                    key: `${item.asset_id}${i++}`
                }));
            }
        }

        const rowSelection = {
            type: this.props.selectedPredictionMarket ? undefined : "radio",
            hideDefaultSelections: true,
            // Uncomment the following line to show translated text as a cancellable column header instead of checkbox
            //columnTitle: counterpart.translate("wallet.cancel")
            onChange: (selectedRowKeys, selectedRows) => {
                if (selectedRows.length > 0) {
                    this.onMarketAction(selectedRows[0], null);
                } else {
                    this.onMarketAction(null, null);
                }
            },
            // Required in order resetSelected to work
            selectedRowKeys: this.props.selectedPredictionMarket
                ? [this.props.selectedPredictionMarket.key]
                : []
        };
        return (
            <PaginatedList
                rowSelection={rowSelection}
                rows={filteredMarkets}
                header={header}
                pageSize={10}
                rowClassName={this._decideRowClassName.bind(this)}
            />
        );
    }
}

PredictionMarketsOverviewTable.propTypes = {
    predictionMarkets: PropTypes.array.isRequired,
    onMarketAction: PropTypes.func.isRequired,
    currentAccount: ChainTypes.ChainAccount.isRequired,
    searchTerm: PropTypes.string,
    selectedPredictionMarket: PropTypes.object,
    hideUnknownHouses: PropTypes.bool
};

PredictionMarketsOverviewTable.defaultProps = {
    predictionMarkets: []
};

export default (PredictionMarketsOverviewTable = debounceRender(
    PredictionMarketsOverviewTable,
    150,
    {leading: false}
));
