import React from "react";
import counterpart from "counterpart";
import MarketsActions from "actions/MarketsActions";
import {ChainStore} from "bitsharesjs";
import {LimitOrder} from "common/MarketClasses";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import marketUtils from "common/market_utils";
import Translate from "react-translate-component";
import PaginatedList from "../Utility/PaginatedList";
import {Input, Icon as AntIcon, Table} from "bitshares-ui-style-guide";
import AccountOrderRowDescription from "./AccountOrderRowDescription";

import {Link} from "react-router-dom";
import Icon from "../Icon/Icon";
import {MarketPrice} from "../Utility/MarketPrice";
import FormattedPrice from "../Utility/FormattedPrice";
import AssetName from "../Utility/AssetName";
import {EquivalentValueComponent} from "../Utility/EquivalentValueComponent";

class AccountOrders extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedOrders: [],
            filterValue: ""
        };
    }

    _getFilteredOrders() {
        let {filterValue} = this.state;

        let orders = this.props.account.get("orders") || [];

        return orders.filter(item => {
            let order = ChainStore.getObject(item).toJS();
            let base = ChainStore.getAsset(order.sell_price.base.asset_id);
            let quote = ChainStore.getAsset(order.sell_price.quote.asset_id);

            let baseSymbol = base.get("symbol").toLowerCase();
            let quoteSymbol = quote.get("symbol").toLowerCase();

            return (
                baseSymbol.indexOf(filterValue) > -1 ||
                quoteSymbol.indexOf(filterValue) > -1
            );
        });
    }

    _getDataSource(orders) {
        let dataSource = [];

        orders.forEach(orderID => {
            let order = ChainStore.getObject(orderID).toJS();
            let base = ChainStore.getAsset(order.sell_price.base.asset_id);
            let quote = ChainStore.getAsset(order.sell_price.quote.asset_id);

            if (base && quote) {
                let assets = {
                    [base.get("id")]: {precision: base.get("precision")},
                    [quote.get("id")]: {precision: quote.get("precision")}
                };

                const {marketName} = marketUtils.getMarketName(base, quote);
                const direction = this.props.marketDirections.get(marketName);

                let marketQuoteId = direction
                    ? quote.get("id")
                    : base.get("id");
                let marketBaseId = direction ? base.get("id") : quote.get("id");

                let limitOrder = new LimitOrder(order, assets, marketQuoteId);

                let marketBase = ChainStore.getAsset(marketBaseId);
                let marketQuote = ChainStore.getAsset(marketQuoteId);

                let isBid = limitOrder.isBid();
                let dataItem = {
                    key: order.id,
                    order: limitOrder,
                    isBid: isBid,
                    quote: marketQuote,
                    base: marketBase,
                    marketName: marketName,
                    preferredUnit: this.props.settings
                        ? this.props.settings.get("unit")
                        : "1.3.0",
                    quoteColor: !isBid ? "value negative" : "value positive",
                    baseColor: isBid ? "value negative" : "value positive"
                };

                dataSource.push(dataItem);
            }
        });

        // Sort by price first
        dataSource.sort((a, b) => {
            return a.order.getPrice() - b.order.getPrice();
        });

        // And then - by market. This way, all records will be grouped by market, but sorted by price inside
        dataSource.sort((a, b) => {
            if (a.marketName > b.marketName) {
                return 1;
            }
            if (a.marketName < b.marketName) {
                return -1;
            }

            return 0;
        });

        return dataSource;
    }

    _getColumns() {
        let onCell = (dataItem, rowIndex) => {
            return {
                onClick: this.onFlip.bind(this, dataItem.marketName)
            };
        };

        return [
            {
                key: "trade",
                title: counterpart.translate("account.trade"),
                align: "center",
                render: dataItem => {
                    return (
                        <Link
                            to={`/market/${dataItem.quote.get(
                                "symbol"
                            )}_${dataItem.base.get("symbol")}`}
                        >
                            <Icon
                                name="trade"
                                title="icons.trade.trade"
                                className="icon-14px"
                            />
                        </Link>
                    );
                }
            },
            {
                key: "orderID",
                title: counterpart.translate("transaction.order_id"),
                render: dataItem => "#" + dataItem.order.id.substring(4)
            },
            {
                key: "description",
                title: counterpart.translate("exchange.description"),
                render: dataItem => (
                    <AccountOrderRowDescription {...dataItem} />
                ),
                onCell: onCell,
                className: "clickable"
            },
            {
                key: "price",
                title: counterpart.translate("exchange.price"),
                render: dataItem => (
                    <FormattedPrice
                        base_amount={dataItem.order.sellPrice().base.amount}
                        base_asset={dataItem.order.sellPrice().base.asset_id}
                        quote_amount={dataItem.order.sellPrice().quote.amount}
                        quote_asset={dataItem.order.sellPrice().quote.asset_id}
                        force_direction={dataItem.base.get("symbol")}
                        hide_symbols
                    />
                ),
                onCell: onCell,
                className: "clickable"
            },
            {
                key: "marketPrice",
                title: counterpart.translate("exchange.price_market"),
                render: dataItem =>
                    dataItem.isBid ? (
                        <MarketPrice
                            base={dataItem.base.get("id")}
                            quote={dataItem.quote.get("id")}
                            force_direction={dataItem.base.get("symbol")}
                            hide_symbols
                            hide_asset
                        />
                    ) : (
                        <MarketPrice
                            base={dataItem.base.get("id")}
                            quote={dataItem.quote.get("id")}
                            force_direction={dataItem.base.get("symbol")}
                            hide_symbols
                            hide_asset
                        />
                    ),
                onCell: onCell,
                className: "clickable"
            },
            {
                key: "value",
                title: counterpart.translate("exchange.value"),
                align: "right",
                render: dataItem => (
                    <div>
                        <EquivalentValueComponent
                            hide_asset
                            amount={dataItem.order.amountForSale().getAmount()}
                            fromAsset={dataItem.order.amountForSale().asset_id}
                            noDecimals={true}
                            toAsset={dataItem.preferredUnit}
                        />{" "}
                        <AssetName name={dataItem.preferredUnit} />
                    </div>
                ),
                onCell: onCell,
                className: "clickable"
            }
        ];
    }

    _cancelLimitOrders(orderId) {
        MarketsActions.cancelLimitOrders(
            this.props.account.get("id"),
            this.state.selectedOrders
        )
            .then(() => {
                this.resetSelected();
            })
            .catch(err => {
                console.log("cancel orders error:", err);
            });
    }

    onFlip(marketId) {
        let setting = {};
        setting[marketId] = !this.props.marketDirections.get(marketId);
        SettingsActions.changeMarketDirection(setting);
    }

    setFilterValue(evt) {
        this.setState({filterValue: evt.target.value.toLowerCase()});
    }

    resetSelected() {
        this.setState({selectedOrders: []});
    }

    cancelSelected() {
        this._cancelLimitOrders.call(this);
    }

    render() {
        let {account} = this.props;
        let {filterValue, selectedOrders} = this.state;

        if (!account.get("orders")) {
            return null;
        }

        let orders = account.get("orders");
        const ordersCount = orders.size;
        if (filterValue) {
            orders = this._getFilteredOrders.call(this);
        }

        let pagination = {
            hideOnSinglePage: true,
            pageSize: 20,
            showTotal: (total, range) =>
                counterpart.translate("utility.total_x_items", {
                    count: total
                })
        };

        let footer = () => this.props.children;

        let columns = this._getColumns();

        let dataSource = this._getDataSource(orders);

        let rowSelection = this.props.isMyAccount
            ? {
                  // Uncomment the following line to show translated text as a cancellable column header instead of checkbox
                  //columnTitle: counterpart.translate("wallet.cancel")
                  onChange: (selectedRowKeys, selectedRows) => {
                      this.setState({selectedOrders: selectedRowKeys});
                  },
                  // Required in order resetSelected to work
                  selectedRowKeys: this.state.selectedOrders
              }
            : null;

        return (
            <div
                className="grid-content no-overflow no-padding"
                style={{paddingBottom: 15}}
            >
                <div className="header-selector">
                    {orders && ordersCount ? (
                        <div className="filter inline-block">
                            <Input
                                type="text"
                                placeholder={counterpart.translate(
                                    "account.filter_orders"
                                )}
                                onChange={this.setFilterValue.bind(this)}
                                addonAfter={<AntIcon type="search" />}
                            />
                        </div>
                    ) : null}
                    {selectedOrders.length ? (
                        <button
                            className="button"
                            onClick={this.resetSelected.bind(this)}
                        >
                            <Translate content="account.reset_orders" />
                        </button>
                    ) : null}
                    {selectedOrders.length ? (
                        <button
                            className="button"
                            onClick={this.cancelSelected.bind(this)}
                        >
                            <Translate content="account.submit_orders" />
                        </button>
                    ) : null}
                </div>

                <div className="grid-content">
                    <Table
                        columns={columns}
                        dataSource={dataSource}
                        rowSelection={rowSelection}
                        pagination={pagination}
                        footer={footer}
                    />
                </div>
            </div>
        );
    }
}

AccountOrders = connect(
    AccountOrders,
    {
        listenTo() {
            return [SettingsStore];
        },
        getProps() {
            return {
                marketDirections: SettingsStore.getState().marketDirections
            };
        }
    }
);

export default AccountOrders;
