import React from "react";
import MarketsStore from "stores/MarketsStore";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import AltContainer from "alt-container";
import Exchange from "./Exchange";
import ChainTypes from "../Utility/ChainTypes";
import LoadingIndicator from "../LoadingIndicator";
import { EmitterInstance } from "graphenejs-lib";
import BindToChainState from "../Utility/BindToChainState";
import MarketsActions from "actions/MarketsActions";

class ExchangeContainer extends React.Component {

    render() {
        let symbols = this.props.params.marketID.split("_");

        return (
                <AltContainer
                    stores={[MarketsStore, AccountStore, SettingsStore]}
                    inject={{
                        marketLimitOrders: () => {
                            return MarketsStore.getState().marketLimitOrders;
                        },
                        marketCallOrders: () => {
                            return MarketsStore.getState().marketCallOrders;
                        },
                        invertedCalls: () => {
                            return MarketsStore.getState().invertedCalls;
                        },
                        marketSettleOrders: () => {
                            return MarketsStore.getState().marketSettleOrders;
                        },
                        marketData: () => {
                            return MarketsStore.getState().marketData;
                        },
                        totals: () => {
                            return MarketsStore.getState().totals;
                        },
                        priceData: () => {
                            return MarketsStore.getState().priceData;
                        },
                        volumeData: () => {
                            return MarketsStore.getState().volumeData;
                        },
                        activeMarketHistory: () => {
                            return MarketsStore.getState().activeMarketHistory;
                        },
                        bucketSize: () => {
                            return MarketsStore.getState().bucketSize;
                        },
                        buckets: () => {
                            return MarketsStore.getState().buckets;
                        },
                        lowestCallPrice: () => {
                            return MarketsStore.getState().lowestCallPrice;
                        },
                        feedPrice: () => {
                            return MarketsStore.getState().feedPrice;
                        },
                        currentAccount: () => {
                            return AccountStore.getState().currentAccount;
                        },
                        linkedAccounts: () => {
                            return AccountStore.getState().linkedAccounts;
                        },
                        viewSettings: () => {
                            return SettingsStore.getState().viewSettings;
                        },
                        settings: () => {
                            return SettingsStore.getState().settings;
                        },
                        starredMarkets: () => {
                            return SettingsStore.getState().starredMarkets;
                        },
                        marketStats: () => {
                            return MarketsStore.getState().marketStats;
                        },
                        marketReady: () => {
                            return MarketsStore.getState().marketReady;
                        }
                    }}
                  >
                    <ExchangeSubscriber router={this.props.router} quoteAsset={symbols[0]} baseAsset={symbols[1]} />
                </AltContainer>
        );
    }
}

let emitter = EmitterInstance.emitter();
let callListener, limitListener, newCallListener, feedUpdateListener, settleOrderListener;

class ExchangeSubscriber extends React.Component {
    static propTypes = {
        currentAccount: ChainTypes.ChainAccount.isRequired,
        quoteAsset: ChainTypes.ChainAsset.isRequired,
        baseAsset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        currentAccount: "1.2.3"
    };

    constructor() {
        super();
        this.state = {sub: null};

        this._subToMarket = this._subToMarket.bind(this);
    }

    componentWillMount() {
        if (this.props.quoteAsset.toJS && this.props.baseAsset.toJS) {
            this._subToMarket(this.props);
            // this._addMarket(this.props.quoteAsset.get("symbol"), this.props.baseAsset.get("symbol"));
        }

        emitter.on("cancel-order", limitListener = MarketsActions.cancelLimitOrderSuccess);
        emitter.on("close-call", callListener = MarketsActions.closeCallOrderSuccess);
        emitter.on("call-order-update", newCallListener = MarketsActions.callOrderUpdate);
        emitter.on("bitasset-update", feedUpdateListener = MarketsActions.feedUpdate);
        emitter.on("settle-order-update", settleOrderListener = (object) => {
            let {isMarketAsset, marketAsset} = market_utils.isMarketAsset(this.props.quoteAsset, this.props.baseAsset);
            console.log("settle-order-update:", object, "isMarketAsset:", isMarketAsset, "marketAsset:", marketAsset);

            if (isMarketAsset && marketAsset.id === object.balance.asset_id) {
                MarketsActions.settleOrderUpdate(marketAsset.id);
            }
        });
    }

    componentWillReceiveProps(nextProps) {
        /* Prediction markets should only be shown in one direction, if the link goes to the wrong one we flip it */ 
        if (nextProps.baseAsset && nextProps.baseAsset.getIn(["bitasset", "is_prediction_market"])) {
            this.props.router.push(`/market/${nextProps.baseAsset.get("symbol")}_${nextProps.quoteAsset.get("symbol")}`);
        }

        if (nextProps.quoteAsset && nextProps.baseAsset) {
            if (!this.state.sub) {
                return this._subToMarket(nextProps);
            }
        }

        if (nextProps.quoteAsset.get("symbol") !== this.props.quoteAsset.get("symbol") || nextProps.baseAsset.get("symbol") !== this.props.baseAsset.get("symbol")) {
            let currentSub = this.state.sub.split("_");
            MarketsActions.unSubscribeMarket(currentSub[0], currentSub[1]);
            return this._subToMarket(nextProps);
        }
    }

    componentWillUnmount() {
        let { quoteAsset, baseAsset } = this.props;
        MarketsActions.unSubscribeMarket(quoteAsset.get("id"), baseAsset.get("id"));
        if (emitter) {
            emitter.off("cancel-order", limitListener);
            emitter.off("close-call", callListener);
            emitter.off("call-order-update", newCallListener);
            emitter.off("bitasset-update", feedUpdateListener);
            emitter.off("settle-order-update", settleOrderListener);
        }
    }

    _subToMarket(props, newBucketSize) {
        let { quoteAsset, baseAsset, bucketSize } = props;
        if (newBucketSize) {
            bucketSize = newBucketSize;
        }
        if (quoteAsset.get("id") && baseAsset.get("id")) {
            MarketsActions.subscribeMarket.defer(baseAsset, quoteAsset, bucketSize);
            this.setState({ sub: `${quoteAsset.get("id")}_${baseAsset.get("id")}` });
        }
    }

    render() {
        return <div className="grid-block vertical">
            {!this.props.marketReady ? <LoadingIndicator /> : null}
            <Exchange {...this.props} sub={this.state.sub} subToMarket={this._subToMarket} />
        </div>;
    }
}

ExchangeSubscriber = BindToChainState(ExchangeSubscriber, {keep_updating: true, show_loader: true});

export default ExchangeContainer;
