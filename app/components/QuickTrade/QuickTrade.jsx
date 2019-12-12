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
    Button,
    Switch,
    Tooltip
} from "bitshares-ui-style-guide";
import SellReceive from "components/QuickTrade/SellReceive";
import MarketsActions from "actions/MarketsActions";
import {
    getAssetsToSell,
    getPrices,
    getOrders,
    getFees
} from "./QuickTradeHelper";
import {ChainStore, FetchChain} from "bitsharesjs";
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
import Translate from "react-translate-component";

class QuickTrade extends Component {
    constructor(props) {
        super(props);
        const accountAssets = getAssetsToSell(props.currentAccount);
        this.state = {
            mounted: false,
            sub: "",
            sellAssetInput: "",
            sellAsset: null,
            sellAssets: accountAssets,
            sellAmount: "",
            sellImgName: "unknown",
            receiveAssetInput: "",
            receiveAsset: null,
            receiveAssets: accountAssets,
            receiveAmount: "",
            receiveImgName: "unknown",
            activeInput: "",
            activeAmountInput: "",
            lookupQuote: "",
            orders: [],
            orderView: "amount",
            fees: null,
            prices: null,
            isSubscribedToMarket: true
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
        this.handleSubscriptionToggleChange = this.handleSubscriptionToggleChange.bind(
            this
        );
        this.hendleOrderView = this.hendleOrderView.bind(this);
        this.handleSell = this.handleSell.bind(this);
        this._subToMarket = this._subToMarket.bind(this);
        this._checkAndUpdateMarketList = this._checkAndUpdateMarketList.bind(
            this
        );
        this.getAssetList = debounce(AssetActions.getAssetList.defer, 150);
    }

    static getDerivedStateFromProps(props, state) {
        let newState = {};
        if (props.assetToSell) {
            newState = {
                sellAssetInput: props.assetToSell.get("id"),
                sellAsset: props.assetToSell,
                sellImgName: props.assetToSell.get("symbol")
            };
        }
        if (props.assetToReceive) {
            newState = {
                ...newState,
                ...{
                    receiveAssetInput: props.assetToReceive.get("id"),
                    receiveAsset: props.assetToReceive,
                    receiveImgName: props.assetToReceive.get("symbol")
                }
            };
        }
        return newState;
    }

    _routeTo(assetToSell, assetToReceive) {
        let sellRoute = assetToSell;
        let receiveRoute = assetToReceive;
        if (!assetToSell) {
            sellRoute = "";
        }
        if (!assetToReceive) {
            receiveRoute = "";
        }
        let pathName = "/instant-trade/" + sellRoute + "_" + receiveRoute;
        if (__DEV__) {
            console.log(
                "_routeTo: ",
                pathName,
                " old: ",
                this.props.location.pathname
            );
        }
        if (this.props.location.pathname !== pathName) {
            this.props.history.push(pathName);
        }
    }

    _areEqualAssets(asset1, asset2) {
        return (
            this._isLoadedAsset(asset1) &&
            this._isLoadedAsset(asset2) &&
            asset1.get("id") === asset2.get("id")
        );
    }

    _isLoadedAsset(asset) {
        return !!asset && !!asset.toJS;
    }

    _areAssetsGiven() {
        return (
            this._isLoadedAsset(this.props.assetToSell) &&
            this._isLoadedAsset(this.props.assetToReceive)
        );
    }

    _haveAssetsChanged(prevProps) {
        if (
            this._isLoadedAsset(this.props.assetToSell) !==
            this._isLoadedAsset(prevProps.assetToSell)
        ) {
            return true;
        }
        if (
            this._isLoadedAsset(this.props.assetToReceive) !==
            this._isLoadedAsset(prevProps.assetToReceive)
        ) {
            return true;
        }
        if (
            !this._areEqualAssets(
                this.props.assetToSell,
                prevProps.assetToSell
            ) ||
            !this._areEqualAssets(
                this.props.assetToReceive,
                prevProps.assetToReceive
            )
        ) {
            return true;
        }
        return false;
    }

    _hasMarketChanged(prevProps) {
        return (
            JSON.stringify(prevProps.marketData) !==
            JSON.stringify(this.props.marketData)
        );
    }

    componentDidUpdate(prevProps) {
        if (this._haveAssetsChanged(prevProps)) {
            this._assetsHaveChanged();
        } else {
            if (this._hasMarketChanged(prevProps)) {
                this._getOrders();
            }
        }
        if (this.props.searchAssets !== prevProps.searchAssets) {
            this.setState({activeSearch: true});
            let filteredAssets = this.props.searchAssets
                .toArray()
                .filter(a => a.symbol.indexOf(this.state.lookupQuote) !== -1);
            this._checkAndUpdateMarketList(filteredAssets);
        }
        if (this.props.currentAccount !== prevProps.currentAccount) {
            const assets = getAssetsToSell(this.props.currentAccount);
            this.setState({
                sellAssets: assets,
                receiveAssets: assets
            });
        }
    }

    componentDidMount() {
        this.setState({
            mounted: true
        });
        if (this._areAssetsGiven()) {
            this._assetsHaveChanged();
        }
    }

    componentWillUnmount() {
        const {sub} = this.state;
        const {sellAssetId, receiveAssetId} = this.getAssetsDetails();
        if (sub) {
            MarketsActions.unSubscribeMarket(sellAssetId, receiveAssetId);
        }
    }

    async _subToMarket() {
        const {
            receiveAsset: baseAsset,
            sellAsset: quoteAsset,
            sub
        } = this.state;
        if (baseAsset && quoteAsset) {
            const {
                receiveAssetId: baseAssetId,
                sellAssetId: quoteAssetId
            } = this.getAssetsDetails();
            const {bucketSize, currentGroupOrderLimit} = this.props;
            if (sub) {
                let [qa, ba] = sub.split("_");
                if (qa === quoteAssetId && ba === baseAssetId) {
                    return;
                }
                await MarketsActions.unSubscribeMarket(qa, ba);
            }
            await MarketsActions.subscribeMarket(
                baseAsset,
                quoteAsset,
                3600,
                0
            );
            this.setState(
                {
                    sub: `${quoteAssetId}_${baseAssetId}`
                },
                () => {
                    this.getAllPrices();
                    this.getAllFees();
                }
            );
        }
    }

    async getAllFees() {
        const {currentAccount} = this.props;
        const {sellAsset, receiveAsset} = this.state;
        if (sellAsset && receiveAsset) {
            const fees = await getFees(receiveAsset, sellAsset, currentAccount);
            this.setState({
                fees
            });
        }
    }

    getAssetsDetails() {
        const {sellAsset, receiveAsset} = this.state;
        return {
            sellAssetId: sellAsset ? sellAsset.get("id") : null,
            receiveAssetId: receiveAsset ? receiveAsset.get("id") : null,
            sellAssetPrecision: sellAsset ? sellAsset.get("precision") : null,
            receiveAssetPrecision: receiveAsset
                ? receiveAsset.get("precision")
                : null,
            sellAssetSymbol: sellAsset ? sellAsset.get("symbol") : null,
            receiveAssetSymbol: receiveAsset ? receiveAsset.get("symbol") : null
        };
    }

    getAllPrices() {
        const {activeMarketHistory, feedPrice} = this.props;
        const prices = getPrices(activeMarketHistory, feedPrice);
        this.setState({
            prices
        });
    }

    _getOrders() {
        if (!this.state.isSubscribedToMarket) {
            console.log(this.props.marketData);
            // if the user wants to inspect current orders, pause updating
            return;
        }
        const {combinedBids} = this.props.marketData;
        const {
            sellAsset,
            receiveAsset,
            sellAmount,
            receiveAmount,
            activeInput
        } = this.state;
        const {
            sellAssetPrecision,
            receiveAssetPrecision
        } = this.getAssetsDetails();
        if (__DEV__) {
            console.log("_getOrders", this.props.marketData);
        }
        if (combinedBids && combinedBids.length) {
            if (sellAsset && receiveAsset) {
                switch (activeInput) {
                    case "receiveAsset":
                        if (sellAmount) {
                            const orders = getOrders(
                                sellAmount * 10 ** sellAssetPrecision,
                                combinedBids,
                                "sell"
                            );
                            this.setState(
                                {
                                    orders,
                                    ordersUpdated: new Date()
                                },
                                () => this.updateReceiveAmount()
                            );
                        }
                        break;
                    case "sellAsset":
                        if (receiveAmount) {
                            const orders = getOrders(
                                receiveAmount * 10 ** receiveAssetPrecision,
                                combinedBids,
                                "receive"
                            );
                            this.setState(
                                {
                                    orders,
                                    ordersUpdated: new Date()
                                },
                                () => this.updateSellAmount()
                            );
                        }
                        break;
                    case "sell":
                        if (sellAmount) {
                            const orders = getOrders(
                                sellAmount * 10 ** sellAssetPrecision,
                                combinedBids,
                                "sell"
                            );
                            this.setState(
                                {
                                    orders,
                                    ordersUpdated: new Date()
                                },
                                () => this.updateReceiveAmount()
                            );
                        } else {
                            this.setState({
                                orders: [],
                                receiveAmount: ""
                            });
                        }
                        break;
                    case "receive":
                        if (receiveAmount) {
                            const orders = getOrders(
                                receiveAmount * 10 ** receiveAssetPrecision,
                                combinedBids,
                                "receive"
                            );
                            this.setState(
                                {
                                    orders,
                                    ordersUpdated: new Date()
                                },
                                () => this.updateSellAmount()
                            );
                        } else {
                            this.setState({
                                orders: [],
                                sellAmount: ""
                            });
                        }
                        break;
                }
            }
        }
    }

    _assetsHaveChanged() {
        this._subToMarket();
    }

    async _setSellAsset(
        assetObjectIdOrSymbol,
        activeInput = "sellAsset",
        fireChanged = true
    ) {
        let asset = null;
        if (typeof assetObjectIdOrSymbol === "string") {
            asset = await FetchChain("getAsset", assetObjectIdOrSymbol);
        } else {
            asset = assetObjectIdOrSymbol;
        }
        if (__DEV__) {
            console.log("_setSellAsset", assetObjectIdOrSymbol, asset);
        }

        this.setState(
            {
                activeInput: activeInput
            },
            () => {
                this._routeTo(
                    asset.get("symbol"),
                    !!this.props.assetToReceive
                        ? this.props.assetToReceive.get("symbol")
                        : ""
                );
            }
        );
    }

    async _setReceiveAsset(
        assetObjectIdOrSymbol,
        activeInput = "receiveAsset",
        fireChanged = true
    ) {
        let asset = null;
        if (typeof assetObjectIdOrSymbol === "string") {
            asset = await FetchChain("getAsset", assetObjectIdOrSymbol);
        } else {
            asset = assetObjectIdOrSymbol;
        }
        if (__DEV__) {
            console.log("_setReceiveAsset", assetObjectIdOrSymbol, asset);
        }
        this.setState(
            {
                activeInput: activeInput
            },
            () => {
                this._routeTo(
                    !!this.props.assetToSell
                        ? this.props.assetToSell.get("symbol")
                        : "",
                    asset.get("symbol")
                );
            }
        );
    }

    async _swapAssets(activeInput, fireChanged = true) {
        this.setState(
            {
                sellAmount:
                    activeInput === "sellAsset" ? "" : this.state.receiveAmount,
                receiveAmount:
                    activeInput === "receiveAsset" ? "" : this.state.sellAmount,
                activeInput: activeInput
            },
            () => {
                this._routeTo(
                    this.state.receiveAsset.get("symbol"),
                    this.state.sellAsset.get("symbol")
                );
            }
        );
    }

    async onSellAssetInputChange(assetIdOrSymbol) {
        const {receiveAssetId} = this.getAssetsDetails();

        if (assetIdOrSymbol === receiveAssetId) {
            this._swapAssets("sellAsset");
        } else {
            this._setSellAsset(assetIdOrSymbol);
        }
    }

    async onReceiveAssetInputChange(assetIdOrSymbol) {
        const {sellAssetId} = this.getAssetsDetails();

        if (assetIdOrSymbol === sellAssetId) {
            this._swapAssets("receiveAsset");
        } else {
            this._setReceiveAsset(assetIdOrSymbol);
        }
    }

    onReceiveAssetSearch(e) {
        if (!this.state.mounted) return;
        let isValidName = !ChainValidation.is_valid_symbol_error(e, true);
        if (!isValidName) {
            /* Don't lookup invalid asset names */
            this.setState({
                receiveAsset: null,
                receiveAssetInput: e,
                activeSearch: false
            });
            return;
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
                    this._subToMarket();
                }
            );
        }, 100);
    }

    onSellAmountChange(e) {
        if (!this.state.mounted) return;
        if (e.asset !== this.state.sellAssetInput) {
            this.onSellAssetInputChange(e.asset);
        }
        this.setState(
            {
                sellAmount: e.amount,
                activeInput: "sell",
                activeAmountInput: "sell"
            },
            () => {
                this._getOrders();
            }
        );
    }

    onReceiveAmountChange(e) {
        if (!this.state.mounted) return;
        if (e.asset !== this.state.receiveAssetInput) {
            this.onReceiveAssetInputChange(e.asset);
        }
        this.setState(
            {
                receiveAmount: e.amount,
                activeInput: "receive",
                activeAmountInput: "receive"
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
            this._swapAssets("neither");
        }
    }

    handleSubscriptionToggleChange() {
        this.setState(state => {
            return {
                isSubscribedToMarket: !state.isSubscribedToMarket
            };
        });
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
        const {sellAmount, receiveAmount} = this.state;
        const {
            sellAssetId,
            receiveAssetId,
            sellAssetPrecision,
            receiveAssetPrecision
        } = this.getAssetsDetails();
        const forSale = new Asset({
            asset_id: sellAssetId,
            precision: sellAssetPrecision,
            amount: sellAmount * 10 ** sellAssetPrecision
        });
        const toReceive = new Asset({
            asset_id: receiveAssetId,
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
                asset_id: "1.3.0",
                amount: 0
            },
            fill_or_kill: true
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
                                    symbol: receiveAssetId
                                }
                            )
                        });
                }
            })
            .catch(e => {
                console.error("order failed:", e);
            });
    }

    updateSellAmount() {
        const {orders, receiveAmount} = this.state;
        const {
            sellAssetPrecision,
            receiveAssetPrecision
        } = this.getAssetsDetails();
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
        const {orders, sellAmount} = this.state;
        const {
            sellAssetPrecision,
            receiveAssetPrecision
        } = this.getAssetsDetails();
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
        return this._areAssetsGiven();
    }

    _getTransactionFee(denominationAssetId) {
        const {fees, prices} = this.state;
        const {sellAssetId} = this.getAssetsDetails();
        if (fees) {
            if (fees.transactionFee[sellAssetId]) {
                if (
                    !denominationAssetId ||
                    denominationAssetId === sellAssetId
                ) {
                    return (
                        fees.transactionFee[sellAssetId].fee.amount /
                        10 ** fees.transactionFee[sellAssetId].fee.precision
                    );
                } else {
                    return (
                        (fees.transactionFee[sellAssetId].fee.amount /
                            10 **
                                fees.transactionFee[sellAssetId].fee
                                    .precision) *
                        prices.latestPrice
                    );
                }
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    }

    _getMarketFee(denomindatedAssetId) {
        const {fees, prices, receiveAmount} = this.state;
        const {receiveAssetId} = this.getAssetsDetails();
        if (fees) {
            if (
                !denomindatedAssetId ||
                denomindatedAssetId === receiveAssetId
            ) {
                return (fees.marketFee.baseMarketFee * receiveAmount) / 10000;
            } else {
                return (
                    (fees.marketFee.baseMarketFee * receiveAmount) /
                    prices.latestPrice /
                    10000
                );
            }
        } else {
            return 0;
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
        const {sellAmount, receiveAmount} = this.state;
        const {
            sellAssetId,
            receiveAssetId,
            sellAssetPrecision,
            receiveAssetPrecision,
            receiveAssetSymbol
        } = this.getAssetsDetails();
        const priceSection = this.getPriceSection();
        const priceExtra = (
            <React.Fragment>
                {counterpart.translate(
                    "exchange.quick_trade_details.effective"
                )}{" "}
                <FormattedPrice
                    base_asset={sellAssetId}
                    quote_asset={receiveAssetId}
                    base_amount={sellAmount * 10 ** sellAssetPrecision}
                    quote_amount={receiveAmount * 10 ** receiveAssetPrecision}
                    noPopOver
                    force_direction={receiveAssetSymbol}
                    noInvertTip
                />
            </React.Fragment>
        );
        const feeSection = this.getFeeSection();
        const ordersSection = this.getOrdersSection();
        const totalPercentFee =
            counterpart.translate("exchange.quick_trade_details.effective") +
            " " +
            (this.getTotalPercentFee() * 100).toFixed(2);
        const amountOfOrders = this.state.orders.length;
        const ordersCaption =
            amountOfOrders < 2
                ? counterpart.translate("exchange.quick_trade_details.order")
                : counterpart.translate("exchange.quick_trade_details.orders");
        return (
            <Collapse
                className="asset-collapse"
                style={{
                    marginTop: "1rem"
                }}
            >
                <Collapse.Panel
                    header={counterpart.translate("exchange.price")}
                    extra={priceExtra}
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

    showFeedPrice() {
        const {sellAsset, receiveAsset} = this.state;
        const {sellAssetId, receiveAssetId} = this.getAssetsDetails();
        const receiveCollateralAsset = receiveAsset.getIn([
            "bitasset",
            "options",
            "short_backing_asset"
        ]);
        const sellCollateralAsset = sellAsset.getIn([
            "bitasset",
            "options",
            "short_backing_asset"
        ]);
        return (
            receiveCollateralAsset === sellAssetId ||
            sellCollateralAsset === receiveAssetId
        );
    }

    getPriceSection() {
        const {prices, sellAmount, receiveAmount} = this.state;
        const {
            sellAssetId,
            receiveAssetId,
            sellAssetPrecision,
            receiveAssetPrecision,
            receiveAssetSymbol
        } = this.getAssetsDetails();
        return (
            <Row>
                <Col span={12}>
                    <div>
                        {counterpart.translate(
                            "exchange.quick_trade_details.your_price"
                        )}
                    </div>
                    {this.showFeedPrice() && (
                        <div>
                            {counterpart.translate(
                                "exchange.quick_trade_details.feed_price"
                            )}
                        </div>
                    )}
                    <div>
                        {counterpart.translate(
                            "exchange.quick_trade_details.last_price"
                        )}
                    </div>
                </Col>
                <Col span={12} style={{textAlign: "right"}}>
                    <div>
                        <FormattedPrice
                            base_asset={sellAssetId}
                            quote_asset={receiveAssetId}
                            base_amount={sellAmount * 10 ** sellAssetPrecision}
                            quote_amount={
                                receiveAmount * 10 ** receiveAssetPrecision
                            }
                            noPopOver
                            force_direction={receiveAssetSymbol}
                            noInvertTip
                        />
                    </div>
                    {this.showFeedPrice() && (
                        <div>
                            <FormattedPrice
                                base_asset={sellAssetId}
                                quote_asset={receiveAssetId}
                                base_amount={1 * 10 ** sellAssetPrecision}
                                quote_amount={
                                    prices.feedPrice *
                                    10 ** receiveAssetPrecision
                                }
                                noPopOver
                                force_direction={receiveAssetSymbol}
                                noInvertTip
                            />
                        </div>
                    )}
                    <div>
                        <FormattedPrice
                            base_asset={sellAssetId}
                            quote_asset={receiveAssetId}
                            base_amount={1 * 10 ** sellAssetPrecision}
                            quote_amount={
                                prices.latestPrice * 10 ** receiveAssetPrecision
                            }
                            noPopOver
                            force_direction={receiveAssetSymbol}
                            noInvertTip
                        />
                    </div>
                </Col>
            </Row>
        );
    }

    getFeeSection() {
        const {sellAmount, receiveAmount} = this.state;
        const {
            sellAssetPrecision,
            receiveAssetPrecision,
            sellAssetSymbol,
            receiveAssetSymbol
        } = this.getAssetsDetails();

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
        const liqidityPenalty = this.showFeedPrice()
            ? `${liqidityPenaltyMarket} / ${liqidityPenaltyFeed}`
            : liqidityPenaltyMarket;

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
        const {orders, orderView} = this.state;
        const {
            sellAssetId,
            receiveAssetId,
            sellAssetPrecision,
            sellAssetSymbol,
            receiveAssetSymbol
        } = this.getAssetsDetails();
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
                <AssetName name={sellAssetSymbol} noTip />)
            </span>
        );

        const price = (
            <span>
                {counterpart.translate("exchange.quick_trade_details.price")}
                &nbsp;(
                <FormattedPrice
                    base_asset={sellAssetId}
                    quote_asset={receiveAssetId}
                    noPopOver
                    force_direction={receiveAssetSymbol}
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
                key: "id",
                width: "20%"
            },
            {
                title: counterpart.translate(
                    "exchange.quick_trade_details.seller"
                ),
                dataIndex: "seller",
                key: "seller",
                width: "20%"
            },
            {
                title: amount,
                dataIndex: "amount",
                key: "amount",
                width: "30%"
            },
            {
                title: price,
                dataIndex: "price",
                key: "price"
            }
        ];
        return (
            <div>
                <Switch
                    style={{marginLeft: "0px"}}
                    onChange={this.handleSubscriptionToggleChange}
                    checked={this.state.isSubscribedToMarket}
                />
                {this.state.ordersUpdated && (
                    <div style={{float: "right"}}>
                        {counterpart.localize(this.state.ordersUpdated)}
                    </div>
                )}
                <Translate
                    onClick={this.handleSubscriptionToggleChange}
                    content="exchange.quick_trade_details.subscribe_to_market"
                    style={{
                        marginLeft: "10px",
                        cursor: "pointer"
                    }}
                />
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    style={{width: "100%", marginTop: "10px"}}
                    pagination={
                        dataSource.length > 5
                            ? {
                                  pageSize: 5
                              }
                            : false
                    }
                />
            </div>
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

    hasBalance() {
        const {sellAmount} = this.state;
        const {currentAccount} = this.props;
        const accountBalances = currentAccount.get("balances").toJS();
        const {sellAssetId, sellAssetPrecision} = this.getAssetsDetails();
        if (!accountBalances[sellAssetId]) {
            return false;
        }
        const balance = ChainStore.getObject(accountBalances[sellAssetId]).get(
            "balance"
        );
        const transactionFee = this._getTransactionFee();
        return (
            sellAmount * 10 ** sellAssetPrecision +
                transactionFee * 10 ** sellAssetPrecision <
            +balance
        );
    }

    render() {
        const {
            sellAssetInput,
            sellAssets,
            sellAmount,
            sellImgName,
            receiveAssetInput,
            receiveAssets,
            receiveAmount,
            receiveImgName,
            sub
        } = this.state;
        const {sellAssetId, receiveAssetId} = this.getAssetsDetails();

        const Details = this.showDetails() ? this.getDetails() : null;

        return (
            <Card
                className="quick-trade"
                style={{
                    align: "center",
                    display: "flex",
                    justifyContent: "center",
                    minWidth: "300px",
                    marginTop: "1rem"
                }}
            >
                <SellReceive
                    sellAssetInput={sellAssetInput}
                    sellAsset={sellAssetId}
                    sellAssets={sellAssets}
                    sellAmount={sellAmount}
                    sellImgName={sellImgName}
                    onSellAssetInputChange={this.onSellAssetInputChange}
                    onSellAmountChange={this.onSellAmountChange}
                    receiveAssetInput={receiveAssetInput}
                    receiveAsset={receiveAssetId}
                    receiveAssets={receiveAssets}
                    receiveAmount={receiveAmount}
                    receiveImgName={receiveImgName}
                    onReceiveAssetInputChange={this.onReceiveAssetInputChange}
                    onReceiveAmountChange={this.onReceiveAmountChange}
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
                    <Tooltip
                        title={
                            !this.hasBalance()
                                ? counterpart.translate("exchange.no_balance")
                                : null
                        }
                    >
                        <Button
                            key="sell"
                            type="primary"
                            disabled={
                                !this.showDetails() ||
                                !sub ||
                                !this.hasBalance()
                            }
                            onClick={this.handleSell}
                        >
                            {counterpart.translate("exchange.sell")}
                        </Button>
                    </Tooltip>
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
                currentGroupOrderLimit: MarketsStore.getState()
                    .currentGroupOrderLimit,
                feedPrice: MarketsStore.getState().feedPrice,
                marketLimitOrders: MarketsStore.getState().marketLimitOrders
            };
        }
    }
);

export default (QuickTrade = bindToCurrentAccount(QuickTrade));
