import React from "react";
import {PropTypes} from "react";
import MarketsActions from "actions/MarketsActions";
import {MyOpenOrders} from "./MyOpenOrders";
import OrderBook from "./OrderBook";
import MarketHistory from "./MarketHistory";
import BuySell from "./BuySell";
import utils from "common/utils";
import PriceChart from "./PriceChart";
import DepthHighChart from "./DepthHighChart";
import {debounce} from "lodash";
import BorrowModal from "../Modal/BorrowModal";
import Translate from "react-translate-component";
import notify from "actions/NotificationActions";
import {Link} from "react-router";
import AccountNotifications from "../Notifier/NotifierContainer";
import Ps from "perfect-scrollbar";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountActions from "actions/AccountActions";
import ActionSheet from "react-foundation-apps/src/action-sheet";
import Icon from "../Icon/Icon";

require("./exchange.scss");

@BindToChainState({keep_updating: true})
class Exchange extends React.Component {
    constructor() {
        super();

        this.state = {
            history: [],
            buyAmount: 0,
            buyPrice: 0,
            buyTotal: 0,
            sellAmount: 0,
            sellPrice: 0,
            sellTotal: 0,
            sub: null,
            activeTab: "buy",
            showBuySell: true
        };

        this._createLimitOrderConfirm = this._createLimitOrderConfirm.bind(this);
        this._setDepthLine = debounce(this._setDepthLine.bind(this), 500);
    }

    static propTypes = {
        currentAccount: ChainTypes.ChainAccount.isRequired,
        quoteAsset: ChainTypes.ChainAsset.isRequired,
        baseAsset: ChainTypes.ChainAsset.isRequired,
        quote: PropTypes.string.isRequired,
        base: PropTypes.string.isRequired,
        limit_orders: PropTypes.array.isRequired,
        balances: PropTypes.array.isRequired,
        totalBids: PropTypes.number.isRequired,
        flat_asks: PropTypes.array.isRequired,
        flat_bids: PropTypes.array.isRequired,
        bids: PropTypes.array.isRequired,
        asks: PropTypes.array.isRequired,
        activeMarketHistory: PropTypes.object.isRequired,
        settings: PropTypes.object.isRequired,
        priceData: PropTypes.array.isRequired,
        volumeData: PropTypes.array.isRequired
    }

    static defaultProps = {
        limit_orders: [],
        balances: [],
        totalBids: 0,
        flat_asks: [],
        flat_bids: [],
        bids: [],
        asks: [],
        setting: null,
        activeMarketHistory: {},
        settings: {},
        priceData: [],
        volumeData: []
    }

    static contextTypes = {router: React.PropTypes.func.isRequired};

    componentDidMount() {
        this._subToMarket(this.props);
        let centerContainer = React.findDOMNode(this.refs.center);
        Ps.initialize(centerContainer);
    }

    componentWillReceiveProps(nextProps) {
        if (!this.state.sub) {
            return this._subToMarket(nextProps);
        }

        if (nextProps.quoteAsset.get("symbol") !== this.props.quoteAsset.get("symbol")) {
            
            let currentSub = this.state.sub.split("_");
            MarketsActions.unSubscribeMarket(currentSub[0], currentSub[1]);
            return this._subToMarket(nextProps);
        }
    }

    componentWillUnmount() {
        let {quoteAsset, baseAsset} = this.props;
        MarketsActions.unSubscribeMarket(quoteAsset.get("id"), baseAsset.get("id"));
    }

    _createLimitOrder(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount) {
        console.log("createLimitOrder:", buyAssetAmount, sellAssetAmount);
        let expiration = new Date();
        // TODO: Add selector for expiry
        expiration.setYear(expiration.getFullYear() + 5);
        MarketsActions.createLimitOrder(
            this.props.currentAccount.get("id"),
            parseInt(sellAssetAmount * utils.get_asset_precision(sellAsset.precision), 10),
            sellAsset.id,
            parseInt(buyAssetAmount * utils.get_asset_precision(buyAsset.precision), 10),
            buyAsset.id,
            expiration, 
            false // fill or kill TODO: add fill or kill switch
        ).then(result => {
            if (!result) {
                notify.addNotification({
                    message: "Unknown error. Failed to place order for " + buyAssetAmount + " " + buyAsset.symbol,
                    level: "error"
                });
            }
        });
    }
    
