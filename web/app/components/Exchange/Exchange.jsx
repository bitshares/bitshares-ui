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
import ChainStore from "api/ChainStore";
import BindToChainState from "../Utility/BindToChainState";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountActions from "actions/AccountActions";
import SettingsActions from "actions/SettingsActions";
import ActionSheet from "react-foundation-apps/src/action-sheet";
import Icon from "../Icon/Icon";
import cnames from "classnames";
import ee from "emitter-instance";
import market_utils from "common/market_utils";
import LoadingIndicator from "../LoadingIndicator";
import ConfirmOrderModal from "./ConfirmOrderModal";

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
            nextProps.price !== this.props.price ||
            nextProps.ready !== this.props.ready
        );
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.ready && this.props.ready) {
            this.setState({change: parseFloat(nextProps.price) - parseFloat(this.props.price)});
        } else {
            this.setState({change: 0});
        }
    }

    render() {
        let {base, quote, price, content, decimals, ready, volume} = this.props;
        let {change} = this.state;
        let changeClass = null;
        if (change && change !== null) {
            changeClass = change > 0 ? "change-up" : "change-down";
        }

        let value = !volume ? utils.format_number(price, Math.max(decimals >= 0 ? decimals : 5, quote ? quote.get("precision") : 0)) :
            utils.format_volume(price);

        return (
            <li className={cnames("stat", this.props.className)}>
                <span>
                    <Translate component="span" content={content} />
                    <br/>
                        <b className={"value stat-primary"}>
                            {!ready ? 0 : value}
                            {!change ? null : change !== null ? <span className={changeClass}>&nbsp;{changeClass === "change-up" ? <span>&#8593;</span> : <span>&#8595;</span>}</span> : null}
                        </b>
                    <br/>
                    <em>{base.get("symbol")}{quote ? <span>/{quote.get("symbol")}</span> : null}</em>
                </span>
            </li>
        );
    }
}

@BindToChainState({keep_updating: true, show_loader: true})
class Exchange extends React.Component {
    constructor(props) {
        super();

        this.state = this._initialState(props);

        this._createLimitOrderConfirm = this._createLimitOrderConfirm.bind(this);
    }

    _initialState(props) {
        return {
            history: [],
            buyAmount: 0,
            displaySellPrice: 0,
            displayBuyPrice: 0,
            buyPrice: {
                quote: {
                    asset_id: props.quoteAsset.get("id"),
                    amount: 0
                },
                base: {
                     asset_id: props.baseAsset.get("id"),
                     amount: 0
                }
            },
            sellPrice: {
                quote: {
                    asset_id: props.baseAsset.get("id"),
                    amount: 0
                },
                base: {
                     asset_id: props.quoteAsset.get("id"),
                     amount: 0
                }
            },
            buyTotal: 0,
            sellAmount: 0,
            sellTotal: 0,
            sub: null,
            flipBuySell: props.viewSettings.get("flipBuySell"),
            favorite: false,
            showDepthChart: props.viewSettings.get("showDepthChart"),
            leftOrderBook: props.viewSettings.get("leftOrderBook"),
            buyDiff: false,
            sellDiff: false
        };
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
            // this._addMarket(this.props.quoteAsset.get("symbol"), this.props.baseAsset.get("symbol"));
        }

        emitter.on('cancel-order', limitListener = MarketsActions.cancelLimitOrderSuccess);
        emitter.on('close-call', callListener = MarketsActions.closeCallOrderSuccess);
        emitter.on('call-order-update', newCallListener = MarketsActions.callOrderUpdate);
    }

    componentDidMount() {
        let centerContainer = React.findDOMNode(this.refs.center);
        Ps.initialize(centerContainer);
        SettingsActions.changeViewSetting({
            lastMarket: this.props.quoteAsset.get("symbol") + "_" + this.props.baseAsset.get("symbol")
        });
    }

    _addMarket(quote, base) {
        let marketID = `${quote}_${base}`;
        if (!this.props.starredMarkets.has(marketID)) {
            SettingsActions.addStarMarket(quote, base);
        } else {
            SettingsActions.removeStarMarket(quote, base);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.quoteAsset.toJS && nextProps.baseAsset.toJS) {
            // this._addMarket(nextProps.quoteAsset.get("symbol"), nextProps.baseAsset.get("symbol"));
            if (!this.state.sub) {
                return this._subToMarket(nextProps);
            }
        }

        if (nextProps.quoteAsset.get("symbol") !== this.props.quoteAsset.get("symbol") || nextProps.baseAsset.get("symbol") !== this.props.baseAsset.get("symbol")) {
            this.setState(this._initialState(nextProps));

            let currentSub = this.state.sub.split("_");
            MarketsActions.unSubscribeMarket(currentSub[0], currentSub[1]);
            SettingsActions.changeViewSetting({
                lastMarket: nextProps.quoteAsset.get("symbol") + "_" + nextProps.baseAsset.get("symbol")
            });
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

    _createLimitOrderConfirm(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount, balance, type, e) {
        e.preventDefault();
        let fee = utils.estimateFee("limit_order_create", [], ChainStore.getObject("2.0.0")) || 0;

        // TODO Convert fee to relevant asset fee and check if user has sufficient balance
        if (sellAsset.get("id") !== "1.3.0") {
            let cer = sellAsset.getIn(["options", "core_exchange_rate"]);
            // console.log("sellAsset:", sellAsset.toJS());
        }

        let {lowestAsk, highestBid} = this._parseMarket();
        if (type === "buy") {
            let diff = (100 * (this.state.displayBuyPrice - lowestAsk) / lowestAsk);
            if (Math.abs(diff) > 25) {
                this.refs.buy.show();
                return this.setState({
                    buyDiff: diff
                });
            }
        } else if (type === "sell") {
            let diff = (100 * (this.state.displaySellPrice - highestBid) / highestBid);
            if (Math.abs(diff) > 25) {
                this.refs.sell.show();
                return this.setState({
                    sellDiff: diff
                });
            }
        }

        if ((sellAssetAmount) > balance) {
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

    _forceBuy(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount, value) {
        if (value) {
            this._createLimitOrder(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount)
        }
    }

    _forceSell(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount, value) {
        if (value) {
            this._createLimitOrder(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount)
        }
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
        let buyPrice = this._getBuyPrice(e.xAxis[0].value / power);
        let sellPrice = this._getSellPrice(e.xAxis[0].value / power);
        let displayBuyPrice = this._getDisplayPrice("bid", buyPrice);
        let displaySellPrice = this._getDisplayPrice("ask", sellPrice);
        // let buyPrice = this._buyPriceChanged(base, quote, {target: {value: value}});

        this.setState({
            depthLine: value,
            buyPrice: buyPrice,
            displayBuyPrice: displayBuyPrice,
            buyTotal: this._limitByPrecision(this.getBuyTotal(buyPrice, this.state.buyAmount), base),
            sellPrice: sellPrice,
            displaySellPrice: displaySellPrice,
            sellTotal: this._limitByPrecision(this.getSellTotal(sellPrice, this.state.sellAmount), base)
        });

        // this._sellPriceChanged(base, quote, {target: {value: value}});
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

    _limitByPrecision(value, asset, floor = true) {
        let assetPrecision = asset.toJS ? asset.get("precision") : asset.precision;
        let valueString = value.toString();
        let splitString = valueString.split(".");
        if (splitString.length === 1 || splitString.length === 2 && splitString[1].length <= assetPrecision) {
            return value;
        }
        let precision = utils.get_asset_precision(assetPrecision);
        value = floor ? Math.floor(value * precision) / precision : Math.round(value * precision) / precision;
        if (isNaN(value) || !isFinite(value)) {
            return 0;
        }
        return value;
    }

    _buyPriceChanged(base, quote, e) {
        let price = this._getBuyPrice(e.target.value);

        this.setState({
            buyPrice: price,
            displayBuyPrice: e.target.value,
            buyTotal: this._limitByPrecision(this.getBuyTotal(price, this.state.buyAmount), base),
            depthLine: e.target.value
        });
    }

    _buyAmountChanged(base, quote, e) {
        let value = e.target.value;
        if (e.target.value.indexOf(".") !== e.target.value.length -1) {
            value = this._limitByPrecision(e.target.value, quote);
        }

        this.setState({
            buyAmount: this._addZero(value),
            buyTotal: this._limitByPrecision(this.getBuyTotal(this.state.buyPrice, value), base)
        });
    }

    _buyTotalChanged(base, quote, e) {
        let value = e.target.value;
        if (e.target.value.indexOf(".") !== e.target.value.length -1) {
            value = this._limitByPrecision(e.target.value, base);
        }

        let amount = this.getBuyAmount(this.state.buyPrice, value);

        this.setState({
            buyAmount: this._limitByPrecision(amount, quote),
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
            sellTotal: this._limitByPrecision(this.getSellTotal(this.state.sellPrice, value), base)
        });
    }

    _sellPriceChanged(base, quote, e) {
        let price = this._getSellPrice(e.target.value);

        this.setState({
            sellPrice: price,
            displaySellPrice: e.target.value,
            sellTotal: this._limitByPrecision(this.getSellTotal(price, this.state.sellAmount), base),
            depthLine: e.target.value
        });
    }

    _sellTotalChanged(base, quote, e) {
        let value = e.target.value;
        if (e.target.value.indexOf(".") !== e.target.value.length -1) {
            value = this._limitByPrecision(e.target.value, base);
        }

        this.setState({
            sellAmount: this._limitByPrecision(this.getSellAmount(this.state.sellPrice, value), quote),
            sellTotal: this._addZero(value)
        });
    }

    _flipBuySell() {
        SettingsActions.changeViewSetting({
            flipBuySell: !this.state.flipBuySell
        });

        this.setState({flipBuySell: !this.state.flipBuySell});
    }

    getSellAmount(price, total) {
        let amountPrecision = utils.get_asset_precision(this.props.quoteAsset.get("precision"));
        let totalPrecision = utils.get_asset_precision(this.props.baseAsset.get("precision"));

        return ((total * totalPrecision / price.base.amount) * price.quote.amount) / amountPrecision;
    }

    getSellTotal(price, amount) {
        let amountPrecision = utils.get_asset_precision(this.props.quoteAsset.get("precision"));
        let totalPrecision = utils.get_asset_precision(this.props.baseAsset.get("precision"));

        return ((amount * amountPrecision / price.quote.amount) * price.base.amount) / totalPrecision;
    }

    getBuyAmount(price, total) {
        let amountPrecision = utils.get_asset_precision(this.props.quoteAsset.get("precision"));
        let totalPrecision = utils.get_asset_precision(this.props.baseAsset.get("precision"));

        return ((total * totalPrecision / price.quote.amount) * price.base.amount) / amountPrecision;
    }

    getBuyTotal(price, amount) {
        let amountPrecision = utils.get_asset_precision(this.props.quoteAsset.get("precision"));
        let totalPrecision = utils.get_asset_precision(this.props.baseAsset.get("precision"));
        return ((amount * amountPrecision / price.base.amount) * price.quote.amount) / totalPrecision;
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

    _orderbookClick(base, quote, type, order) {
        let precision = utils.get_asset_precision(quote.get("precision") + base.get("precision"));

        if (type === "bid") {
            let value = order.totalAmount.toString();
            if (value.indexOf(".") !== value.length -1) {
                value = this._limitByPrecision(order.totalAmount, quote);
            }


            let displaySellPrice = this._getDisplayPrice("ask", order.sell_price);

            let total = this.getSellTotal(order.sell_price, value);

            this.setState({
                displaySellPrice: displaySellPrice,
                sellPrice: order.sell_price,
                sellAmount: value,
                sellTotal: this._limitByPrecision(total, base)
            });

        } else if (type === "ask") {
            let value = order.totalAmount.toString();
            if (value.indexOf(".") !== value.length -1) {
                value = this._limitByPrecision(order.totalAmount, base);
            }

            let displayBuyPrice = this._getDisplayPrice("bid", order.sell_price);

            let total = this.getBuyTotal(order.sell_price, value);

            this.setState({
                displayBuyPrice: displayBuyPrice,
                buyPrice: order.sell_price,
                buyAmount: value,
                buyTotal: this._limitByPrecision(total, base)
            });
        }
    }

    _borrowQuote() {
        this.refs.borrowQuote.show();
    }

    _borrowBase() {
        this.refs.borrowBase.show();
    }

    _getBuyPrice(price) {
        let ratio = market_utils.priceToObject(price, "bid");
        let {baseAsset, quoteAsset} = this.props;
        let quotePrecision = utils.get_asset_precision(quoteAsset.get("precision"));
        let basePrecision = utils.get_asset_precision(baseAsset.get("precision"));

        return {
            base: {
                 asset_id: baseAsset.get("id"),
                 amount: ratio.base * quotePrecision
            },
            quote: {
                asset_id: quoteAsset.get("id"),
                amount: ratio.quote * basePrecision
            }
        };
    }

    _getDisplayPrice(type, priceObject) {
        let {quoteAsset, baseAsset} = this.props;
        let precision =  Math.min(8, quoteAsset.get("precision") + baseAsset.get("precision"));
        let price;

        switch (type) {
            case "bid":
                price = utils.get_asset_price(priceObject.quote.amount, baseAsset, priceObject.base.amount, quoteAsset);
                price = this._limitByPrecision(this._addZero(price), {precision}, false);
                return isNaN(price) ? 0 : price;

            case "ask":
                price = utils.get_asset_price(priceObject.base.amount, baseAsset, priceObject.quote.amount, quoteAsset);
                price = this._limitByPrecision(this._addZero(price), {precision}, false);
                return isNaN(price) ? 0 : price;

            default:
                break;
        }

        return price;
    }

    _getSellPrice(price) {
        let ratio = market_utils.priceToObject(price, "ask");
        let {baseAsset, quoteAsset} = this.props;
        let quotePrecision = utils.get_asset_precision(quoteAsset.get("precision"));
        let basePrecision = utils.get_asset_precision(baseAsset.get("precision"));

        return {
            base: {
                 asset_id: this.props.quoteAsset.get("id"),
                 amount: ratio.base * basePrecision
            },
            quote: {
                asset_id: this.props.baseAsset.get("id"),
                amount: ratio.quote * quotePrecision
            }
        };
    }

    _parseMarket() {
        let {bids, asks, calls, invertedCalls} = this.props;
        let combinedAsks, combinedBids, highestBid, lowestAsk;

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

        return {
            spread,
            combinedAsks,
            combinedBids,
            highestBid,
            lowestAsk
        };

    }

    render() {
        let { currentAccount, linkedAccounts, limit_orders, call_orders, totalCalls, activeMarketHistory,
            totalBids, flat_asks, flat_bids, flat_calls, invertedCalls, bids, asks, starredMarkets,
            calls, quoteAsset, baseAsset, transaction, broadcast, lowestCallPrice, buckets, marketStats, marketReady } = this.props;
        let {buyAmount, buyPrice, buyTotal, sellAmount, sellPrice, sellTotal, leftOrderBook,
            displayBuyPrice, displaySellPrice, buyDiff, sellDiff} = this.state;
        let base = null, quote = null, accountBalance = null, quoteBalance = null, baseBalance = null,
            quoteSymbol, baseSymbol, settlementPrice = null, squeezePrice = null, settlementQuote, settlementBase,
            flipped = false, showCallLimit = false, latestPrice, changeClass;

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

        let {combinedAsks, combinedBids, spread, lowestAsk, highestBid} = this._parseMarket();


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

            isAsk = false;
            if (second_latest) {
                if (second_latest.pays.asset_id === base.get("id")) {
                    paysAsset = base;
                    receivesAsset = quote;
                    isAsk = true;
                } else {
                    paysAsset = quote;
                    receivesAsset = base;
                }

                let oldPrice = market_utils.parse_order_history(second_latest, paysAsset, receivesAsset, isAsk, flipped);
                changeClass = latestPrice.full === oldPrice.full ? "" : latestPrice.full - oldPrice.full > 0 ? "change-up" : "change-down";
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
            return <div className={cnames("label bucket-option", {" ": this.props.bucketSize !== bucket, "active-bucket": this.props.bucketSize === bucket})} onClick={this._changeBucketSize.bind(this, bucket)}>{bucketTexts[bucket]}</div>
        }).reverse();


        // Market stats
        let dayChange = marketStats.get("change");

        let dayChangeClass = parseInt(dayChange, 10) === 0 ? "" : parseInt(dayChange, 10) < 0 ? "negative" : "positive";
        let dayChangeArrow = dayChangeClass === "" ? "" : dayChangeClass === "positive" ? "change-up" : "change-down";
        let volumeBase = marketStats.get("volumeBase");
        let volumeQuote = marketStats.get("volumeQuote");

        // Favorite star
        let marketID = `${quoteSymbol}_${baseSymbol}`;
        let starClass = starredMarkets.has(marketID) ? "gold-star" : "grey-star";

        return (
                <div className="grid-block page-layout market-layout">
                    <AccountNotifications/>
                    {!marketReady ? <LoadingIndicator /> : null}
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
                    <div className={cnames("grid-block main-content vertical ps-container", leftOrderBook ? "small-8 medium-9 large-7 " : "small-12 large-9 ")} >

                        {/* Top bar with info */}
                        <div className="grid-block no-padding shrink overflow-visible" style={{minHeight: "67px"}}>
                            <div className="grid-block overflow-visible vertical medium-horizontal">
                                <div className="grid-block shrink">
                                    <span style={{paddingRight: 0}} onClick={this._addMarket.bind(this, quoteAsset.get("symbol"), baseAsset.get("symbol"))} className="market-symbol"><Icon className={starClass} name="fi-star"/></span><Link className="market-symbol" to="exchange" params={{marketID: `${baseSymbol}_${quoteSymbol}`}}><span>{`${quoteSymbol} : ${baseSymbol}`}</span></Link>
                                </div>
                                    <div className="grid-block">
                                    <ul className="market-stats stats">
                                        {settlementPrice ? <PriceStat ready={marketReady} price={settlementPrice} quote={quote} base={base} content="exchange.settle"/> : null}
                                        {lowestCallPrice && showCallLimit ?
                                            (<li className="stat">
                                                <span>
                                                    <Translate component="span" content="explorer.block.call_limit" />
                                                    <br/>
                                                    <b className="value" style={{color: "#BBBF2B"}}>{utils.format_number(lowestCallPrice, base.get("precision"))}</b>
                                                    <br/>
                                                    <em>{baseSymbol}/{quoteSymbol}</em>
                                                </span>
                                            </li>) : null}
                                        {squeezePrice && showCallLimit ?
                                            (<li className="stat">
                                                <span>
                                                    <Translate component="span" content="exchange.squeeze" />
                                                    <br/>
                                                    <b className="value" style={{color: "#BBBF2B"}}>{utils.format_number(squeezePrice, base.get("precision"))}</b>
                                                    <br/>
                                                    <em>{baseSymbol}/{quoteSymbol}</em>
                                                </span>
                                            </li>) : null}
                                        {latestPrice ?
                                            <li className="stat">
                                                <span>
                                                    <Translate component="span" content="exchange.latest" />
                                                    <br/>
                                                    <b className={"value"}>{utils.format_number(!marketReady ? 0 : latestPrice.full, Math.max(5, base ? base.get("precision") : 0))}<span className={changeClass}>&nbsp;{changeClass === "change-up" ? <span>&#8593;</span> : <span>&#8595;</span>}</span></b>
                                                    <br/>
                                                    <em>{baseSymbol}/{quoteSymbol}</em>
                                                </span>
                                            </li> : null}

                                        {volumeBase >= 0 ? <PriceStat ready={marketReady} decimals={0} volume={true} price={volumeBase} base={base} content="exchange.volume_24"/> : null}

                                        {volumeQuote >= 0 ? <PriceStat ready={marketReady} decimals={0} volume={true} price={volumeQuote} base={quote} content="exchange.volume_24"/> : null}

                                        <li className="stat">
                                            <span>
                                                <Translate component="span" content="account.hour_24" />
                                                <br/>
                                                <b className={"value " + dayChangeClass}>{marketReady ? dayChange : 0}<span className={dayChangeArrow}>&nbsp;{dayChangeArrow === "" ? null : dayChangeArrow === "change-up" ? <span>&#8593;</span> : <span>&#8595;</span>}</span></b>
                                                <br/>
                                                <em>%</em>
                                            </span>
                                        </li>

                                    </ul>

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
                                        height={425}
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
                                    className={cnames("small-12 medium-5 no-padding", this.state.flipBuySell ? "order-3 sell-form" : "order-1 buy-form")}
                                    type="buy"
                                    amount={buyAmount}
                                    price={displayBuyPrice}
                                    total={buyTotal}
                                    quote={quote}
                                    base={base}
                                    amountChange={this._buyAmountChanged.bind(this, base, quote)}
                                    priceChange={this._buyPriceChanged.bind(this, base, quote)}
                                    totalChange={this._buyTotalChanged.bind(this, base, quote)}
                                    balance={baseBalance}
                                    onSubmit={this._createLimitOrderConfirm.bind(this, quote, base, buyAmount, buyTotal, baseBalance / utils.get_asset_precision(base.get("precision")), "buy")}
                                    balancePrecision={base.get("precision")}
                                    quotePrecision={quote.get("precision")}
                                    totalPrecision={base.get("precision")}
                                    currentPrice={lowestAsk}
                                    account={currentAccount.get("name")}
                                /> : null}
                                <ConfirmOrderModal
                                    type="buy"
                                    ref="buy"
                                    onForce={this._forceBuy.bind(this, quote, base, buyAmount, buyTotal)}
                                    diff={buyDiff}
                                />

                                <div onClick={this._flipBuySell.bind(this)} className="grid-block vertical align-center text-center no-padding shrink order-2" style={{cursor: "pointer"}}>
                                    <span style={{fontSize: "2rem"}}>&#8646;</span>
                                </div>
                                {quote && base ?
                                <BuySell
                                    className={cnames("small-12 medium-5 no-padding", this.state.flipBuySell ? "order-1 buy-form" : "order-3 sell-form")}
                                    type="sell"
                                    amount={sellAmount}
                                    price={displaySellPrice}
                                    total={sellTotal}
                                    quote={quote}
                                    base={base}
                                    amountChange={this._sellAmountChanged.bind(this, base, quote)}
                                    priceChange={this._sellPriceChanged.bind(this, base, quote)}
                                    totalChange={this._sellTotalChanged.bind(this, base, quote)}
                                    balance={quoteBalance}
                                    onSubmit={this._createLimitOrderConfirm.bind(this, base, quote, sellTotal, sellAmount, quoteBalance / utils.get_asset_precision(quote.get("precision")), "sell")}
                                    balancePrecision={quote.get("precision")}
                                    quotePrecision={quote.get("precision")}
                                    totalPrecision={base.get("precision")}
                                    currentPrice={highestBid}
                                    account={currentAccount.get("name")}
                                    ref="sell"
                                /> : null}
                                <ConfirmOrderModal
                                    type="sell"
                                    ref="sell"
                                    onForce={this._forceSell.bind(this, base, quote, sellTotal, sellAmount)}
                                    diff={sellDiff}
                                />
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
                    <div className="grid-block show-for-large large-3 right-column no-overflow vertical" style={{paddingTop: 0, paddingRight: "0.5rem"}}>
                        {/* Market History */}
                        <div className="grid-block no-padding no-margin vertical"  style={{flex: "1 1 50vh"}}>
                            <MarketHistory
                                className="left-order-book no-padding no-overflow"
                                headerStyle={{paddingTop: 0}}
                                history={activeMarketHistory}
                                myHistory={currentAccount.get("history")}
                                base={base}
                                quote={quote}
                                baseSymbol={baseSymbol}
                                quoteSymbol={quoteSymbol}
                            />
                        </div>
                        <div className="grid-block no-padding no-margin vertical" style={{flex: "0 1 50vh"}}>
                            <MyMarkets
                                className="left-order-book no-padding no-overflow"
                                headerStyle={{paddingTop: 0}}
                                columns={
                                    [
                                        {name: "star", index: 1},
                                        {name: "market", index: 2},
                                        {name: "vol", index: 3},
                                        {name: "price", index: 4},
                                        {name: "change", index: 5}
                                    ]
                                }
                            />
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
