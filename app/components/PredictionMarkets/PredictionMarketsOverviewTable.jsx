import React, {Component} from "react";
import PropTypes from "prop-types";
import counterpart from "counterpart";
import LinkToAssetById from "../Utility/LinkToAssetById";
import LinkToAccountById from "../Utility/LinkToAccountById";
import {Table, Button} from "bitshares-ui-style-guide";

export default class PredictionMarketsOverviewTable extends Component {
    onMarketAction(dataItem, option = "yes") {
        this.props.onMarketAction({
            market: dataItem,
            action: option
        });
    }

    onRowAction = () => {
        return {
            onClick: this.onMarketAction.bind(this)
        };
    };

    _getColumns() {
        const onCell = this.onRowAction;
        return [
            {
                key: "asset_id",
                title: "#",
                align: "left",
                onCell,
                render: dataItem => {
                    return <LinkToAssetById id={dataItem.asset_id} />;
                }
            },
            {
                key: "issuer",
                title: counterpart.translate("prediction.overview.issuer"),
                align: "left",
                onCell,
                render: dataItem => {
                    return <LinkToAccountById account={dataItem.issuer} />;
                }
            },
            {
                key: "condition",
                title: counterpart.translate("prediction.overview.prediction"),
                align: "left",
                onCell,
                render: dataItem => {
                    return <span>{dataItem.condition}</span>;
                }
            },
            {
                key: "description",
                title: counterpart.translate("prediction.overview.description"),
                align: "left",
                onCell,
                render: dataItem => {
                    return <span>{dataItem.description}</span>;
                }
            },
            {
                key: "odds",
                title: counterpart.translate("prediction.overview.odds"),
                align: "left",
                onCell,
                render: dataItem => {
                    return <span>{dataItem.odds}</span>;
                }
            },
            {
                key: "action",
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
                            this.props.currentAccountId === dataItem.issuer ? (
                                <Button
                                    style={{marginTop: "10px", width: "90%"}}
                                    type="primary"
                                    onClick={() =>
                                        this.onMarketAction(dataItem, "resolve")
                                    }
                                >
                                    Resolve
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
                                        onClick={() =>
                                            this.onMarketAction(dataItem, "yes")
                                        }
                                    >
                                        YES
                                    </Button>
                                    <Button
                                        style={{marginLeft: "5px"}}
                                        onClick={() =>
                                            this.onMarketAction(dataItem, "no")
                                        }
                                    >
                                        No
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                }
            }
        ];
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

        return (
            <div style={{paddingTop: "20px"}} key="overview-table">
                <Table
                    columns={this._getColumns()}
                    dataSource={this.props.markets.map(item => ({
                        ...item,
                        key: item.asset_id
                    }))}
                    pagination={pagination}
                    footer={null}
                />
            </div>
        );
    }
}

PredictionMarketsOverviewTable.propTypes = {
    markets: PropTypes.array.isRequired,
    onMarketAction: PropTypes.func.isRequired,
    currentAccountId: PropTypes.string
};

PredictionMarketsOverviewTable.defaultProps = {
    markets: []
};