    _createLimitOrderConfirm(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount, balance, e) {
        e.preventDefault();
        if (sellAssetAmount > balance) {
            return notify.addNotification({
                message: "Insufficient funds to place order. Required: " + sellAssetAmount + " " + sellAsset.symbol,
                level: "error"
            });
        }

        if (!(sellAssetAmount > 0 && buyAssetAmount > 0)) {
            return notify.addNotification({
                message: "Please enter a valid amount and price",
                level: "error"
            });
        }

        this._createLimitOrder(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount);
    }

    _cancelLimitOrder(orderID, e) {
        e.preventDefault();
        console.log("canceling limit order:", orderID);
        let {currentAccount} = this.props;
        MarketsActions.cancelLimitOrder(
            currentAccount.get("id"),
            orderID // order id to cancel
        ).then(result => {
            if (!result) {
                notify.addNotification({
                        message: `Failed to cancel limit order ${orderID}`,
                        level: "error"
                    });
            }
        });
    }

    _changeBucketSize(size, e) {
        e.preventDefault();
        if (size !== this.props.bucketSize) { 
            MarketsActions.changeBucketSize(size);
            let currentSub = this.state.sub.split("_");
            MarketsActions.unSubscribeMarket(currentSub[0], currentSub[1]);
            this._subToMarket(this.props, size);
        }
    }

    _subToMarket(props, newBucketSize) {
        let {quoteAsset, baseAsset, bucketSize} = props;
        if (newBucketSize) {
            bucketSize = newBucketSize;
        }
        if (quoteAsset.get("id") && baseAsset.get("id")) {
            MarketsActions.subscribeMarket(baseAsset.toJS(), quoteAsset.toJS(), bucketSize);
            this.setState({sub: `${quoteAsset.get("id")}_${baseAsset.get("id")}`});
        }
    }

    _depthChartClick(base, quote, e) {
        e.preventDefault();
        let value = this._limitByPrecision(e.xAxis[0].value, quote);
        this.setState({
            depthLine: value
        });

        this._buyPriceChanged(base, {target: {value: value}});
        this._sellPriceChanged(base, {target: {value: value}});
    }

    _addZero(value) {
        if (typeof value === "number") {
            value = value.toString();
        }
        if (value.length === 1 && value === ".") {
            return "0.";
        }

        return value;
    }

    _setDepthLine(value) { this.setState({depthLine: value}); }

    _limitByPrecision(value, asset) {
        let valueString = value.toString();
        let splitString = valueString.split(".");
        if (splitString.length === 1 || splitString.length === 2 && splitString[1].length <= asset.precision) {
            return value;
        }
        let precision = utils.get_asset_precision(asset.precision);
        value = Math.floor(value * precision) / precision;
        if (isNaN(value) || !isFinite(value)) {
            return 0;
        }
        return value;
    }

    _buyPriceChanged(base, e) {
        this.setState({
            buyPrice: this._addZero(e.target.value),
            buyTotal: this._limitByPrecision(this.state.buyAmount * e.target.value, base)
        });
        this._setDepthLine(e.target.value); 
    }

    _buyAmountChanged(base, quote, e) {
        let value = e.target.value;
        if (e.target.value.indexOf(".") !== e.target.value.length -1) {
            value = this._limitByPrecision(e.target.value, quote);
        }
        this.setState({
            buyAmount: this._addZero(value),
            buyTotal: this._limitByPrecision(value * this.state.buyPrice, base)
        }); 
    }

    _buyTotalChanged(base, quote, e) {
        let value = e.target.value;
        if (e.target.value.indexOf(".") !== e.target.value.length -1) {
            value = this._limitByPrecision(e.target.value, base);
        }
        this.setState({
            buyAmount: this._limitByPrecision(value / this.state.buyPrice, quote),
            buyTotal: this._addZero(value)
        });
    }

    _sellAmountChanged(base, quote, e) {
        let value = e.target.value;
        if (e.target.value.indexOf(".") !== e.target.value.length -1) {
            value = this._limitByPrecision(e.target.value, quote);
        }
        this.setState({
            sellAmount: this._addZero(value),
            sellTotal: this._limitByPrecision(value * this.state.sellPrice, base)
        }); 
    }

