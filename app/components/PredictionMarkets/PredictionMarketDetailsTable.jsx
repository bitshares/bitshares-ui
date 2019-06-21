import React, {Component} from "react";
import PropTypes from "prop-types";
import counterpart from "counterpart";
import LinkToAccountById from "../Utility/LinkToAccountById";
import {Table, Button} from "bitshares-ui-style-guide";
import {ChainStore} from "bitsharesjs";

export default class PredictionMarketDetailsTable extends Component {
    _getColumns() {
        const onCell = this.onRowAction;
        return [
            {
                key: "order_id",
                title: "#",
                align: "left",
                onCell,
                render: dataItem => {
                    return <span>{dataItem.order_id}</span>;
                }
            },
            {
                key: "opinionator",
                title: counterpart.translate("prediction.details.opinionator"),
                align: "left",
                onCell,
                render: dataItem => {
                    return <LinkToAccountById account={dataItem.opinionator} />;
                }
            },
            {
                key: "opinion",
                title: counterpart.translate("prediction.details.opinion"),
                align: "left",
                onCell,
                render: dataItem => {
                    return <span>{dataItem.opinion}</span>;
                }
            },
            {
                key: "amount",
                title: counterpart.translate("prediction.details.amount"),
                align: "left",
                onCell,
                render: dataItem => {
                    return <span>{dataItem.amount}</span>;
                }
            },
            {
                key: "fee",
                title: counterpart.translate("prediction.details.fee"),
                align: "left",
                onCell,
                render: dataItem => {
                    return <span>{dataItem.fee}</span>;
                }
            },
            {
                key: "actions",
                title: counterpart.translate("prediction.overview.action"),
                align: "left",
                onCell,
                render: dataItem => {
                    return (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center"
                            }}
                        >
                            {this.props.currentAccountId &&
                            dataItem.opinionator ===
                                this.props.currentAccountId ? (
                                <Button
                                    onClick={() => {
                                        this.cancelOpinion(dataItem);
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

    cancelOpinion(opinion) {
        console.log("Cancel", opinion);
    }

    render() {
        let pagination = {
            hideOnSinglePage: true,
            pageSize: 20,
            showTotal: total =>
                counterpart.translate("utility.total_x_items", {
                    count: total
                })
        };

        let filteredOpinions = this.props.marketData.opinions.filter(
            item => {
                console.log(item);
                return (
                    (item.opiniator + item.opinion)
                        .toUpperCase()
                        .indexOf(this.props.detailsSearchTerm) !== -1
                );
            }
            //TODO filter with opiniator name, not with issuer id
        );

        let i = 0;
        filteredOpinions = filteredOpinions.map(item => ({
            ...item,
            key: `${item.order_id}${i++}`
        }));

        return (
            <div style={{paddingTop: "50px"}} key="overview-table">
                <Table
                    columns={this._getColumns()}
                    dataSource={filteredOpinions}
                    pagination={pagination}
                    footer={null}
                />
            </div>
        );
    }
}

PredictionMarketDetailsTable.propTypes = {
    marketData: PropTypes.any.isRequired,
    onOppose: PropTypes.func.isRequired,
    currentAccountId: PropTypes.string,
    detailsSearchTerm: PropTypes.string
};

PredictionMarketDetailsTable.defaultProps = {
    marketData: {}
};
