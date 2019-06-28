import React, {Component} from "react";
import PropTypes from "prop-types";
import counterpart from "counterpart";
import LinkToAssetById from "../Utility/LinkToAssetById";
import LinkToAccountById from "../Utility/LinkToAccountById";
import {Table, Button} from "bitshares-ui-style-guide";
import {ChainStore} from "bitsharesjs";

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

    _getColumns() {
        const onCell = this.onRowAction;
        return [
            {
                key: "asset_id",
                title: "#",
                align: "left",
                onCell,
                render: dataItem => {
                    return <LinkToAssetById asset={dataItem.asset_id} />;
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
                //              onCell,
                render: dataItem => {
                    // TODO translation
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
                                    style={{marginTop: "10px", width: "170px"}}
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
            pageSize: 10,
            showTotal: total =>
                counterpart.translate("utility.total_x_items", {
                    count: total
                })
        };

        let filteredMarkets = this.props.markets.filter(item => {
            let accountName = ChainStore.getAccount(item.issuer)
                ? ChainStore.getAccount(item.issuer).get("name")
                : null;
            return (
                (accountName + "\0" + item.condition + "\0" + item.description)
                    .toUpperCase()
                    .indexOf(this.props.searchTerm) !== -1
            );
        });

        let i = 0;
        filteredMarkets = filteredMarkets.map(item => ({
            ...item,
            key: `${item.asset_id}${i++}`
        }));

        return (
            <div style={{paddingTop: "50px"}} key="overview-table">
                <Table
                    columns={this._getColumns()}
                    dataSource={filteredMarkets}
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
    currentAccountId: PropTypes.string,
    searchTerm: PropTypes.string
};

PredictionMarketsOverviewTable.defaultProps = {
    markets: []
};