    _sellPriceChanged(base, e) {
        this.setState({
            sellPrice: this._addZero(e.target.value),
            sellTotal: this._limitByPrecision(this.state.sellAmount * e.target.value, base)
        });
        this._setDepthLine(e.target.value);
    }

    _sellTotalChanged(base, quote, e) {
        let value = e.target.value;
        if (e.target.value.indexOf(".") !== e.target.value.length -1) {
            value = this._limitByPrecision(e.target.value, base);
        }
        this.setState({
            sellAmount: this._limitByPrecision(value / this.state.sellPrice, quote),
            sellTotal: this._addZero(value)
        });
    }

    _changeTab(value) {
        this.setState({activeTab: value});
    }

    _toggleBuySell() {
        this.setState({showBuySell: !this.state.showBuySell});
    }

    _orderbookClick(base, quote, price, amount, type) {
        if (type === "bid") {

            let value = amount.toString();
            if (value.indexOf(".") !== value.length -1) {
                value = this._limitByPrecision(amount, quote);
            }
            this.setState({
                sellPrice: price,
                sellAmount: value,
                sellTotal: this._limitByPrecision(value * price, base)
            });
            
        } else if (type === "ask") {
            let value = amount.toString();
            if (value.indexOf(".") !== value.length -1) {
                value = this._limitByPrecision(amount, base);
            }
            this.setState({
                buyPrice: price,
                buyAmount: value,
                buyTotal: this._limitByPrecision(value * price, base)
            });
            // this._buyPriceChanged(base, {target: {value: price}});
            // this._buyAmountChanged(base, quote, {target: {value: amount.toString()}});
        }
    }

    _borrowQuote() {
        this.refs.borrowQuote.show();
    }

    _borrowBase() {
        this.refs.borrowBase.show();
    }

    _accountClickHandler(account_name, e) {
        e.preventDefault();
        ZfApi.publish("account_drop_down", "close");
        let router = this.context.router;
        AccountActions.setCurrentAccount(account_name);
        let current_account_name = router.getCurrentParams()["account_name"];
        if(current_account_name && current_account_name !== account_name) {
            let routes = router.getCurrentRoutes();
            this.context.router.transitionTo(routes[routes.length - 1].name, {account_name: account_name});
        }
    }

