import React from "react";
import PropTypes from "prop-types";
import {Link} from "react-router-dom";
import counterpart from "counterpart";
import Ps from "perfect-scrollbar";
import OpenSettleOrders from "./OpenSettleOrders";
import utils from "common/utils";
import Translate from "react-translate-component";
import PriceText from "../Utility/PriceText";
import TransitionWrapper from "../Utility/TransitionWrapper";
import SettingsActions from "actions/SettingsActions";
import AssetName from "../Utility/AssetName";
import Icon from "../Icon/Icon";
import {ChainStore} from "bitsharesjs";
import {LimitOrder, CallOrder} from "common/MarketClasses";
import {EquivalentValueComponent} from "../Utility/EquivalentValueComponent";
import {MarketPrice} from "../Utility/MarketPrice";
import FormattedPrice from "../Utility/FormattedPrice";
const leftAlign = {textAlign: "left"};
const rightAlign = {textAlign: "right"};
const centerAlign = {textAlign: "center"};
import ReactTooltip from "react-tooltip";

class TableHeader extends React.Component {
    render() {
        let {
            baseSymbol,
            quoteSymbol,
            dashboard,
            isMyAccount,
            leftAlign
        } = this.props;

        return !dashboard ? (
            <thead>
                <tr>
                    <th style={leftAlign ? leftAlign : rightAlign}>
                        <Translate
                            className="header-sub-title"
                            content="exchange.price"
                        />
                    </th>
                    <th style={leftAlign ? leftAlign : rightAlign}>
                        {baseSymbol ? (
                            <span className="header-sub-title">
                                <AssetName dataPlace="top" name={quoteSymbol} />
                            </span>
                        ) : null}
                    </th>
                    <th style={leftAlign ? leftAlign : rightAlign}>
                        {baseSymbol ? (
                            <span className="header-sub-title">
                                <AssetName dataPlace="top" name={baseSymbol} />
                            </span>
                        ) : null}
                    </th>
                    <th style={leftAlign ? leftAlign : rightAlign}>
                        <Translate
                            className="header-sub-title"
                            content="transaction.expiration"
                        />
                    </th>
                    <th style={{width: "6%"}} />
                </tr>
            </thead>
        ) : (
            <tr>
                {isMyAccount ? (
                    <th id="cancelAllOrders" style={{cursor: "pointer"}}>
                        <Translate content="wallet.cancel" />
                    </th>
                ) : null}
                <th>
                    <Translate content="account.trade" />
                </th>
                <th style={leftAlign}>
                    <Translate content="transaction.order_id" />
                </th>
                <th style={leftAlign} colSpan="4">
                    <Translate content="exchange.description" />
                </th>
                <th style={leftAlign}>
                    <Translate content="exchange.price" />
                </th>
                <th style={leftAlign}>
                    <Translate content="exchange.price_market" />
                </th>
                <th style={{textAlign: "right"}}>
                    <Translate content="exchange.value" />
                </th>
            </tr>
        );
    }
}

TableHeader.defaultProps = {
    quoteSymbol: null,
    baseSymbol: null
};

