import React from "react";
import MarketsActions from "actions/MarketsActions";
import MyOpenOrders from "./MyOpenOrders.jsx";
import OrderBook from "./OrderBook.jsx";
import Margin from "./Margin.jsx";
import utils from "common/utils";
import DepthHighChart from "./DepthHighChart";
import classNames from "classnames";

require("./exchange.scss");

//        {timestamp: new Date(15, 6, 1, 11, 33, 0, 0), type: 0, amount: 1, price: 145}

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
            activeTab: "buy"
        };
    }

    _createLimitOrder(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount, e) {
        e.preventDefault();
        console.log("sell id:", sellAsset);

        let expiration = new Date();
        expiration.setYear(expiration.getFullYear() + 5);

        MarketsActions.createLimitOrder(
            this.props.account.id,
            sellAssetAmount * utils.get_asset_precision(sellAsset.precision),
            sellAsset.id,
            buyAssetAmount * utils.get_asset_precision(buyAsset.precision),
            buyAsset.id,
            expiration.toISOString().slice(0, -7), // the seconds will be added in the actionCreator to set a unique identifer for this user and order
            false // fill or kill
        );
    }

    _cancelLimitOrder(orderID, e) {
        e.preventDefault();
        console.log("cancelling limit order:", orderID);
        let {account} = this.props;
        MarketsActions.cancelLimitOrder(
            account.id,
            orderID // order id to cancel
        );
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

    _buyAmountChanged(e) { this.setState({buyAmount: e.target.value}); }

    _buyPriceChanged(e) { this.setState({buyPrice: e.target.value}); }

    _sellAmountChanged(e) { this.setState({sellAmount: e.target.value}); }

    _sellPriceChanged(e) { this.setState({sellPrice: e.target.value}); }

    _changeTab(value) {
        this.setState({activeTab: value});
    }

    render() {
        let {asset_symbol_to_id, assets, account, limit_orders, short_orders, base: baseSymbol, quote: quoteSymbol} = this.props;
        let base = null, quote = null;

        // console.log("exchange rerender", this.state);
        if (asset_symbol_to_id[quoteSymbol] && asset_symbol_to_id[baseSymbol]) {
            let quote_id = asset_symbol_to_id[quoteSymbol];
            let base_id = asset_symbol_to_id[baseSymbol];
            base = assets.get(base_id);
            quote = assets.get(quote_id);
        }
        var buyTotal = this.state.buyAmount * this.state.buyPrice;
        var sellTotal = this.state.sellAmount * this.state.sellPrice;

        function orderHistoryEntry(order) {
            let priceTrendCssClass = order.type === 1 ? "orderHistoryBid" : "orderHistoryAsk";
            return (
                <tr>
                    <td>{order.amount}</td>
                    <td className={priceTrendCssClass}>{order.price}</td>
                    <td>{order.timestamp.getHours()}:{order.timestamp.getMinutes()}</td>
                </tr>
            );
        }

        let buyTabClass = classNames("tab-item", {"is-active": this.state.activeTab === "buy"});
        let sellTabClass = classNames("tab-item", {"is-active": this.state.activeTab === "sell"});
        let marginTabClass = classNames("tab-item", {"is-active": this.state.activeTab === "margin"});

        let buyForm = (
            <form className="order-form"
                  onSubmit={this._createLimitOrder.bind(this, quote, base, this.state.buyAmount, this.state.buyAmount * this.state.buyPrice)}>
                <label>
                    Quantity ({quoteSymbol}):
                    <input type="text" id="buyAmount" value={this.state.buyAmount} onChange={this._buyAmountChanged.bind(this)}/>
                </label>
                <label>
                    Price: ({baseSymbol} per {quoteSymbol}):
                    <input type="text" id="buyPrice" value={this.state.buyPrice} onChange={this._buyPriceChanged.bind(this)}/>
                </label>

                <p>Total ({baseSymbol}): { buyTotal }</p>
                <input style={{backgroundColor: "#50D2C2"}} type="submit" className="button" value={`Buy ${this.state.buyAmount} ${quoteSymbol}`}/>
            </form>
        );

        let sellForm = (
            <form className="order-form"
                  onSubmit={this._createLimitOrder.bind(this, base, quote, this.state.sellAmount * this.state.sellPrice, this.state.sellAmount)}>
                <label>
                    Quantity ({quoteSymbol}):
                    <input type="text" id="sellAmount" value={this.state.sellAmount} onChange={this._sellAmountChanged.bind(this)}/>
                </label>
                <label>
                    Price: ({baseSymbol} per {quoteSymbol}):
                    <input type="text" id="sellPrice" value={this.state.sellPrice} onChange={this._sellPriceChanged.bind(this)}/>
                </label>
                <p>Total ({baseSymbol}): { sellTotal }</p>
               <input style={{backgroundColor: "#E3745B"}} type="submit" className="button" value={`Sell ${this.state.sellAmount} ${quoteSymbol}`}/>
            </form>
        );

        return (
            <div className="grid-block vertical">
                <div className="grid-block shrink">
                    <p>{baseSymbol} / {quoteSymbol} Put all kinds of info related to the market here (current price, spread, etc)</p>
                </div>
                <div className="grid-block page-layout market-layout small-vertical medium-horizontal" style={{flexWrap: "nowrap"}}>


                    {/* Left Column */}
                    <div className="grid-block left-column-2 show-for-large">
                        {/* Market History */}
                        <div className="grid-content market-content">
                            <table style={{width: "100%"}} className="table expand order-table">
                                <p>MARKET HISTORY</p>
                                <thead>
                                <tr>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Time</th>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    this.state.history.map(orderHistoryEntry)
                                }
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Center Column */}
                    <div className="grid-block main-content vertical">
                        {/* Header 
                        <div className="grid-block">
                            
                        </div>
                        */}

                        
                        {/* TODO: placeholder for price history chart */}
                        <div className="grid-block small-12">
                                
                                <div className="grid-block ">
                                    <DepthHighChart
                                        orders={limit_orders}
                                        flat_asks={this.props.flat_asks}
                                        flat_bids={this.props.flat_bids}
                                        base={base}
                                        quote={quote}
                                        baseSymbol={baseSymbol}
                                        quoteSymbol={quoteSymbol}
                                        height={450}
                                        />
                                </div>
                        </div>

                        <div className="grid-block">
                            {/* Depth Chart */}
                            <div className="grid-block small-6">    
                                <DepthHighChart
                                    orders={limit_orders}
                                    flat_asks={this.props.flat_asks}
                                    flat_bids={this.props.flat_bids}
                                    base={base}
                                    quote={quote}
                                    baseSymbol={baseSymbol}
                                    quoteSymbol={quoteSymbol}
                                    />
                            </div>

                            {/* Order Book */}
                            <div className="grid-block vertical market-content">
                                <OrderBook
                                    orders={limit_orders}
                                    base={base}
                                    quote={quote}
                                    baseSymbol={baseSymbol}
                                    quoteSymbol={quoteSymbol}
                                    />
                            </div>
                        </div>


                        {/* My Open Orders 
                        <div className="grid-block">
                            
                            <div className="grid-block small-6">
                                <div className="grid-content order-table">
                                    <p>OPEN ORDERS</p>
                                    <MyOpenOrders
                                        orders={limit_orders}
                                        account={account.id}
                                        base={base}
                                        quote={quote}
                                        baseSymbol={baseSymbol}
                                        quoteSymbol={quoteSymbol}
                                        onCancel={this._cancelLimitOrder.bind(this)}/>
                                </div>
                            </div>

                            {/* My Recent Trades 
                            <div className="grid-block shrink">
                                <div className="grid-content order-table">
                                    <p>RECENT TRADES</p>

                                    <p>TODO: put the user&apos;s most recently completed trades in this panel.</p>
                                </div>
                            </div>
                            
                        </div> */}

                    </div>


                    {/* Buy/Sell */}
                    <div className="grid-block shrink right-column" style={{alignItems: "flex-start"}}>
                        <div className="grid-block vertical market-content">
                            <div className="grid-content">
                                {buyForm}
                            </div>
                            <div className="grid-content" style={{paddingTop: "2rem"}}>
                                {sellForm}
                            </div>
                            <div className="grid-content" style={{paddingTop: "5rem"}}>
                                <div className="button">My Orders Switch here</div>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        );
    }
}

export default Exchange;
