import React, {Component} from "react";
import PropTypes from "prop-types";
import counterpart from "counterpart";
import LinkToAssetById from "../Utility/LinkToAssetById";
import LinkToAccountById from "../Utility/LinkToAccountById";
import {Table, Button} from "bitshares-ui-style-guide";
import {ChainStore} from "bitsharesjs";
import PaginatedList from "components/Utility/PaginatedList";
import ChainTypes from "../Utility/ChainTypes";

require("./prediction.scss");

const ISSUERS_WHITELIST = ["1.2.1634961"]; // "iamredbar1", "sports-owner", "twat123"

export default class PredictionMarketsOverviewTable extends Component {
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
                                        {counterpart.translate(
                                            "prediction.overview.yes"
                                        )}
                                    </Button>
                                    <Button
                                        style={{marginLeft: "5px"}}
                                        className="align-middle"
                                        onClick={() =>
                                            this.onMarketAction(dataItem, "no")
                                        }
                                    >
                                        {counterpart.translate(
                                            "prediction.overview.no"
                                        )}
                                    </Button>
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

    render() {
        const header = this.getHeader();

        let filteredMarkets = [];

        if (this.props.selectedPredictionMarket) {
            filteredMarkets = [this.props.selectedPredictionMarket];
        } else {
            filteredMarkets = this.props.predictionMarkets.filter(item => {
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

        if (this.props.hideUnknownHouses) {
            filteredMarkets = filteredMarkets.filter(item => {
                return ISSUERS_WHITELIST.includes(item.issuer);
            });
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
