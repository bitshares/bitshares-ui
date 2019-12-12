import React, {Component} from "react";
import Page404 from "../Page404/Page404";
import QuickTrade from "./QuickTrade";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";

class QuickTradeSubscriber extends Component {
    static propTypes = {
        assetToSell: ChainTypes.ChainAsset,
        assetToReceive: ChainTypes.ChainAsset
    };

    static defaultProps = {
        assetToSell: "CNY",
        assetToReceive: "BTS"
    };

    render() {
        if (!!this.props.assetToReceive.get && !!this.props.assetToSell.get) {
            return <QuickTrade {...this.props} />;
        } else {
            return null;
        }
    }
}

const QuickTradeAssetResolver = BindToChainState(QuickTradeSubscriber, {
    show_loader: true
});

class QuickTradeRouter extends Component {
    render() {
        let symbols = !!this.props.match.params.marketID
            ? this.props.match.params.marketID.toUpperCase().split("_")
            : ["", ""];
        if (symbols.length == 2 && !!symbols[0] && symbols[0] === symbols[1]) {
            return <Page404 subtitle="market_not_found_subtitle" />;
        }
        if (__DEV__) {
            console.log("QuickTradeRouter", symbols);
        }
        return (
            <QuickTradeAssetResolver
                {...this.props}
                assetToSell={symbols[0] || ""}
                assetToReceive={symbols.length == 2 ? symbols[1] : ""}
            />
        );
    }
}

export default QuickTradeRouter;
