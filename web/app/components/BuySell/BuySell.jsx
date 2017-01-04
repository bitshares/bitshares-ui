import React from "react";
import ReactDOM from "react-dom";
import {PropTypes} from "react";
import MarketsActions from "actions/MarketsActions";
import utils from "common/utils";
import assetUtils from "common/asset_utils";
import connectToStores from "alt/utils/connectToStores";
import MarketsStore from "stores/MarketsStore";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import SettingsActions from "actions/SettingsActions";
import AssetName from "../Utility/AssetName";

require("./BuySell.scss");

class UserOrder {
    constructor(state, cb) {
        this.ap = {
            int: state.amountPrecision,
            factor: utils.get_asset_precision(state.amountPrecision)
        };
        this.tp = {
            int: state.totalPrecision,
            factor: utils.get_asset_precision(state.totalPrecision)
        };

        this.isBuy = state.type === "buy" ? true : false;

        this.amount = state.amount;
        this._setAmountSats();
        this.price = state.price;
        this.cb = cb;
        this.total = this.amount * this.price;
        this._setTotalSats();
    }

    _callback() {
        if (this.cb) {
            this.cb();
        }
    }

    _setAmountSats(a) {
        let value = a ? a : this.amount;
        this.amountSats = Math.floor(value * this.ap.factor);
    }

    setAmount = (e) => {
        let value = parseFloat(e.target.value);
        this.amount = isNaN(value) ? 0 : value;
        if (this.price) {
            this._deriveTotal();
        } else {
            this._callback();
        }
    }

    setPrice = (e) => {
        let value = parseFloat(e.target.value);
        this.price = isNaN(value) ? 0 : value;

        if (this.amount) {
            this._deriveTotal();
        } else if (this.total) {
            this._deriveAmount();
        } else {
            this._callback();
        }
    }

    _setTotalSats(t) {
        let value = t ? t : this.amount;
        this.totalSats = Math.floor(value * this.tp.factor);
    }

    setTotal = (e) => {
        let value = parseFloat(e.target.value);
        value = isNaN(value) ? 0 : value;
        this._setTotalSats(value);
        this.total = utils.get_asset_amount(this.totalSats, {precision: this.tp.int});
        if (this.price) {
            this._deriveAmount();
        } else {
            this._callback();
        }
    }

    getAmount() {
        return this.amount;
    }

    getPrice() {
        return this.price;
    }

    getTotal() {
        return this.total;
    }

    getTotalString() {
        return utils.format_number(this.total, 4);
    }

    _deriveAmount() {
        let value = this.total / this.price;
        value = isFinite(value) ? value : 0;
        this._setAmountSats(value);
        this.amount = utils.get_asset_amount(this.amountSats, {precision: this.ap.int});
        console.log("this.totalSats:", this.totalSats, "amountSats:", this.amountSats);

        let satPrice = utils.get_asset_amount(this.totalSats / this.amountSats, {precision: (this.tp.int - this.ap.int)});
        if (satPrice !== this.price) {
            this.price = satPrice;
        }
        console.log("this.price:", this.price, satPrice);

        this._callback();
    }

    _deriveTotal() {
        this.total = this.amount * this.price;
        this._callback();
    }
}

@BindToChainState({keep_updating: true, show_loader: true})
class BuySell extends React.Component {
    constructor(props) {
        super();

        this.state = this._getInitState(props);
    }

    _getInitState(props) {
        let orderCB = () => {
            this.forceUpdate();
        };

        return {
            buyOrder: new UserOrder({
                price: 0,
                amount: 0,
                amountAsset: props.quoteAsset,
                amountPrecision: props.quoteAsset.get("precision"),
                totalPrecision: props.baseAsset.get("precision"),
                totalAsset: props.baseAsset,
                type: "buy"
            }, orderCB),
            sellOrder: new UserOrder({
                price: 0,
                amount: 0,
                amountAsset: props.quoteAsset,
                amountPrecision: props.quoteAsset.get("precision"),
                totalPrecision: props.baseAsset.get("precision"),
                totalAsset: props.baseAsset,
                type: "sell"
            }, orderCB)
        };
    }

    static propTypes = {
        quoteBalance: ChainTypes.ChainObject,
        baseBalance: ChainTypes.ChainObject
    };

    static defaultProps = {
        currentAccount: "1.2.3",
        limit_orders: [],
        calls: [],
        bids: [],
        asks: []
    };

