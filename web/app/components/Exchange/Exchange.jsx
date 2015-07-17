import React from "react";
import MarketsActions from "actions/MarketsActions";
import MyOpenOrders from "./MyOpenOrders";
import OrderBook from "./OrderBook";
import MarketHistory from "./MarketHistory";
import BuySell from "./BuySell";
import Margin from "./Margin";
import utils from "common/utils";
import PriceChart from "./PriceChart";
import DepthHighChart from "./DepthHighChart";
import Tabs from "react-foundation-apps/src/tabs";
import AccountActions from "actions/AccountActions";
import debounce from "lodash.debounce";


require("./exchange.scss");

class Exchange extends React.Component {
    constructor() {
        super();

        this.state = {
            history: [],
            buyAmount: 5,
            buyPrice: 160,
            sellAmount: 5,
            sellPrice: 170,
            sub: false,
            activeTab: "buy",
            showBuySell: true
        };

        this._createLimitOrder = this._createLimitOrder.bind(this);
        this._setDepthLine = debounce(this._setDepthLine.bind(this), 500);
    }

    componentDidMount() {
        this._subToMarket(this.props);
    }

    componentWillReceiveProps(nextProps) {
        if (!this.state.sub && nextProps.assets.size > 0) {
            this._subToMarket(nextProps);
        }
    }

    componentWillUnmount() {
        let {quote, base, asset_symbol_to_id} = this.props;
        let quote_id = asset_symbol_to_id[quote];
        let base_id = asset_symbol_to_id[base];
        MarketsActions.unSubscribeMarket(quote_id, base_id);
    }

    _createLimitOrder(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount, balance, e) {
        e.preventDefault();
        if (sellAssetAmount > balance) {
            return this.props.addNotification({
                message: "Insufficient funds to place order. Required: " + sellAssetAmount + " " + sellAsset.symbol,
                level: "error"
            });
        }

        let expiration = new Date();
        expiration.setYear(expiration.getFullYear() + 5);
        MarketsActions.createLimitOrder(
            this.props.currentAccount.id,
            parseInt(sellAssetAmount * utils.get_asset_precision(sellAsset.precision), 10),
            sellAsset.id,
            parseInt(buyAssetAmount * utils.get_asset_precision(buyAsset.precision), 10),
            buyAsset.id,
            expiration.toISOString().slice(0, -7), // the seconds will be added in the actionCreator to set a unique identifer for this user and order
            false // fill or kill
        ).then(result => {
            if (!result) {
                this.props.addNotification({
                    message: "Unknown error. Failed to place order for " + buyAssetAmount + " " + buyAsset.symbol,
                    level: "error"
                });
            }
        });
    }

    _cancelLimitOrder(orderID, e) {
        e.preventDefault();
        console.log("cancelling limit order:", orderID);
        let {currentAccount} = this.props;
        MarketsActions.cancelLimitOrder(
            currentAccount.id,
            orderID // order id to cancel
        ).then(result => {
            if (!result) {
                this.props.addNotification({
                        message: `Failed to cancel limit order ${orderID}`,
                        level: "error"
                    });
            }
        });
    }

    _subToMarket(props) {
        let {quote, base, asset_symbol_to_id, assets} = props;
        if (asset_symbol_to_id[quote] && asset_symbol_to_id[base]) {
            let quote_id = asset_symbol_to_id[quote];
            let base_id = asset_symbol_to_id[base];
            let baseAsset = assets.get(base_id);
            let quoteAsset = assets.get(quote_id);
            if (quoteAsset && baseAsset && !this.state.sub) {
                MarketsActions.subscribeMarket(baseAsset, quoteAsset);
                this.setState({sub: true});
            }
        }
    }

