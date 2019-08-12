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
import FormattedPrice from "../Utility/FormattedPrice";

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
            lookupQuote: ""
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

    async componentDidMount() {
        const {currentAccount} = this.props;
        const baseAsset = ChainStore.getAsset("1.3.1999");
        const quoteAsset = ChainStore.getAsset("1.3.0");

        const fees = await getFees(baseAsset, quoteAsset, currentAccount);
        console.log("fees", fees);

        this.setState({
            mounted: true,
            sellAssets: getAssetsToSell(currentAccount)
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
    }

    _subToMarket(baseAssetId, quoteAssetId) {
        const {bucketSize, currentGroupOrderLimit} = this.props;
        if (baseAssetId && quoteAssetId) {
            const baseAsset = ChainStore.getAsset(baseAssetId);
            const quoteAsset = ChainStore.getAsset(quoteAssetId);
            MarketsActions.subscribeMarket.defer(
                baseAsset,
                quoteAsset,
                bucketSize,
                currentGroupOrderLimit
            );
            this.setState({
                sub: `${quoteAsset.get("symbol")}_${baseAsset.get("symbol")}`
            });
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
                    this._subToMarket(sellAsset, receiveAsset);
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
                        this._subToMarket(sellAsset, receiveAsset);
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
                sellAmount: amount
            },
            () => this.updateReceiveAmount()
        );
    }

    onReceiveAmountChange(e) {
        if (!this.state.mounted) return;
        const {amount} = e;
        this.setState(
            {
                receiveAmount: amount
            },
            () => this.updateSellAmount()
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
        this.setState({
            receiveAmount: Math.random().toString() //TODO
        });
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
        const amountOfOrders = this.getAmountOfOrders();
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
                    extra={amountOfOrders}
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
        return (
            <Row>
                <Col span={12}>
                    <p>
                        {counterpart.translate(
                            "exchange.quick_trade_details.your_price"
                        )}
                    </p>
                    <p>
                        {counterpart.translate(
                            "exchange.quick_trade_details.feed_price"
                        )}
                    </p>
                    <p>
                        {counterpart.translate(
                            "exchange.quick_trade_details.last_price"
                        )}
                    </p>
                </Col>
                <Col span={12} style={{textAlign: "right"}}>
                    <p>{this.getYourPrice()}</p>
                    <p>1005615136143614</p>
                    <p>3514313514351351</p>
                </Col>
            </Row>
        );
    }

    getFeeSection() {
        return (
            <Row>
                <Col span={12}>
                    <p>
                        {counterpart.translate(
                            "exchange.quick_trade_details.liquidity_penalty"
                        )}
                    </p>
                    <p>
                        {counterpart.translate(
                            "exchange.quick_trade_details.market_fee"
                        )}
                    </p>
                    <p>
                        {counterpart.translate(
                            "exchange.quick_trade_details.transaction_fee"
                        )}
                    </p>
                </Col>
                <Col span={12} style={{textAlign: "right"}}>
                    <p>53441433143535</p>
                    <p>1005615136143614</p>
                    <p>3514313514351351</p>
                </Col>
            </Row>
        );
    }

    getOrdersSection() {
        const dataSource = [
            {
                key: "1",
                id: "123",
                seller: "Account1",
                amount: 32,
                price: "13.5"
            },
            {
                key: "2",
                id: "124",
                seller: "Account2",
                amount: 15,
                price: "15.5"
            }
        ];

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
                title: counterpart.translate(
                    "exchange.quick_trade_details.amount"
                ),
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
                quote_amount={receiveAmount * 10 ** receiveAssetPrecession}
                quote_asset={receiveAsset}
                base_asset={sellAsset}
                base_amount={sellAmount * 10 ** sellAssetPrecession}
            />
        );
    }

    getTotalPercentFee() {
        return "1%"; //TODO
    }

    getAmountOfOrders() {
        return "3"; //TODO
    }

    render() {
        console.log("PROPS", this.props);
        console.log("STATE", this.state);
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
        const {
            activeMarketHistory,
            feedPrice,
            marketData,
            searchAssets
        } = this.props;
        console.log("in render");

        if (
            marketData &&
            marketData.combinedBids &&
            marketData.combinedBids.length
        ) {
            console.log(
                "ORDERS",
                getOrders(2000 * 10 ** 5, marketData.combinedBids)
            );
        }

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