class OrderRow extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
            nextProps.order.for_sale !== this.props.order.for_sale ||
            nextProps.order.id !== this.props.order.id ||
            nextProps.quote !== this.props.quote ||
            nextProps.base !== this.props.base ||
            nextProps.order.market_base !== this.props.order.market_base
        );
    }

    render() {
        let {
            base,
            quote,
            order,
            showSymbols,
            dashboard,
            isMyAccount,
            settings
        } = this.props;
        const isBid = order.isBid();
        const isCall = order.isCall();
        let tdClass = isCall
            ? "orderHistoryCall"
            : isBid
                ? "orderHistoryBid"
                : "orderHistoryAsk";

        let priceSymbol = showSymbols ? (
            <span>{` ${base.get("symbol")}/${quote.get("symbol")}`}</span>
        ) : null;
        let valueSymbol = showSymbols ? " " + base.get("symbol") : null;
        let amountSymbol = showSymbols ? " " + quote.get("symbol") : null;
        let preferredUnit = settings ? settings.get("unit") : "1.3.0";
        let quoteColor = !isBid ? "value negative" : "value positive";
        let baseColor = isBid ? "value negative" : "value positive";

        return !dashboard ? (
            <tr key={order.id}>
                <td className={tdClass} style={{paddingLeft: 10}}>
                    <PriceText
                        price={order.getPrice()}
                        base={base}
                        quote={quote}
                    />
                    {priceSymbol}
                </td>
                <td>
                    {utils.format_number(
                        order[
                            !isBid ? "amountForSale" : "amountToReceive"
                        ]().getAmount({real: true}),
                        quote.get("precision")
                    )}{" "}
                    {amountSymbol}
                </td>
                <td>
                    {utils.format_number(
                        order[
                            !isBid ? "amountToReceive" : "amountForSale"
                        ]().getAmount({real: true}),
                        base.get("precision")
                    )}{" "}
                    {valueSymbol}
                </td>
                <td
                    style={{
                        width: "25%",
                        textAlign: "right",
                        whiteSpace: "nowrap"
                    }}
                    className="tooltip"
                    data-tip={order.expiration.toLocaleString()}
                >
                    {isCall
                        ? null
                        : counterpart.localize(new Date(order.expiration), {
                              type: "date",
                              format: "short_custom"
                          })}
                </td>
                <td className="text-center" style={{width: "6%"}}>
                    {isCall ? null : (
                        <a
                            style={{marginRight: 0}}
                            className="order-cancel"
                            onClick={this.props.onCancel}
                        >
                            <Icon
                                name="cross-circle"
                                title="icons.cross_circle.cancel_order"
                                className="icon-14px"
                            />
                        </a>
                    )}
                </td>
            </tr>
        ) : (
            <tr key={order.id} className="clickable">
                {isMyAccount ? (
                    <td className="text-center">
                        {isCall ? null : (
                            <span
                                style={{marginRight: 0}}
                                className="order-cancel"
                            >
                                <input
                                    type="checkbox"
                                    className="orderCancel"
                                    onChange={this.props.onCheckCancel}
                                />
                            </span>
                        )}
                    </td>
                ) : null}
                <td>
                    <Link
                        to={`/market/${quote.get("symbol")}_${base.get(
                            "symbol"
                        )}`}
                    >
                        <Icon
                            name="trade"
                            title="icons.trade.trade"
                            className="icon-14px"
                        />
                    </Link>
                </td>
                <td style={leftAlign}>#{order.id.substring(4)}</td>
                <td colSpan="4" style={leftAlign} onClick={this.props.onFlip}>
                    {isBid ? (
                        <Translate
                            content="exchange.buy_description"
                            baseAsset={utils.format_number(
                                order[
                                    isBid ? "amountToReceive" : "amountForSale"
                                ]().getAmount({real: true}),
                                base.get("precision"),
                                false
                            )}
                            quoteAsset={utils.format_number(
                                order[
                                    isBid ? "amountForSale" : "amountToReceive"
                                ]().getAmount({real: true}),
                                quote.get("precision"),
                                false
                            )}
                            baseName={
                                <AssetName
                                    noTip
                                    customClass={quoteColor}
                                    name={quote.get("symbol")}
                                />
                            }
                            quoteName={
                                <AssetName
                                    noTip
                                    customClass={baseColor}
                                    name={base.get("symbol")}
                                />
                            }
                        />
                    ) : (
                        <Translate
                            content="exchange.sell_description"
                            baseAsset={utils.format_number(
                                order[
                                    isBid ? "amountToReceive" : "amountForSale"
                                ]().getAmount({real: true}),
                                base.get("precision"),
                                false
                            )}
                            quoteAsset={utils.format_number(
                                order[
                                    isBid ? "amountForSale" : "amountToReceive"
                                ]().getAmount({real: true}),
                                quote.get("precision"),
                                false
                            )}
                            baseName={
                                <AssetName
                                    noTip
                                    customClass={quoteColor}
                                    name={quote.get("symbol")}
                                />
                            }
                            quoteName={
                                <AssetName
                                    noTip
                                    customClass={baseColor}
                                    name={base.get("symbol")}
                                />
                            }
                        />
                    )}
                </td>
                <td style={leftAlign} onClick={this.props.onFlip}>
                    <FormattedPrice
                        base_amount={order.sellPrice().base.amount}
                        base_asset={order.sellPrice().base.asset_id}
                        quote_amount={order.sellPrice().quote.amount}
                        quote_asset={order.sellPrice().quote.asset_id}
                        force_direction={base.get("symbol")}
                        hide_symbols
                    />
                </td>
                <td style={leftAlign} onClick={this.props.onFlip}>
                    {isBid ? (
                        <MarketPrice
                            base={base.get("id")}
                            quote={quote.get("id")}
                            force_direction={base.get("symbol")}
                            hide_symbols
                            hide_asset
                        />
                    ) : (
                        <MarketPrice
                            base={base.get("id")}
                            quote={quote.get("id")}
                            force_direction={base.get("symbol")}
                            hide_symbols
                            hide_asset
                        />
                    )}
                </td>
                <td style={{textAlign: "right"}} onClick={this.props.onFlip}>
                    <EquivalentValueComponent
                        hide_asset
                        amount={order.amountForSale().getAmount()}
                        fromAsset={order.amountForSale().asset_id}
                        noDecimals={true}
                        toAsset={preferredUnit}
                    />{" "}
                    <AssetName name={preferredUnit} />
                </td>
            </tr>
        );
    }
}