    _depthChartClick(e) {
        e.preventDefault();
        let base_id = this.props.asset_symbol_to_id[this.props.base];
        let base = this.props.assets.get(base_id);
        let precision = utils.get_asset_precision(base.precision);
        let value = Math.round(precision * e.xAxis[0].value) / precision;
        this.setState({
            buyPrice: value,
            sellPrice: value,
            depthLine: value
        });
    }

    _setDepthLine(value) { this.setState({depthLine: value}); }

    _buyAmountChanged(e) { this.setState({buyAmount: e.target.value}); }

    _buyPriceChanged(e) { this.setState({buyPrice: e.target.value}); this._setDepthLine(e.target.value); }

    _sellAmountChanged(e) { this.setState({sellAmount: e.target.value}); }

    _sellPriceChanged(e) { this.setState({sellPrice: e.target.value}); this._setDepthLine(e.target.value); }

    _changeTab(value) {
        this.setState({activeTab: value});
    }

    _toggleBuySell() {
        this.setState({showBuySell: !this.state.showBuySell});
    }

    _orderbookClick(price, type) {
        if (type === "bid") {
            this.setState({sellPrice: price});
        } else if (type === "ask") {
            this.setState({buyPrice: price});
        }
    }

    render() {
        let {asset_symbol_to_id, assets, currentAccount, limit_orders,
            short_orders, base: baseSymbol, quote: quoteSymbol,
            balances, totalBids, flat_asks, flat_bids, bids, asks} = this.props;
        let {buyAmount, buyPrice, sellAmount, sellPrice} = this.state;
        let base = null, quote = null, accountBalance = null, quoteBalance = 0, baseBalance = 0;

        if (asset_symbol_to_id[quoteSymbol] && asset_symbol_to_id[baseSymbol]) {
            let quote_id = asset_symbol_to_id[quoteSymbol];
            let base_id = asset_symbol_to_id[baseSymbol];
            base = assets.get(base_id);
            quote = assets.get(quote_id);

            accountBalance = balances.get(currentAccount.name);

            if (accountBalance) {
                for (var i = 0; i < accountBalance.length; i++) {
                    if (accountBalance[i].asset_id === quote_id) {
                        quoteBalance = parseInt(accountBalance[i].amount, 10);
                    }
                    if (accountBalance[i].asset_id === base_id) {
                        baseBalance = parseInt(accountBalance[i].amount, 10);
                    }
                }
            } else {
                AccountActions.getAccount(currentAccount.id);
            }
        }

        return (

            <div className="grid-block vertical">
                {/* Main vertical block with content */}
                <div className="grid-block page-layout market-layout">

                    {/* Left Column - Open Orders */}
                    <div className="grid-block left-column small-3 medium-2" style={{border: "1px solid green", overflowY: "auto", justifyContent: "center"}}>
                        <div className="grid-block">
                            <OrderBook
                                orders={limit_orders}
                                bids={bids}
                                asks={asks}
                                base={base}
                                quote={quote}
                                baseSymbol={baseSymbol}
                                quoteSymbol={quoteSymbol}
                                onClick={this._orderbookClick.bind(this)}
                            />
                        </div>
                    </div>

                    {/* Center Column */}
                    <div className="block grid-block main-content vertical small-9 medium-10 large-8">

                        {/* Top bar with info */}
                        <div className="grid-block shrink">
                            <div style={{display: "inline-block"}}>
                                    <span style={{display: "inline-block", verticalAlign: "middle"}} className="market-symbol">{`${baseSymbol} / ${quoteSymbol}`}</span>
                            </div>
                            <ul className="market-stats stats">
                                <li className="stat">
                                    <span>
                                        <span>Latest Price</span><br/>
                                        <b className="value stat-primary">{utils.format_number(290, 3)}</b><br/>
                                        <em>{quoteSymbol}/{baseSymbol}</em>
                                    </span>
                                </li>
                                <li className="stat">
                                    <span>
                                        <span>Call Price</span><br/>
                                        <b className="value stat-primary">{utils.format_number(312, 3)}</b><br/>
                                        <em>{quoteSymbol}/{baseSymbol}</em>
                                    </span>
                                </li>
                                <li className="stat">
                                    <span>
                                        <span>Volume</span><br/>
                                        <b className="value stat-primary">{utils.format_number(23122, 3)}</b><br/>
                                        <em>{quoteSymbol}</em>
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Price history chart and depth chart inside tabs */}
                        <div className="grid-block" id="market-charts" style={{display: "inline-block", flexGrow: "0", minHeight: "350px" }} >
                            <Tabs>
                                <Tabs.Tab title="Price history">
                                    <PriceChart
                                        priceData={this.props.priceData}
                                        volumeData={this.props.volumeData}
                                        base={base}
                                        quote={quote}
                                        baseSymbol={baseSymbol}
                                        quoteSymbol={quoteSymbol}
                                        height={300}
                                    />
                                </Tabs.Tab>
                                <Tabs.Tab title="Order depth">
                                    <DepthHighChart
                                        orders={limit_orders}
                                        flat_asks={flat_asks}
                                        flat_bids={flat_bids}
                                        totalBids={totalBids}
                                        base={base}
                                        quote={quote}
                                        baseSymbol={baseSymbol}
                                        quoteSymbol={quoteSymbol}
                                        height={300}
                                        onClick={this._depthChartClick.bind(this)}
                                        plotLine={this.state.depthLine}
                                    />
                                </Tabs.Tab>
                            </Tabs>

                        </div>


                        {/* Buy/Sell forms */}
                        <div className="grid-block shrink" style={{ flexGrow: "0" }} >
                                    {quote && base ?
                                    <BuySell
                                        className="small-6"
                                        type="buy"
                                        amount={buyAmount}
                                        price={buyPrice}
                                        quoteSymbol={quoteSymbol}
                                        baseSymbol={baseSymbol}
                                        amountChange={this._buyAmountChanged.bind(this)}
                                        priceChange={this._buyPriceChanged.bind(this)}
                                        balance={baseBalance / utils.get_asset_precision(base.precision)}
                                        onSubmit={this._createLimitOrder.bind(this, quote, base, buyAmount, buyAmount * buyPrice, baseBalance / utils.get_asset_precision(base.precision))}
                                    /> : null}
                                    {quote && base ?
                                    <BuySell
                                        className="small-6"
                                        type="sell"
                                        amount={sellAmount}
                                        price={sellPrice}
                                        quoteSymbol={quoteSymbol}
                                        baseSymbol={baseSymbol}
                                        amountChange={this._sellAmountChanged.bind(this)}
                                        priceChange={this._sellPriceChanged.bind(this)}
                                        balance={quoteBalance / utils.get_asset_precision(quote.precision)}
                                        onSubmit={this._createLimitOrder.bind(this, base, quote, sellAmount * sellPrice, sellAmount, quoteBalance / utils.get_asset_precision(quote.precision))}
                                    /> : null}
                        </div>

                        <div className="grid-block" style={{minHeight: "20rem"}}>
                            <MyOpenOrders
                                orders={limit_orders}
                                currentAccount={currentAccount.id}
                                base={base}
                                quote={quote}
                                baseSymbol={baseSymbol}
                                quoteSymbol={quoteSymbol}
                                onCancel={this._cancelLimitOrder.bind(this)}
                            />
                        </div>

                    {/* End of Main Content Column */}
                    </div>


                    {/* Right Column - Market History */}
                    <div className="grid-block right-column  show-for-large large-2" style={{overflowY: "auto"}}>
                        {/* Market History */}
                        <MarketHistory
                            history={this.props.activeMarketHistory}
                            assets={assets}
                            base={base}
                            baseSymbol={baseSymbol}
                            quoteSymbol={quoteSymbol}/>
                    </div>

                {/* End of Second Vertical Block */}
                </div>
            </div>
        );
    }
}

export default Exchange;
