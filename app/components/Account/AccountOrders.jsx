import React from "react";
import {OrderRow, TableHeader} from "../Exchange/MyOpenOrders";
import counterpart from "counterpart";
import MarketsActions from "actions/MarketsActions";
import {ChainStore} from "bitsharesjs/es";
import {LimitOrder} from "common/MarketClasses";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import marketUtils from "common/market_utils";
import Translate from "react-translate-component";

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

    render() {
        let {account, marketDirections} = this.props;
        let {filterValue, selectedOrders} = this.state;
        let cancel = counterpart.translate("account.perm.cancel");
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

                marketOrders[marketName].push(
                    <OrderRow
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
                    />
                );
            }
        });

        let tables = [];

        let marketIndex = 0;
        for (let market in marketOrders) {
            if (marketOrders[market].length) {
                tables.push(
                    <tbody key={market}>
                        {/* {marketIndex > 0 ? <tr><td colSpan={this.props.isMyAccount ? "7" : "6"}><span style={{visibility: "hidden"}}>H</span></td></tr> : null} */}
                        {marketOrders[market].sort((a, b) => {
                            return a.props.price - b.props.price;
                        })}
                    </tbody>
                );
                marketIndex++;
            }
        }

        return (
            <div
                className="grid-content no-overflow no-padding"
                style={{paddingBottom: 15}}
            >
                <div className="header-selector">
                    {orders && ordersCount ? (
                        <input
                            type="text"
                            placeholder={counterpart.translate(
                                "account.filter_orders"
                            )}
                            style={{
                                display: "inline-block",
                                maxWidth: "50%",
                                marginRight: "1em",
                                marginBottom: "0"
                            }}
                            onChange={this.setFilterValue.bind(this)}
                        />
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

                <table className="table table-striped dashboard-table table-hover">
                    <TableHeader
                        settings={this.props.settings}
                        dashboard
                        isMyAccount={this.props.isMyAccount}
                    />
                    {tables}
                    {this.props.children}
                </table>
            </div>
        );
    }
}

AccountOrders = connect(AccountOrders, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            marketDirections: SettingsStore.getState().marketDirections
        };
    }
});

export default AccountOrders;