OrderRow.defaultProps = {
    showSymbols: false
};

class MyOpenOrders extends React.Component {
    constructor(props) {
        super();
        this.state = {
            activeTab: props.activeTab,
            rowCount: 20,
            showAll: false
        };
        this._getOrders = this._getOrders.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.activeTab !== this.state.activeTab) {
            this._changeTab(nextProps.activeTab);
        }

        if (
            this.props.hideScrollbars &&
            nextState.showAll != this.state.showAll
        ) {
            let contentContainer = this.refs.container;
            if (!nextState.showAll) {
                Ps.destroy(contentContainer);
            } else {
                Ps.initialize(contentContainer);
                Ps.update(contentContainer);
            }
            if (this.refs.contentTransition) {
                this.refs.contentTransition.resetAnimation();
            }
            if (contentContainer) contentContainer.scrollTop = 0;
        }

        return (
            nextProps.baseSymbol !== this.props.baseSymbol ||
            nextProps.quoteSymbol !== this.props.quoteSymbol ||
            nextProps.className !== this.props.className ||
            nextProps.activeTab !== this.props.activeTab ||
            nextState.activeTab !== this.state.activeTab ||
            nextState.showAll !== this.state.showAll ||
            nextProps.currentAccount !== this.props.currentAccount
        );
    }

    componentDidMount() {
        if (!this.props.hideScrollbars) {
            let contentContainer = this.refs.container;
            if (contentContainer) Ps.initialize(contentContainer);
        }
    }

    componentDidUpdate() {
        if (
            !this.props.hideScrollbars ||
            (this.props.hideScrollbars && this.state.showAll)
        ) {
            let contentContainer = this.refs.container;
            if (contentContainer) Ps.update(contentContainer);
        }
    }

    componentWillReceiveProps(nextProps) {
        let contentContainer = this.refs.container;

        if (
            nextProps.hideScrollbars !== this.props.hideScrollbars &&
            nextProps.hideScrollbars
        ) {
            Ps.destroy(contentContainer);
        }

        if (
            nextProps.hideScrollbars !== this.props.hideScrollbars &&
            !nextProps.hideScrollbars
        ) {
            Ps.initialize(contentContainer);
            this.refs.contentTransition.resetAnimation();
            if (contentContainer) contentContainer.scrollTop = 0;
            Ps.update(contentContainer);
        }
    }

    _onSetShowAll() {
        this.setState({
            showAll: !this.state.showAll
        });

        if (this.state.showAll) {
            this.refs.container.scrollTop = 0;
        }
    }

    _getOrders() {
        const {currentAccount, base, quote, feedPrice} = this.props;
        const orders = currentAccount.get("orders"),
            call_orders = currentAccount.get("call_orders");
        const baseID = base.get("id"),
            quoteID = quote.get("id");
        const assets = {
            [base.get("id")]: {precision: base.get("precision")},
            [quote.get("id")]: {precision: quote.get("precision")}
        };
        let limitOrders = orders
            .toArray()
            .map(order => {
                let o = ChainStore.getObject(order);
                if (!o) return null;
                let sellBase = o.getIn(["sell_price", "base", "asset_id"]),
                    sellQuote = o.getIn(["sell_price", "quote", "asset_id"]);
                if (
                    (sellBase === baseID && sellQuote === quoteID) ||
                    (sellBase === quoteID && sellQuote === baseID)
                ) {
                    return new LimitOrder(o.toJS(), assets, quote.get("id"));
                }
            })
            .filter(a => !!a);

        let callOrders = call_orders
            .toArray()
            .map(order => {
                try {
                    let o = ChainStore.getObject(order);
                    if (!o) return null;
                    let sellBase = o.getIn(["call_price", "base", "asset_id"]),
                        sellQuote = o.getIn([
                            "call_price",
                            "quote",
                            "asset_id"
                        ]);
                    if (
                        (sellBase === baseID && sellQuote === quoteID) ||
                        (sellBase === quoteID && sellQuote === baseID)
                    ) {
                        return feedPrice
                            ? new CallOrder(
                                  o.toJS(),
                                  assets,
                                  quote.get("id"),
                                  feedPrice
                              )
                            : null;
                    }
                } catch (e) {
                    return null;
                }
            })
            .filter(a => !!a)
            .filter(a => {
                try {
                    return a.isMarginCalled();
                } catch (err) {
                    return false;
                }
            });
        return limitOrders.concat(callOrders);
    }

    _changeTab(tab) {
        SettingsActions.changeViewSetting({
            ordersTab: tab
        });
        this.setState({
            activeTab: tab
        });

        // Ensure that focus goes back to top of scrollable container when tab is changed
        let contentContainer = this.refs.container;
        contentContainer.scrollTop = 0;
        Ps.update(contentContainer);

        setTimeout(ReactTooltip.rebuild, 1000);
    }

    render() {
        let {base, quote, quoteSymbol, baseSymbol, settleOrders} = this.props;
        let {activeTab, showAll, rowCount} = this.state;

        if (!base || !quote) return null;

        let contentContainer;
        let footerContainer;

        // Is asset a BitAsset with Settlements
        let baseIsBitAsset =
            base.get("bitasset_data_id") && settleOrders.size > 0
                ? true
                : false;
        let quoteIsBitAsset =
            quote.get("bitasset_data_id") && settleOrders.size > 0
                ? true
                : false;

        {
            /* Users Open Orders Tab (default) */
        }
        if (!activeTab || activeTab == "my_orders") {
            const orders = this._getOrders();
            let emptyRow = (
                <tr>
                    <td
                        style={{
                            textAlign: "center",
                            lineHeight: 4,
                            fontStyle: "italic"
                        }}
                        colSpan="5"
                    >
                        <Translate content="account.no_orders" />
                    </td>
                </tr>
            );

            let bids = orders
                .filter(a => {
                    return a.isBid();
                })
                .sort((a, b) => {
                    return b.getPrice() - a.getPrice();
                })
                .map(order => {
                    let price = order.getPrice();
                    return (
                        <OrderRow
                            price={price}
                            key={order.id}
                            order={order}
                            base={base}
                            quote={quote}
                            onCancel={this.props.onCancel.bind(this, order.id)}
                        />
                    );
                });

            let asks = orders
                .filter(a => {
                    return !a.isBid();
                })
                .sort((a, b) => {
                    return a.getPrice() - b.getPrice();
                })
                .map(order => {
                    let price = order.getPrice();
                    return (
                        <OrderRow
                            price={price}
                            key={order.id}
                            order={order}
                            base={base}
                            quote={quote}
                            onCancel={this.props.onCancel.bind(this, order.id)}
                        />
                    );
                });

            let rows = [];

            if (asks.length) {
                rows = rows.concat(asks);
            }

            if (bids.length) {
                rows = rows.concat(bids);
            }

            rows.sort((a, b) => {
                return a.props.price - b.props.price;
            });

            let rowsLength = rows.length;
            if (!showAll) {
                rows.splice(rowCount, rows.length);
            }

            contentContainer = (
                <TransitionWrapper
                    ref="contentTransition"
                    component="tbody"
                    transitionName="newrow"
                >
                    {rows.length ? rows : emptyRow}
                </TransitionWrapper>
            );

            footerContainer =
                rowsLength > 11 ? (
                    <div className="orderbook-showall">
                        <a onClick={this._onSetShowAll.bind(this)}>
                            <Translate
                                content={
                                    showAll
                                        ? "exchange.hide"
                                        : "exchange.show_all_orders"
                                }
                                rowcount={rowsLength}
                            />
                        </a>
                    </div>
                ) : null;
        }

        {
            /* Open Settle Orders */
        }
        if (activeTab && activeTab == "open_settlement") {
            let settleOrdersLength = settleOrders.length;

            if (settleOrdersLength > 0) {
                if (!showAll) {
                    settleOrders.splice(rowCount, settleOrders.length);
                }
            }

            contentContainer = (
                <OpenSettleOrders
                    key="settle_orders"
                    orders={settleOrders}
                    base={base}
                    quote={quote}
                    baseSymbol={baseSymbol}
                    quoteSymbol={quoteSymbol}
                />
            );

            footerContainer =
                settleOrdersLength > 11 ? (
                    <div className="orderbook-showall">
                        <a onClick={this._onSetShowAll.bind(this)}>
                            <Translate
                                content={
                                    showAll
                                        ? "exchange.hide"
                                        : "exchange.show_all_orders"
                                }
                                rowcount={settleOrdersLength}
                            />
                        </a>
                    </div>
                ) : null;
        }

        return (
            <div
                style={this.props.style}
                key="open_orders"
                className={this.props.className}
            >
                <div
                    className={this.props.innerClass}
                    style={this.props.innerStyle}
                >
                    {this.props.noHeader ? null : (
                        <div
                            style={this.props.headerStyle}
                            className="exchange-content-header"
                        >
                            {activeTab == "my_orders" ? (
                                <Translate content="exchange.my_orders" />
                            ) : null}
                            {activeTab == "open_settlement" ? (
                                <Translate content="exchange.settle_orders" />
                            ) : null}
                        </div>
                    )}
                    <div className="grid-block shrink left-orderbook-header market-right-padding-only">
                        <table className="table order-table text-right fixed-table market-right-padding">
                            {activeTab == "my_orders" ? (
                                <TableHeader
                                    type="sell"
                                    baseSymbol={baseSymbol}
                                    quoteSymbol={quoteSymbol}
                                />
                            ) : (
                                <thead>
                                    <tr>
                                        <th>
                                            <Translate
                                                className="header-sub-title"
                                                content="exchange.price"
                                            />
                                        </th>
                                        <th>
                                            <span className="header-sub-title">
                                                <AssetName
                                                    dataPlace="top"
                                                    name={quoteSymbol}
                                                />
                                            </span>
                                        </th>
                                        <th>
                                            <span className="header-sub-title">
                                                <AssetName
                                                    dataPlace="top"
                                                    name={baseSymbol}
                                                />
                                            </span>
                                        </th>
                                        <th>
                                            <Translate
                                                className="header-sub-title"
                                                content="explorer.block.date"
                                            />
                                        </th>
                                    </tr>
                                </thead>
                            )}
                        </table>
                    </div>

                    <div
                        className="table-container grid-block market-right-padding-only no-overflow"
                        ref="container"
                        style={{
                            overflow: "hidden",
                            minHeight: !this.props.tinyScreen ? 260 : 0,
                            maxHeight: 260,
                            lineHeight: "13px"
                        }}
                    >
                        <table className="table order-table table-highlight-hover table-hover no-stripes text-right fixed-table market-right-padding">
                            {contentContainer}
                        </table>
                    </div>
                    {footerContainer}
                </div>
            </div>
        );
    }
}

MyOpenOrders.defaultProps = {
    base: {},
    quote: {},
    orders: {},
    quoteSymbol: "",
    baseSymbol: ""
};

MyOpenOrders.propTypes = {
    base: PropTypes.object.isRequired,
    quote: PropTypes.object.isRequired,
    orders: PropTypes.object.isRequired,
    quoteSymbol: PropTypes.string.isRequired,
    baseSymbol: PropTypes.string.isRequired
};

export {OrderRow, TableHeader, MyOpenOrders};
