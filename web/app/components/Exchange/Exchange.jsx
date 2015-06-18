import React from "react";
import MarketsActions from "actions/MarketsActions";
import MyOpenOrders from "./MyOpenOrders.jsx";
import OpenOrders from "./OpenOrders.jsx";
import Utils from "common/utils";
import DepthChart from "./DepthChart";
import Tabs from "react-foundation-apps/lib/tabs";

require("./exchange.scss");

let orderBook = {
    bids: [
        {expiration: 0, amount: 5, price: 120},
        {expiration: 0, amount: 800, price: 130},
        {expiration: 0, amount: 12, price: 140},
        {expiration: 0, amount: 10, price: 154}
    ],
    asks: [
        {expiration: 0, amount: 10, price: 160},
        {expiration: 0, amount: 32, price: 170},
        {expiration: 0, amount: 400, price: 180},
        {expiration: 0, amount: 4, price: 190}
    ]
};

let history = {
    orders: [
        {timestamp: new Date(15,6,1,11,38,0,0), type: 0, amount: 5, price: 150},
        {timestamp: new Date(15,6,1,11,37,0,0), type: 0, amount: 10, price: 152},
        {timestamp: new Date(15,6,1,11,36,0,0), type: 1, amount: 1, price: 155},
        {timestamp: new Date(15,6,1,11,35,0,0), type: 1, amount: 80, price: 154},
        {timestamp: new Date(15,6,1,11,34,0,0), type: 1, amount: 1, price: 148},
        {timestamp: new Date(15,6,1,11,33,0,0), type: 0, amount: 1, price: 145}
    ]
};

class Exchange extends React.Component {
    constructor() {
        super();

        this.state = {
            history: history,
            buyAmount: 5,
            buyPrice: 160,
            sellAmount: 5,
            sellPrice: 170,
            sub: false
        };
    }

    _createLimitOrder(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount, e) {
        e.preventDefault();
        console.log("sell id:", sellAsset);

        MarketsActions.createLimitOrder(
            this.props.account.id,
            sellAssetAmount * utils.get_asset_precision(sellAsset.precision),
            sellAsset.id,
            buyAssetAmount * utils.get_asset_precision(buyAsset.precision),
            buyAsset.id,
            "2020-01-01T00:00:00", // expiration. TODO: set to a value chosen by the user
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

    _buyAmountChanged(e) { this.setState({buyAmount: e.target.value }); }
    _buyPriceChanged(e) { this.setState({buyPrice: e.target.value }); }
    _sellAmountChanged(e) { this.setState({sellAmount: e.target.value }); }
    _sellPriceChanged(e) { this.setState({sellPrice: e.target.value }); }

    render() {
        let {asset_symbol_to_id, assets, account, limit_orders, short_orders, base: baseSymbol, quote: quoteSymbol} = this.props;
        let base = null, quote = null;

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

        return (
            <div className="grid-block vertical">
                <div className="grid-block page-layout">
                    <div className="grid-block medium-3 large-2 left-column">
                            <div className="grid-content">

<Tabs>
  <Tabs.Tab title='Buy'>
    <form className="order-form" onSubmit={this._createLimitOrder.bind(this, quote, base, this.state.buyAmount, this.state.buyAmount * this.state.buyPrice)}>
                                            <label>
                                                Quantity ({quoteSymbol}):
                                                <input type="text" id="buyAmount" value={this.state.buyAmount} onChange={this._buyAmountChanged.bind(this)} />
                                            </label>
                                            <label>
                                                Price: ({baseSymbol} per {quoteSymbol}):
                                                <input type="text" id="buyPrice" value={this.state.buyPrice} onChange={this._buyPriceChanged.bind(this)} />
                                            </label>
                                            <p>Total ({baseSymbol}): { buyTotal }</p>
                                            <input type="submit" className="button" value={"Buy " + quoteSymbol} />
                                        </form>
  </Tabs.Tab>
  <Tabs.Tab title='Sell'>
    <form className="order-form" onSubmit={this._createLimitOrder.bind(this, base, quote, this.state.sellAmount * this.state.sellPrice, this.state.sellAmount)}>
                                            <label>
                                                Quantity ({quoteSymbol}):
                                                <input type="text" id="sellAmount" value={this.state.sellAmount} onChange={this._sellAmountChanged.bind(this)} />
                                            </label>
                                            <label>
                                                Price: ({baseSymbol} per {quoteSymbol}):
                                                <input type="text" id="sellPrice" value={this.state.sellPrice} onChange={this._sellPriceChanged.bind(this)} />
                                            </label>
                                            <p>Total ({baseSymbol}): { sellTotal }</p>
                                            <input type="submit" className="button" value={"Sell " + quoteSymbol} />
                                        </form>
  </Tabs.Tab>

</Tabs>





                                        
                            </div>
                       
                                      
                    </div>
                    <div className="grid-block medium-6 large-8 main-content vertical">

                        <div className="grid-block depthchart">
                            <DepthChart
                                orders={limit_orders}
                                base={base}
                                quote={quote}
                                baseSymbol={baseSymbol}
                                quoteSymbol={quoteSymbol}
                            />
                        </div>
                        <div className="grid-block buysell">   
                            <div className="grid-block medium-12 main-content">
                                 <div className="grid-content openorders">



                                <p>MY OPEN ORDERS</p>
                                <MyOpenOrders
                                    orders={limit_orders}
                                    account={account.id}
                                    base={base}
                                    quote={quote}
                                    baseSymbol={baseSymbol}
                                    quoteSymbol={quoteSymbol}
                                    onCancel={this._cancelLimitOrder.bind(this)} />

                                <OpenOrders
                                    orders={limit_orders}
                                    base={base}
                                    quote={quote}
                                    baseSymbol={baseSymbol}
                                    quoteSymbol={quoteSymbol}
                                    />
                        </div>


                             
                            </div>
                            <div className="grid-block medium-6 main-content">
                              
                            </div>
                        </div>
                    </div>
                    <div className="grid-block medium-3 large-2 right-column">
                        <div className="grid-content">
                            <p>ORDER HISTORY</p>
                            <table style={{width: "100%"}} className="table expand">
                                <thead>
                                <tr>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Time</th>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    this.state.history.orders.map(orderHistoryEntry)
                                }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Exchange;
