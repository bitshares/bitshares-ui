import React from "react";
import PropTypes from "prop-types";
import Ps from "perfect-scrollbar";
import OpenSettleOrders from "./OpenSettleOrders";
import MarketsActions from "actions/MarketsActions";
import Translate from "react-translate-component";
import TransitionWrapper from "../Utility/TransitionWrapper";
import SettingsActions from "actions/SettingsActions";
import {ChainStore, FetchChain} from "bitsharesjs";
import {LimitOrder, CallOrder} from "common/MarketClasses";
import ReactTooltip from "react-tooltip";
import {Button} from "bitshares-ui-style-guide";
import {MarketsOrderView, MarketOrdersRowView} from "./View/MarketOrdersView";

class MarketOrdersRow extends React.Component {
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

        return (
            <MarketOrdersRowView
                key={order.id}
                order={order}
                selected={selected}
                base={base}
                quote={quote}
                onCheckCancel={this.props.onCheckCancel.bind(this)}
            />
        );
    }
}

class MarketOrders extends React.Component {
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
        return (
            nextProps.baseSymbol !== this.props.baseSymbol ||
            nextProps.quoteSymbol !== this.props.quoteSymbol ||
            nextProps.className !== this.props.className ||
            nextProps.activeTab !== this.props.activeTab ||
            nextState.activeTab !== this.state.activeTab ||
            nextState.showAll !== this.state.showAll ||
            nextProps.currentAccount !== this.props.currentAccount ||
            nextState.selectedOrders !== this.state.selectedOrders ||
            nextProps.settleOrders !== this.props.settleOrders
        );
    }

    componentDidMount() {
        if (!this.props.hideScrollbars) {
            this.updateContainer(1);
        }
    }

    componentDidUpdate(prevState) {
        let {hideScrollbars} = this.props;
        let {showAll} = this.state;

        if (prevState.showAll != showAll) {
            if (showAll && !hideScrollbars) {
                this.updateContainer(2);
            } else if (!showAll && !hideScrollbars) {
                this.updateContainer(3);
            } else if (showAll && hideScrollbars) {
                this.updateContainer(1);
            } else {
                this.updateContainer(0);
            }
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.activeTab !== this.state.activeTab) {
            this.changeTab(nextProps.activeTab);
        }

        // Reset on Market Switch
        if (
            nextProps.baseSymbol !== this.props.baseSymbol ||
            nextProps.quoteSymbol !== this.props.quoteSymbol
        ) {
            this.setState({showAll: false});
            this.updateContainer(0);

            if (!this.props.hideScrollbars) {
                this.updateContainer(1);
            }
        }

        // Reset on hideScrollbars switch
        if (nextProps.hideScrollbars !== this.props.hideScrollbars) {
            this.updateContainer(0);

            if (!nextProps.hideScrollbars) {
                this.updateContainer(1);
            }
        }
    }

    /***
     * Update PS Container
     * type:int [0:destroy, 1:init, 2:update, 3:update w/ scrollTop] (default: 2)
     */
    updateContainer(type = 2) {
        let containerNode = this.refs.view.refs.container;
        let containerTransition = this.refs.contentTransition;

        if (!containerNode) return;

        if (type == 0) {
            containerNode.scrollTop = 0;
            Ps.destroy(containerNode);
        } else if (type == 1) {
            Ps.initialize(containerNode);
            this.updateContainer(3);
        } else if (type == 2) {
            Ps.update(containerNode);
        } else if (type == 3) {
            containerNode.scrollTop = 0;
            Ps.update(containerNode);
        }

        if (containerTransition) {
            containerTransition.resetAnimation();
        }
    }

    _onSetShowAll() {
        this.setState({
            showAll: !this.state.showAll
        });
    }

    changeTab(tab) {
        SettingsActions.changeViewSetting({
            ordersTab: tab
        });
        this.setState({
            activeTab: tab
        });

        // Ensure that focus goes back to top of scrollable container when tab is changed
        this.updateContainer(3);

        setTimeout(ReactTooltip.rebuild, 1000);
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
            this.resetSelected();
        }
    }

    _getSelectedOrders(keys) {
        let orders = this.props.currentAccount
            .get("orders")
            .toArray()
            .filter(item => keys.indexOf(item) != -1);
        return FetchChain("getObject", orders);
    }

    _cancelLimitOrders() {
        this._getSelectedOrders(this.state.selectedOrders).then(orders => {
            let fallbackFeeAssets = orders
                .toJS()
                .map(item => item.sell_price.base.asset_id);
            MarketsActions.cancelLimitOrders(
                this.props.currentAccount.get("id"),
                this.state.selectedOrders,
                fallbackFeeAssets
            )
                .then(() => {
                    this.resetSelected();
                })
                .catch(err => {
                    console.log("cancel orders error:", err);
                });
        });
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

    render() {
        let {base, quote, quoteSymbol, baseSymbol, settleOrders} = this.props;
        let {activeTab, showAll, rowCount, selectedOrders} = this.state;

        if (!base || !quote) return null;

        let contentContainer;
        let footerContainer;

        /* Users Open Orders Tab (default) */
        let totalRows = 0;

        // User Orders
        if (!activeTab || activeTab == "my_orders") {
            const orders = this._getOrders();

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
                        <MarketOrdersRow
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
                        <MarketOrdersRow
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

            totalRows = rows.length;

            if (totalRows > 0 && !showAll) {
                rows.splice(rowCount, rows.length);
            }

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

            let cancelOrderButton = (
                <div style={{display: "grid"}}>
                    <Button onClick={this.cancelSelected.bind(this)}>
                        <Translate content="exchange.cancel_selected_orders" />
                    </Button>
                </div>
            );

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
                totalRows > 11 ? (
                    <React.Fragment>
                        <div className="orderbook-showall">
                            <a onClick={this._onSetShowAll.bind(this)}>
                                <Translate
                                    content={
                                        showAll
                                            ? "exchange.hide"
                                            : "exchange.show_all_orders"
                                    }
                                    rowcount={totalRows}
                                />
                            </a>
                        </div>
                        {selectedOrders.length > 0 ? cancelOrderButton : null}
                    </React.Fragment>
                ) : selectedOrders.length > 0 ? (
                    cancelOrderButton
                ) : null;
        }

        // Open Settle Orders
        if (activeTab && activeTab == "open_settlement") {
            totalRows = settleOrders.length;

            if (totalRows > 0 && !showAll) {
                settleOrders.splice(rowCount, settleOrders.length);
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

            footerContainer = totalRows > 11 && (
                <div className="orderbook-showall">
                    <a onClick={this._onSetShowAll.bind(this)}>
                        <Translate
                            content={
                                showAll
                                    ? "exchange.hide"
                                    : "exchange.show_all_orders"
                            }
                            rowcount={totalRows}
                        />
                    </a>
                </div>
            );
        }

        let isSelected =
            this.state.selectedOrders.length > 0 &&
            this.state.selectedOrders.length == totalRows;

        return (
            <MarketsOrderView
                ref="view"
                // Styles and Classes
                style={this.props.style}
                className={this.props.className}
                innerClass={this.props.innerClass}
                innerStyle={this.props.innerStyle}
                headerStyle={this.props.headerStyle}
                // Bools
                noHeader={this.props.noHeader}
                isSelected={isSelected}
                tinyScreen={this.props.tinyScreen}
                // Strings
                activeTab={activeTab}
                baseSymbol={baseSymbol}
                quoteSymbol={quoteSymbol}
                // Containers
                contentContainer={contentContainer}
                footerContainer={footerContainer}
                // Functions
                onCancelToggle={this.onCancelToggle.bind(this)}
            />
        );
    }
}

MarketOrders.defaultProps = {
    base: {},
    quote: {},
    orders: {},
    quoteSymbol: "",
    baseSymbol: ""
};

MarketOrders.propTypes = {
    base: PropTypes.object.isRequired,
    quote: PropTypes.object.isRequired,
    orders: PropTypes.object.isRequired,
    quoteSymbol: PropTypes.string.isRequired,
    baseSymbol: PropTypes.string.isRequired
};

export {MarketOrders};
