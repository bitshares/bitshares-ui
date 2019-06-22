import React from "react";
import PropTypes from "prop-types";
import counterpart from "counterpart";
import Ps from "perfect-scrollbar";
import OpenSettleOrders from "./OpenSettleOrders";
import MarketsActions from "actions/MarketsActions";
import utils from "common/utils";
import Translate from "react-translate-component";
import PriceText from "../Utility/PriceText";
import TransitionWrapper from "../Utility/TransitionWrapper";
import SettingsActions from "actions/SettingsActions";
import AssetName from "../Utility/AssetName";
import {ChainStore} from "bitsharesjs";
import {LimitOrder, CallOrder} from "common/MarketClasses";
const leftAlign = {textAlign: "left !important"};
const rightAlign = {textAlign: "right"};
import ReactTooltip from "react-tooltip";
import {Tooltip, Checkbox, Button} from "bitshares-ui-style-guide";

class ExchangeTableHeader extends React.Component {
    render() {
        let {baseSymbol, quoteSymbol, isMyAccount, selected} = this.props;

        return (
            <thead>
                <tr>
                    <th style={{width: "6%", textAlign: "center"}}>
                        <Tooltip
                            title={counterpart.translate(
                                "exchange.cancel_selected_orders"
                            )}
                            placement="left"
                        >
                            <Checkbox
                                className="order-cancel-toggle"
                                checked={selected}
                                onChange={this.props.onCancelToggle}
                            />
                        </Tooltip>
                    </th>
                    <th style={rightAlign}>
                        <Translate
                            className="header-sub-title"
                            content="exchange.price"
                        />
                    </th>
                    <th style={rightAlign}>
                        {baseSymbol ? (
                            <span className="header-sub-title">
                                <AssetName dataPlace="top" name={quoteSymbol} />
                            </span>
                        ) : null}
                    </th>
                    <th style={rightAlign}>
                        {baseSymbol ? (
                            <span className="header-sub-title">
                                <AssetName dataPlace="top" name={baseSymbol} />
                            </span>
                        ) : null}
                    </th>
                    <th style={rightAlign}>
                        <Translate
                            className="header-sub-title"
                            content="transaction.expiration"
                        />
                    </th>
                </tr>
            </thead>
        );
    }
}

ExchangeTableHeader.defaultProps = {
    quoteSymbol: null,
    baseSymbol: null
};

class ExchangeOrderRow extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
            nextProps.order.for_sale !== this.props.order.for_sale ||
            nextProps.order.id !== this.props.order.id ||
            nextProps.quote !== this.props.quote ||
            nextProps.base !== this.props.base ||
            nextProps.order.market_base !== this.props.order.market_base ||
            nextProps.selected !== this.props.selected
        );
    }

    render() {
        let {base, quote, order, selected} = this.props;
        const isBid = order.isBid();
        const isCall = order.isCall();
        let tdClass = isCall
            ? "orderHistoryCall"
            : isBid
                ? "orderHistoryBid"
                : "orderHistoryAsk";

        return (
            <tr key={order.id}>
                <td className="text-center" style={{width: "6%"}}>
                    {isCall ? null : (
                        <Tooltip
                            title={counterpart.translate(
                                "exchange.cancel_selected_orders"
                            )}
                            placement="left"
                        >
                            <Checkbox
                                className="orderCancel"
                                checked={selected}
                                onChange={this.props.onCheckCancel}
                            />
                        </Tooltip>
                    )}
                </td>
                <td className={tdClass} style={{paddingLeft: 10}}>
                    <PriceText
                        price={order.getPrice()}
                        base={base}
                        quote={quote}
                    />
                </td>
                <td>
                    {utils.format_number(
                        order[
                            !isBid ? "amountForSale" : "amountToReceive"
                        ]().getAmount({real: true}),
                        quote.get("precision")
                    )}{" "}
                </td>
                <td>
                    {utils.format_number(
                        order[
                            !isBid ? "amountToReceive" : "amountForSale"
                        ]().getAmount({real: true}),
                        base.get("precision")
                    )}{" "}
                </td>
                <td>
                    <Tooltip title={order.expiration.toLocaleString()}>
                        <div
                            style={{
                                textAlign: "right",
                                whiteSpace: "nowrap"
                            }}
                        >
                            {isCall
                                ? null
                                : counterpart.localize(
                                      new Date(order.expiration),
                                      {
                                          type: "date",
                                          format: "short_custom"
                                      }
                                  )}
                        </div>
                    </Tooltip>
                </td>
            </tr>
        );
    }
}

class MyOpenOrders extends React.Component {
    constructor(props) {
        super();
        this.state = {
            activeTab: props.activeTab,
            rowCount: 20,
            showAll: false,
            selectedOrders: []
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
            nextProps.currentAccount !== this.props.currentAccount ||
            nextState.selectedOrders !== this.state.selectedOrders
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

    cancelSelected() {
        this._cancelLimitOrders.call(this);
    }

    resetSelected() {
        this.setState({selectedOrders: []});
    }

    onCancelToggle(evt) {
        const orders = this._getOrders();
        let selectedOrders = [];

        orders.forEach(order => {
            selectedOrders.push(order.id);
        });

        if (evt.target.checked) {
            this.setState({selectedOrders: selectedOrders});
        } else {
            this.setState({selectedOrders: []});
        }
    }

    _cancelLimitOrders() {
        MarketsActions.cancelLimitOrders(
            this.props.currentAccount.get("id"),
            this.state.selectedOrders
        )
            .then(() => {
                this.resetSelected();
            })
            .catch(err => {
                console.log("cancel orders error:", err);
            });
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
        let {activeTab, showAll, rowCount, selectedOrders} = this.state;

        if (!base || !quote) return null;

        let contentContainer;
        let footerContainer;

        /* Users Open Orders Tab (default) */
        let totalMyOrders = 0;

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
                        <ExchangeOrderRow
                            price={price}
                            key={order.id}
                            order={order}
                            base={base}
                            quote={quote}
                            selected={
                                this.state.selectedOrders.length > 0 &&
                                this.state.selectedOrders.includes(order.id)
                            }
                            onCancel={this.props.onCancel.bind(this, order.id)}
                            onCheckCancel={this.onCheckCancel.bind(
                                this,
                                order.id
                            )}
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
                        <ExchangeOrderRow
                            price={price}
                            key={order.id}
                            order={order}
                            base={base}
                            quote={quote}
                            selected={
                                this.state.selectedOrders.length > 0 &&
                                this.state.selectedOrders.includes(order.id)
                            }
                            onCancel={this.props.onCancel.bind(this, order.id)}
                            onCheckCancel={this.onCheckCancel.bind(
                                this,
                                order.id
                            )}
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

            totalMyOrders = rows.length;
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

            var cancelOrderButton = (
                <div style={{display: "grid"}}>
                    <Button onClick={this.cancelSelected.bind(this)}>
                        <Translate content="exchange.cancel_selected_orders" />
                    </Button>
                </div>
            );

            footerContainer =
                rowsLength > 11 ? (
                    <React.Fragment>
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
                        {selectedOrders.length > 0 ? cancelOrderButton : null}
                    </React.Fragment>
                ) : selectedOrders.length > 0 ? (
                    cancelOrderButton
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
                                <ExchangeTableHeader
                                    baseSymbol={baseSymbol}
                                    quoteSymbol={quoteSymbol}
                                    selected={
                                        this.state.selectedOrders.length > 0 &&
                                        this.state.selectedOrders.length ==
                                            totalMyOrders
                                    }
                                    onCancelToggle={this.onCancelToggle.bind(
                                        this
                                    )}
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

export {MyOpenOrders};
