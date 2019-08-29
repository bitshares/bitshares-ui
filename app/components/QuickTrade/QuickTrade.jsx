import React, {Component} from "react";
import {bindToCurrentAccount} from "../Utility/BindToCurrentAccount";
import {connect} from "alt-react";
import AssetStore from "../../stores/AssetStore";
import MarketsStore from "../../stores/MarketsStore";
import {
    Card,
    Collapse,
    Row,
    Col,
    Table,
    Button
} from "bitshares-ui-style-guide";
import SellReceive from "components/QuickTrade/SellReceive";
import MarketsActions from "actions/MarketsActions";
import {
    getAssetsToSell,
    getPrices,
    getOrders,
    getFees
} from "./QuickTradeHelper";
import {ChainStore} from "bitsharesjs";
import {debounce} from "lodash-es";
import AssetActions from "actions/AssetActions";
import {ChainValidation} from "bitsharesjs";
import {lookupAssets} from "../Exchange/MarketPickerHelpers";
import counterpart from "counterpart";
import LinkToAccountById from "../Utility/LinkToAccountById";
import {Asset, LimitOrderCreate} from "common/MarketClasses";
import {Notification} from "bitshares-ui-style-guide";
import FormattedPrice from "../Utility/FormattedPrice";
import AssetName from "../Utility/AssetName";

class QuickTrade extends Component {
    constructor(props) {
        super(props);
        this.state = {
            mounted: false,
            sub: "",
            sellAssetInput: "",
            sellAsset: "",
            sellAssets: [],
            sellAmount: "",
            sellImgName: "unknown",
            receiveAssetInput: "",
            receiveAsset: "",
            receiveAssets: [],
            receiveAmount: "",
            receiveImgName: "unknown",
            activeInput: "",
            lookupQuote: "",
            orders: [],
            orderView: "amount",
            fees: null,
            prices: null
        };
        this.onSellAssetInputChange = this.onSellAssetInputChange.bind(this);
        this.onReceiveAssetInputChange = this.onReceiveAssetInputChange.bind(
            this
        );
        this.onSellAmountChange = this.onSellAmountChange.bind(this);
        this.onReceiveAmountChange = this.onReceiveAmountChange.bind(this);
        this.onSellImageError = this.onSellImageError.bind(this);
        this.onReceiveImageError = this.onReceiveImageError.bind(this);
        this.onReceiveAssetSearch = this.onReceiveAssetSearch.bind(this);
        this.onSwap = this.onSwap.bind(this);
        this.hendleOrderView = this.hendleOrderView.bind(this);
        this.handleSell = this.handleSell.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this._subToMarket = this._subToMarket.bind(this);
        this.getAssetList = debounce(AssetActions.getAssetList.defer, 150);
        this.setState = this.setState.bind(this);
        this._checkAndUpdateMarketList = this._checkAndUpdateMarketList.bind(
            this
        );
    }