    componentWillMount() {
        if (this.props.quoteAsset.toJS && this.props.baseAsset.toJS) {
            this._subToMarket(this.props);
            // this._addMarket(this.props.quoteAsset.get("symbol"), this.props.baseAsset.get("symbol"));
        }
    }

    componentDidMount() {
        let centerContainer = ReactDOM.findDOMNode(this.refs.center);
        if (centerContainer) {
            Ps.initialize(centerContainer);
        }
        SettingsActions.changeViewSetting({
            lastMarket: this.props.quoteAsset.get("symbol") + "_" + this.props.baseAsset.get("symbol")
        });

    }

    _subToMarket(props, newBucketSize) {
        let {quoteAsset, baseAsset, bucketSize} = props;
        if (newBucketSize) {
            bucketSize = newBucketSize;
        }
        if (quoteAsset.get("id") && baseAsset.get("id")) {
            MarketsActions.subscribeBuySell.defer(baseAsset, quoteAsset);
            this.setState({sub: `${quoteAsset.get("id")}_${baseAsset.get("id")}`});
        }
    }

    componentWillReceiveProps(np) {
        if (np.baseAsset && np.baseAsset.getIn(["bitasset", "is_prediction_market"])) {
            // console.log("this.props:", this.props);
            this.props.history.push(`market/${np.baseAsset.get("symbol")}_${np.quoteAsset.get("symbol")}`)
        }

        if (np.quoteAsset.toJS && np.baseAsset.toJS) {
            // this._addMarket(np.quoteAsset.get("symbol"), np.baseAsset.get("symbol"));
            if (!this.state.sub) {
                return this._subToMarket(np);
            }
        }

        if (np.quoteAsset.get("symbol") !== this.props.quoteAsset.get("symbol") || np.baseAsset.get("symbol") !== this.props.baseAsset.get("symbol")) {
            // this.setState(this._initialState(np));

            let currentSub = this.state.sub.split("_");
            MarketsActions.unSubscribeMarket(currentSub[0], currentSub[1]);
            SettingsActions.changeViewSetting({
                lastMarket: np.quoteAsset.get("symbol") + "_" + np.baseAsset.get("symbol")
            });
            this.setState(this._getInitState(np));
            return this._subToMarket(np);
        }
    }

    componentWillUnmount() {
        let {quoteAsset, baseAsset} = this.props;
        MarketsActions.unSubscribeMarket(quoteAsset.get("id"), baseAsset.get("id"));
    }

    _renderRows(bids, isBid) {
        let rows = bids.sort((a, b) => {
            return (isBid ? b.price_full - a.price_full : a.price_full - b.price_full);
        })
        .slice(0, 7)
        .map((a, index) => {
            return (
                <tr key={(isBid ? "bid_" : "ask_") + index}>
                    <td style={{textAlign: "right"}}>{a.price_full.toFixed(4)}</td>
                    <td style={{textAlign: "right"}}>{a.amount.toFixed(4)}</td>
                    <td style={{textAlign: "right"}}>{a.value.toFixed(4)}</td>
                </tr>
            );
        });

        return rows;
    }

    _getBalance(b, asset, isBid) {
        let amount = 0;
        if (b) {
            amount = b.get("balance");
        }

        let onClick = (event) => {
            event.stopPropagation();
            let a = utils.get_asset_amount(amount, asset);
            let e = {
                target: {
                    value: a
                }
            };
            if (isBid) {
                this.state.buyOrder.setTotal(e);
            } else {
                this.state.sellOrder.setAmount(e);
            }
        };

        return (
            <span>
                <span
                onClick={onClick}
                className="BuySell__balance">
                    {utils.format_asset(amount, asset, true)}
                </span>
                &nbsp;<AssetName name={asset.get("symbol")} />
            </span>
        );
    }

