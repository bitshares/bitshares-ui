import React, {Component} from "react";
import PropTypes from "prop-types";
import counterpart from "counterpart";
import LinkToAccountById from "../Utility/LinkToAccountById";
import {Table, Button, Icon, Tooltip} from "bitshares-ui-style-guide";
import {ChainStore} from "bitsharesjs";
import PaginatedList from "components/Utility/PaginatedList";
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset";

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
                sorter_inactive: (a, b) => {
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
                sorter_inactive: (a, b) => {
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
                sorter_inactive: (a, b) => {
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
                                    "prediction.details." +
                                        (item == "yes"
                                            ? "proves_true"
                                            : "incorrect")
                                )}
                            </span>
                        </div>
                    );
                }
            },
            {
                title: counterpart.translate(
                    "prediction.details.predicated_likelihood"
                ),
                dataIndex: "likelihood",
                align: "left",
                sortOrder:
                    this.props.opinionFilter == "yes" ? "descend" : "ascend",
                sorter: (a, b) => {
                    return a.likelihood > b.likelihood
                        ? 1
                        : a.likelihood < b.likelihood
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
                            <span>{(item * 100).toPrecision(3)}%</span>
                        </div>
                    );
                }
            },
            {
                title: counterpart.translate("prediction.details.premium"),
                dataIndex: "premium",
                align: "left",
                sorter_inactive: (a, b) => {
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
                            <FormattedAsset
                                amount={item.amount}
                                asset={item.asset_id}
                            />
                        </div>
                    );
                }
            },
            {
                title: counterpart.translate("prediction.details.commission"),
                dataIndex: "commission",
                align: "left",
                sorter_inactive: (a, b) => {
                    return a.fee > b.fee ? 1 : a.fee < b.fee ? -1 : 0;
                },
                render: (item, row) => {
                    return (
                        <div
                            style={{
                                whiteSpace: "nowrap"
                            }}
                        >
                            <FormattedAsset
                                amount={item.amount}
                                asset={item.asset_id}
                            />
                            &nbsp;(
                            {(
                                (row.commission.amount / row.premium.amount) *
                                100
                            ).toPrecision(3)}
                            %)
                        </div>
                    );
                }
            },
            {
                title: counterpart.translate(
                    "prediction.details.potential_profit"
                ),
                dataIndex: "potentialProfit",
                align: "left",
                sorter_inactive: (a, b) => {
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
                            <FormattedAsset
                                amount={item.amount}
                                asset={item.asset_id}
                            />
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
                                alignItems: "right"
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
                                <React.Fragment>
                                    <span>
                                        <Tooltip
                                            title={counterpart.translate(
                                                dataItem.opinion == "yes"
                                                    ? "prediction.tooltips.oppose_proves_true"
                                                    : "prediction.tooltips.oppose_is_incorrect"
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
                                            onClick={() => {
                                                this.props.onOppose(dataItem);
                                            }}
                                        >
                                            {counterpart.translate(
                                                "prediction.details.oppose"
                                            )}
                                        </Button>
                                    </span>
                                </React.Fragment>
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
