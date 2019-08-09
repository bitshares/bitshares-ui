import React, {Component} from "react";
import {bindToCurrentAccount} from "../Utility/BindToCurrentAccount";
import {connect} from "alt-react";
import AssetStore from "../../stores/AssetStore";
import MarketsStore from "../../stores/MarketsStore";
import {Card} from "bitshares-ui-style-guide";
import SellReceive from "components/QuickTrade/SellReceive";
import MarketsActions from "actions/MarketsActions";
import {getAssetsToSell, getPrices, getOrders} from "./QuickTradeHelper";
import {ChainStore} from "bitsharesjs";

class QuickTrade extends Component {
    constructor(props) {
        super(props);
        this.state = {
            mounted: false,
            isDetailsVisible: false,
            sellAssetInput: "",
            sellAsset: "",
            sellAssets: [],
            sellAmount: "",
            sellImgName: "BTS",
            receiveAssetInput: "",
            receiveAsset: "",
            receiveAssets: [],
            receiveAmount: "",
            receiveImgName: "BTS"
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
        this._subToMarket = this._subToMarket.bind(this);
    }

    componentDidMount() {
        const {bucketSize, currentGroupOrderLimit} = this.props;
        const baseAsset = ChainStore.getAsset("1.3.1999");
        const quoteAsset = ChainStore.getAsset("1.3.0");

        if (baseAsset && quoteAsset) {
            this._subToMarket(
                {baseAsset, quoteAsset},
                bucketSize,
                currentGroupOrderLimit
            );
        }
        this.setState({
            mounted: true,
            sellAssets: getAssetsToSell(this.props.currentAccount),
            receiveAssets: this.getAssetsToReceive()
        });
    }

    _subToMarket(props, newBucketSize, newGroupLimit) {
        let {quoteAsset, baseAsset, bucketSize, currentGroupOrderLimit} = props;
        if (newBucketSize) {
            bucketSize = newBucketSize;
        }
        if (newGroupLimit) {
            currentGroupOrderLimit = newGroupLimit;
        }
        if (quoteAsset.get("id") && baseAsset.get("id")) {
            MarketsActions.subscribeMarket.defer(
                baseAsset,
                quoteAsset,
                bucketSize,
                currentGroupOrderLimit
            );
            this.setState({
                sub: `${quoteAsset.get("id")}_${baseAsset.get("id")}`
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
        const asset =
            filteredSellAssets.length === 1 ? filteredSellAssets[0] : "";
        const assetImage = asset
            ? ChainStore.getAsset(asset).get("symbol")
            : "BTS";
        this.setState({
            sellAsset: asset,
            sellAssets: filteredSellAssets,
            sellAssetInput: e,
            sellImgName: assetImage
        });
    }

    onReceiveAssetInputChange(e) {
        const receiveAssets = this.getAssetsToReceive();
        const filteredReceiveAssets = receiveAssets.filter(item => {
            return ChainStore.getAsset(item)
                ? ChainStore.getAsset(item)
                      .get("symbol")
                      .includes(e)
                : false;
        });
        const asset =
            filteredReceiveAssets.length === 1 ? filteredReceiveAssets[0] : "";
        const assetImage = asset
            ? ChainStore.getAsset(asset).get("symbol")
            : "BTS";
        this.setState({
            receiveAsset: asset,
            receiveAssets: filteredReceiveAssets,
            receiveAssetInput: e,
            receiveImgName: assetImage
        });
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
        if (this.checkSwappability()) {
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

    getAssetsToReceive() {
        return ["1.3.0", "1.3.121", "1.3.1999"]; //TODO
    }

    getDetails() {
        //TODO
        return (
            <div>
                <p />
                <p>Price</p>
                <p>Fee</p>
                <p>Orders</p>
            </div>
        );
    }

    checkDetails() {
        const {assetToSell, assetToReceive, sellAmount} = this.state;
        if (assetToSell && assetToReceive && sellAmount) {
            this.setState({
                isDetailsVisible: true
            });
        } else {
            this.setState({
                isDetailsVisible: false
            });
        }
    }

    checkSwappability() {
        return true; //TODO
    }

    render() {
        const {
            isDetailsVisible,
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
        const {activeMarketHistory, feedPrice, marketData} = this.props;
        console.log("in render");

        if (
            marketData &&
            marketData.combinedBids &&
            marketData.combinedBids.length
        ) {
            console.dir(getOrders(2000 * 10 ** 5, marketData.combinedBids));
        }

        const Details = this.getDetails();

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
                />
                {isDetailsVisible ? Details : null}
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
                assets: AssetStore.getState().assets,
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
