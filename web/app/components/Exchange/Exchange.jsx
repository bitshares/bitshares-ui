import React from "react";
import ReactDOM from "react-dom";
import {PropTypes} from "react";
import MarketsActions from "actions/MarketsActions";
import {MyOpenOrders} from "./MyOpenOrders";
import OrderBook from "./OrderBook";
import MarketHistory from "./MarketHistory";
import MyMarkets from "./MyMarkets";
import BuySell from "./BuySell";
import utils from "common/utils";
import assetUtils from "common/asset_utils";
import PriceChart from "./PriceChart";
import DepthHighChart from "./DepthHighChart";
import {debounce} from "lodash";
import {cloneDeep} from "lodash";
import BorrowModal from "../Modal/BorrowModal";
import Translate from "react-translate-component";
import notify from "actions/NotificationActions";
import {Link} from "react-router";
import AccountNotifications from "../Notifier/NotifierContainer";
import Ps from "perfect-scrollbar";
import ChainTypes from "../Utility/ChainTypes";
import {ChainStore, EmitterInstance} from "graphenejs-lib";
import BindToChainState from "../Utility/BindToChainState";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountActions from "actions/AccountActions";
import SettingsActions from "actions/SettingsActions";
import ActionSheet from "react-foundation-apps/src/action-sheet";
import Icon from "../Icon/Icon";
import cnames from "classnames";
import market_utils from "common/market_utils";
import LoadingIndicator from "../LoadingIndicator";
import ConfirmOrderModal from "./ConfirmOrderModal";
import IndicatorModal from "./IndicatorModal";
import OpenSettleOrders from "./OpenSettleOrders";
import counterpart from "counterpart";
import AssetName from "../Utility/AssetName";
import Highcharts from "highcharts/highstock";

require("./exchange.scss");