    render() {
        let {quoteAsset, baseAsset, baseBalance, quoteBalance} = this.props;
        let {buyOrder, sellOrder} = this.state;

        let quoteSymbol = quoteAsset.get("symbol");
        let baseSymbol = baseAsset.get("symbol");

        return (
            <div className="grid-block page-layout">
                <div className="grid-block main-content wrap" style={{marginTop: "1rem"}}>
                    <div className="grid-content large-offset-2 shrink" style={{paddingRight: "4rem"}}>
                        <h4>Order type</h4>

                        <ul className="settings-menu">
                            <li>Instant order</li>
                            <li>Limit order</li>
                        </ul>
                    </div>

                    <div className="grid-content">
                        <div className="grid-block small-10 no-padding no-margin vertical">

                            <h3>Limit order</h3>

                            <div className="grid-block BuySell__inputs">
                                <div className="grid-content small-6">
                                    <div className="text-center inputs__header">
                                        <h4>Buy <AssetName name={quoteSymbol} /></h4>
                                        <div>Available: {this._getBalance(baseBalance, baseAsset, true)}</div>
                                    </div>

                                    <div className="inputs__input">
                                        <div>Amount to Buy:</div>
                                        <input value={buyOrder.getAmount()} onChange={buyOrder.setAmount} type="text"></input>
                                        <AssetName className="inputs__symbol" name={quoteSymbol} />
                                    </div>

                                    <div className="inputs__input">
                                        <div>Buy Price:</div>
                                        <input value={buyOrder.getPrice()} onChange={buyOrder.setPrice} type="text"></input>
                                        <AssetName className="inputs__symbol" name={baseSymbol} />
                                    </div>

                                    <p>Total: <span className="float-right">{buyOrder.getTotalString()} <AssetName name={baseSymbol} /></span></p>
                                </div>

                                <div className="grid-content small-6">
                                    <div className="text-center inputs__header">
                                        <h4>Sell <AssetName name={quoteSymbol} /></h4>
                                        <div>Available: {this._getBalance(quoteBalance, quoteAsset, false)}</div>
                                    </div>

                                    <div className="inputs__input">
                                        <div>Amount to Sell:</div>
                                        <input value={sellOrder.getAmount()} onChange={sellOrder.setAmount}  type="text"></input>
                                        <AssetName className="inputs__symbol" name={quoteSymbol} />
                                    </div>

                                    <div className="inputs__input">
                                        <div>Sell Price:</div>
                                        <input onChange={sellOrder.setPrice} type="text"></input>
                                        <AssetName className="inputs__symbol" name={baseSymbol} />
                                    </div>

                                    <p>Total: <span className="float-right">{sellOrder.getTotalString()} <AssetName name={baseSymbol} /></span></p>
                                </div>
                            </div>


                            <div className="grid-block BuySell__orderbook">
                                <div className="grid-content small-6">
                                    <table className="table">
                                    <caption>Top 7 Buyers</caption>
                                        <thead>
                                            <tr>
                                                <th style={{textAlign: "right"}}>Price ({baseAsset.get("symbol")})</th>
                                                <th style={{textAlign: "right"}}>Amount ({quoteAsset.get("symbol")})</th>
                                                <th style={{textAlign: "right"}}>Value ({baseAsset.get("symbol")})</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {this._renderRows(this.props.bids, true)}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="grid-content small-6">
                                    <table className="table">
                                        <caption>Top 7 Sellers</caption>
                                        <thead>
                                            <tr>
                                                <th style={{textAlign: "right"}}>Price ({baseAsset.get("symbol")})</th>
                                                <th style={{textAlign: "right"}}>Amount ({quoteAsset.get("symbol")})</th>
                                                <th style={{textAlign: "right"}}>Value ({baseAsset.get("symbol")})</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {this._renderRows(this.props.asks, false)}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

@BindToChainState()
class StateWrapper extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        quoteAsset: ChainTypes.ChainAsset.isRequired,
        baseAsset: ChainTypes.ChainAsset.isRequired,
        coreAsset: ChainTypes.ChainAsset.isRequired
    }

    render() {
        let {quoteAsset, baseAsset} = this.props;
        let quoteBalance, baseBalance;
        this.props.account.get("balances", []).forEach((balance, key) => {
            if (key === quoteAsset.get("id")) {
                quoteBalance = balance;
            }

            if (key === baseAsset.get("id")) {
                baseBalance = balance;
            }
        });

        return <BuySell {...this.props} baseBalance={baseBalance} quoteBalance={quoteBalance} />;
    }
}

@connectToStores
class BuySellContainer extends React.Component {
    static getStores() {
        return [MarketsStore, AccountStore, SettingsStore];
    };

    static getPropsFromStores() {
        return {
            bids: MarketsStore.getState().bids,
            asks: MarketsStore.getState().asks,
            calls: MarketsStore.getState().calls,
            account: AccountStore.getState().currentAccount
        };
    };

    render() {
        let symbols = this.props.params.marketID.split("_");

        return (
            <StateWrapper
                quoteAsset={symbols[0]}
                baseAsset={symbols[1]}
                coreAsset="1.3.0"
                {...this.props}
            />
        );
    }

}

export default BuySellContainer;