    componentDidMount() {
        const {currentAccount} = this.props;
        const sellAssets = getAssetsToSell(currentAccount);
        const receiveAssets = getAssetsToSell(currentAccount);
        this.setState({
            mounted: true,
            sellAssets,
            receiveAssets
        });
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.searchAssets !== this.props.searchAssets) {
            this.setState({activeSearch: true});
            let filteredAssets = this.props.searchAssets
                .toArray()
                .filter(a => a.symbol.indexOf(this.state.lookupQuote) !== -1);
            this._checkAndUpdateMarketList(filteredAssets);
        }
        if (
            nextProps.marketData.combinedBids !==
            this.props.marketData.combinedBids
        ) {
            this._getOrders();
        }
    }

    componentWillUnmount() {
        const {sub, sellAsset, receiveAsset} = this.state;
        if (sub) {
            MarketsActions.unSubscribeMarket(sellAsset, receiveAsset);
        }
    }

    async _subToMarket(baseAssetId, quoteAssetId) {
        const {sub, sellAsset, receiveAsset} = this.state;
        const {bucketSize, currentGroupOrderLimit} = this.props;
        if (sub) {
            let [qa, ba] = sub.split("_");
            if (qa === quoteAssetId && ba === baseAssetId) {
                return;
            }
        }
        if (sub) {
            await MarketsActions.unSubscribeMarket(sellAsset, receiveAsset);
        }
        if (baseAssetId && quoteAssetId) {
            const baseAsset = ChainStore.getAsset(baseAssetId);
            const quoteAsset = ChainStore.getAsset(quoteAssetId);
            await MarketsActions.subscribeMarket(
                baseAsset,
                quoteAsset,
                bucketSize,
                currentGroupOrderLimit
            );
            this.setState({
                sub: `${quoteAssetId}_${baseAssetId}`
            });
            this.getAllPrices();
            this.getAllFees();
        }
    }

    async getAllFees() {
        const {currentAccount} = this.props;
        const {sellAsset, receiveAsset} = this.state;

        if (sellAsset && receiveAsset) {
            const baseAsset = ChainStore.getAsset(receiveAsset);
            const quoteAsset = ChainStore.getAsset(sellAsset);
            const fees = await getFees(baseAsset, quoteAsset, currentAccount);
            this.setState({
                fees
            });
        }
    }

    getAllPrices() {
        const {activeMarketHistory, feedPrice} = this.props;
        const prices = getPrices(activeMarketHistory, feedPrice);
        this.setState({
            prices
        });
    }

    _getOrders() {
        const {combinedBids} = this.props.marketData;
        if (combinedBids && combinedBids.length) {
            const {
                sellAsset,
                receiveAsset,
                sellAmount,
                receiveAmount,
                activeInput
            } = this.state;
            if (
                sellAmount &&
                sellAsset &&
                receiveAsset &&
                activeInput === "sell"
            ) {
                const sellAssetPrecision = ChainStore.getAsset(sellAsset).get(
                    "precision"
                );
                const orders = getOrders(
                    sellAmount * 10 ** sellAssetPrecision,
                    combinedBids,
                    "sell"
                );
                this.setState(
                    {
                        orders
                    },
                    () => this.updateReceiveAmount()
                );
            } else if (
                receiveAmount &&
                sellAsset &&
                receiveAsset &&
                activeInput === "receive"
            ) {
                const receiveAssetPrecision = ChainStore.getAsset(
                    receiveAsset
                ).get("precision");
                const orders = getOrders(
                    receiveAmount * 10 ** receiveAssetPrecision,
                    combinedBids,
                    "receive"
                );
                this.setState(
                    {
                        orders
                    },
                    () => this.updateSellAmount()
                );
            } else {
                this.setState({
                    orders: []
                });
            }
        }
    }

    onSellAssetInputChange(e) {
        const {receiveAsset} = this.state;
        if (e === receiveAsset) {
            const assetImage = e
                ? ChainStore.getAsset(e).get("symbol")
                : "unknown";
            this.setState(
                state => {
                    return {
                        sellAssetInput: e,
                        sellAsset: e,
                        sellImgName: assetImage,
                        sellAmount: "",
                        receiveAmount: "",
                        receiveAsset: state.sellAsset,
                        receiveAssetInput: state.sellAssetInput,
                        receiveImgName: state.sellImgName
                    };
                },
                () => {
                    const {sellAsset, receiveAsset} = this.state;
                    if (sellAsset && receiveAsset) {
                        this._subToMarket(receiveAsset, sellAsset);
                    }
                }
            );
        } else {
            const assetImage = e
                ? ChainStore.getAsset(e).get("symbol")
                : "unknown";
            this.setState(
                {
                    sellAssetInput: e,
                    sellAsset: e,
                    sellImgName: assetImage,
                    sellAmount: "",
                    receiveAmount: ""
                },
                () => {
                    const {sellAsset, receiveAsset} = this.state;
                    if (sellAsset && receiveAsset) {
                        this._subToMarket(receiveAsset, sellAsset);
                    }
                }
            );
        }
    }

    onReceiveAssetInputChange(e) {
        const {sellAsset, receiveAsset, sellAssets} = this.state;
        const assetImage = e ? ChainStore.getAsset(e).get("symbol") : "unknown";
        if (e === sellAsset && sellAssets.includes(receiveAsset)) {
            this.setState(
                state => {
                    return {
                        receiveAssetInput: e,
                        receiveAsset: e,
                        receiveImgName: assetImage,
                        receiveAmount: "",
                        sellAmount: "",
                        sellAsset: state.receiveAsset,
                        sellAssetInput: state.receiveAssetInput,
                        sellImgName: state.receiveImgName
                    };
                },
                () => {
                    const {sellAsset, receiveAsset} = this.state;
                    if (sellAsset && receiveAsset) {
                        this._subToMarket(receiveAsset, sellAsset);
                    }
                }
            );
        } else if (e === sellAsset) {
            this.setState(
                state => {
                    return {
                        receiveAssetInput: e,
                        receiveAsset: e,
                        receiveImgName: assetImage,
                        receiveAmount: "",
                        sellAmount: "",
                        sellAsset: "",
                        sellAssetInput: "",
                        sellImgName: "unknown"
                    };
                },
                () => {
                    const {sellAsset, receiveAsset} = this.state;
                    if (sellAsset && receiveAsset) {
                        this._subToMarket(receiveAsset, sellAsset);
                    }
                }
            );
        } else {
            this.setState(
                {
                    receiveAssetInput: e,
                    receiveAsset: e,
                    receiveImgName: assetImage,
                    sellAmount: "",
                    receiveAmount: ""
                },
                () => {
                    const {sellAsset, receiveAsset} = this.state;
                    if (sellAsset && receiveAsset) {
                        this._subToMarket(receiveAsset, sellAsset);
                    }
                }
            );
        }
    }

    onReceiveAssetSearch(e) {
        if (!this.state.mounted) return;
        let isValidName = !ChainValidation.is_valid_symbol_error(e, true);
        if (!isValidName) {
            /* Don't lookup invalid asset names */
            this.setState({
                receiveAsset: "",
                receiveAssetInput: e,
                activeSearch: false
            });
            return;
        } else {
            this.setState({
                receiveAsset: "",
                receiveAssetInput: e,
                activeSearch: true
            });
        }

        if (this.state.receiveAssetInput !== e) {
            this.timer && clearTimeout(this.timer);
        }

        this.timer = setTimeout(() => {
            lookupAssets(e, true, this.getAssetList, this.setState);
        }, 100);
    }

    _checkAndUpdateMarketList(marketsList) {
        let receiveAssets = marketsList.map(asset => asset.id);
        clearInterval(this.intervalId);
        const {receiveAssetInput} = this.state;
        let asset = "";
        if (ChainStore.getAsset(receiveAssetInput)) {
            const assetId = ChainStore.getAsset(receiveAssetInput).get("id");
            if (receiveAssets.includes(assetId)) {
                asset = ChainStore.getAsset(receiveAssetInput).get("id");
            }
        }
        if (receiveAssets.length === 1) {
            asset = receiveAssets[0];
            const {currentAccount} = this.props;
            receiveAssets = getAssetsToSell(currentAccount);
            receiveAssets.push(asset);
        }
        if (receiveAssets.length === 0) {
            const {currentAccount} = this.props;
            receiveAssets = getAssetsToSell(currentAccount);
        }

        this.intervalId = setInterval(() => {
            clearInterval(this.intervalId);
            this.setState(
                {
                    receiveAssets,
                    activeSearch: false
                },
                () => {
                    const {sellAsset, receiveAsset} = this.state;
                    if (sellAsset && receiveAsset) {
                        this._subToMarket(receiveAsset, sellAsset);
                    }
                }
            );
        }, 100);
    }

    onSellAmountChange(e) {
        if (!this.state.mounted) return;
        const {amount} = e;
        let {receiveAmount} = this.state;
        if (amount === "") {
            receiveAmount = "";
        }
        this.setState(
            {
                sellAmount: amount,
                activeInput: "sell",
                receiveAmount
            },
            () => {
                this._getOrders();
            }
        );
    }

    onReceiveAmountChange(e) {
        if (!this.state.mounted) return;
        const {amount} = e;
        let {sellAmount} = this.state;
        if (amount === "") {
            sellAmount = "";
        }
        this.setState(
            {
                receiveAmount: amount,
                activeInput: "receive",
                sellAmount
            },
            () => {
                this._getOrders();
            }
        );
    }

    onSellImageError() {
        this.setState({
            sellImgName: "unknown"
        });
    }

    onReceiveImageError() {
        this.setState({
            receiveImgName: "unknown"
        });
    }

    onSwap() {
        if (this.isSwappable()) {
            let {
                sellAsset,
                receiveAsset,
                sellImgName,
                receiveImgName,
                sellAssetInput,
                receiveAssetInput,
                receiveAssets
            } = this.state;
            if (!receiveAssets.includes(sellAsset)) {
                receiveAssets = [...receiveAssets, sellAsset];
            }
            this.setState({
                sellAsset: receiveAsset,
                receiveAsset: sellAsset,
                sellAssetInput: receiveAssetInput,
                receiveAssetInput: sellAssetInput,
                sellImgName: receiveImgName,
                receiveImgName: sellImgName,
                sellAmount: "",
                receiveAmount: "",
                receiveAssets
            });
        }
    }

    hendleOrderView() {
        this.setState(state => {
            const orderView = state.orderView === "amount" ? "total" : "amount";
            return {
                orderView
            };
        });
    }

    handleSell() {
        const {currentAccount} = this.props;
        const {sellAmount, receiveAmount, sellAsset, receiveAsset} = this.state;
        const sellAssetPrecision = ChainStore.getAsset(sellAsset).get(
            "precision"
        );
        const receiveAssetPrecision = ChainStore.getAsset(receiveAsset).get(
            "precision"
        );
        const forSale = new Asset({
            asset_id: sellAsset,
            precision: sellAssetPrecision,
            amount: sellAmount * 10 ** sellAssetPrecision
        });
        const toReceive = new Asset({
            asset_id: receiveAsset,
            precision: receiveAssetPrecision,
            amount: receiveAmount * 10 ** receiveAssetPrecision
        });
        const expirationTime = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

        const order = new LimitOrderCreate({
            for_sale: forSale,
            expiration: expirationTime,
            to_receive: toReceive,
            seller: currentAccount.get("id"),
            fee: {
                asset_id: sellAsset,
                amount: 0
            }
        });

        return MarketsActions.createLimitOrder2(order)
            .then(result => {
                if (result.error) {
                    if (result.error.message !== "wallet locked")
                        Notification.error({
                            message: counterpart.translate(
                                "notifications.exchange_unknown_error_place_order",
                                {
                                    amount: receiveAmount,
                                    symbol: receiveAsset
                                }
                            )
                        });
                }
            })
            .catch(e => {
                console.error("order failed:", e);
            });
    }

    handleCancel() {
        this.props.history.goBack();
    }

    updateSellAmount() {
        const {orders, receiveAmount, sellAsset, receiveAsset} = this.state;
        const sellAssetPrecision = ChainStore.getAsset(sellAsset).get(
            "precision"
        );
        const receiveAssetPrecision = ChainStore.getAsset(receiveAsset).get(
            "precision"
        );
        if (orders.length === 1) {
            const sellAmount = (
                receiveAmount / orders[0].order.getPrice()
            ).toFixed(sellAssetPrecision);
            this.setState({
                sellAmount
            });
            return;
        }
        if (orders.length > 1) {
            const lastOrder = orders.slice(-1)[0];
            const penultimateOrder = orders.slice(
                orders.length - 2,
                orders.length - 1
            )[0];
            const lastOrderToReceive =
                receiveAmount * 10 ** receiveAssetPrecision -
                penultimateOrder.order.total_for_sale.getAmount();
            const lastOrderForSale =
                ((lastOrderToReceive / lastOrder.order.getPrice()) *
                    10 ** sellAssetPrecision) /
                10 ** receiveAssetPrecision;
            const sellAmount = (
                (penultimateOrder.order.total_to_receive.getAmount() +
                    lastOrderForSale) /
                10 ** sellAssetPrecision
            ).toFixed(sellAssetPrecision);
            this.setState({
                sellAmount
            });
            return;
        }
    }

    updateReceiveAmount() {
        const {orders, sellAmount, sellAsset, receiveAsset} = this.state;
        const sellAssetPrecision = ChainStore.getAsset(sellAsset).get(
            "precision"
        );
        const receiveAssetPrecision = ChainStore.getAsset(receiveAsset).get(
            "precision"
        );
        if (orders.length === 1) {
            const receiveAmount = (
                orders[0].order.getPrice() * sellAmount
            ).toFixed(receiveAssetPrecision);
            this.setState({
                receiveAmount
            });
            return;
        }

        if (orders.length > 1) {
            const lastOrder = orders.slice(-1)[0];
            const penultimateOrder = orders.slice(
                orders.length - 2,
                orders.length - 1
            )[0];
            const lastOrderForSale =
                sellAmount * 10 ** sellAssetPrecision -
                penultimateOrder.order.total_to_receive.getAmount();
            const lastOrderToReceive =
                (lastOrderForSale *
                    lastOrder.order.getPrice() *
                    10 ** receiveAssetPrecision) /
                10 ** sellAssetPrecision;
            const receiveAmount = (
                (penultimateOrder.order.total_for_sale.getAmount() +
                    lastOrderToReceive) /
                10 ** receiveAssetPrecision
            ).toFixed(receiveAssetPrecision);
            this.setState({
                receiveAmount
            });
            return;
        }
    }

    isSwappable() {
        const {sellAsset, receiveAsset} = this.state;
        const sellAssets = getAssetsToSell(this.props.currentAccount);
        return sellAsset &&
            receiveAsset &&
            sellAssets.includes(ChainStore.getAsset(receiveAsset).get("id"))
            ? true
            : false;
    }

    _getTransactionFee(denominationAsset) {
        const {fees, prices, sellAsset} = this.state;
        if (!denominationAsset || denominationAsset === sellAsset) {
            return (
                fees.transactionFee[sellAsset].fee.amount /
                10 ** fees.transactionFee[sellAsset].fee.precision
            );
        } else {
            return (
                (fees.transactionFee[sellAsset].fee.amount /
                    10 ** fees.transactionFee[sellAsset].fee.precision) *
                prices.latestPrice
            );
        }
    }

    _getMarketFee(denomindatedAsset) {
        const {fees, prices, receiveAsset, receiveAmount} = this.state;
        if (!denomindatedAsset || denomindatedAsset === receiveAsset) {
            return (fees.marketFee.baseMarketFee * receiveAmount) / 10000;
        } else {
            return (
                (fees.marketFee.baseMarketFee * receiveAmount) /
                prices.latestPrice /
                10000
            );
        }
    }

    _getFeePercent(feeAmount, totalAmount) {
        return +totalAmount ? (+totalAmount + +feeAmount) / totalAmount - 1 : 0;
    }

    getDetails() {
        const {sub} = this.state;
        if (!sub) {
            return;
        }
        const {sellAmount, receiveAmount, sellAsset, receiveAsset} = this.state;
        const sellAssetPrecision = ChainStore.getAsset(sellAsset).get(
            "precision"
        );
        const receiveAssetPrecision = ChainStore.getAsset(receiveAsset).get(
            "precision"
        );
        const priceSection = this.getPriceSection();
        const feeSection = this.getFeeSection();
        const ordersSection = this.getOrdersSection();
        const totalPercentFee = (this.getTotalPercentFee() * 100).toFixed(2);
        const amountOfOrders = this.state.orders.length;
        const ordersCaption = amountOfOrders < 2 ? "order" : "orders";
        return (
            <Collapse
                className="asset-collapse"
                style={{
                    marginTop: "1rem"
                }}
            >
                <Collapse.Panel
                    header={counterpart.translate("exchange.price")}
                    extra={
                        <FormattedPrice
                            base_asset={sellAsset}
                            quote_asset={receiveAsset}
                            base_amount={sellAmount * 10 ** sellAssetPrecision}
                            quote_amount={
                                receiveAmount * 10 ** receiveAssetPrecision
                            }
                            noPopOver
                            force_direction={ChainStore.getAsset(
                                receiveAsset
                            ).get("symbol")}
                            noInvertTip
                        />
                    }
                >
                    {priceSection}
                </Collapse.Panel>
                <Collapse.Panel
                    header={counterpart.translate("exchange.fee")}
                    extra={`${totalPercentFee}%`}
                >
                    {feeSection}
                </Collapse.Panel>
                <Collapse.Panel
                    header={counterpart.translate("exchange.orders")}
                    extra={
                        amountOfOrders
                            ? `${amountOfOrders} ${ordersCaption}`
                            : "no orders"
                    }
                >
                    {ordersSection}
                </Collapse.Panel>
            </Collapse>
        );
    }

    showDetails() {
        const {sellAsset, receiveAsset, sellAmount, receiveAmount} = this.state;
        return sellAsset && receiveAsset && +sellAmount && +receiveAmount;
    }

    getPriceSection() {
        const {
            prices,
            sellAmount,
            receiveAmount,
            sellAsset,
            receiveAsset
        } = this.state;
        const sellAssetPrecision = ChainStore.getAsset(sellAsset).get(
            "precision"
        );
        const receiveAssetPrecision = ChainStore.getAsset(receiveAsset).get(
            "precision"
        );
        return (
            <Row>
                <Col span={12}>
                    <div>
                        {counterpart.translate(
                            "exchange.quick_trade_details.your_price"
                        )}
                    </div>
                    <div>
                        {counterpart.translate(
                            "exchange.quick_trade_details.feed_price"
                        )}
                    </div>
                    <div>
                        {counterpart.translate(
                            "exchange.quick_trade_details.last_price"
                        )}
                    </div>
                </Col>
                <Col span={12} style={{textAlign: "right"}}>
                    <div>
                        <FormattedPrice
                            base_asset={sellAsset}
                            quote_asset={receiveAsset}
                            base_amount={sellAmount * 10 ** sellAssetPrecision}
                            quote_amount={
                                receiveAmount * 10 ** receiveAssetPrecision
                            }
                            noPopOver
                            force_direction={ChainStore.getAsset(
                                receiveAsset
                            ).get("symbol")}
                            noInvertTip
                        />
                    </div>
                    <div>
                        <FormattedPrice
                            base_asset={sellAsset}
                            quote_asset={receiveAsset}
                            base_amount={1 * 10 ** sellAssetPrecision}
                            quote_amount={
                                prices.feedPrice * 10 ** receiveAssetPrecision
                            }
                            noPopOver
                            force_direction={ChainStore.getAsset(
                                receiveAsset
                            ).get("symbol")}
                            noInvertTip
                        />
                    </div>
                    <div>
                        <FormattedPrice
                            base_asset={sellAsset}
                            quote_asset={receiveAsset}
                            base_amount={1 * 10 ** sellAssetPrecision}
                            quote_amount={
                                prices.latestPrice * 10 ** receiveAssetPrecision
                            }
                            noPopOver
                            force_direction={ChainStore.getAsset(
                                receiveAsset
                            ).get("symbol")}
                            noInvertTip
                        />
                    </div>
                </Col>
            </Row>
        );
    }

    getFeeSection() {
        const {sellAmount, receiveAmount, sellAsset, receiveAsset} = this.state;
        const sellAssetSymbol = ChainStore.getAsset(sellAsset).get("symbol");
        const receiveAssetSymbol = ChainStore.getAsset(receiveAsset).get(
            "symbol"
        );
        const sellAssetPrecision = ChainStore.getAsset(sellAsset).get(
            "precision"
        );
        const receiveAssetPrecision = ChainStore.getAsset(receiveAsset).get(
            "precision"
        );

        const transactionFee = this._getTransactionFee().toFixed(
            sellAssetPrecision
        );
        const transactionFeePercent = (
            this._getFeePercent(this._getTransactionFee(), sellAmount) * 100
        ).toFixed(2);
        const marketFee = this._getMarketFee().toFixed(receiveAssetPrecision);
        const marketFeePercent = (
            this._getFeePercent(this._getMarketFee(), receiveAmount) * 100
        ).toFixed(2);

        let [
            liqidityPenaltyMarket,
            liqidityPenaltyFeed
        ] = this.getLiquidityPenalty();
        if (liqidityPenaltyMarket || liqidityPenaltyMarket === 0) {
            liqidityPenaltyMarket =
                (liqidityPenaltyMarket * 100).toFixed(2) + "%";
        } else {
            liqidityPenaltyMarket = "-";
        }
        if (liqidityPenaltyFeed || liqidityPenaltyFeed === 0) {
            liqidityPenaltyFeed = (liqidityPenaltyFeed * 100).toFixed(2) + "%";
        } else {
            liqidityPenaltyFeed = "-";
        }
        const liqidityPenalty = `${liqidityPenaltyMarket} / ${liqidityPenaltyFeed}`;

        return (
            <Row>
                <Col span={12}>
                    <div>
                        {counterpart.translate(
                            "exchange.quick_trade_details.liquidity_penalty"
                        )}
                    </div>
                    <div>
                        {counterpart.translate(
                            "exchange.quick_trade_details.market_fee"
                        )}
                        {` ${marketFeePercent}%`}
                    </div>
                    <div>
                        {counterpart.translate(
                            "exchange.quick_trade_details.transaction_fee"
                        )}
                        {` ${transactionFeePercent}%`}
                    </div>
                </Col>
                <Col span={12} style={{textAlign: "right"}}>
                    <div>{liqidityPenalty}</div>
                    <div>
                        {marketFee}
                        &nbsp;
                        <AssetName name={receiveAssetSymbol} noTip />
                    </div>
                    <div>
                        {transactionFee}
                        &nbsp;
                        <AssetName name={sellAssetSymbol} noTip />
                    </div>
                </Col>
            </Row>
        );
    }

    getOrdersSection() {
        const {orders, sellAsset, receiveAsset, orderView} = this.state;
        const sellAssetPrecision = ChainStore.getAsset(sellAsset).get(
            "precision"
        );
        const dataSource = orders.map(item => {
            return {
                key: item.order.id,
                id: item.order.id,
                seller: <LinkToAccountById account={item.order.seller} />,
                amount: (
                    <div onClick={this.hendleOrderView}>
                        {orderView === "amount"
                            ? item.amount / 10 ** sellAssetPrecision
                            : item.total_amount / 10 ** sellAssetPrecision}
                    </div>
                ),
                price: item.price
            };
        });

        const amount = (
            <span>
                {orderView === "amount"
                    ? counterpart.translate(
                          "exchange.quick_trade_details.amount"
                      )
                    : counterpart.translate(
                          "exchange.quick_trade_details.total"
                      )}
                &nbsp;(
                <AssetName
                    name={ChainStore.getAsset(sellAsset).get("symbol")}
                    noTip
                />
                )
            </span>
        );

        const price = (
            <span>
                {counterpart.translate("exchange.quick_trade_details.price")}
                &nbsp;(
                <FormattedPrice
                    base_asset={sellAsset}
                    quote_asset={receiveAsset}
                    noPopOver
                    force_direction={ChainStore.getAsset(receiveAsset).get(
                        "symbol"
                    )}
                    noInvertTip
                    hide_value
                />
                )
            </span>
        );

        const columns = [
            {
                title: counterpart.translate("exchange.quick_trade_details.id"),
                dataIndex: "id",
                key: "id"
            },
            {
                title: counterpart.translate(
                    "exchange.quick_trade_details.seller"
                ),
                dataIndex: "seller",
                key: "seller"
            },
            {
                title: amount,
                dataIndex: "amount",
                key: "amount"
            },
            {
                title: price,
                dataIndex: "price",
                key: "price"
            }
        ];
        return (
            <Table
                columns={columns}
                dataSource={dataSource}
                style={{width: "100%"}}
                pagination={
                    dataSource.length > 5
                        ? {
                              pageSize: 5
                          }
                        : false
                }
            />
        );
    }

    getLiquidityPenalty() {
        const {prices, sellAmount, receiveAmount} = this.state;
        const price = receiveAmount / sellAmount;
        const marketPrice = prices.latestPrice;
        const feedPrice = prices.feedPrice;
        let liquidityFee1, liquidityFee2;
        if (price && marketPrice) {
            liquidityFee1 = Math.max(
                1 - price / marketPrice,
                1 - marketPrice / price
            );
        }
        if (price && feedPrice) {
            liquidityFee2 = Math.max(
                1 - price / feedPrice,
                1 - feedPrice / price
            );
        }
        return [liquidityFee1, liquidityFee2];
    }

    getTotalPercentFee() {
        const {sellAmount, receiveAmount} = this.state;
        const transactionFeePercent = this._getFeePercent(
            this._getTransactionFee(),
            sellAmount
        );
        const marketFeePercent = this._getFeePercent(
            this._getMarketFee(),
            receiveAmount
        );
        const liquidityFee = this.getLiquidityPenalty()[0];
        return transactionFeePercent + marketFeePercent + liquidityFee;
    }

    render() {
        const {
            sellAssetInput,
            sellAsset,
            sellAssets,
            sellAmount,
            sellImgName,
            receiveAssetInput,
            receiveAsset,
            receiveAssets,
            receiveAmount,
            receiveImgName,
            sub
        } = this.state;

        const Details = this.showDetails() ? this.getDetails() : null;

        return (
            <Card
                className="quick-trade"
                style={{
                    align: "center",
                    display: "flex",
                    justifyContent: "center",
                    minWidth: "300px"
                }}
            >
                <SellReceive
                    sellAssetInput={sellAssetInput}
                    sellAsset={sellAsset}
                    sellAssets={sellAssets}
                    sellAmount={sellAmount}
                    sellImgName={sellImgName}
                    onSellAssetInputChange={this.onSellAssetInputChange}
                    onSellAmountChange={this.onSellAmountChange}
                    onSellImageError={this.onSellImageError}
                    receiveAssetInput={receiveAssetInput}
                    receiveAsset={receiveAsset}
                    receiveAssets={receiveAssets}
                    receiveAmount={receiveAmount}
                    receiveImgName={receiveImgName}
                    onReceiveAssetInputChange={this.onReceiveAssetInputChange}
                    onReceiveAmountChange={this.onReceiveAmountChange}
                    onReceiveImageError={this.onReceiveImageError}
                    onReceiveAssetSearch={this.onReceiveAssetSearch}
                    onSwap={this.onSwap}
                    isSwappable={this.isSwappable()}
                />
                {Details}
                <div
                    style={{
                        marginTop: "1rem",
                        textAlign: "center"
                    }}
                >
                    <Button
                        key="sell"
                        type="primary"
                        disabled={!this.showDetails() || !sub}
                        onClick={this.handleSell}
                    >
                        {counterpart.translate("exchange.sell")}
                    </Button>
                    <Button key="cancel" onClick={this.handleCancel}>
                        {counterpart.translate("global.cancel")}
                    </Button>
                </div>
            </Card>
        );
    }
}

QuickTrade = connect(
    QuickTrade,
    {
        listenTo() {
            return [AssetStore, MarketsStore];
        },
        getProps() {
            return {
                searchAssets: AssetStore.getState().assets,
                assetsLoading: AssetStore.getState().assetsLoading,
                marketData: MarketsStore.getState().marketData,
                activeMarketHistory: MarketsStore.getState()
                    .activeMarketHistory,
                bucketSize: MarketsStore.getState().bucketSize,
                currentGroupOrderLimit: MarketsStore.getState().bucketSize,
                feedPrice: MarketsStore.getState().feedPrice,
                marketLimitOrders: MarketsStore.getState().marketLimitOrders
            };
        }
    }
);

export default (QuickTrade = bindToCurrentAccount(QuickTrade));