let emitter = EmitterInstance.emitter();
let callListener, limitListener, newCallListener, feedUpdateListener, settleOrderListener;
let SATOSHI = 8;

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

        let value = !volume ? utils.price_text(price, quote, base) :
            utils.format_volume(price);

        return (
            <li className={cnames("stat", this.props.className)}>
                <span>
                    <Translate component="span" content={content} />
                    <b className={"value stat-primary"}>
                        {!ready ? 0 : value}
                        {!change ? null : change !== null ? <span className={changeClass}>&nbsp;{changeClass === "change-up" ? <span>&#8593;</span> : <span>&#8595;</span>}</span> : null}
                    </b>
                    <span><AssetName name={base.get("symbol")} />{quote ? <span>/<AssetName name={quote.get("symbol")} /></span> : null}</span>
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

        this._getWindowSize = debounce(this._getWindowSize.bind(this), 150);
    }


    _initialState(props) {
        let ws = props.viewSettings;

        return {
            history: [],
            buySellOpen: ws.get("buySellOpen", true),
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
            flipBuySell: ws.get("flipBuySell", false),
            favorite: false,
            showDepthChart: ws.get("showDepthChart", false),
            leftOrderBook: ws.get("leftOrderBook", false),
            buyDiff: false,
            sellDiff: false,
            indicators: ws.get("indicators", {
                rsi: false,
                sma: true,
                atr: false,
                ema: true
            }),
            buyFeeAssetIdx: ws.get("buyFeeAssetIdx", 0) ,
            sellFeeAssetIdx: ws.get("sellFeeAssetIdx", 0),
            indicatorSettings: ws.get("indicatorSettings") || {
                rsi: {
                    period: 14,
                    overbought: 70,
                    oversold: 30
                },
                sma: {
                    period: 5
                },
                atr: {
                    period: 14
                },
                ema: {
                    period: 10,
                    index: 0
                }
            },
            height: window.innerHeight,
            width: window.innerWidth,
            chartHeight: ws.get("chartHeight", 425),
            currentPeriod: ws.get("currentPeriod", 3600 * 24 * 7)
        };
    }

    static propTypes = {
        currentAccount: ChainTypes.ChainAccount.isRequired,
        quoteAsset: ChainTypes.ChainAsset.isRequired,
        baseAsset: ChainTypes.ChainAsset.isRequired,
        limit_orders: PropTypes.object.isRequired,
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
    };

    static defaultProps = {
        currentAccount: "1.2.3",
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
    };

    componentWillMount() {
        if (this.props.quoteAsset.toJS && this.props.baseAsset.toJS) {
            this._subToMarket(this.props);
            // this._addMarket(this.props.quoteAsset.get("symbol"), this.props.baseAsset.get("symbol"));
        }

        emitter.on('cancel-order', limitListener = MarketsActions.cancelLimitOrderSuccess);
        emitter.on('close-call', callListener = MarketsActions.closeCallOrderSuccess);
        emitter.on('call-order-update', newCallListener = MarketsActions.callOrderUpdate);
        emitter.on('bitasset-update', feedUpdateListener = MarketsActions.feedUpdate);
        emitter.on('settle-order-update', settleOrderListener = (object) => {
            let {isMarketAsset, marketAsset} = market_utils.isMarketAsset(this.props.quoteAsset, this.props.baseAsset);
            console.log("settle-order-update:", object, "isMarketAsset:", isMarketAsset, "marketAsset:", marketAsset);

            if (isMarketAsset && marketAsset.id === object.balance.asset_id) {
                MarketsActions.settleOrderUpdate(marketAsset.id);
            }
        });

        window.addEventListener("resize", this._getWindowSize, false);
    }

    componentDidMount() {
        let centerContainer = ReactDOM.findDOMNode(this.refs.center);
        if (centerContainer) {
            Ps.initialize(centerContainer);
        }
        SettingsActions.changeViewSetting({
            lastMarket: this.props.quoteAsset.get("symbol") + "_" + this.props.baseAsset.get("symbol")
        });

    }


    _getWindowSize() {
        let {innerHeight, innerWidth} = window;
        if (innerHeight !== this.state.height || innerWidth !== this.state.width) {
            this.setState({
                height: innerHeight,
                width: innerWidth
            });
        }
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
        if (nextProps.baseAsset && nextProps.baseAsset.getIn(["bitasset", "is_prediction_market"])) {
            // console.log("this.props:", this.props);
            this.props.history.push(`market/${nextProps.baseAsset.get("symbol")}_${nextProps.quoteAsset.get("symbol")}`)
        }

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

        if (this.state.sub && nextProps.bucketSize !== this.props.bucketSize) {
            return this._changeBucketSize(nextProps.bucketSize);
        }
    }

    componentWillUnmount() {
        let {quoteAsset, baseAsset} = this.props;
        MarketsActions.unSubscribeMarket(quoteAsset.get("id"), baseAsset.get("id"));
        if (emitter) {
            emitter.off('cancel-order', limitListener);
            emitter.off('close-call', callListener);
            emitter.off('call-order-update', newCallListener);
            emitter.off('bitasset-update', feedUpdateListener);
    }
        window.removeEventListener("resize", this._getWindowSize, false);

    }

    _createPredictionShort(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount, feeID) {
        console.log("createPredictionShort:", buyAssetAmount, sellAssetAmount);
        let coreAsset = ChainStore.getAsset("1.3.0");
        let expiration = new Date();
        // TODO: Add selector for expiry
        expiration.setYear(expiration.getFullYear() + 5);
        MarketsActions.createPredictionShort(
            this.props.currentAccount.get("id"),
            utils.get_satoshi_amount(sellAssetAmount, sellAsset),
            sellAsset,
            utils.get_satoshi_amount(buyAssetAmount, buyAsset),
            utils.get_satoshi_amount(sellAssetAmount, coreAsset),
            buyAsset,
            expiration,
            false, // fill or kill TODO: add fill or kill switch
            feeID
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

    _getFee(asset) {
        let fee = utils.estimateFee("limit_order_create", [], ChainStore.getObject("2.0.0")) || 0;

        if (!asset || asset.get("id") === "1.3.0") return fee;
        let cer = asset.getIn(["options", "core_exchange_rate"]).toJS();
        let coreAsset = ChainStore.getAsset("1.3.0");
        if (!coreAsset) return 0;
        let price = utils.convertPrice(coreAsset, cer, null, asset.get("id"));

        let eqValue = utils.convertValue(price, fee, coreAsset, asset);

        return Math.floor(eqValue + 0.5);
    }

    _verifyFee(fee, feeAsset, sellAsset, sellAmount, sellBalance, coreBalance) {
        let coreFee = this._getFee();

        let sellPrecision = utils.get_asset_precision(sellAsset);
        let sellSum = fee + parseInt(sellAmount * sellPrecision, 10);
        if (feeAsset.get("id") === "1.3.0") {
            if (coreFee <= coreBalance) {
                return "1.3.0";
            } else {
                return null;
            }
        } else {
            if (sellSum <= sellBalance) { // Sufficient balance in asset to pay fee
                return feeAsset.get("id");
            } else if (coreFee <= coreBalance && feeAsset.get("id") !== "1.3.0") { // Sufficient balance in core asset to pay fee
                return "1.3.0";
            } else {
                return null; // Unable to pay fee in either asset
            }
        }
    }

    _createLimitOrderConfirm(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount, sellBalance, coreBalance, feeAsset, type, short = true, e) {
        e.preventDefault();

        sellBalance = sellBalance ? parseInt(ChainStore.getObject(sellBalance).toJS().balance, 10) : 0;
        coreBalance = coreBalance ? parseInt(ChainStore.getObject(coreBalance).toJS().balance, 10) : 0;
        let sellPrecision = utils.get_asset_precision(sellAsset);
        let buyPrecision = utils.get_asset_precision(buyAsset);

        // Convert fee to relevant asset fee and check if user has sufficient balance
        let feeAmount;
        // if (sellAsset.get("id") !== "1.3.0") {
        //     feeAmount = this._getFee(sellAsset);
        // } else {
        feeAmount = this._getFee(feeAsset);
        // }

        let feeID = this._verifyFee(feeAmount, feeAsset, sellAsset, sellAssetAmount, sellBalance, coreBalance);

        if (!feeID) {
            return notify.addNotification({
                message: "Insufficient funds to pay fees",
                level: "error"
            });
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

        let isPredictionMarket = sellAsset.getIn(["bitasset", "is_prediction_market"]);

        if ((sellAssetAmount * sellPrecision) > sellBalance && !isPredictionMarket) {
            return notify.addNotification({
                message: "Insufficient funds to place order. Required: " + sellAssetAmount + " " + sellAsset.get("symbol"),
                level: "error"
            });
        }

        if (!(sellAssetAmount > 0 && buyAssetAmount > 0)) {
            return notify.addNotification({
                message: "Please enter a valid amount and price",
                level: "error"
            });
        }

        if (type === "sell" && isPredictionMarket && short) {
            return this._createPredictionShort(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount, feeID);
        }
        this._createLimitOrder(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount, feeID);
    }

    _createLimitOrder(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount, feeID) {
        console.log("createLimitOrder:", buyAssetAmount, sellAssetAmount);
        let expiration = new Date();
        // TODO: Add selector for expiry
        expiration.setYear(expiration.getFullYear() + 5);
        MarketsActions.createLimitOrder(
            this.props.currentAccount.get("id"),
            utils.get_satoshi_amount(sellAssetAmount, sellAsset),
            sellAsset,
            utils.get_satoshi_amount(buyAssetAmount, buyAsset),
            buyAsset,
            expiration,
            false, // fill or kill TODO: add fill or kill switch
            feeID
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

    _forceBuy(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount, value, sellBalance, coreBalance) {
        // Convert fee to relevant asset fee and check if user has sufficient balance
        let feeAmount;
        if (sellAsset.get("id") !== "1.3.0") {
            feeAmount = this._getFee(sellAsset);
        } else {
            feeAmount = this._getFee();
        }

        let feeID = this._verifyFee(feeAmount, sellAsset, sellAssetAmount, sellBalance, coreBalance);

        if (value && feeID) {
            this._createLimitOrder(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount, feeID)
        }
    }

    _forceSell(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount, value, sellBalance, coreBalance) {
        let feeAmount;
        if (sellAsset.get("id") !== "1.3.0") {
            feeAmount = this._getFee(sellAsset);
        } else {
            feeAmount = this._getFee();
        }

        let feeID = this._verifyFee(feeAmount, sellAsset, sellAssetAmount, sellBalance, coreBalance);

        if (value && feeID) {
            this._createLimitOrder(buyAsset, sellAsset, buyAssetAmount, sellAssetAmount, feeID)
        }
    }

    _cancelLimitOrder(orderID, e) {
        e.preventDefault();
        let {currentAccount} = this.props;
        MarketsActions.cancelLimitOrder(
            currentAccount.get("id"),
            orderID // order id to cancel
        );
    }

    _changeBucketSize(size, e) {
        if (e) e.preventDefault();
        if (size !== this.props.bucketSize) {
            MarketsActions.changeBucketSize.defer(size);
            let currentSub = this.state.sub.split("_");
            MarketsActions.unSubscribeMarket.defer(currentSub[0], currentSub[1]);
            this._subToMarket(this.props, size);
        }
    }

    _changeZoomPeriod(size, e) {
        e.preventDefault();
        if (size !== this.state.currentPeriod) {
            this.setState({
                currentPeriod: size
            });
            SettingsActions.changeViewSetting({
                currentPeriod: size
            });
        }
    }

    _subToMarket(props, newBucketSize) {
        let {quoteAsset, baseAsset, bucketSize} = props;
        if (newBucketSize) {
            bucketSize = newBucketSize;
        }
        if (quoteAsset.get("id") && baseAsset.get("id")) {
            MarketsActions.subscribeMarket.defer(baseAsset, quoteAsset, bucketSize);
            this.setState({sub: `${quoteAsset.get("id")}_${baseAsset.get("id")}`});
        }
    }

    _depthChartClick(base, quote, power, e) {
        e.preventDefault();
        let value = market_utils.limitByPrecision(e.xAxis[0].value / power, quote);
        let buyPrice = this._getBuyPrice(e.xAxis[0].value / power);
        let sellPrice = this._getSellPrice(e.xAxis[0].value / power);
        let displayBuyPrice = this._getDisplayPrice("bid", buyPrice);
        let displaySellPrice = this._getDisplayPrice("ask", sellPrice);

        this.setState({
            depthLine: value,
            buyPrice: buyPrice,
            displayBuyPrice: displayBuyPrice,
            buyTotal: market_utils.limitByPrecision(this.getBuyTotal(buyPrice, this.state.buyAmount), base),
            sellPrice: sellPrice,
            displaySellPrice: displaySellPrice,
            sellTotal: market_utils.limitByPrecision(this.getSellTotal(sellPrice, this.state.sellAmount), base)
        });
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

    _

    _buyPriceChanged(base, quote, e) {

        let split = e.target.value.split(".");
        if (split.length === 2 && split[1].length === SATOSHI + 1) {
            return;
        }

        let amount = market_utils.limitByPrecision(e.target.value, {precision: SATOSHI});
        let price = this._getBuyPrice(amount);

        this.setState({
            buyPrice: price,
            displayBuyPrice: amount,
            buyTotal: market_utils.limitByPrecision(this.getBuyTotal(price, this.state.buyAmount), base),
            depthLine: amount
        });
    }

    _sellPriceChanged(base, quote, e) {
        let split = e.target.value.split(".");
        if (split.length === 2 && split[1].length === SATOSHI + 1) {
            return;
        }
        let amount = market_utils.limitByPrecision(e.target.value, {precision: SATOSHI});
        let price = this._getSellPrice(amount);

        this.setState({
            sellPrice: price,
            displaySellPrice: amount,
            sellTotal: market_utils.limitByPrecision(this.getSellTotal(price, this.state.sellAmount), base),
            depthLine: amount
        });
    }

    _buyAmountChanged(base, quote, e) {
        let value = e.target.value;
        if (e.target.value.indexOf(".") !== e.target.value.length -1) {
            value = market_utils.limitByPrecision(e.target.value, quote);
        }

        this.setState({
            buyAmount: this._addZero(value),
            buyTotal: market_utils.limitByPrecision(this.getBuyTotal(this.state.buyPrice, value), base)
        });
    }

    _buyTotalChanged(base, quote, e) {
        let value = e.target.value;
        if (e.target.value.indexOf(".") !== e.target.value.length -1) {
            value = market_utils.limitByPrecision(e.target.value, base);
        }


        let amount = this.getBuyAmount(this.state.buyPrice, value);

        this.setState({
            buyAmount: market_utils.limitByPrecision(amount, quote),
            buyTotal: this._addZero(value)
        });
    }

    _sellAmountChanged(base, quote, e) {
        let value = e.target.value;
        if (e.target.value.indexOf(".") !== e.target.value.length -1) {
            value = market_utils.limitByPrecision(e.target.value, quote);
        }
        this.setState({
            sellAmount: this._addZero(value),
            sellTotal: market_utils.limitByPrecision(this.getSellTotal(this.state.sellPrice, value), base)
        });
    }

    _sellTotalChanged(base, quote, e) {
        let value = e.target.value;
        if (e.target.value.indexOf(".") !== e.target.value.length -1) {
            value = market_utils.limitByPrecision(e.target.value, base);
        }

        this.setState({
            sellAmount: market_utils.limitByPrecision(this.getSellAmount(this.state.sellPrice, value), quote),
            sellTotal: this._addZero(value)
        });
    }

    _flipBuySell() {
        SettingsActions.changeViewSetting({
            flipBuySell: !this.state.flipBuySell
        });

        this.setState({flipBuySell: !this.state.flipBuySell});
    }

    _toggleOpenBuySell() {
        SettingsActions.changeViewSetting({
            buySellOpen: !this.state.buySellOpen
        });

        this.setState({buySellOpen: !this.state.buySellOpen});
    }

    getSellAmount(price, total = 0, satAmount) {
        let amountPrecision = utils.get_asset_precision(this.props.quoteAsset.get("precision"));
        if (!satAmount) {
            satAmount = utils.get_satoshi_amount(total, this.props.baseAsset);
        }
        return ((satAmount / price.base.amount) * price.quote.amount) / amountPrecision;
    }

    getSellTotal(price, amount = 0) {
        let totalPrecision = utils.get_asset_precision(this.props.baseAsset.get("precision"));
        let satAmount = utils.get_satoshi_amount(amount, this.props.quoteAsset);
        return ((satAmount / price.quote.amount) * price.base.amount) / totalPrecision;
    }

    getBuyAmount(price, total = 0, satAmount) {
        let amountPrecision = utils.get_asset_precision(this.props.quoteAsset.get("precision"));
        if (!satAmount) {
            satAmount = utils.get_satoshi_amount(total, this.props.baseAsset);
        }

        return ((satAmount / price.quote.amount) * price.base.amount) / amountPrecision;
    }

    getBuyTotal(price, amount = 0, satAmount) {
        let totalPrecision = utils.get_asset_precision(this.props.baseAsset.get("precision"));
        if (!satAmount) {
            satAmount = utils.get_satoshi_amount(amount, this.props.quoteAsset);
        }

        return (Math.floor(0.5 + (satAmount / price.base.amount) * price.quote.amount)) / totalPrecision;
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

    _currentPriceClick(base, quote, type, price) {
        if (type === "bid") {
            let displayBuyPrice = this._getDisplayPrice("bid", price);
            let {buyTotal, buyAmount} = this.state;

            if (buyAmount) {
                buyTotal = market_utils.limitByPrecision(this.getBuyTotal(price, this.state.buyAmount), base);
            } else if (buyTotal) {
                buyAmount = market_utils.limitByPrecision(this.getBuyAmount(price, buyTotal), quote);
            }

            this.setState({
                buyPrice: price,
                displayBuyPrice,
                buyTotal,
                buyAmount,
                depthLine: displayBuyPrice
            })
        } else if (type === "ask") {
            let displaySellPrice = this._getDisplayPrice("ask", price);
            let {sellTotal, sellAmount} = this.state;

            if (sellAmount) {
                sellTotal = market_utils.limitByPrecision(this.getSellTotal(price, this.state.sellAmount), base);
            } else if (sellTotal) {
                sellAmount = market_utils.limitByPrecision(this.getSellAmount(price, sellTotal), quote);
            }
            this.setState({
                sellPrice: price,
                displaySellPrice,
                sellTotal,
                sellAmount,
                depthLine: displaySellPrice
            })

        }
    }

    _orderbookClick(base, quote, type, order) {
        let precision = utils.get_asset_precision(quote.get("precision") + base.get("precision"));

        let value = order.amount.toString();
        if (value.indexOf(".") !== value.length - 1) {
            value = market_utils.limitByPrecision(order.amount, quote);
        }
        console.log("type:", type, "order:", order);
        if (type === "bid") {

            let displaySellPrice = this._getDisplayPrice("ask", order.sell_price);
            // let sellAmount = market_utils.limitByPrecision(this.getSellAmount(order.sell_price, null, order.totalForSale), quote);

            let sellAmount = order.totalAmount;

            let sellTotal = this.getSellTotal(order.sell_price, sellAmount);
        
            this.setState({
                displaySellPrice: displaySellPrice,
                sellPrice: order.sell_price,
                sellAmount: utils.get_asset_amount(sellAmount, quote),
                sellTotal: utils.get_asset_amount(sellTotal, base),
                displayBuyPrice: displaySellPrice,
                buyPrice: {
                    quote: order.sell_price.base,
                    base: order.sell_price.quote
                },
                buyAmount: 1,
                buyTotal: null
            });

        } else if (type === "ask") {

            let displayBuyPrice = this._getDisplayPrice("bid", order.sell_price);
            // Calculate total
            // let total = this.getBuyTotal(order.sell_price, null, order.totalForSale);
            let buyAmount = market_utils.limitByPrecision(this.getBuyAmount(order.sell_price, null, order.totalValue), quote);

            this.setState({
                displayBuyPrice: displayBuyPrice,
                buyPrice: order.sell_price,
                buyAmount: buyAmount,
                buyTotal: market_utils.limitByPrecision(utils.get_asset_amount(order.totalValue, base), base),
                displaySellPrice: displayBuyPrice,
                sellPrice: {
                    quote: order.sell_price.base,
                    base: order.sell_price.quote
                },
                sellAmount: 1,
                sellTotal: null
            });
        }
    }

    _borrowQuote() {
        this.refs.borrowQuote.show();
    }

    _borrowBase() {
        this.refs.borrowBase.show();
    }

    _onSelectIndicators() {
        this.refs.indicators.show();
    }

    _getBuyPrice(price) {
        let nominator = utils.get_satoshi_amount(price, this.props.baseAsset)
        let denominator = utils.get_satoshi_amount(1, this.props.quoteAsset);

        let integerRatio = market_utils.priceToObject(price, "ask");
        let {baseAsset, quoteAsset} = this.props;
        let quotePrecision = utils.get_asset_precision(quoteAsset.get("precision"));
        let basePrecision = utils.get_asset_precision(baseAsset.get("precision"));

        return {
            quote: {
                 asset_id: baseAsset.get("id"),
                 amount: integerRatio.base * basePrecision
            },
            base: {
                asset_id: quoteAsset.get("id"),
                amount: integerRatio.quote * quotePrecision
            }
        };
    }

    _getDisplayPrice(type, priceObject) {
        let {quoteAsset, baseAsset} = this.props;
        let price;

        switch (type) {
            case "bid":
                price = utils.get_asset_price(priceObject.quote.amount, baseAsset, priceObject.base.amount, quoteAsset);
                price = market_utils.limitByPrecision(this._addZero(price), {precision: SATOSHI}, false);
                return isNaN(price) ? 0 : price;

            case "ask":
                price = utils.get_asset_price(priceObject.base.amount, baseAsset, priceObject.quote.amount, quoteAsset);
                price = market_utils.limitByPrecision(this._addZero(price), {precision: SATOSHI}, false);
                return isNaN(price) ? 0 : price;

            default:
                break;
        }

        return price;
    }

    _getSellPrice(price) {
        let nominator = utils.get_satoshi_amount(price, this.props.baseAsset)
        let denominator = utils.get_satoshi_amount(1, this.props.quoteAsset);

        let integerRatio = market_utils.priceToObject(price, "bid");
        let {baseAsset, quoteAsset} = this.props;

        let quotePrecision = utils.get_asset_precision(quoteAsset.get("precision"));
        let basePrecision = utils.get_asset_precision(baseAsset.get("precision"));

        return {
            quote: {
                 asset_id: baseAsset.get("id"),
                 amount: integerRatio.base * quotePrecision
            },
            base: {
                asset_id: quoteAsset.get("id"),
                amount: integerRatio.quote * basePrecision
            }
        };
    }

    _parseMarket() {
        let {bids, asks, calls, invertedCalls} = this.props;

        let {showCallLimit} = this._getSettlementInfo();
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
            combinedAsks[0] :
            combinedAsks.length > 1 ?
                combinedAsks.reduce((a, b) => {
                    if (!a) return b;
                    return a.price_full <= b.price_full ? a : b;
            }, null) : {price_full: 0};

        highestBid = combinedBids.length === 1 ?
        combinedBids[0] :
        combinedBids.length > 0 ? combinedBids.reduce((a, b) => {
            if (!a) return b;
            return a.price_full >= b.price_full ? a : b;
        }) : {price_full: 0};

        let spread = lowestAsk.price_full - highestBid.price_full;

        return {
            spread,
            combinedAsks,
            combinedBids,
            highestBid,
            lowestAsk
        };
    }

    _getSettlementInfo() {
        let {quoteAsset: quote, baseAsset: base, bids, asks, lowestCallPrice} = this.props;

        let settlement_price, core_rate, short_squeeze, flipped,
            settlementBase, settlementQuote, settlementPrice, highestBid,
            squeezePrice, lowestAsk, showCallLimit;

        let {isMarketAsset} = market_utils.isMarketAsset(quote, base);

        if (isMarketAsset && quote && base) {
            if (quote.get("bitasset") && quote.getIn(["bitasset", "current_feed"]) && base.get("id") === quote.getIn(["bitasset", "options", "short_backing_asset"])) {
                settlement_price = quote.getIn(["bitasset", "current_feed", "settlement_price"]);
                short_squeeze = quote.getIn(["bitasset", "current_feed", "maximum_short_squeeze_ratio"]) / 1000;

            } else if (base.get("bitasset") && base.getIn(["bitasset", "current_feed"]) && quote.get("id") === base.getIn(["bitasset", "options", "short_backing_asset"])) {
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

                settlementPrice = market_utils.getFeedPrice(settlement_price, flipped);

                if (flipped) {
                    highestBid = bids.reduce((total, bid) => {
                        if (!total) {
                            return bid.full;
                        } else {
                            return Math.max(total, bid.full);
                        }
                    }, null);
                    squeezePrice = settlementPrice / short_squeeze;
                    showCallLimit = lowestCallPrice > settlementPrice;
                } else {
                    lowestAsk = asks.reduce((total, ask) => {
                        if (!total) {
                            return ask.full;
                        } else {
                            return Math.min(total, ask.full);
                        }
                    }, null);

                    squeezePrice = settlementPrice * short_squeeze;
                    showCallLimit = lowestCallPrice < settlementPrice;
                }
            }
        }

        return {
            squeezePrice,
            settlementPrice,
            showCallLimit
        }
    }

    _changeIndicator(key) {
        let indicators = cloneDeep(this.state.indicators);
        indicators[key] = !indicators[key];
        this.setState({
            indicators: indicators
        });

        SettingsActions.changeViewSetting({
            indicators: indicators
        });
    }

    _changeIndicatorSetting(key, setting, e) {
        e.preventDefault();
        let indicatorSettings = cloneDeep(this.state.indicatorSettings);
        indicatorSettings[key][setting] = parseInt(e.target.value, 10);

        this.setState({
            indicatorSettings: indicatorSettings
        });

        SettingsActions.changeViewSetting({
            indicatorSettings: indicatorSettings
        });
    }

    onChangeFeeAsset(type, e) {
        e.preventDefault();
        if (type === "buy") {
            this.setState({
                buyFeeAssetIdx: e.target.value
            });

            SettingsActions.changeViewSetting({
                "buyFeeAssetIdx": e.target.value
            });
        } else {
            this.setState({
                sellFeeAssetIdx: e.target.value
            });

            SettingsActions.changeViewSetting({
                "sellFeeAssetIdx": e.target.value
            });
        }
    }

    onChangeChartHeight(increase) {
        let newHeight = this.state.chartHeight + (increase ? 20 : -20);

        this.setState({
            chartHeight: newHeight
        });

        SettingsActions.changeViewSetting({
            "chartHeight": newHeight
        });
    }

    _getFeeAssets(quote, base, coreAsset) {
        let {currentAccount} = this.props;

        function addMissingAsset(target, asset) {
            if (target.indexOf(asset) === -1) {
                target.push(asset);
            }
        }

        let sellFeeAssets = [coreAsset, quote === coreAsset ? base : quote];
        addMissingAsset(sellFeeAssets, quote);
        addMissingAsset(sellFeeAssets, base);
        let sellFeeAsset;

        let buyFeeAssets = [coreAsset, base === coreAsset ? quote : base];
        addMissingAsset(buyFeeAssets, quote);
        addMissingAsset(buyFeeAssets, base);
        let buyFeeAsset;

        let balances = {};

        currentAccount.get("balances").filter((balance, id) => {
            return (["1.3.0", quote.get("id"), base.get("id")].indexOf(id) >= 0);
        }).forEach((balance, id) => {
            let balanceObject = ChainStore.getObject(balance);
            balances[id] = {
                balance: balanceObject ? parseInt(balanceObject.get("balance"), 10) : 0,
                fee: this._getFee(ChainStore.getAsset(id))
            };
        });

        // Sell asset fee
        sellFeeAssets = sellFeeAssets.filter(a => {
            if (!balances[a.get("id")]) {return false;};
            return balances[a.get("id")].balance > balances[a.get("id")].fee;
        });

        if (!sellFeeAssets.length) {
            sellFeeAsset = coreAsset;
            sellFeeAssets.push(coreAsset);
        } else {
            sellFeeAsset = sellFeeAssets[Math.min(sellFeeAssets.length - 1, this.state.sellFeeAssetIdx)];
        }

        // Buy asset fee
        buyFeeAssets = buyFeeAssets.filter(a => {
            if (!balances[a.get("id")]) {return false;};
            return balances[a.get("id")].balance > balances[a.get("id")].fee;
        });

        if (!buyFeeAssets.length) {
            buyFeeAsset = coreAsset;
            buyFeeAssets.push(coreAsset);
        } else {
            buyFeeAsset = buyFeeAssets[Math.min(buyFeeAssets.length - 1, this.state.buyFeeAssetIdx)];
        }

        let sellFee = utils.round_number(utils.get_asset_amount(this._getFee(sellFeeAsset), sellFeeAsset), sellFeeAsset);
        let buyFee = utils.round_number(utils.get_asset_amount(this._getFee(buyFeeAsset), buyFeeAsset), buyFeeAsset);

        return {
            sellFeeAsset,
            sellFeeAssets,
            sellFee,
            buyFeeAsset,
            buyFeeAssets,
            buyFee
        };
    }

    render() {
        let { currentAccount, linkedAccounts, limit_orders, call_orders, totalCalls, activeMarketHistory,
            totalBids, flat_asks, flat_bids, flat_calls, invertedCalls, bids, asks, starredMarkets,
            calls, quoteAsset, baseAsset, transaction, broadcast, lowestCallPrice, buckets, marketStats,
            marketReady, settle_orders, bucketSize } = this.props;

        let {buyAmount, buyPrice, buyTotal, sellAmount, sellPrice, sellTotal, leftOrderBook,
            displayBuyPrice, displaySellPrice, buyDiff, sellDiff, indicators, indicatorSettings,
            width, height} = this.state;

        let base = null, quote = null, accountBalance = null, quoteBalance = null, baseBalance = null, coreBalance = null,
            quoteSymbol, baseSymbol, settlementPrice = null, squeezePrice = null,
            showCallLimit = false, latestPrice, changeClass;

        let isNullAccount = currentAccount.get("id") === "1.2.3";

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
                    if (id === "1.3.0") {
                        coreBalance = accountBalance[id];
                    }
                }
            }

            ({showCallLimit, settlementPrice, squeezePrice} = this._getSettlementInfo());
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

        let bucketText = function(size) {
            if (size === "all") {
                return counterpart.translate("exchange.zoom_all");
            } else if (size < 60) {
                return size + "s";
            } else if (size < 3600) {
                return (size / 60) + "m";
            } else if (size < 86400) {
                return (size / 3600) + "h"
            } else if (size < 604800) {
                return (size / 86400) + "d"
            } else if (size < 2592000) {
                return (size / 604800) + "w"
            } else {
                return (size / 2592000) + "m"
            }
        }

        let bucketOptions = buckets.filter(bucket => {
            return bucket > 60 * 4;
        }).map(bucket => {
            return <div key={bucket} className={cnames("label bucket-option", {"active-bucket": bucketSize === bucket})} onClick={this._changeBucketSize.bind(this, bucket)}>{bucketText(bucket)}</div>
        });

        let oneHour = 3600;
        let zoomPeriods = [oneHour * 6, oneHour * 48, oneHour * 48 * 2, oneHour * 24 * 7, oneHour * 24 * 14, oneHour * 24 * 30, "all"];

        let zoomOptions = zoomPeriods.map(period => {
            return <div key={period} className={cnames("label bucket-option", {"active-bucket": this.state.currentPeriod === period})} onClick={this._changeZoomPeriod.bind(this, period)}>{bucketText(period)}</div>
        }) ;

        // Market stats
        let dayChange = marketStats.get("change");

        let dayChangeClass = parseFloat(dayChange) === 0 ? "" : parseFloat(dayChange) < 0 ? "negative" : "positive";
        let dayChangeArrow = dayChangeClass === "" ? "" : dayChangeClass === "positive" ? "change-up" : "change-down";
        let volumeBase = marketStats.get("volumeBase");
        let volumeQuote = marketStats.get("volumeQuote");

        // Favorite star
        let marketID = `${quoteSymbol}_${baseSymbol}`;
        let starClass = starredMarkets.has(marketID) ? "gold-star" : "grey-star";

        // Fees
        let coreAsset = ChainStore.getAsset("1.3.0");
        if (!coreAsset) {
            return null;
        }

        let {sellFeeAsset, sellFeeAssets, sellFee,
            buyFeeAsset, buyFeeAssets, buyFee} = this._getFeeAssets(quote, base, coreAsset);

        // Decimals
        let priceDecimals = Math.max(5, base ? base.get("precision") : 0);

        let hasPrediction = base.getIn(["bitasset", "is_prediction_market"]) || quote.getIn(["bitasset", "is_prediction_market"]);

        let description = null;

        if (hasPrediction) {
            description = quoteAsset.getIn(["options", "description"]);
            description = assetUtils.parseDescription(description).main;
        }

        let smallScreen = false;
        if (width < 1000) {
            smallScreen = true;
            leftOrderBook = false;
        }

        let buyForm = (
            <BuySell
                smallScreen={smallScreen}
                style={!smallScreen && !leftOrderBook ? {minHeight: 266} : null}
                isOpen={this.state.buySellOpen}
                onToggleOpen={this._toggleOpenBuySell.bind(this)}
                className={cnames("small-12 no-padding middle-content", {disabled: isNullAccount}, leftOrderBook || smallScreen ? "medium-6" : "medium-6 large-4", this.state.flipBuySell ? "order-2 sell-form" : "order-1 buy-form")}
                type="bid"
                amount={buyAmount}
                price={displayBuyPrice}
                total={buyTotal}
                quote={quote}
                base={base}
                amountChange={this._buyAmountChanged.bind(this, base, quote)}
                priceChange={this._buyPriceChanged.bind(this, base, quote)}
                setPrice={this._currentPriceClick.bind(this, base, quote)}
                totalChange={this._buyTotalChanged.bind(this, base, quote)}
                balance={baseBalance}
                onSubmit={this._createLimitOrderConfirm.bind(this, quote, base, buyAmount, buyTotal, baseBalance, coreBalance, buyFeeAsset, "buy")}
                balancePrecision={base.get("precision")}
                quotePrecision={quote.get("precision")}
                totalPrecision={base.get("precision")}
                currentPrice={lowestAsk.price_full}
                currentPriceObject={lowestAsk.sell_price}
                account={currentAccount.get("name")}
                fee={buyFee}
                feeAssets={buyFeeAssets}
                feeAsset={buyFeeAsset}
                onChangeFeeAsset={this.onChangeFeeAsset.bind(this, "buy")}
                isPredictionMarket={base.getIn(["bitasset", "is_prediction_market"])}
                onFlip={!this.state.flipBuySell ? this._flipBuySell.bind(this) : null}
            />
        );

        let sellForm = (
            <BuySell
                smallScreen={smallScreen}
                style={!smallScreen && !leftOrderBook ? {minHeight: 266} : null}
                isOpen={this.state.buySellOpen}
                onToggleOpen={this._toggleOpenBuySell.bind(this)}
                className={cnames("small-12 no-padding middle-content", {disabled: isNullAccount}, leftOrderBook || smallScreen ? "medium-6" : "medium-6 large-4", this.state.flipBuySell ? "order-1 buy-form" : "order-2 sell-form")}
                type="ask"
                amount={sellAmount}
                price={displaySellPrice}
                total={sellTotal}
                quote={quote}
                base={base}
                amountChange={this._sellAmountChanged.bind(this, base, quote)}
                priceChange={this._sellPriceChanged.bind(this, base, quote)}
                setPrice={this._currentPriceClick.bind(this, base, quote)}
                totalChange={this._sellTotalChanged.bind(this, base, quote)}
                balance={quoteBalance}
                onSubmit={this._createLimitOrderConfirm.bind(this, base, quote, sellTotal, sellAmount, quoteBalance, coreBalance, sellFeeAsset, "sell")}
                balancePrecision={quote.get("precision")}
                quotePrecision={quote.get("precision")}
                totalPrecision={base.get("precision")}
                currentPrice={highestBid.price_full}
                currentPriceObject={highestBid.sell_price}
                account={currentAccount.get("name")}
                fee={sellFee}
                feeAssets={sellFeeAssets}
                feeAsset={sellFeeAsset}
                onChangeFeeAsset={this.onChangeFeeAsset.bind(this, "sell")}
                isPredictionMarket={quote.getIn(["bitasset", "is_prediction_market"])}
                onFlip={this.state.flipBuySell ? this._flipBuySell.bind(this) : null}
            />
        );

        let orderBook = (
            <OrderBook
                latest={latestPrice}
                changeClass={changeClass}
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
                marketReady={marketReady}
            />
        );

        return (
                <div className="grid-block page-layout market-layout">
                    <AccountNotifications/>
                    {!marketReady ? <LoadingIndicator /> : null}
                    {/* Main vertical block with content */}

                    {/* Left Column - Open Orders */}
                    {leftOrderBook ? (
                    <div className="grid-block left-column shrink no-overflow">
                        {orderBook}
                    </div>) : null}

                    {/* Center Column */}
                    <div className={cnames("grid-block main-content vertical no-overflow")} >

                        {/* Top bar with info */}
                        <div className="grid-block no-padding shrink overflow-visible top-bar">
                            <div className="grid-block no-overflow">
                                <div className="grid-block shrink" style={{borderRight: "1px solid grey"}}>
                                    <span style={{paddingRight: 0}} onClick={this._addMarket.bind(this, quoteAsset.get("symbol"), baseAsset.get("symbol"))} className="market-symbol">
                                        <Icon className={starClass} name="fi-star"/>
                                    </span>
                                    {!hasPrediction ? (
                                        <Link className="market-symbol" to={`/market/${baseSymbol}_${quoteSymbol}`}>
                                            <span><AssetName name={quoteSymbol} replace={true} /> : <AssetName name={baseSymbol} replace={true} /></span>
                                        </Link>) : (
                                        <a className="market-symbol">
                                            <span>{`${quoteSymbol} : ${baseSymbol}`}</span>
                                        </a>
                                        )}

                                </div>
                                <div className="grid-block vertical">
                                    <div className="grid-block show-for-medium wrap" style={{borderBottom: "1px solid grey"}}>
                                        <ul className="market-stats stats top-stats">
                                            {settlementPrice ? <PriceStat ready={marketReady} price={settlementPrice} quote={quote} base={base} content="exchange.settle"/> : null}
                                            {lowestCallPrice && showCallLimit ?
                                                (<li className="stat">
                                                    <span>
                                                        <Translate component="span" content="explorer.block.call_limit" />
                                                        <b className="value" style={{color: "#BBBF2B"}}>{utils.price_text(lowestCallPrice, quote, base)}</b>
                                                        <span>{baseSymbol}/{quoteSymbol}</span>
                                                    </span>
                                                </li>) : null}
                                            {squeezePrice && showCallLimit ?
                                                (<li className="stat">
                                                    <span>
                                                        <Translate component="span" content="exchange.squeeze" />
                                                        <b className="value" style={{color: "#BBBF2B"}}>{utils.price_text(squeezePrice, quote, base)}</b>
                                                        <span><AssetName name={baseSymbol} />/<AssetName name={quoteSymbol} /></span>
                                                    </span>
                                                </li>) : null}
                                            {latestPrice ?
                                                <li className="stat">
                                                    <span>
                                                        <Translate component="span" content="exchange.latest" />
                                                        <b className={"value"}>{utils.price_text(!marketReady ? 0 : latestPrice.full, quote, base)}<span className={changeClass}>&nbsp;{changeClass === "change-up" ? <span>&#8593;</span> : <span>&#8595;</span>}</span></b>
                                                        <span><AssetName name={baseSymbol} />/<AssetName name={quoteSymbol} /></span>
                                                    </span>
                                                </li> : null}

                                            {volumeBase >= 0 ? <PriceStat ready={marketReady} decimals={0} volume={true} price={volumeBase} base={base} content="exchange.volume_24"/> : null}

                                            {volumeQuote >= 0 ? <PriceStat ready={marketReady} decimals={0} volume={true} price={volumeQuote} base={quote} content="exchange.volume_24"/> : null}

                                            <li className="stat">
                                                <span>
                                                    <Translate component="span" content="account.hour_24" />
                                                    <b className={"value " + dayChangeClass}>{marketReady ? dayChange : 0}<span className={dayChangeArrow}>&nbsp;{dayChangeArrow === "" ? null : dayChangeArrow === "change-up" ? <span>&#8593;</span> : <span>&#8595;</span>}</span></b>
                                                    <span>%</span>
                                                </span>
                                            </li>

                                        </ul>
                                    </div>
                                    <div className="grid-block wrap no-overflow" style={{justifyContent: "space-between"}}>
                                        <ul className="market-stats stats bottom-stats">
                                            {!this.state.showDepthChart ? (
                                                <li className="stat">
                                                    <span>
                                                        <span><Translate content="exchange.zoom" />:</span>
                                                        <span>{zoomOptions}</span>
                                                    </span>
                                                </li>) : null}
                                            {!this.state.showDepthChart ? (
                                                <li className="stat">
                                                    <span>
                                                        <span><Translate content="exchange.time" />:</span>
                                                        <span>{bucketOptions}</span>
                                                    </span>
                                                </li>) : null}

                                            {!this.state.showDepthChart && this.props.priceData.length ? (
                                                <li className="stat clickable" onClick={this._onSelectIndicators.bind(this)}>
                                                    <div className="indicators">
                                                        <Translate content="exchange.settings" />
                                                    </div>
                                                </li>) : null}
                                         </ul>
                                         <ul className="market-stats stats bottom-stats">
                                            {!isNullAccount && quoteIsBitAsset ?
                                                (<li className="stat clickable" style={{borderLeft: "1px solid grey", borderRight: "none"}} onClick={this._borrowQuote.bind(this)}>
                                                    <div className="indicators">
                                                       <Translate content="exchange.borrow" />&nbsp;{quoteAsset.get("symbol")}
                                                    </div>
                                                </li>) : null}

                                            {!isNullAccount && baseIsBitAsset ?
                                                (<li className="stat clickable" style={{borderLeft: "1px solid grey", borderRight: "none"}} onClick={this._borrowBase.bind(this)}>
                                                    <div className="indicators">
                                                       <Translate content="exchange.borrow" />&nbsp;{baseAsset.get("symbol")}
                                                    </div>
                                                </li>) : null}

                                                <li className="stat float-right clickable" style={{borderLeft: "1px solid grey", borderRight: "none", padding: "3px 15px 0 15px"}} onClick={this._toggleCharts.bind(this)}>
                                                    <div className="indicators">
                                                       {!this.state.showDepthChart ? <Translate content="exchange.order_depth" /> : <Translate content="exchange.price_history" />}
                                                    </div>
                                                </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid-block vertical no-padding market-right-padding" id="CenterContent" ref="center">
                        {!this.state.showDepthChart ? (
                            <div className="grid-block shrink" id="market-charts" style={{marginTop: 0}}>
                                {/* Price history chart */}

                                <PriceChart
                                    onChangeSize={this.onChangeChartHeight.bind(this)}
                                    priceData={this.props.priceData}
                                    volumeData={this.props.volumeData}
                                    base={base}
                                    quote={quote}
                                    baseSymbol={baseSymbol}
                                    quoteSymbol={quoteSymbol}
                                    height={this.state.height > 1100 ? this.state.chartHeight : this.state.chartHeight - 125}
                                    leftOrderBook={leftOrderBook}
                                    marketReady={marketReady}
                                    indicators={indicators}
                                    indicatorSettings={indicatorSettings}
                                    bucketSize={bucketSize}
                                    latest={latestPrice}
                                    verticalOrderbook={leftOrderBook}
                                    theme={this.props.settings.get("themes")}
                                    zoom={this.state.currentPeriod}
                                />
                                <IndicatorModal
                                    ref="indicators"
                                    indicators={indicators}
                                    indicatorSettings={indicatorSettings}
                                    onChangeIndicator={this._changeIndicator.bind(this)}
                                    onChangeSetting={this._changeIndicatorSetting.bind(this)}
                                />
                            </div>) : (
                            <div className="grid-block no-overflow no-padding shrink" >
                                <DepthHighChart
                                    orders={limit_orders}
                                    showCallLimit={showCallLimit}
                                    call_orders={call_orders}
                                    flat_asks={flat_asks}
                                    flat_bids={flat_bids}
                                    flat_calls={ showCallLimit ? flat_calls : []}
                                    settles={settle_orders}
                                    invertedCalls={invertedCalls}
                                    totalBids={totalBids}
                                    totalCalls={showCallLimit ? totalCalls : 0}
                                    base={base}
                                    quote={quote}
                                    baseSymbol={baseSymbol}
                                    quoteSymbol={quoteSymbol}
                                    height={this.state.height > 1100 ? this.state.chartHeight : this.state.chartHeight - 125}
                                    onClick={this._depthChartClick.bind(this, base, quote)}
                                    plotLine={this.state.depthLine}
                                    settlementPrice={settlementPrice}
                                    spread={spread}
                                    SQP={showCallLimit ? null : null}
                                    LCP={showCallLimit ? lowestCallPrice : null}
                                    leftOrderBook={leftOrderBook}
                                    hasPrediction={hasPrediction}
                                    noFrame={false}
                                    verticalOrderbook={leftOrderBook}
                                    theme={this.props.settings.get("themes")}
                                />
                            </div>)}

                        {/* OrderBook and Market History */}


                            <div className="grid-block vertical shrink buy-sell">
                            {hasPrediction ? <div className="grid-content no-overflow" style={{lineHeight: "1.2rem", paddingTop: 10}}>{description}</div> : null}

                            <div className="grid-block align-spaced wrap">
                                {!leftOrderBook ? orderBook : null}

                                {leftOrderBook && quote && base ? buyForm : null}

                                {leftOrderBook && quote && base ? sellForm : null}

                                <MarketHistory
                                    className={cnames(leftOrderBook ? "hide-for-small" : "show-for-large", "no-padding no-overflow middle-content order-3 large-4")}
                                    headerStyle={{paddingTop: 0}}
                                    history={activeMarketHistory}
                                    myHistory={currentAccount.get("history")}
                                    base={base}
                                    quote={quote}
                                    baseSymbol={baseSymbol}
                                    quoteSymbol={quoteSymbol}
                                    isNullAccount={isNullAccount}
                                />

                                <ConfirmOrderModal
                                    type="buy"
                                    ref="buy"
                                    onForce={this._forceBuy.bind(this, quote, base, buyAmount, buyTotal, baseBalance, coreBalance)}
                                    diff={buyDiff}
                                />

                                <ConfirmOrderModal
                                    type="sell"
                                    ref="sell"
                                    onForce={this._forceSell.bind(this, base, quote, sellTotal, sellAmount, quoteBalance, coreBalance)}
                                    diff={sellDiff}
                                />
                            </div>
                        </div>

                        <div className="grid-block no-overflow wrap shrink no-padding">
                            {!leftOrderBook && quote && base ? buyForm : null}

                            {leftOrderBook ? <ConfirmOrderModal
                                type="buy"
                                ref="buy"
                                onForce={this._forceBuy.bind(this, quote, base, buyAmount, buyTotal, baseBalance, coreBalance)}
                                diff={buyDiff}
                            /> : null}

                            {!leftOrderBook && quote && base ? sellForm : null}

                            <MarketHistory
                                className={cnames(!smallScreen && !leftOrderBook ? "medium-6 large-4" : "medium-12 large-6", {"hide-for-large" : !leftOrderBook}, "no-padding no-overflow middle-content order-3 small-12 medium-6")}
                                headerStyle={{paddingTop: 0}}
                                history={activeMarketHistory}
                                myHistory={currentAccount.get("history")}
                                base={base}
                                quote={quote}
                                baseSymbol={baseSymbol}
                                quoteSymbol={quoteSymbol}
                                isNullAccount={isNullAccount}
                            />

                            {limit_orders.size > 0 && base && quote ? (
                            <MyOpenOrders
                                smallScreen={this.props.smallScreen}
                                className={cnames({disabled: isNullAccount}, !smallScreen && !leftOrderBook ? "medium-6 large-4" : "medium-12 large-6", "small-12 no-padding align-spaced ps-container middle-content order-4")}
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



                        <div className="grid-block no-overflow shrink no-padding">

                            {settle_orders.size > 0 && base && quote &&
                            (base.get("id") === "1.3.0" || quote.get("id") === "1.3.0") ? (
                                <OpenSettleOrders
                                    key="settle_orders"
                                    orders={settle_orders}
                                    currentAccount={currentAccount.get("id")}
                                    base={base}
                                    quote={quote}
                                    baseSymbol={baseSymbol}
                                    quoteSymbol={quoteSymbol}
                                    settlementPrice={settlementPrice}
                                />) : null}
                        </div>


                    </div>
                    {/* End of Main Content Column */}
                    </div>


                    {/* Right Column - Market History */}
                    <div className="grid-block shrink right-column no-overflow vertical show-for-medium" style={{paddingTop: 0, minWidth: 358, maxWidth: 400}}>
                        {/* Market History */}
                        <div className="grid-block no-padding no-margin vertical"  style={{borderBottom: "1px solid grey"}}>
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
                                current={marketID}
                            />
                        </div>
                        <div className="grid-block no-padding no-margin vertical shrink">
                            <DepthHighChart
                                    orders={limit_orders}
                                    showCallLimit={showCallLimit}
                                    call_orders={call_orders}
                                    flat_asks={flat_asks}
                                    flat_bids={flat_bids}
                                    flat_calls={ showCallLimit ? flat_calls : []}
                                    settles={settle_orders}
                                    invertedCalls={invertedCalls}
                                    totalBids={totalBids}
                                    totalCalls={showCallLimit ? totalCalls : 0}
                                    base={base}
                                    quote={quote}
                                    baseSymbol={baseSymbol}
                                    quoteSymbol={quoteSymbol}
                                    height={200}
                                    onClick={this._depthChartClick.bind(this, base, quote)}
                                    plotLine={this.state.depthLine}
                                    settlementPrice={settlementPrice}
                                    spread={spread}
                                    SQP={showCallLimit ? squeezePrice : null}
                                    LCP={showCallLimit ? lowestCallPrice : null}
                                    leftOrderBook={leftOrderBook}
                                    hasPrediction={hasPrediction}
                                    noText={true}
                                    theme={this.props.settings.get("themes")}
                                />
                        </div>
                    </div>

                    {!isNullAccount && quoteIsBitAsset  ?
                        <BorrowModal
                            ref="borrowQuote"
                            quote_asset={quoteAsset.get("id")}
                            backing_asset={quoteAsset.getIn(["bitasset", "options", "short_backing_asset"])}
                            account={currentAccount}
                         /> : null}
                    {!isNullAccount && baseIsBitAsset ?
                        <BorrowModal
                            ref="borrowBase"
                            quote_asset={baseAsset.get("id")}
                            backing_asset={baseAsset.getIn(["bitasset", "options", "short_backing_asset"])}
                            account={currentAccount}
                        /> : null}
                {/* End of Second Vertical Block */}
                </div>
        );
    }
}

export default Exchange;
