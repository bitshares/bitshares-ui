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
import {Input, Icon} from "bitshares-ui-style-guide";
import AssetName from "../Utility/AssetName";
import {Link} from "react-router-dom";
import {EquivalentValueComponent} from "../Utility/EquivalentValueComponent";
import {MarketPrice} from "../Utility/MarketPrice";
import FormattedPrice from "../Utility/FormattedPrice";
import utils from "common/utils";

class AccountOrders extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedOrders: [],
            filterValue: ""
        };
    }

    componentDidMount() {
        let cancelHeader = document.getElementById("cancelAllOrders");

        if (cancelHeader) {
            cancelHeader.addEventListener(
                "click",
                function() {
                    let orders = this._getFilteredOrders.call(this);
                    orders = orders.toJS ? orders.toJS() : orders;

                    this.setState({selectedOrders: orders});

                    let checkboxes = document.querySelectorAll(".orderCancel");

                    checkboxes.forEach(item => {
                        if (!item.checked) item.checked = true;
                    });
                }.bind(this)
            );
        }
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

    _cancelLimitOrder(orderID, e) {
        e.preventDefault();

        MarketsActions.cancelLimitOrder(
            this.props.account.get("id"),
            orderID, // order id to cancel
            false // Don't show normal confirms
        ).catch(err => {
            console.log("cancel order error:", err);
        });
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

    onCheckCancel(orderId, evt) {
        let {selectedOrders} = this.state;
        let checked = evt.target.checked;

        if (checked) {
            this.setState({selectedOrders: selectedOrders.concat([orderId])});
        } else {
            let index = selectedOrders.indexOf(orderId);

            if (index > -1) {
                this.setState({
                    selectedOrders: selectedOrders
                        .slice(0, index)
                        .concat(selectedOrders.slice(index + 1))
                });
            }
        }
    }

    setFilterValue(evt) {
        this.setState({filterValue: evt.target.value.toLowerCase()});
    }

    resetSelected() {
        this.setState({selectedOrders: []});

        let checkboxes = document.querySelectorAll(".orderCancel");

        checkboxes.forEach(item => {
            if (item.checked) item.checked = false;
        });
    }

    cancelSelected() {
        this._cancelLimitOrders.call(this);
    }
    getHeader() {
        const {isMyAccount} = this.props;
        return [
            isMyAccount
                ? {
                      title: <Translate content="wallet.cancel" />,
                      dataIndex: "cancel",
                      render: item => {
                          return isMyAccount ? (
                              <span
                                  style={{
                                      whiteSpace: "nowrap",
                                      cursor: "pointer"
                                  }}
                              >
                                  {item}
                              </span>
                          ) : null;
                      }
                  }
                : {},
            {
                title: <Translate content="account.trade" />,
                dataIndex: "trade",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                title: <Translate content="transaction.order_id" />,
                dataIndex: "order_id",
                align: "left",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                title: <Translate content="exchange.description" />,
                dataIndex: "description",
                align: "left",
                width: "30%",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                title: <Translate content="exchange.price" />,
                dataIndex: "price",
                align: "left",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                title: <Translate content="exchange.price_market" />,
                dataIndex: "price_market",
                align: "left",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                title: <Translate content="exchange.value" />,
                dataIndex: "value",
                align: "right",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            }
        ];
    }

    render() {
        let {account, marketDirections} = this.props;
        let {filterValue, selectedOrders} = this.state;
        let markets = {};

        let marketOrders = {};

        if (!account.get("orders")) {
            return null;
        }

        let orders = account.get("orders");
        const ordersCount = orders.size;
        if (filterValue) {
            orders = this._getFilteredOrders.call(this);
        }

        orders.forEach(orderID => {
            let order = ChainStore.getObject(orderID).toJS();
            let base = ChainStore.getAsset(order.sell_price.base.asset_id);
            let quote = ChainStore.getAsset(order.sell_price.quote.asset_id);
            let {settings} = this.props;

            if (base && quote) {
                let assets = {
                    [base.get("id")]: {precision: base.get("precision")},
                    [quote.get("id")]: {precision: quote.get("precision")}
                };
                // let baseID = parseInt(order.sell_price.base.asset_id.split(".")[2], 10);
                // let quoteID = parseInt(order.sell_price.quote.asset_id.split(".")[2], 10);

                // let marketName = quoteID > baseID ? `${quote.get("symbol")}_${base.get("symbol")}` : `${base.get("symbol")}_${quote.get("symbol")}`;
                const {marketName} = marketUtils.getMarketName(base, quote);
                const direction = marketDirections.get(marketName);

                if (!markets[marketName]) {
                    if (direction) {
                        markets[marketName] = {
                            base: {
                                id: base.get("id"),
                                symbol: base.get("symbol"),
                                precision: base.get("precision")
                            },
                            quote: {
                                id: quote.get("id"),
                                symbol: quote.get("symbol"),
                                precision: quote.get("precision")
                            }
                        };
                    } else {
                        markets[marketName] = {
                            base: {
                                id: quote.get("id"),
                                symbol: quote.get("symbol"),
                                precision: quote.get("precision")
                            },
                            quote: {
                                id: base.get("id"),
                                symbol: base.get("symbol"),
                                precision: base.get("precision")
                            }
                        };
                    }
                }
                let limitOrder = new LimitOrder(
                    order,
                    assets,
                    markets[marketName].quote.id
                );

                let marketBase = ChainStore.getAsset(
                    markets[marketName].base.id
                );
                let marketQuote = ChainStore.getAsset(
                    markets[marketName].quote.id
                );

                if (!marketOrders[marketName]) {
                    marketOrders[marketName] = [];
                }

                const isBid = limitOrder.isBid();
                const isCall = limitOrder.isCall();
                let preferredUnit = settings ? settings.get("unit") : "1.3.0";
                let quoteColor = !isBid ? "value negative" : "value positive";
                let baseColor = isBid ? "value negative" : "value positive";

                marketOrders[marketName].push(
                    {
                        key: limitOrder.id,
                        cancel: isCall ? null : (
                            <span
                                style={{marginRight: 0}}
                                className="order-cancel"
                            >
                                <input
                                    type="checkbox"
                                    className="orderCancel"
                                    onChange={this.onCheckCancel.bind(
                                        this,
                                        limitOrder.id
                                    )}
                                />
                            </span>
                        ),
                        trade: (
                            <Link
                                to={`/market/${marketQuote.get(
                                    "symbol"
                                )}_${marketBase.get("symbol")}`}
                            >
                                <Icon
                                    type="bar-chart"
                                    name="trade"
                                    title="icons.trade.trade"
                                    className="icon-14px"
                                />
                            </Link>
                        ),
                        order_id: <span>#{limitOrder.id.substring(4)}</span>,
                        description: (
                            <div onClick={this.onFlip.bind(this, marketName)}>
                                {isBid ? (
                                    <Translate
                                        content="exchange.buy_description"
                                        baseAsset={utils.format_number(
                                            limitOrder[
                                                isBid
                                                    ? "amountToReceive"
                                                    : "amountForSale"
                                            ]().getAmount({real: true}),
                                            marketBase.get("precision"),
                                            false
                                        )}
                                        quoteAsset={utils.format_number(
                                            limitOrder[
                                                isBid
                                                    ? "amountForSale"
                                                    : "amountToReceive"
                                            ]().getAmount({real: true}),
                                            marketQuote.get("precision"),
                                            false
                                        )}
                                        baseName={
                                            <AssetName
                                                noTip
                                                customClass={quoteColor}
                                                name={marketQuote.get("symbol")}
                                            />
                                        }
                                        quoteName={
                                            <AssetName
                                                noTip
                                                customClass={baseColor}
                                                name={marketBase.get("symbol")}
                                            />
                                        }
                                    />
                                ) : (
                                    <Translate
                                        content="exchange.sell_description"
                                        baseAsset={utils.format_number(
                                            limitOrder[
                                                isBid
                                                    ? "amountToReceive"
                                                    : "amountForSale"
                                            ]().getAmount({real: true}),
                                            marketBase.get("precision"),
                                            false
                                        )}
                                        quoteAsset={utils.format_number(
                                            limitOrder[
                                                isBid
                                                    ? "amountForSale"
                                                    : "amountToReceive"
                                            ]().getAmount({real: true}),
                                            marketQuote.get("precision"),
                                            false
                                        )}
                                        baseName={
                                            <AssetName
                                                noTip
                                                customClass={quoteColor}
                                                name={marketQuote.get("symbol")}
                                            />
                                        }
                                        quoteName={
                                            <AssetName
                                                noTip
                                                customClass={baseColor}
                                                name={marketBase.get("symbol")}
                                            />
                                        }
                                    />
                                )}
                            </div>
                        ),
                        price: (
                            <div onClick={this.onFlip.bind(this, marketName)}>
                                <FormattedPrice
                                    base_amount={
                                        limitOrder.sellPrice().base.amount
                                    }
                                    base_asset={
                                        limitOrder.sellPrice().base.asset_id
                                    }
                                    quote_amount={
                                        limitOrder.sellPrice().quote.amount
                                    }
                                    quote_asset={
                                        limitOrder.sellPrice().quote.asset_id
                                    }
                                    force_direction={marketBase.get("symbol")}
                                    hide_symbols
                                />
                            </div>
                        ),
                        price_market: (
                            <div onClick={this.onFlip.bind(this, marketName)}>
                                {isBid ? (
                                    <MarketPrice
                                        base={marketBase.get("id")}
                                        quote={marketQuote.get("id")}
                                        force_direction={marketBase.get(
                                            "symbol"
                                        )}
                                        hide_symbols
                                        hide_asset
                                    />
                                ) : (
                                    <MarketPrice
                                        base={marketBase.get("id")}
                                        quote={marketQuote.get("id")}
                                        force_direction={marketBase.get(
                                            "symbol"
                                        )}
                                        hide_symbols
                                        hide_asset
                                    />
                                )}
                            </div>
                        ),
                        value: (
                            <div onClick={this.onFlip.bind(this, marketName)}>
                                <EquivalentValueComponent
                                    hide_asset
                                    amount={limitOrder
                                        .amountForSale()
                                        .getAmount()}
                                    fromAsset={
                                        limitOrder.amountForSale().asset_id
                                    }
                                    noDecimals={true}
                                    toAsset={preferredUnit}
                                />{" "}
                                <AssetName name={preferredUnit} />
                            </div>
                        )
                    }

                    /* <OrderRow
                        ref={markets[marketName].base.symbol}
                        key={order.id}
                        order={limitOrder}
                        base={marketBase}
                        quote={marketQuote}
                        cancel_text={cancel}
                        showSymbols={false}
                        invert={true}
                        onCancel={this._cancelLimitOrder.bind(this, order.id)}
                        price={limitOrder.getPrice()}
                        dashboard
                        isMyAccount={this.props.isMyAccount}
                        settings={this.props.settings}
                        onFlip={this.onFlip.bind(this, marketName)}
                        onCheckCancel={this.onCheckCancel.bind(this, order.id)}
                    /> */
                );
            }
        });

        let tables = [];

        for (let market in marketOrders) {
            if (marketOrders[market].length) {
                tables = tables.concat(
                    marketOrders[market].sort((a, b) => {
                        return a.price - b.price;
                    })
                );
                // tables.push(
                //     <tbody key={market}>
                //         {/* {marketIndex > 0 ? <tr><td colSpan={this.props.isMyAccount ? "7" : "6"}><span style={{visibility: "hidden"}}>H</span></td></tr> : null} */}
                //         {marketOrders[market].sort((a, b) => {
                //             return a.props.price - b.props.price;
                //         })}
                //     </tbody>
                // );
                // marketIndex++;
            }
        }

        // tables.sort((a, b) => {
        //     return parseInt(a.key, 10) - parseInt(b.key, 10);
        // })

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
                </div>

                <PaginatedList
                    pageSize={20}
                    className="table table-striped dashboard-table table-hover"
                    header={this.getHeader()}
                    rows={tables}
                    extraRow={this.props.children}
                />
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
