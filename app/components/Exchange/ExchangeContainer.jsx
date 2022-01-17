import React from "react";
import MarketsStore from "stores/MarketsStore";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import GatewayStore from "stores/GatewayStore";
import IntlStore from "stores/IntlStore";
import WalletUnlockStore from "stores/WalletUnlockStore";
import AltContainer from "alt-container";
import Exchange from "./Exchange";
import ChainTypes from "../Utility/ChainTypes";
import {EmitterInstance} from "bitsharesjs";
import BindToChainState from "../Utility/BindToChainState";
import MarketsActions from "actions/MarketsActions";
import {DataFeed} from "components/Exchange/tradingViewClasses";
import Page404 from "../Page404/Page404";

class ExchangeContainer extends React.Component {
    render() {
        let symbols = this.props.match.params.marketID.toUpperCase().split("_");
        if (symbols[0] === symbols[1]) {
            return <Page404 subtitle="market_not_found_subtitle" />;
        }
        return (
            <AltContainer
                stores={[
                    MarketsStore,
                    AccountStore,
                    SettingsStore,
                    WalletUnlockStore,
                    IntlStore
                ]}
                inject={{
                    hasAnyPriceAlert: () =>
                        SettingsStore.hasAnyPriceAlert(symbols[0], symbols[1]),
                    priceAlert: () => SettingsStore.getState().priceAlert,
                    locale: () => IntlStore.getState().currentLocale,
                    lockedWalletState: () => {
                        return WalletUnlockStore.getState().locked;
                    },
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
                    myActiveAccounts: () => {
                        return AccountStore.getState().myActiveAccounts;
                    },
                    viewSettings: () => {
                        return SettingsStore.getState().viewSettings;
                    },
                    settings: () => {
                        return SettingsStore.getState().settings;
                    },
                    exchange: () => {
                        return SettingsStore.getState().exchange;
                    },
                    starredMarkets: () => {
                        return SettingsStore.getState().starredMarkets;
                    },
                    marketDirections: () => {
                        return SettingsStore.getState().marketDirections;
                    },
                    marketStats: () => {
                        return MarketsStore.getState().marketStats;
                    },
                    marketReady: () => {
                        return MarketsStore.getState().marketReady;
                    },
                    backedCoins: () => {
                        return GatewayStore.getState().backedCoins.get(
                            "OPEN",
                            []
                        );
                    },
                    bridgeCoins: () => {
                        return GatewayStore.getState().bridgeCoins;
                    },
                    miniDepthChart: () => {
                        return SettingsStore.getState().viewSettings.get(
                            "miniDepthChart",
                            true
                        );
                    },

                    dataFeed: () => new DataFeed(),

                    trackedGroupsConfig: () => {
                        return MarketsStore.getState().trackedGroupsConfig;
                    },
                    currentGroupOrderLimit: () => {
                        return MarketsStore.getState().currentGroupLimit;
                    }
                }}
            >
                <ExchangeSubscriber
                    history={this.props.history}
                    location={this.props.location}
                    quoteAsset={symbols[0]}
                    baseAsset={symbols[1]}
                />
            </AltContainer>
        );
    }
}

let emitter = EmitterInstance();
let callListener,
    limitListener,
    newCallListener,
    feedUpdateListener,
    settleOrderListener;

class ExchangeSubscriber extends React.Component {
    static propTypes = {
        currentAccount: ChainTypes.ChainAccount.isRequired,
        quoteAsset: ChainTypes.ChainAsset.isRequired,
        baseAsset: ChainTypes.ChainAsset.isRequired,
        coreAsset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        currentAccount: "1.2.3",
        coreAsset: "1.3.0"
    };

    constructor(props) {
        super();
        this.state = {sub: null};

        this._subToMarket = this._subToMarket.bind(this);
    }

    UNSAFE_componentWillMount() {
        if (this.props.quoteAsset === null || this.props.baseAsset === null) {
            return;
        }
        if (this.props.quoteAsset.toJS && this.props.baseAsset.toJS) {
            this._subToMarket(this.props);
            // this._addMarket(this.props.quoteAsset.get("symbol"), this.props.baseAsset.get("symbol"));
        }

        emitter.on(
            "cancel-order",
            (limitListener = MarketsActions.cancelLimitOrderSuccess)
        );
        emitter.on(
            "close-call",
            (callListener = MarketsActions.closeCallOrderSuccess)
        );

        emitter.on(
            "call-order-update",
            (newCallListener = call_order => {
                let {asset_id: coBase} = call_order.call_price.base;
                let {asset_id: coQuote} = call_order.call_price.quote;
                let baseId = this.props.baseAsset.get("id"),
                    quoteId = this.props.quoteAsset.get("id");
                if (
                    (coBase === baseId || coBase === quoteId) &&
                    (coQuote === baseId || coQuote === quoteId)
                ) {
                    MarketsActions.callOrderUpdate(call_order);
                }
            })
        );
        emitter.on(
            "bitasset-update",
            (feedUpdateListener = MarketsActions.feedUpdate)
        );
        emitter.on(
            "settle-order-update",
            (settleOrderListener = object => {
                let {isMarketAsset, marketAsset} = market_utils.isMarketAsset(
                    this.props.quoteAsset,
                    this.props.baseAsset
                );

                if (
                    isMarketAsset &&
                    marketAsset.id === object.balance.asset_id
                ) {
                    MarketsActions.settleOrderUpdate(marketAsset.id);
                }
            })
        );
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.quoteAsset === null || nextProps.baseAsset === null) {
            return;
        }
        /* Prediction markets should only be shown in one direction, if the link goes to the wrong one we flip it */
        if (
            nextProps.baseAsset &&
            nextProps.baseAsset.getIn(["bitasset", "is_prediction_market"])
        ) {
            this.props.history.push(
                `/market/${nextProps.baseAsset.get(
                    "symbol"
                )}_${nextProps.quoteAsset.get("symbol")}`
            );
        }

        if (nextProps.quoteAsset && nextProps.baseAsset) {
            if (!this.state.sub) {
                return this._subToMarket(nextProps);
            }
        }

        if (
            nextProps.quoteAsset.get("symbol") !==
                this.props.quoteAsset.get("symbol") ||
            nextProps.baseAsset.get("symbol") !==
                this.props.baseAsset.get("symbol")
        ) {
            let currentSub = this.state.sub.split("_");
            MarketsActions.unSubscribeMarket(currentSub[0], currentSub[1]).then(
                () => {
                    this._subToMarket(nextProps);
                }
            );
        }
    }

    componentWillUnmount() {
        let {quoteAsset, baseAsset} = this.props;
        if (quoteAsset === null || baseAsset === null) {
            return;
        }

        MarketsActions.unSubscribeMarket(
            quoteAsset.get("id"),
            baseAsset.get("id")
        );
        if (emitter) {
            emitter.off("cancel-order", limitListener);
            emitter.off("close-call", callListener);
            emitter.off("call-order-update", newCallListener);
            emitter.off("bitasset-update", feedUpdateListener);
            emitter.off("settle-order-update", settleOrderListener);
        }
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

    render() {
        if (this.props.quoteAsset === null || this.props.baseAsset === null)
            return <Page404 subtitle="market_not_found_subtitle" />;

        return (
            <Exchange
                {...this.props}
                sub={this.state.sub}
                subToMarket={this._subToMarket}
            />
        );
    }
}

ExchangeSubscriber = BindToChainState(ExchangeSubscriber, {
    show_loader: true
});

export default ExchangeContainer;
