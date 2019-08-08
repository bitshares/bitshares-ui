import React, {Component} from "react";
import {bindToCurrentAccount} from "../Utility/BindToCurrentAccount";
import {connect} from "alt-react";
import AssetStore from "../../stores/AssetStore";
import MarketsStore from "../../stores/MarketsStore";
import {Card} from "bitshares-ui-style-guide";
import SellReceive from "components/QuickTrade/SellReceive";
import {validate} from "@babel/types";
import MarketsActions from "actions/MarketsActions";
import {getAssetsToSell} from "./QuickTradeHelper";
import {ChainStore} from "bitsharesjs";

const ASSET_PLACEHOLDER = "-";

class QuickTrade extends Component {
    constructor(props) {
        super(props);
        this.state = {
            mounted: false,
            isDetailsVisible: false,
            swappable: false,
            sellAmount: null,
            receiveAmount: null,
            assetToSell: null,
            assetToReceive: null,
            sellAssetPlaceholder: ASSET_PLACEHOLDER,
            receiveAssetPlaceholder: ASSET_PLACEHOLDER,
            assetsToSell: this.getAssetsToSell(),
            assetsToReceive: []
        };
        this.onSellChange = this.onSellChange.bind(this);
        this.onReceiveChange = this.onReceiveChange.bind(this);
        this.onSwap = this.onSwap.bind(this);
        this._subToMarket = this._subToMarket.bind(this);
    }

    componentDidMount() {
        const {bucketSize, currentGroupOrderLimit} = this.props;
        this.setState({
            mounted: true
        });

        const baseAsset = ChainStore.getAsset("1.3.0");
        const quoteAsset = ChainStore.getAsset("1.3.2672");

        MarketsActions.subscribeMarket.defer(
            baseAsset,
            quoteAsset,
            bucketSize,
            currentGroupOrderLimit
        );
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

    onSellChange(e) {
        //TODO checkDetails, checkSwappability
        if (!this.state.mounted) return;
        const {asset, amount} = e;
        if (asset) {
            this.setState({
                sellAmount: amount,
                assetToSell: asset.get("id"),
                sellAssetPlaceholder: null,
                assetsToReceive: this.getAssetsToReceive()
            });
            if (this.state.assetToReceive) this.updateReceiveAmount();
        } else {
            this.setState({
                sellAmount: amount
            });
        }
    }

    onReceiveChange(e) {
        //TODO checkDetails, checkSwappability
        if (!this.state.mounted) return;
        const {asset} = e;
        this.setState({
            receiveAmount: this.state.receiveAmount,
            receiveAssetPlaceholder: null,
            assetToReceive: asset.get("id")
        });
        this.updateReceiveAmount();
    }

    onSwap() {
        const {assetToSell, assetToReceive} = this.state;
        if (this.state.swappable) {
            this.setState({
                assetToSell: assetToReceive,
                assetToReceive: assetToSell
            });
            this.updateReceiveAmount();
        }
    }

    updateReceiveAmount() {
        this.setState({
            receiveAmount: Math.random().toString() //TODO
        });
    }

    getAssetsToSell() {
        return ["1.3.0", "1.3.121", "1.3.1999"]; //TODO
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

    checkSwappability() {}

    render() {
        const {
            isDetailsVisible,
            sellAmount,
            receiveAmount,
            assetToSell,
            assetToReceive,
            assetsToSell,
            assetsToReceive,
            sellAssetPlaceholder,
            receiveAssetPlaceholder
        } = this.state;
        console.log(this.props);

        const Details = this.getDetails();

        return (
            <Card
                className="quick-trade"
                style={{
                    align: "center",
                    display: "flex",
                    justifyContent: "center"
                }}
            >
                <SellReceive
                    sellAmount={sellAmount}
                    receiveAmount={receiveAmount}
                    assetToSell={assetToSell}
                    assetToReceive={assetToReceive}
                    assetsToSell={assetsToSell}
                    assetsToReceive={assetsToReceive}
                    sellAssetPlaceholder={sellAssetPlaceholder}
                    receiveAssetPlaceholder={receiveAssetPlaceholder}
                    onSellChange={this.onSellChange}
                    onReceiveChange={this.onReceiveChange}
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
                markets: MarketsStore.getState().marketData,
                activeMarketHistory: MarketsStore.getState()
                    .activeMarketHistory,
                bucketSize: MarketsStore.getState().bucketSize,
                currentGroupOrderLimit: MarketsStore.getState().bucketSize
            };
        }
    }
);

export default (QuickTrade = bindToCurrentAccount(QuickTrade));
