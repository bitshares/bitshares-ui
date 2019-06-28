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
import {Input, Icon, Table, Switch} from "bitshares-ui-style-guide";
import AccountOrderRowDescription from "./AccountOrderRowDescription";
import CollapsibleTable from "../Utility/CollapsibleTable";
import {groupBy, sumBy, meanBy} from "lodash-es";
import {FormattedNumber} from "react-intl";

import {Link} from "react-router-dom";
import {MarketPrice} from "../Utility/MarketPrice";
import FormattedPrice from "../Utility/FormattedPrice";
import AssetName from "../Utility/AssetName";
import {EquivalentValueComponent} from "../Utility/EquivalentValueComponent";
import utils from "common/utils";

class AccountOrders extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedOrders: [],
            filterValue: "",
            areAssetsGrouped: props.viewSettings.get(
                "accountOrdersGrouppedByAsset"
            )
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
                    marketDirection: direction,
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

        // And then sort by market name - this way all records will be sorted by price inside, but by the market outside.
        dataSource.sort((a, b) => {
            if (a.marketName > b.marketName) {
                return 1;
            }
            if (a.marketName < b.marketName) {
                return -1;
            }

            // Trick only for grouped orders on the same market, which preserves tables order on direction change
            return a.marketDirection ? 1 : -1;
        });

        return dataSource;
    }

    _getColumns(areAssetsGrouped, groupedDataItems) {
        let onCell = (dataItem, rowIndex) => {
            return {
                onClick: this.onFlip.bind(this, dataItem.marketName)
            };
        };

        let firstDataItem,
            operation,
            forText,
            baseAsset,
            quoteAsset,
            baseName,
            quoteName,
            averagePrice,
            marketPrice,
            value;

        let getBaseAsset = dataItem =>
            dataItem.order[
                dataItem.isBid ? "amountToReceive" : "amountForSale"
            ]().getAmount({real: true});
        let formatBaseAsset = baseAsset =>
            utils.format_number(
                baseAsset,
                firstDataItem.base.get("precision"),
                false
            );

        let getQuoteAsset = dataItem =>
            dataItem.order[
                dataItem.isBid ? "amountForSale" : "amountToReceive"
            ]().getAmount({real: true});
        let formatQuoteAsset = quoteAsset =>
            utils.format_number(
                quoteAsset,
                firstDataItem.quote.get("precision"),
                false
            );

        let formatMarketPrice = dataItem => (
            <MarketPrice
                base={dataItem.base.get("id")}
                quote={dataItem.quote.get("id")}
                force_direction={dataItem.base.get("symbol")}
                hide_symbols
                hide_asset
            />
        );

        if (areAssetsGrouped) {
            // Assuming that first element always exist because data items were passed as grouped
            firstDataItem = groupedDataItems[0];

            operation = counterpart.translate(
                "exchange." + (firstDataItem.isBid ? "buy" : "sell")
            );
            forText = counterpart.translate("transaction.for");

            baseAsset = formatBaseAsset(sumBy(groupedDataItems, getBaseAsset));
            quoteAsset = formatQuoteAsset(
                sumBy(groupedDataItems, getQuoteAsset)
            );

            let quoteColor = !firstDataItem.isBid
                ? "value negative"
                : "value positive";
            let baseColor = firstDataItem.isBid
                ? "value negative"
                : "value positive";

            baseName = (
                <AssetName
                    noTip
                    customClass={quoteColor}
                    name={firstDataItem.quote.get("symbol")}
                />
            );
            quoteName = (
                <AssetName
                    noTip
                    customClass={baseColor}
                    name={firstDataItem.base.get("symbol")}
                />
            );

            averagePrice = meanBy(groupedDataItems, dataItem => {
                let price = dataItem.order.sellPrice().toReal(true);
                return !dataItem.marketDirection ? price : 1 / price;
            });

            // Taken from FormattedPrice internal logic
            let decimals = Math.min(
                8,
                firstDataItem.order.sellPrice()[
                    firstDataItem.isBid ? "base" : "quote"
                ].precision
            );
            averagePrice = (
                <FormattedNumber
                    value={averagePrice}
                    minimumFractionDigits={Math.max(2, decimals)}
                    maximumFractionDigits={Math.max(2, decimals)}
                />
            );

            marketPrice = formatMarketPrice(firstDataItem);

            let valueAmount = sumBy(groupedDataItems, dataItem =>
                dataItem.order.amountForSale().getAmount()
            );

            value = (
                <div>
                    <EquivalentValueComponent
                        hide_asset
                        amount={valueAmount}
                        fromAsset={firstDataItem.order.amountForSale().asset_id}
                        noDecimals={true}
                        toAsset={firstDataItem.preferredUnit}
                    />{" "}
                    <AssetName name={firstDataItem.preferredUnit} />
                </div>
            );
        }

        // Conditional array items: https://stackoverflow.com/a/47771259
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
                            <Icon type="bar-chart" />
                        </Link>
                    );
                }
            },
            {
                key: "orderID",
                title: counterpart.translate("transaction.order_id"),
                render: dataItem => "#" + dataItem.order.id.substring(4)
            },
            ...(areAssetsGrouped
                ? [
                      {
                          key: "operation",
                          title: operation,
                          render: dataItem => operation,
                          onCell: onCell,
                          className: "clickable groupColumn"
                      },
                      {
                          key: "baseAsset",
                          title: baseAsset,
                          render: dataItem =>
                              formatBaseAsset(getBaseAsset(dataItem)),
                          onCell: onCell,
                          className: "clickable groupColumn"
                      },
                      {
                          key: "baseName",
                          title: baseName,
                          render: dataItem => baseName,
                          onCell: onCell,
                          className: "clickable groupColumn"
                      },
                      {
                          key: "for",
                          title: forText,
                          render: dataItem => forText,
                          onCell: onCell,
                          className: "clickable groupColumn"
                      },
                      {
                          key: "quoteAsset",
                          title: quoteAsset,
                          render: dataItem =>
                              formatQuoteAsset(getQuoteAsset(dataItem)),
                          onCell: onCell,
                          className: "clickable groupColumn"
                      },
                      {
                          key: "quoteName",
                          title: quoteName,
                          render: dataItem => quoteName,
                          onCell: onCell,
                          className: "clickable groupColumn"
                      }
                  ]
                : [
                      {
                          key: "description",
                          title: counterpart.translate("exchange.description"),
                          render: dataItem => (
                              <AccountOrderRowDescription {...dataItem} />
                          ),
                          onCell: onCell,
                          className: "clickable"
                      }
                  ]),
            {
                key: "price",
                title: areAssetsGrouped ? (
                    <div>
                        <Translate content="account.average_price" />
                        <br />
                        {averagePrice}
                    </div>
                ) : (
                    counterpart.translate("exchange.price")
                ),
                align: areAssetsGrouped ? "right" : "left",
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
                title: areAssetsGrouped ? (
                    <div>
                        <Translate content="exchange.price_market" />
                        <br />
                        {marketPrice}
                    </div>
                ) : (
                    counterpart.translate("exchange.price_market")
                ),
                align: areAssetsGrouped ? "right" : "left",
                render: formatMarketPrice,
                onCell: onCell,
                className: "clickable"
            },
            {
                key: "value",
                title: areAssetsGrouped ? (
                    <div>
                        <Translate content="exchange.value" />
                        <br />
                        {value}
                    </div>
                ) : (
                    counterpart.translate("exchange.value")
                ),
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

    _formatTables(dataSource, areAssetsGrouped) {
        let pagination = {
            hideOnSinglePage: true,
            pageSize: 20,
            showTotal: (total, range) =>
                counterpart.translate("utility.total_x_items", {
                    count: total
                })
        };

        let footer = () => this.props.children;

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

        let tables = [];

        if (areAssetsGrouped) {
            // Group by market name - this will group all records from the same market, no matter is it sell or buy order
            // And then group by base market ID - this will separate buy and sell records on the same market
            // Don't forget to count the direction - this allows to consider table as the same one when direction changes
            let grouped = groupBy(
                dataSource,
                dataItem =>
                    dataItem.marketName +
                    "_" +
                    (dataItem.marketDirection
                        ? dataItem.base.get("id")
                        : dataItem.quote.get("id"))
            );

            for (let [key, value] of Object.entries(grouped)) {
                let columns = this._getColumns(areAssetsGrouped, value);
                tables.push(
                    <div className="grid-wrapper" key={key}>
                        <CollapsibleTable
                            columns={columns}
                            dataSource={value}
                            rowSelection={rowSelection}
                            pagination={pagination}
                            isCollapsed={true}
                        />
                    </div>
                );
            }
        } else {
            let columns = this._getColumns(areAssetsGrouped, dataSource);

            tables.push(
                <div className="grid-wrapper" key="groupedTable">
                    <Table
                        columns={columns}
                        dataSource={dataSource}
                        rowSelection={rowSelection}
                        pagination={pagination}
                        footer={footer}
                    />
                </div>
            );
        }

        return tables;
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

        let dataSource = this._getDataSource(orders);

        let tables = this._formatTables(
            dataSource,
            this.state.areAssetsGrouped
        );

        let onGroupChange = (checked, evt) => {
            SettingsActions.changeViewSetting({
                accountOrdersGrouppedByAsset: checked
            });
            this.setState({areAssetsGrouped: checked});
        };

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
                                addonAfter={<Icon type="search" />}
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
                    {orders && ordersCount ? (
                        <div className="group-by">
                            <Translate content="account.group_by_asset" />
                            <span className="text">:</span>
                            <Switch
                                onChange={onGroupChange}
                                checked={this.state.areAssetsGrouped}
                            />
                        </div>
                    ) : null}
                </div>

                {tables}
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
                marketDirections: SettingsStore.getState().marketDirections,
                viewSettings: SettingsStore.getState().viewSettings
            };
        }
    }
);

export default AccountOrders;
