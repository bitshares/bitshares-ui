import React, {Component} from "react";
import PropTypes from "prop-types";
import counterpart from "counterpart";
import LinkToAccountById from "../Utility/LinkToAccountById";
import {Table, Button} from "bitshares-ui-style-guide";
import {ChainStore} from "bitsharesjs";
import PaginatedList from "components/Utility/PaginatedList";
import ChainTypes from "../Utility/ChainTypes";

export default class PredictionMarketDetailsTable extends Component {
    getHeader() {
        const precision = Math.pow(
            10,
            ChainStore.getAsset(
                this.props.predictionMarketData.predictionMarket.asset_id
            ).get("precision")
        );
        const currentAccountId = this.props.currentAccount.get("id");
        return [
            {
                title: "#",
                dataIndex: "order_id",
                align: "left",
                sorter: (a, b) => {
                    return a.order_id > b.order_id
                        ? 1
                        : a.order_id < b.order_id
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
                            <span>{item}</span>
                        </div>
                    );
                }
            },
            {
                title: counterpart.translate("prediction.details.predictor"),
                dataIndex: "opinionator",
                align: "left",
                sorter: (a, b) => {
                    let a_name = ChainStore.getAccount(a.opinionator).get(
                        "name"
                    );
                    let b_name = ChainStore.getAccount(b.opinionator).get(
                        "name"
                    );
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
                title: counterpart.translate("prediction.details.prediction"),
                dataIndex: "opinion",
                align: "left",
                sorter: (a, b) => {
                    return a.opinion > b.opinion
                        ? 1
                        : a.opinion < b.opinion
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
                            <span>
                                {counterpart.translate(
                                    "prediction.details." + item
                                )}
                            </span>
                        </div>
                    );
                }
            },
            {
                title: counterpart.translate("prediction.details.amount"),
                dataIndex: "amount",
                align: "left",
                sorter: (a, b) => {
                    return a.amount > b.amount
                        ? 1
                        : a.amount < b.amount
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
                            <span>{item / precision}</span>
                        </div>
                    );
                }
            },
            {
                title: counterpart.translate(
                    "prediction.details.predicated_likelihood"
                ),
                dataIndex: "probability",
                align: "left",
                sortOrder: "ascend",
                sorter: (a, b) => {
                    return a.probability > b.probability
                        ? 1
                        : a.probability < b.probability
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
                            <span>{item}</span>
                        </div>
                    );
                }
            },
            {
                title: counterpart.translate("prediction.details.fee"),
                dataIndex: "fee",
                align: "left",
                sorter: (a, b) => {
                    return a.fee > b.fee ? 1 : a.fee < b.fee ? -1 : 0;
                },
                render: item => {
                    return (
                        <div
                            style={{
                                whiteSpace: "nowrap"
                            }}
                        >
                            <span>{item / precision}</span>
                        </div>
                    );
                }
            },
            {
                title: counterpart.translate("prediction.overview.action"),
                align: "left",
                render: dataItem => {
                    return (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center"
                            }}
                        >
                            {currentAccountId &&
                            dataItem.opinionator === currentAccountId ? (
                                <Button
                                    onClick={() => {
                                        this.props.onCancel(dataItem);
                                    }}
                                >
                                    {counterpart.translate(
                                        "prediction.details.cancel"
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => {
                                        this.props.onOppose(dataItem);
                                    }}
                                >
                                    {counterpart.translate(
                                        "prediction.details.oppose"
                                    )}
                                </Button>
                            )}
                        </div>
                    );
                }
            }
        ];
    }

    render() {
        const header = this.getHeader();

        let filteredOpinions = this.props.predictionMarketData.opinions.filter(
            item => {
                let accountName = ChainStore.getAccount(item.opinionator)
                    ? ChainStore.getAccount(item.opinionator).get("name")
                    : null;
                if (this.props.detailsSearchTerm) {
                    if (
                        !(accountName + "\0" + item.opinion)
                            .toUpperCase()
                            .indexOf(this.props.detailsSearchTerm) !== -1
                    ) {
                        return false;
                    }
                }
                if (this.props.opinionFilter) {
                    if (this.props.opinionFilter == "all") {
                        return true;
                    } else {
                        if (!(this.props.opinionFilter == item.opinion)) {
                            return false;
                        }
                    }
                }
                return true;
            }
        );

        let i = 0;
        filteredOpinions = filteredOpinions.map(item => ({
            ...item,
            key: `${item.order_id}${i++}`
        }));

        return (
            <PaginatedList
                rows={filteredOpinions}
                header={header}
                pageSize={10}
            />
        );
    }
}

PredictionMarketDetailsTable.propTypes = {
    predictionMarketData: PropTypes.any.isRequired,
    onOppose: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    currentAccount: ChainTypes.ChainAccount.isRequired,
    detailsSearchTerm: PropTypes.string,
    opinionFilter: PropTypes.string
};

PredictionMarketDetailsTable.defaultProps = {
    predictionMarketData: {}
};
