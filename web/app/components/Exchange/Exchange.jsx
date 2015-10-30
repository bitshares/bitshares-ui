import React from "react";
import {PropTypes} from "react";
import MarketsActions from "actions/MarketsActions";
import {MyOpenOrders} from "./MyOpenOrders";
import OrderBook from "./OrderBook";
import MarketHistory from "./MarketHistory";
import MyMarkets from "./MyMarkets";
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
import SettingsActions from "actions/SettingsActions";
import ActionSheet from "react-foundation-apps/src/action-sheet";
import Icon from "../Icon/Icon";
import classnames from "classnames";
import ee from "emitter-instance";
import market_utils from "common/market_utils";

require("./exchange.scss");

let emitter = ee.emitter();
let callListener, limitListener, newCallListener;

Highcharts.setOptions({
    global: {
        useUTC: false
    }
});

class PriceStat extends React.Component {

    constructor() {
        super();
        this.state = {
            change: null
        };
    }

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.price !== this.props.price
        );
    }

    componentWillReceiveProps(nextProps) {
        this.setState({change: nextProps.price - this.props.price});
    }

    render() {
        let {base, quote, price, content} = this.props;
        let {change} = this.state;
        let changeClass = null;
        if (change !== null) {
            changeClass = change > 0 ? "change-up" : "change-down";
        }
        return (
            <li className="stat">
                <span>
                    <Translate component="span" content={content} />
                    <br/>
                    <b className={"value stat-primary"}>
                        {utils.format_number(price, Math.max(5, quote ? quote.get("precision") : 0))}
                        {change !== null ? <span className={changeClass}>&nbsp;{changeClass === "change-up" ? <span>&#8593;</span> : <span>&#8595;</span>}</span> : null}
                        
                    </b>                                                    
                    <br/>
                    <em>{base.get("symbol")}/{quote.get("symbol")}</em>
                </span>
            </li>
        );
    }
}

@BindToChainState({keep_updating: true, show_loader: true})
class Exchange extends React.Component {
    constructor(props) {
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
            flipBuySell: props.viewSettings.get("flipBuySell"),
            favorite: false,
            showDepthChart: props.viewSettings.get("showDepthChart"),
            leftOrderBook: props.viewSettings.get("leftOrderBook")
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
        viewSettings: PropTypes.object.isRequired,
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
        viewSettings: {},
        priceData: [],
        volumeData: []
    }

    static contextTypes = {router: React.PropTypes.func.isRequired};

    componentWillMount() {
        if (this.props.quoteAsset.toJS && this.props.baseAsset.toJS) {
            this._subToMarket(this.props);
            this._addMarket(this.props.quoteAsset.get("symbol"), this.props.baseAsset.get("symbol"));
        }

        emitter.on('cancel-order', limitListener = MarketsActions.cancelLimitOrderSuccess);
        emitter.on('close-call', callListener = MarketsActions.closeCallOrderSuccess);
        emitter.on('call-order-update', newCallListener = MarketsActions.callOrderUpdate);
    }

    componentDidMount() {
        let centerContainer = React.findDOMNode(this.refs.center);
        Ps.initialize(centerContainer);
    }

    _addMarket(quote, base) {
        if (!this.state.favorite) {
            SettingsActions.addMarket(quote, base);
            this.setState({
                favorite: true
            });
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.quoteAsset.toJS && nextProps.baseAsset.toJS) {
            this._addMarket(nextProps.quoteAsset.get("symbol"), nextProps.baseAsset.get("symbol"));
            if (!this.state.sub) {
                return this._subToMarket(nextProps);
            }
        }

        if (nextProps.quoteAsset.get("symbol") !== this.props.quoteAsset.get("symbol") || nextProps.baseAsset.get("symbol") !== this.props.baseAsset.get("symbol")) {

            let currentSub = this.state.sub.split("_");
            MarketsActions.unSubscribeMarket(currentSub[0], currentSub[1]);
            return this._subToMarket(nextProps);
        }
    }

    componentWillUnmount() {
        let {quoteAsset, baseAsset} = this.props;
        MarketsActions.unSubscribeMarket(quoteAsset.get("id"), baseAsset.get("id"));
        emitter.off('cancel-order', limitListener);
        emitter.off('close-call', callListener);
        emitter.off('call-order-update', newCallListener);
    }

    _createLimitOrder(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount) {
        console.log("createLimitOrder:", buyAssetAmount, sellAssetAmount);
        let expiration = new Date();
        // TODO: Add selector for expiry
        expiration.setYear(expiration.getFullYear() + 5);
        MarketsActions.createLimitOrder(
            this.props.currentAccount.get("id"),
            parseInt(sellAssetAmount * utils.get_asset_precision(sellAsset.get("precision")), 10),
            sellAsset,
            parseInt(buyAssetAmount * utils.get_asset_precision(buyAsset.get("precision")), 10),
            buyAsset,
            expiration,
            false // fill or kill TODO: add fill or kill switch
        ).then(result => {
            if (result.error) {
                if (result.error.message !== "wallet locked")
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
        );
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
            MarketsActions.subscribeMarket(baseAsset, quoteAsset, bucketSize);
            this.setState({sub: `${quoteAsset.get("id")}_${baseAsset.get("id")}`});
        }
    }

    _depthChartClick(base, quote, power, e) {
        e.preventDefault();
        let value = this._limitByPrecision(e.xAxis[0].value / power, quote);
        this.setState({
            depthLine: value
        });

        this._buyPriceChanged(base, quote, {target: {value: value}});
        this._sellPriceChanged(base, quote, {target: {value: value}});
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
        let assetPrecision = asset.toJS ? asset.get("precision") : asset.precision;
        let valueString = value.toString();
        let splitString = valueString.split(".");
        if (splitString.length === 1 || splitString.length === 2 && splitString[1].length <= assetPrecision) {
            return value;
        }
        let precision = utils.get_asset_precision(assetPrecision);
        value = Math.floor(value * precision) / precision;
        if (isNaN(value) || !isFinite(value)) {
            return 0;
        }
        return value;
    }

    _buyPriceChanged(base, quote, e) {
        this.setState({
            buyPrice: this._limitByPrecision(this._addZero(e.target.value), {precision: quote.get("precision") + base.get("precision")}),
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

    _sellPriceChanged(base, quote, e) {
        this.setState({
            sellPrice: this._limitByPrecision(this._addZero(e.target.value), {precision: quote.get("precision") + base.get("precision")}),
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

    _flipBuySell() {
        SettingsActions.changeViewSetting({
            flipBuySell: !this.state.flipBuySell
        });

        this.setState({flipBuySell: !this.state.flipBuySell});
    }

    _toggleCharts() {
        SettingsActions.changeViewSetting({
            showDepthChart: !this.state.showDepthChart
        });

        this.setState({showDepthChart: !this.state.showDepthChart});
    }

    _moveOrderBook() {
        SettingsActions.changeViewSetting({
            leftOrderBook: !this.state.leftOrderBook
        });

        this.setState({leftOrderBook: !this.state.leftOrderBook});
    }

    _orderbookClick(base, quote, price, amount, type) {

        let precision = utils.get_asset_precision(quote.get("precision") + base.get("precision"));

        if (type === "bid") {

            let value = amount.toString();
            if (value.indexOf(".") !== value.length -1) {
                value = this._limitByPrecision(amount, quote);
            }
            // price = Math.round(price * precision) /
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
        let { currentAccount, linkedAccounts, limit_orders, call_orders, totalCalls, activeMarketHistory,
            totalBids, flat_asks, flat_bids, flat_calls, invertedCalls, bids, asks,
            calls, quoteAsset, baseAsset, transaction, broadcast, lowestCallPrice, buckets } = this.props;
        let {buyAmount, buyPrice, buyTotal, sellAmount, sellPrice, sellTotal, leftOrderBook} = this.state;

        let base = null, quote = null, accountBalance = null, quoteBalance = null, baseBalance = null,
            quoteSymbol, baseSymbol, settlementPrice = null, squeezePrice = null, settlementQuote, settlementBase,
            flipped = false, showCallLimit = false, highestBid, lowestAsk, latestPrice, changeClass;


        // console.log("currentAccount:", currentAccount.toJS());
        if (quoteAsset.size && baseAsset.size && currentAccount.size) {
            base = baseAsset;
            quote = quoteAsset;
            baseSymbol = base.get("symbol");
            quoteSymbol = quote.get("symbol");

            accountBalance = currentAccount.get("balances").toJS();

            if (accountBalance) {
                for (let id in accountBalance) {
                    if (id === quote.get("id")) {
                        quoteBalance = accountBalance[id];
                    }
                    if (id === base.get("id")) {
                        baseBalance = accountBalance[id];
                    }
                }
            }

            let settlement_price, core_rate, short_squeeze;
            if (quote.get("bitasset") && quote.getIn(["bitasset", "current_feed"]) && base.get("id") === "1.3.0") {
                settlement_price = quote.getIn(["bitasset", "current_feed", "settlement_price"]);
                short_squeeze = quote.getIn(["bitasset", "current_feed", "maximum_short_squeeze_ratio"]) / 1000;

            } else if (base.get("bitasset") && base.getIn(["bitasset", "current_feed"]) && quote.get("id") === "1.3.0") {
                settlement_price = base.getIn(["bitasset", "current_feed", "settlement_price"]);
                short_squeeze = base.getIn(["bitasset", "current_feed", "maximum_short_squeeze_ratio"]) / 1000;
            }

            if (settlement_price) {

                if (settlement_price.getIn(["base", "asset_id"]) === quote.get("id")) {
                    settlementBase = {precision: quote.get("precision"), id: quote.get("id")};
                    settlementQuote = {precision: base.get("precision"), id: base.get("id")};
                } else {
                    flipped = true;
                    settlementBase = {precision: base.get("precision"), id: base.get("id")};
                    settlementQuote = {precision: quote.get("precision"), id: quote.get("id")};
                }

                settlementPrice = utils.get_asset_price(settlement_price.getIn(["quote", "amount"]), settlementQuote, settlement_price.getIn(["base", "amount"]), settlementBase, flipped);

                if (flipped) {
                    highestBid = bids.reduce((total, bid) => {
                        if (!total) {
                            return bid.full;
                        } else {
                            return Math.max(total, bid.full);
                        }
                    }, null);
                    squeezePrice = settlementPrice / short_squeeze;
                    showCallLimit = highestBid < lowestCallPrice && lowestCallPrice > squeezePrice;
                } else {
                    lowestAsk = asks.reduce((total, ask) => {
                        if (!total) {
                            return ask.full;
                        } else {
                            return Math.min(total, ask.full);
                        }
                    }, null);
                    
                    squeezePrice = settlementPrice * short_squeeze;
                    showCallLimit = lowestAsk > lowestCallPrice && lowestCallPrice < squeezePrice;
                }
            }
        }

        let quoteIsBitAsset = quoteAsset.get("bitasset_data_id") ? true : false;
        let baseIsBitAsset = baseAsset.get("bitasset_data_id") ? true : false;

        let combinedAsks, combinedBids;

        if (calls.length && invertedCalls) {
            combinedAsks = showCallLimit ? asks.concat(calls) : asks;
            combinedBids = bids;
        } else if (calls.length && !invertedCalls) {
            combinedBids = showCallLimit ? bids.concat(calls) : bids;
            combinedAsks = asks;
        } else {
            combinedAsks = asks;
            combinedBids = bids;
        }

        lowestAsk = combinedAsks.length === 1 ?
            combinedAsks[0].price_full : combinedAsks.length > 1 ?
            combinedAsks.reduce((a, b) => {
            if (a.price_full) {
                return a.price_full <= b.price_full ? a.price_full : b.price_full;
           } else {
                return a <= b.price_full ? a : b.price_full;
           }
        }) : 0;

        highestBid = combinedBids.length === 1 ?
        combinedBids[0].price_full :
        combinedBids.length > 0 ? combinedBids.reduce((a, b) => {
            return a >= b.price_full ? a : b.price_full;
        }, 0) : 0;

        let spread = lowestAsk - highestBid;

        // Latest price
        if (activeMarketHistory.size) {
            // Orders come in pairs, first is driver. Third entry is first of second pair.
            let latest_two = activeMarketHistory.take(3);
            let latest = latest_two.first();
            let second_latest = latest_two.last();
            let paysAsset, receivesAsset, isAsk = false;
            if (latest.pays.asset_id === base.get("id")) {
                paysAsset = base;
                receivesAsset = quote;                    
                isAsk = true;                    
            } else {
                paysAsset = quote;
                receivesAsset = base;
            }
            let flipped = base.get("id").split(".")[2] > quote.get("id").split(".")[2];
            latestPrice = market_utils.parse_order_history(latest, paysAsset, receivesAsset, isAsk, flipped);
            if (second_latest) {
                if (second_latest.pays.asset_id === base.get("id")) {
                    paysAsset = base;
                    receivesAsset = quote;                    
                } else {
                    paysAsset = quote;
                    receivesAsset = base;
                    isAsk = true;                    
                }
                let oldPrice = market_utils.parse_order_history(second_latest, paysAsset, receivesAsset, isAsk, flipped);
                changeClass = latestPrice.full - oldPrice.full > 0 ? "change-up" : "change-down";
            }

        }

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

        let bucketTexts = {
            "15": "15s",
            "60": "1m",
            "300": "5m",
            "900": "15m",
            "1800": "30m",
            "3600": "1h",
            "14400": "4h",
            "86400": "1d"
        };

        let bucketOptions = buckets.map(bucket => {
            return <div className={classnames("label bucket-option", {" ": this.props.bucketSize !== bucket, "active-bucket": this.props.bucketSize === bucket})} onClick={this._changeBucketSize.bind(this, bucket)}>{bucketTexts[bucket]}</div>
        }).reverse();

        return (

                <div className="grid-block page-layout market-layout">
                    <AccountNotifications/>
                    {/* Main vertical block with content */}

                    {/* Left Column - Open Orders */}
                    {leftOrderBook ? (
                        <div className="grid-block left-column large-2 no-overflow">
                            <OrderBook
                                latest={latestPrice}
                                orders={limit_orders}
                                calls={call_orders}
                                invertedCalls={invertedCalls}
                                combinedBids={combinedBids}
                                combinedAsks={combinedAsks}
                                base={base}
                                quote={quote}
                                baseSymbol={baseSymbol}
                                quoteSymbol={quoteSymbol}
                                onClick={this._orderbookClick.bind(this, base, quote)}
                                horizontal={!leftOrderBook}
                                moveOrderBook={this._moveOrderBook.bind(this)}
                                flipOrderBook={this.props.viewSettings.get("flipOrderBook")}
                            />
                    </div>) : null}

                    {/* Center Column */}
                    <div className={classnames("grid-block main-content vertical ps-container", leftOrderBook ? "small-8 medium-9 large-7 " : "small-12 large-9 ")} >

                        {/* Top bar with info */}
                        <div className="grid-block no-padding shrink overflow-visible" style={{paddingTop: 0}}>
                            <div className="grid-block overflow-visible">
                                <div className="grid-block shrink">
                                    <Link className="market-symbol" to="exchange" params={{marketID: `${baseSymbol}_${quoteSymbol}`}}><span>{`${quoteSymbol} : ${baseSymbol}`}</span></Link>
                                </div>
                                <div className="grid-block">
                                    <ul className="market-stats stats">
                                        {/*coreRate ?
                                            (<li className="stat">
                                                <span>
                                                    <Translate component="span" content="exchange.core_rate" /><br/>
                                                    <b className="value stat-primary">{utils.format_number(coreRate, base.get("precision"))}</b><br/>
                                                    <em>{baseSymbol}/{quoteSymbol}</em>
                                                </span>
                                            </li>) : null*/}
                                        {settlementPrice ? <PriceStat price={settlementPrice} quote={quote} base={base} content="exchange.settle"/> : null}
                                        {lowestCallPrice && showCallLimit ?
                                            (<li className="stat">
                                                <span>
                                                    <Translate component="span" content="explorer.block.call_limit" />
                                                    <br/>
                                                    <b className="value stat-primary" style={{color: "#BBBF2B"}}>{utils.format_number(lowestCallPrice, base.get("precision"))}</b>
                                                    <br/>
                                                    <em>{baseSymbol}/{quoteSymbol}</em>
                                                </span>
                                            </li>) : null}
                                        {squeezePrice && showCallLimit ?
                                            (<li className="stat">
                                                <span>
                                                    <Translate component="span" content="exchange.squeeze" />
                                                    <br/>
                                                    <b className="value stat-primary" style={{color: "#BBBF2B"}}>{utils.format_number(squeezePrice, base.get("precision"))}</b>
                                                    <br/>
                                                    <em>{baseSymbol}/{quoteSymbol}</em>
                                                </span>
                                            </li>) : null}
                                        {latestPrice ?
                                            <li className="stat">
                                                <span>
                                                    <Translate component="span" content="exchange.latest" />
                                                    <br/>
                                                    <b className={"value stat-primary"}>{utils.format_number(latestPrice.full, Math.max(5, base ? base.get("precision") : 0))}<span className={changeClass}>&nbsp;{changeClass === "change-up" ? <span>&#8593;</span> : <span>&#8595;</span>}</span></b>                                                    
                                                    <br/>
                                                    <em>{baseSymbol}/{quoteSymbol}</em>
                                                </span>
                                            </li> : null}
                                    </ul>

                                </div>
                                <div className="grid-block shrink overflow-visible account-drop-down">
                                    {accountsDropDown}
                                </div>
                                <div className="grid-block shrink borrow-button-container">
                                    {quoteIsBitAsset ? <div><button onClick={this._borrowQuote.bind(this)} className="button outline borrow-button">Borrow&nbsp;{quoteAsset.get("symbol")}</button></div> : null}
                                    {baseIsBitAsset ? <div><button onClick={this._borrowBase.bind(this)} className="button outline borrow-button">Borrow&nbsp;{baseAsset.get("symbol")}</button></div> : null}
                                    <div><button onClick={this._toggleCharts.bind(this)} className="button outline borrow-button">{!this.state.showDepthChart ? <Translate content="exchange.order_depth" /> : <Translate content="exchange.price_history" />}&nbsp;</button></div>
                                </div>
                            </div>
                        </div>
                        <div ref="center">
                        {!this.state.showDepthChart ? (
                            <div className="grid-block shrink" id="market-charts" style={{marginTop: "0.5rem"}}>
                            {/* Price history chart */}
                            <div className="chart-zoom-dropdown no-overflow" style={{position: "absolute", top: "24px", left: "24px", zIndex: 999}} >
                              <Icon className="grid-block" name="cog"/>

                                  <div className="grid-block float-right" >
                                    <div className="grid-content float-right no-overflow">
                                   {bucketOptions}
                                  </div>
                                </div>
                              </div>
                                    <PriceChart
                                        priceData={this.props.priceData}
                                        volumeData={this.props.volumeData}
                                        base={base}
                                        quote={quote}
                                        baseSymbol={baseSymbol}
                                        quoteSymbol={quoteSymbol}
                                        height={400}
                                        leftOrderBook={leftOrderBook}

                                    />

                        </div>) : (
                            <div className="grid-block no-overflow no-padding shrink" >
                                <DepthHighChart
                                    orders={limit_orders}
                                    call_orders={call_orders}
                                    flat_asks={flat_asks}
                                    flat_bids={flat_bids}
                                    flat_calls={ showCallLimit ? flat_calls : []}
                                    invertedCalls={invertedCalls}
                                    totalBids={totalBids}
                                    totalCalls={showCallLimit ? totalCalls : 0}
                                    base={base}
                                    quote={quote}
                                    baseSymbol={baseSymbol}
                                    quoteSymbol={quoteSymbol}
                                    height={445}
                                    onClick={this._depthChartClick.bind(this, base, quote)}
                                    plotLine={this.state.depthLine}
                                    settlementPrice={settlementPrice}
                                    spread={spread}
                                    SQP={showCallLimit ? squeezePrice : null}
                                    LCP={showCallLimit ? lowestCallPrice : null}
                                    leftOrderBook={leftOrderBook}
                                />
                            </div>)}

                        {/* Buy/Sell forms */}

                        <div className="grid-block vertical shrink no-padding">
                            <div className="grid-block small-vertical medium-horizontal no-padding align-spaced" style={{ flexGrow: "0" }} >
                                {quote && base ?
                                <BuySell
                                    className={classnames("small-12 medium-5 no-padding", this.state.flipBuySell ? "order-3 sell-form" : "order-1 buy-form")}
                                    type="buy"
                                    amount={buyAmount}
                                    price={buyPrice}
                                    total={buyTotal}
                                    quote={quote}
                                    base={base}
                                    amountChange={this._buyAmountChanged.bind(this, base, quote)}
                                    priceChange={this._buyPriceChanged.bind(this, base, quote)}
                                    totalChange={this._buyTotalChanged.bind(this, base, quote)}
                                    balance={baseBalance}
                                    onSubmit={this._createLimitOrderConfirm.bind(this, quote, base, buyAmount, buyAmount * buyPrice, baseBalance / utils.get_asset_precision(base.get("precision")))}
                                    balancePrecision={base.get("precision")}
                                    quotePrecision={quote.get("precision")}
                                    totalPrecision={base.get("precision")}
                                    currentPrice={lowestAsk}
                                    account={currentAccount.get("name")}
                                /> : null}
                                <div onClick={this._flipBuySell.bind(this)} className="grid-block vertical align-center text-center no-padding shrink order-2" style={{cursor: "pointer"}}>
                                    <span style={{fontSize: "2rem"}}>&#8646;</span>
                                </div>
                                {quote && base ?
                                <BuySell
                                    className={classnames("small-12 medium-5 no-padding", this.state.flipBuySell ? "order-1 buy-form" : "order-3 sell-form")}
                                    type="sell"
                                    amount={sellAmount}
                                    price={sellPrice}
                                    total={sellTotal}
                                    quote={quote}
                                    base={base}
                                    amountChange={this._sellAmountChanged.bind(this, base, quote)}
                                    priceChange={this._sellPriceChanged.bind(this, base, quote)}
                                    totalChange={this._sellTotalChanged.bind(this, base, quote)}
                                    balance={quoteBalance}
                                    onSubmit={this._createLimitOrderConfirm.bind(this, base, quote, sellAmount * sellPrice, sellAmount, quoteBalance / utils.get_asset_precision(quote.get("precision")))}
                                    balancePrecision={quote.get("precision")}
                                    quotePrecision={quote.get("precision")}
                                    totalPrecision={base.get("precision")}
                                    currentPrice={highestBid}
                                    account={currentAccount.get("name")}
                                /> : null}
                            </div>
                        </div>

                        {!leftOrderBook ? <div className="grid-block small-12" style={{overflow: "hidden"}}>
                            <OrderBook
                                orders={limit_orders}
                                calls={call_orders}
                                invertedCalls={invertedCalls}
                                combinedBids={combinedBids}
                                combinedAsks={combinedAsks}
                                base={base}
                                quote={quote}
                                baseSymbol={baseSymbol}
                                quoteSymbol={quoteSymbol}
                                onClick={this._orderbookClick.bind(this, base, quote)}
                                horizontal={!leftOrderBook}
                                moveOrderBook={this._moveOrderBook.bind(this)}
                                flipOrderBook={this.props.viewSettings.get("flipOrderBook")}
                            />
                    </div> : null}

                        <div className="grid-block no-overflow shrink no-padding">
                            {limit_orders.size > 0 && base && quote ? (
                                <MyOpenOrders
                                    key="open_orders"
                                    orders={limit_orders}
                                    currentAccount={currentAccount.get("id")}
                                    base={base}
                                    quote={quote}
                                    baseSymbol={baseSymbol}
                                    quoteSymbol={quoteSymbol}
                                    onCancel={this._cancelLimitOrder.bind(this)}
                                    flipMyOrders={this.props.viewSettings.get("flipMyOrders")}
                                />) : null}
                        </div>


                    </div>
                    {/* End of Main Content Column */}
                    </div>


                    {/* Right Column - Market History */}
                    <div className="grid-block show-for-large large-3 right-column no-overflow vertical" style={{paddingRight: "0.5rem"}}>
                        {/* Market History */}
                        <div className="grid-block no-padding no-margin vertical"  style={{flex: "1 1 50vh"}}>
                            <MarketHistory
                                history={activeMarketHistory}
                                base={base}
                                quote={quote}
                                baseSymbol={baseSymbol}
                                quoteSymbol={quoteSymbol}
                            />
                        </div>
                        <div className="grid-block no-padding no-margin vertical" style={{flex: "0 1 50vh"}}>
                            <MyMarkets />
                        </div>
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
