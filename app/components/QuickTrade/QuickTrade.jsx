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
    getOrdersWithSellAmount,
    getOrdersWithReceiveAmount,
    getFees
} from "./QuickTradeHelper";
import {ChainStore} from "bitsharesjs";
import {debounce} from "lodash-es";
import AssetActions from "actions/AssetActions";
import {ChainValidation} from "bitsharesjs";
import {lookupAssets} from "../Exchange/MarketPickerHelpers";
import counterpart from "counterpart";
import FormattedPrice from "../Utility/FormattedPrice";
import LinkToAccountById from "../Utility/LinkToAccountById";

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
            sellImgName: "BTS",
            receiveAssetInput: "",
            receiveAsset: "",
            receiveAssets: [],
            receiveAmount: "",
            receiveImgName: "BTS",
            lookupQuote: "",
            orders: [],
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
        this.onSwap = this.onSwap.bind(this);
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
        this.setState({
            mounted: true,
            sellAssets: getAssetsToSell(currentAccount)
        });
    }

    componentWillReceiveProps(nextProps) {
        //      console.log("nextProps", nextProps)
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
            this.getOrders(); ///CHECK
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
            this.getAllFees();
            this.getAllPrices();
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

    getOrders() {
        const {combinedBids} = this.props.marketData;
        if (combinedBids && combinedBids.length) {
            const {
                sellAsset,
                receiveAsset,
                sellAmount,
                receiveAmount
            } = this.state;
            if (sellAmount && sellAsset && receiveAsset) {
                const sellAssetPrecession = ChainStore.getAsset(sellAsset).get(
                    "precision"
                );
                const orders = getOrdersWithSellAmount(
                    sellAmount * 10 ** sellAssetPrecession,
                    combinedBids
                );
                this.setState(
                    {
                        orders
                    },
                    () => this.updateReceiveAmount()
                );
            } else if (receiveAmount && sellAsset && receiveAsset) {
                const receiveAssetPrecession = ChainStore.getAsset(
                    receiveAsset
                ).get("precision");
                const orders = getOrdersWithReceiveAmount(
                    receiveAmount * 10 ** receiveAssetPrecession,
                    combinedBids
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
        const sellAssets = getAssetsToSell(this.props.currentAccount);
        const filteredSellAssets = sellAssets.filter(item => {
            return ChainStore.getAsset(item)
                ? ChainStore.getAsset(item)
                      .get("symbol")
                      .includes(e)
                : false;
        });
        let asset = "";
        if (ChainStore.getAsset(e)) {
            const assetId = ChainStore.getAsset(e).get("id");
            if (filteredSellAssets.includes(assetId)) {
                asset = e;
            }
        }
        if (filteredSellAssets.length === 1) {
            asset = filteredSellAssets[0];
        }
        const assetImage = asset
            ? ChainStore.getAsset(asset).get("symbol")
            : "BTS";
        this.setState(
            {
                sellAsset: asset,
                sellAssets: filteredSellAssets,
                sellAssetInput: e,
                sellImgName: assetImage
            },
            () => {
                const {sellAsset, receiveAsset} = this.state;
                if (sellAsset && receiveAsset) {
                    this._subToMarket(receiveAsset, sellAsset);
                }
            }
        );
    }

    onReceiveAssetInputChange(e) {
        if (!this.state.mounted) return;
        let isValidName = !ChainValidation.is_valid_symbol_error(e, true);
        if (!isValidName) {
            /* Don't lookup invalid asset names */
            this.setState({
                receiveAsset: "",
                receiveAssetInput: e,
                activeSearch: false,
                receiveAssets: []
            });
            return;
        } else {
            this.setState({
                receiveAsset: "",
                receiveAssetInput: e,
                activeSearch: true,
                receiveAssets: []
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
        const receiveAssets = marketsList.map(asset => asset.id);
        clearInterval(this.intervalId);
        const {receiveAssetInput} = this.state;
        let asset = "";
        if (ChainStore.getAsset(receiveAssetInput)) {
            const assetId = ChainStore.getAsset(receiveAssetInput).get("id");
            if (receiveAssets.includes(assetId)) {
                asset = ChainStore.getAsset(receiveAssetInput).get("id");
            }
        }
        if (receiveAssets.length === 1) asset = receiveAssets[0];
        const assetImage = asset
            ? ChainStore.getAsset(asset).get("symbol")
            : "BTS";

        this.intervalId = setInterval(() => {
            clearInterval(this.intervalId);
            this.setState(
                {
                    receiveAsset: asset,
                    receiveAssets,
                    activeSearch: false,
                    receiveImgName: assetImage
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
        this.setState(
            {
                sellAmount: amount,
                receiveAmount: ""
            },
            () => {
                this.getOrders();
            }
        );
    }

    onReceiveAmountChange(e) {
        if (!this.state.mounted) return;
        const {amount} = e;
        this.setState(
            {
                receiveAmount: amount,
                sellAmount: ""
            },
            () => {
                this.getOrders();
            }
        );
    }

    onSellImageError() {
        this.setState({
            sellImgName: "BTS"
        });
    }

    onReceiveImageError() {
        this.setState({
            receiveImgName: "BTS"
        });
    }

    onSwap() {
        if (this.isSwappable()) {
            const {
                sellAsset,
                receiveAsset,
                sellImgName,
                receiveImgName,
                sellAssetInput,
                receiveAssetInput,
                receiveAmount
            } = this.state;
            this.setState(
                {
                    sellAsset: receiveAsset,
                    receiveAsset: sellAsset,
                    sellAssets: [receiveAsset],
                    receiveAssets: [sellAsset],
                    sellAssetInput: receiveAssetInput,
                    receiveAssetInput: sellAssetInput,
                    sellImgName: receiveImgName,
                    receiveImgName: sellImgName,
                    sellAmount: receiveAmount
                },
                () => this.updateReceiveAmount()
            );
        }
    }

    handleSell() {
        console.log("Sell"); //TODO
    }

    handleCancel() {
        this.props.history.goBack();
    }

    updateSellAmount() {
        this.setState({
            sellAmount: Math.random().toString() //TODO
        });
    }

    updateReceiveAmount() {
        const {orders, sellAmount, sellAsset, receiveAsset} = this.state;
        const sellAssetPrecession = ChainStore.getAsset(sellAsset).get(
            "precision"
        );
        const receiveAssetPrecession = ChainStore.getAsset(receiveAsset).get(
            "precision"
        );
        if (!orders.length) {
            this.setState({
                receiveAmount: ""
            });
            return;
        }

        if (orders.length === 1) {
            const receiveAmount = (
                orders[0].order.getPrice() * sellAmount
            ).toFixed(receiveAssetPrecession);
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
                sellAmount * 10 ** sellAssetPrecession -
                penultimateOrder.order.total_to_receive.getAmount();
            const lastOrderToReceive =
                (lastOrderForSale *
                    lastOrder.order.getPrice() *
                    10 ** receiveAssetPrecession) /
                10 ** sellAssetPrecession;
            const receiveAmount = (
                (penultimateOrder.order.total_for_sale.getAmount() +
                    lastOrderToReceive) /
                10 ** receiveAssetPrecession
            ).toFixed(receiveAssetPrecession);
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

    getDetails() {
        const priceSection = this.getPriceSection();
        const feeSection = this.getFeeSection();
        const ordersSection = this.getOrdersSection();
        const yourPrice = this.getYourPrice();
        const totalPercentFee = this.getTotalPercentFee();
        const amountOfOrders = this.state.orders.length;
        const ordersCaption = amountOfOrders < 2 ? "order" : "orders";
        return (
            <Collapse
                style={{
                    marginTop: "1rem"
                }}
            >
                <Collapse.Panel
                    header={counterpart.translate("exchange.price")}
                    extra={yourPrice}
                >
                    {priceSection}
                </Collapse.Panel>
                <Collapse.Panel
                    header={counterpart.translate("exchange.fee")}
                    extra={totalPercentFee}
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
        return sellAsset && receiveAsset && sellAmount && receiveAmount
            ? true
            : false;
    }

    getPriceSection() {
        const {prices, sellAmount, receiveAmount, receiveAsset} = this.state;
        const receiveAssetPrecession = ChainStore.getAsset(receiveAsset).get(
            "precision"
        );
        const yourPrice = (receiveAmount / sellAmount).toFixed(
            receiveAssetPrecession
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
                    <div>{yourPrice || "-"}</div>
                    <div>{prices.feedPrice || "-"}</div>
                    <div>{prices.latestPrice || "-"}</div>
                </Col>
            </Row>
        );
    }

    getFeeSection() {
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
                    </div>
                    <div>
                        {counterpart.translate(
                            "exchange.quick_trade_details.transaction_fee"
                        )}
                    </div>
                </Col>
                <Col span={12} style={{textAlign: "right"}}>
                    <div>53441433143535</div>
                    <div>1005615136143614</div>
                    <div>3514313514351351</div>
                </Col>
            </Row>
        );
    }

    getOrdersSection() {
        const {orders, sellAsset} = this.state;
        const sellAssetPrecession = ChainStore.getAsset(sellAsset).get(
            "precision"
        );
        const dataSource = orders.map(item => {
            return {
                key: item.order.id,
                id: item.order.id,
                seller: <LinkToAccountById account={item.order.seller} />,
                amount: item.amount / 10 ** sellAssetPrecession,
                price: item.price
            };
        });

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
                title: `${counterpart.translate(
                    "exchange.quick_trade_details.amount"
                )} (${ChainStore.getAsset(sellAsset).get("symbol")})`,
                dataIndex: "amount",
                key: "amount"
            },
            {
                title: counterpart.translate(
                    "exchange.quick_trade_details.price"
                ),
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
                    dataSource.length > 4
                        ? {
                              pageSize: 5
                          }
                        : false
                }
            />
        );
    }

    getYourPrice() {
        const {sellAmount, receiveAmount, sellAsset, receiveAsset} = this.state;
        const sellAssetPrecession = ChainStore.getAsset(sellAsset).get(
            "precision"
        );
        const receiveAssetPrecession = ChainStore.getAsset(receiveAsset).get(
            "precision"
        );
        return (
            <FormattedPrice
                quote_amount={receiveAmount * 10 ** sellAssetPrecession}
                quote_asset={sellAsset}
                base_asset={receiveAsset}
                base_amount={sellAmount * 10 ** receiveAssetPrecession}
            />
        );
    }

    getTotalPercentFee() {
        return "1%"; //TODO
    }

    render() {
        //        console.log("PROPS", this.props);
        //        console.log("STATE", this.state);
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
            receiveImgName
        } = this.state;
        // const {
        //     activeMarketHistory,
        //     feedPrice,
        //     marketData,
        //     searchAssets
        // } = this.props;
        //        console.log("in render");

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
                        disabled={!this.showDetails()}
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
