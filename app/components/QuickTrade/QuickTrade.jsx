import React, {Component} from "react";
import {bindToCurrentAccount} from "../Utility/BindToCurrentAccount";
import {connect} from "alt-react";
import AssetStore from "../../stores/AssetStore";
import MarketsStore from "../../stores/MarketsStore";
import {
    Switch,
    Button,
    Radio,
    Icon,
    Tooltip,
    Card
} from "bitshares-ui-style-guide";
import SellReceive from "components/QuickTrade/SellReceive";

class QuickTrade extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isDetailsVisible: false,
            swappable: false,
            sellAmount: null,
            receiveAmount: 999,
            assetToSell: null,
            assetToReceive: null,
            assetsToSell: ["1.3.0", "1.3.121", "1.3.1999"],
            assetsToReceive: ["1.3.0", "1.3.121", "1.3.1999"]
        };
        this.onSellChange = this.onSellChange.bind(this);
        this.onReceiveChange = this.onReceiveChange.bind(this);
    }

    onSellChange(e) {
        const {asset, amount} = e;
        this.setState({
            sellAmount: amount,
            assetToSell: asset.get("id")
        });
    }

    onReceiveChange(e) {
        const {asset, amount} = e;
        this.setState({
            receiveAmount: amount,
            assetToReceive: asset.get("id")
        });
    }

    render() {
        console.log(this.state);
        let {
            sellAmount,
            receiveAmount,
            assetToSell,
            assetToReceive,
            assetsToSell,
            assetsToReceive
        } = this.state;

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
                    onSellChange={this.onSellChange}
                    onReceiveChange={this.onReceiveChange}
                />
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
                markets: MarketsStore.getState().marketData
            };
        }
    }
);

export default (QuickTrade = bindToCurrentAccount(QuickTrade));
