import React from "react";
import FormattedAsset from "./FormattedAsset";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";
import utils from "common/utils";
import MarketsActions from "actions/MarketsActions";
import ChainStore from "api/ChainStore";
import connectToStores from "alt/utils/connectToStores";
import MarketsStore from "stores/MarketsStore";
import SettingsStore from "stores/SettingsStore";
import Immutable from "immutable";

/**
 *  Given an asset amount, displays the equivalent value in baseAsset if possible
 *
 *  Expects three properties
 *  -'toAsset' which should be a asset id
 *  -'fromAsset' which is the asset id of the original asset amount
 *  -'amount' which is the amount to convert
 *  -'fullPrecision' boolean to tell if the amount uses the full precision of the asset
 */

@BindToChainState({keep_updating: true})
class TotalValue extends React.Component {

    static propTypes = {
        fromAssets: ChainTypes.ChainAssetsList.isRequired,
        toAsset: ChainTypes.ChainAsset.isRequired
    };

    constructor() {
        super();

        this.fromStatsIntervals = {};
        this.toStatsInterval = null;
    }

    componentWillMount() {
        this._startUpdates(this.props);
    }

    _startUpdates(props) {
        let coreAsset = ChainStore.getAsset("1.3.0");
        let {fromAssets} = props;

        if (coreAsset) {
            // From assets
            fromAssets.forEach(asset => {
                if (asset) {

                    if (asset.get("id") !== coreAsset.get("id")) {
                        setTimeout(() => {
                            MarketsActions.getMarketStats(coreAsset, asset);
                            this.fromStatsIntervals[asset.get("id")] = setInterval(MarketsActions.getMarketStats.bind(this, coreAsset, asset), 10 * 60 * 1000);
                        }, 50)
                    }
                }
            })

            // To asset
            if (props.toAsset.get("id") !== coreAsset.get("id")) {
                // wrap this in a timeout to prevent dispatch in the middle of a dispatch
                setTimeout(() => {
                    MarketsActions.getMarketStats.bind(this, coreAsset, props.toAsset);
                    this.toStatsInterval = setInterval(MarketsActions.getMarketStats.bind(this, coreAsset, props.toAsset), 10 * 60 * 1000);
                }, 150);
            }
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!Immutable.is(nextProps.toAsset, this.props.toAsset)) {
            this._stopUpdates();

            this._startUpdates(nextProps);
        }
    }

    _stopUpdates() {
        for (let key in this.fromStatsIntervals) {
            clearInterval(this.fromStatsIntervals[key]);
        }
        clearInterval(this.toStatsInterval);
    }

    componentWillUnmount() {
        this._stopUpdates();
    }

    render() {
        let {fromAssets, toAsset, balances, marketStats} = this.props;
        let coreAsset = ChainStore.getAsset("1.3.0");
        let toStats, fromStats;

        let assets = {};
        fromAssets.forEach(asset => {
            if (asset) {
                assets[asset.get("id")] = asset;
            }
        });

        let totalValue = 0;
        balances.forEach(balance => {
            if (balance.asset_id === toAsset.get("id")) {
                totalValue += balance.amount;
            } else {
                let fromAsset = assets[balance.asset_id];
                if (fromAsset) {
                    let toID = toAsset.get("id");
                    let toSymbol = toAsset.get("symbol");
                    let fromID = fromAsset.get("id");
                    let fromSymbol = fromAsset.get("symbol");

                    if (coreAsset && marketStats) {
                        let coreSymbol = coreAsset.get("symbol");

                        toStats = marketStats.get(toSymbol + "_" + coreSymbol);
                        fromStats = marketStats.get(fromSymbol + "_" + coreSymbol);
                    }

                    let price = utils.convertPrice(fromStats && fromStats.close ? fromStats.close : fromAsset, toStats && toStats.close ? toStats.close : toAsset, fromID, toID);

                    let eqValue = utils.convertValue(price, balance.amount, fromAsset, toAsset);
                    totalValue += eqValue;
                }
            }
        })

        return (
            <div>
                <FormattedAsset amount={totalValue} asset={toAsset.get("id")}/>
            </div>

        );
    }
}

@connectToStores
class ValueStoreWrapper extends React.Component {
    static getStores() {
        return [MarketsStore, SettingsStore]
    };

    static getPropsFromStores() {
        return {
            marketStats: MarketsStore.getState().allMarketStats,
            settings: SettingsStore.getState().settings
        }
    };

    render() {
        let preferredUnit = this.props.settings.get("unit") || "1.3.0"

        return <TotalValue {...this.props} toAsset={preferredUnit}/>
    }
}

@BindToChainState({keep_updating: true})
class TotalBalanceValue extends React.Component {

    static propTypes = {
        balances: ChainTypes.ChainObjectsList.isRequired
    }

    render() {
        let {balances, toAsset} = this.props;
        let assets = Immutable.List();
        let amounts = [];

        balances.forEach(balance => {
            if (balance) {
                assets = assets.push(balance.get("asset_type"));
                amounts.push({asset_id: balance.get("asset_type"), amount: parseInt(balance.get("balance"), 10)});
            }
        })

        return <ValueStoreWrapper balances={amounts} fromAssets={assets}/>;
    }
}

@BindToChainState({keep_updating: true})
class AccountWrapper extends React.Component {

    static propTypes = {
        accounts: ChainTypes.ChainAccountsList.isRequired
    };

    render() {
        let balanceList = Immutable.List();

        this.props.accounts.forEach(account => {
            if (account) {
                let account_balances = account.get("balances");

                account_balances.forEach( balance => {
                    let balanceAmount = ChainStore.getObject(balance);
                    if (!balanceAmount.get("balance")) {
                        return null;
                    }
                    balanceList = balanceList.push(balance);
                });
            }
        })

        return balanceList.size ? <TotalBalanceValue balances={balanceList}/> : null;
    }
}

TotalBalanceValue.AccountWrapper = AccountWrapper;
export default TotalBalanceValue;