    render() {
        let { currentAccount, linkedAccounts, limit_orders,
            totalBids, flat_asks, flat_bids, bids, asks, quoteAsset, baseAsset } = this.props;
        let {buyAmount, buyPrice, buyTotal, sellAmount, sellPrice, sellTotal} = this.state;
        
        let base = null, quote = null, accountBalance = null, quoteBalance = null, baseBalance = null,
            quoteSymbol, baseSymbol;

        if (quoteAsset.size && baseAsset.size && currentAccount.size) {
            base = baseAsset.toJS();
            quote = quoteAsset.toJS();
            baseSymbol = base.symbol;
            quoteSymbol = quote.symbol;

            accountBalance = currentAccount.get("balances").toJS();
            
            if (accountBalance) {
                for (var id in accountBalance) {
                    if (id === quote.id) {
                        quoteBalance = accountBalance[id];
                    }
                    if (id === base.id) {
                        baseBalance = accountBalance[id];
                    }
                }
            } 

        }

        let quoteIsBitAsset = quoteAsset.get("bitasset_data_id") ? true : false;
        let baseIsBitAsset = baseAsset.get("bitasset_data_id") ? true : false;

        let lowestAsk = asks.length > 0 ? asks.reduce((a, b) => {
            if (a.price_full) {
                return a.price_full <= b.price_full ? a.price_full : b.price_full; 
           } else {
                return a <= b.price_full ? a : b.price_full; 
           }
        }) : 0;

        let highestBid = bids.length > 0 ? bids.reduce((a, b) => {
            return a >= b.price_full ? a : b.price_full;
        }, 0) : 0;

        let spread = lowestAsk - highestBid;

        let accountsDropDown = null;
        if (currentAccount) {

            let account_display_name = currentAccount.get("name").length > 20 ? `${currentAccount.get("name").slice(0, 20)}..` : currentAccount.get("name");

            if(linkedAccounts.size > 1) {
                let accountsList = linkedAccounts
                    .sort()
                    .map(name => {
                        return <li key={name}><a href onClick={this._accountClickHandler.bind(this, name)}>{name}</a></li>;
                    });

                accountsDropDown = (
                    <ActionSheet>
                        <ActionSheet.Button title="">
                            <a className="button">
                                <Icon name="user"/>&nbsp;{account_display_name} &nbsp;<Icon name="chevron-down"/>
                            </a>
                        </ActionSheet.Button>
                        <ActionSheet.Content >
                            <ul className="no-first-element-top-border">
                                {accountsList}
                            </ul>
                        </ActionSheet.Content>
                    </ActionSheet>);
            }
        }

        return (

                <div className="grid-block page-layout market-layout">
                    <AccountNotifications/>
                    {/* Main vertical block with content */}

                    {/* Left Column - Open Orders */}
                    <div className="grid-block left-column small-4 medium-3 large-2">
                            <OrderBook
                                orders={limit_orders}
                                bids={bids}
                                asks={asks}
                                base={base}
                                quote={quote}
                                baseSymbol={baseSymbol}
                                quoteSymbol={quoteSymbol}
                                onClick={this._orderbookClick.bind(this, base, quote)}
                            />
                    </div>

                    {/* Center Column */}
                    <div className="grid-block main-content vertical small-8 medium-9 large-8 ps-container" ref="center">

                        {/* Top bar with info */}
                        <div className="grid-block no-padding shrink overflow-visible" style={{paddingTop: 0}}>
                            <div className="grid-block overflow-visible">
                                <div className="grid-block shrink">
                                    <Link className="market-symbol" to="exchange" params={{marketID: `${baseSymbol}_${quoteSymbol}`}}><span>{`${baseSymbol} / ${quoteSymbol}`}</span></Link>
                                </div>
                                <div className="grid-block">
                                    {/*<ul className="market-stats stats">
                                        <li className="stat">
                                            <span>
                                                <Translate component="span" content="exchange.latest" /><br/>
                                                <b className="value stat-primary">{utils.format_number(290, Math.max(5, quote ? quote.precision : 0))}</b><br/>
                                                <em>{baseSymbol}/{quoteSymbol}</em>
                                            </span>
                                        </li>
                                        <li className="stat">
                                            <span>
                                                <Translate component="span" content="exchange.call" /><br/>
                                                <b className="value stat-primary">{utils.format_number(312, Math.max(5, quote ? quote.precision : 0))}</b><br/>
                                                <em>{baseSymbol}/{quoteSymbol}</em>
                                            </span>
                                        </li>
                                        <li className="stat">
                                            <span>
                                                <Translate component="span" content="exchange.volume" /><br/>
                                                <b className="value stat-primary">{utils.format_number(23122, quote ? quote.precision : 2)}</b><br/>
                                                <em>{quoteSymbol}</em>
                                            </span>
                                        </li>
                                    </ul>
                                */}
                                </div>
                                <div className="grid-block shrink overflow-visible account-drop-down">
                                    {accountsDropDown}
                                </div>
                                <div className="grid-block shrink borrow-button-container">
                                    {quoteIsBitAsset ? <div><button onClick={this._borrowQuote.bind(this)} className="button outline borrow-button">Borrow&nbsp;{quoteAsset.get("symbol")}</button></div> : null}
                                    {baseIsBitAsset ? <div><button onClick={this._borrowBase.bind(this)} className="button outline borrow-button">Borrow&nbsp;{baseAsset.get("symbol")}</button></div> : null}
                                </div>
                            </div>
                        </div>

                        <div className="grid-block no-overflow no-padding shrink">
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
                                onClick={this._depthChartClick.bind(this, base, quote)}
                                plotLine={this.state.depthLine}
                                spread={spread}
                            />
                        </div>

                        {/* Buy/Sell forms */}
                        <div className="grid-block vertical shrink">
                            <div className="grid-block shrink">
                               </div>
                            <div className="grid-block small-vertical medium-horizontal shrink no-padding" style={{ flexGrow: "0" }} >
                                {quote && base ?
                                <BuySell
                                    className="small-12 medium-6"
                                    type="buy"
                                    amount={buyAmount}
                                    price={buyPrice}
                                    total={buyTotal}
                                    quoteSymbol={quoteSymbol}
                                    baseSymbol={baseSymbol}
                                    amountChange={this._buyAmountChanged.bind(this, base, quote)}
                                    priceChange={this._buyPriceChanged.bind(this, base)}
                                    totalChange={this._buyTotalChanged.bind(this, base, quote)}
                                    balance={baseBalance}
                                    onSubmit={this._createLimitOrderConfirm.bind(this, quote, base, buyAmount, buyAmount * buyPrice, baseBalance / utils.get_asset_precision(base.precision))}
                                    balancePrecision={base.precision}
                                    quotePrecision={quote.precision}
                                    totalPrecision={base.precision}
                                    currentPrice={lowestAsk}
                                    account={currentAccount.get("name")}
                                /> : null}                                
                                {quote && base ?
                                <BuySell
                                    className="small-12 medium-6"
                                    type="sell"
                                    amount={sellAmount}
                                    price={sellPrice}
                                    total={sellTotal}
                                    quoteSymbol={quoteSymbol}
                                    baseSymbol={baseSymbol}
                                    amountChange={this._sellAmountChanged.bind(this, base, quote)}
                                    priceChange={this._sellPriceChanged.bind(this, base)}
                                    totalChange={this._sellTotalChanged.bind(this, base, quote)}
                                    balance={quoteBalance}
                                    onSubmit={this._createLimitOrderConfirm.bind(this, base, quote, sellAmount * sellPrice, sellAmount, quoteBalance / utils.get_asset_precision(quote.precision))}
                                    balancePrecision={quote.precision}
                                    quotePrecision={quote.precision}
                                    totalPrecision={base.precision}
                                    currentPrice={highestBid}
                                    account={currentAccount.get("name")}
                                /> : null}
                            </div>
                        </div>



                        <div className="grid-content no-overflow shrink no-padding">
                            {limit_orders.size > 0 && base && quote ? <MyOpenOrders
                                key="open_orders"
                                orders={limit_orders}
                                currentAccount={currentAccount.get("id")}
                                base={base}
                                quote={quote}
                                baseSymbol={baseSymbol}
                                quoteSymbol={quoteSymbol}
                                onCancel={this._cancelLimitOrder.bind(this)}
                            /> : null}
                        </div>

                        {/* Price history chart and depth chart inside tabs */}
                        <div className="grid-block shrink no-overflow no-padding" id="market-charts" style={{marginTop: "0.5rem"}}>

                                    <div style={{position: "absolute", top: "-5px", right: "20px", zIndex: 999}}>
                                        <div className="button bucket-button" onClick={this._changeBucketSize.bind(this, 15)}>15s</div>
                                        <div className="button bucket-button" onClick={this._changeBucketSize.bind(this, 60)}>60s</div>
                                        <div className="button bucket-button" onClick={this._changeBucketSize.bind(this, 300)}>5min</div>
                                        <div className="button bucket-button" onClick={this._changeBucketSize.bind(this, 3600)}>1hr</div>
                                        <div className="button bucket-button" onClick={this._changeBucketSize.bind(this, 86400)}>1d</div>
                                    </div>
                                    <PriceChart
                                        priceData={this.props.priceData}
                                        volumeData={this.props.volumeData}
                                        base={base}
                                        quote={quote}
                                        baseSymbol={baseSymbol}
                                        quoteSymbol={quoteSymbol}
                                        height={300}
                                    />



                        </div>


                    {/* End of Main Content Column */}
                    </div>


                    {/* Right Column - Market History */}
                    <div className="grid-block right-column show-for-large large-2" style={{overflowY: "auto"}}>
                        {/* Market History */}
                        <MarketHistory
                            history={this.props.activeMarketHistory}
                            base={base}
                            baseSymbol={baseSymbol}
                            quoteSymbol={quoteSymbol}/>
                    </div>
                    {quoteIsBitAsset ?
                        <BorrowModal
                            ref="borrowQuote"
                            quote_asset={quoteAsset.get("id")}
                            account={currentAccount}
                         /> : null}
                    {baseIsBitAsset ?
                        <BorrowModal
                            ref="borrowBase"
                            quote_asset={baseAsset.get("id")}
                            account={currentAccount}
                        /> : null}
                {/* End of Second Vertical Block */}
                </div>
        );
    }
}

export default Exchange;
