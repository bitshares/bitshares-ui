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
        toAsset: ChainTypes.ChainAsset.isRequired,
        inHeader: React.PropTypes.bool
    };

    static defaultProps = {
        inHeader: false
    };

    constructor() {
        super();

        this.fromStatsIntervals = {};
        this.toStatsInterval = null;
    }

    componentWillMount() {
        this._startUpdates(this.props);
    }

    shouldComponentUpdate(nextProps) {
        return (
            !utils.are_equal_shallow(nextProps.fromAssets, this.props.fromAssets) ||
            nextProps.toAsset !== this.props.toAsset ||
            !utils.are_equal_shallow(nextProps.balances, this.props.balances) ||
            !utils.are_equal_shallow(nextProps.openOrders, this.props.openOrders) ||
            !utils.are_equal_shallow(nextProps.collateral, this.props.collateral) ||
            !utils.are_equal_shallow(nextProps.debt, this.props.debt)
        );
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

    _convertValue(amount, fromAsset, toAsset, marketStats, coreAsset) {
        if (!fromAsset || !toAsset) {
            return 0;
        }
        let toStats, fromStats;

        let toID = toAsset.get("id");
        let toSymbol = toAsset.get("symbol");
        let fromID = fromAsset.get("id");
        let fromSymbol = fromAsset.get("symbol");

        if (coreAsset && marketStats) {
            let coreSymbol = coreAsset.get("symbol");

            toStats = marketStats.get(toSymbol + "_" + coreSymbol);
            fromStats = marketStats.get(fromSymbol + "_" + coreSymbol);
        }

        let price = utils.convertPrice(fromStats && fromStats.close ? fromStats.close :
                                       fromID === "1.3.0" || fromAsset.has("bitasset") ? fromAsset : null,
                                       toStats && toStats.close ? toStats.close :
                                       (toID === "1.3.0" || toAsset.has("bitasset")) ? toAsset : null,
                                       fromID,
                                       toID);

        return price ? utils.convertValue(price, amount, fromAsset, toAsset) : null;
    }

    _assetValues(totals, amount, asset) {
        if (!totals[asset]) {
            totals[asset] = amount; 
        } else {
            totals[asset] += amount; 
        }

        return totals;
    }

    render() {
        let {fromAssets, toAsset, balances, marketStats, collateral, debt, openOrders, inHeader} = this.props;
        let coreAsset = ChainStore.getAsset("1.3.0");
        
        if (!coreAsset || !toAsset) {
            return null;
        }


        let assets = {};
        fromAssets.forEach(asset => {
            if (asset) {
                assets[asset.get("id")] = asset;
            }
        });

        let totalValue = 0;
        let assetValues = {};

        // Collateral value
        let collateralValue = this._convertValue(collateral, coreAsset, toAsset, marketStats, coreAsset);

        totalValue += collateralValue;
        assetValues = this._assetValues(assetValues, collateralValue, coreAsset.get("id"));

        // Open orders value
        for (let asset in openOrders) {
            let fromAsset = assets[asset];
            if (fromAsset) {
                let orderValue = this._convertValue(openOrders[asset], fromAsset, toAsset, marketStats, coreAsset);
                totalValue += orderValue;
                assetValues = this._assetValues(assetValues, orderValue, fromAsset.get("id"));
            }
        }

        // Debt value
        for (let asset in debt) {
            let fromAsset = assets[asset];
            if (fromAsset) {
                let debtValue = this._convertValue(debt[asset], fromAsset, toAsset, marketStats, coreAsset);
                totalValue -= debtValue;
                assetValues = this._assetValues(assetValues, -debtValue, fromAsset.get("id"));
            }
        }

        // Balance value
        balances.forEach(balance => {
            if (balance.asset_id === toAsset.get("id")) {
                totalValue += balance.amount;
            } else {
                let fromAsset = assets[balance.asset_id];
                if (fromAsset) {
                    let eqValue = this._convertValue(balance.amount, fromAsset, toAsset, marketStats, coreAsset);
                    totalValue += eqValue;
                    assetValues = this._assetValues(assetValues, eqValue, fromAsset.get("id"));
                }
            }
        });

        // Determine if higher precision should be displayed
        let hiPrec = false;
        for (let asset in assetValues) {
            if (assets[asset] && assetValues[asset]) {
                if (Math.abs(utils.get_asset_amount(assetValues[asset], toAsset)) < 100) {
                    hiPrec = true;
                    break;
                }
            }
        }

        // Render each asset's balance, noting if there are any values missing
        const noDataSymbol = "**";
        const minValue = 1e-12;
        let missingData = false;
        let totalsTip = "<table><tbody>";
        for (let asset in assetValues) {
            if (assets[asset] && assetValues[asset]) {
                let symbol = assets[asset].get("symbol");
                let amount = utils.get_asset_amount(assetValues[asset], toAsset);
                if (amount) {
                    if (amount >= 0 && amount < minValue ) { // really close to zero, but not zero, probably a result of incomplete data
                        amount = noDataSymbol;
                        missingData = true;
                    } else if (hiPrec) {
                        if (amount >= 0 && amount < 0.01)
                            amount = "<0.01";
                        else
                            amount = utils.format_number(amount, 2);
                    } else {
                        if (amount >= 0 && amount < 1)
                            amount = "<1";
                        else
                            amount = utils.format_number(amount, 0);
                    }
                } else {
                    amount = noDataSymbol;
                    missingData = true;
                }
                totalsTip += `<tr><td>${symbol}:&nbsp;</td><td style="text-align: right;">${amount} ${toAsset.get("symbol")}</td></tr>`;
            }
        }

        // If any values are missing, let the user know.
        if (missingData)
            totalsTip += `<tr><td>&nbsp;</td><td style="text-align: right;">${noDataSymbol} no data</td></tr>`;

        totalsTip += "</tbody></table>"
        
        // console.log("assetValues:", assetValues, "totalsTip:", totalsTip);
        if (!inHeader) {
            return <FormattedAsset amount={totalValue} asset={toAsset.get("id")} decimalOffset={toAsset.get("precision")}/>;
        } else {
            return (
                <div data-tip={totalsTip} data-place="bottom" data-type="light" html data-html={true} >
                    <FormattedAsset amount={totalValue} asset={toAsset.get("id")} decimalOffset={toAsset.get("precision")}/>
                </div>

            );
        }
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
        balances: ChainTypes.ChainObjectsList
    };

    static defaultProps = {
        collateral: 0,
        debt: {},
        openOrders: {}
    };

    render() {
        let {balances, toAsset, collateral, debt, openOrders, inHeader} = this.props;
        let assets = Immutable.List();
        let amounts = [];

        balances.forEach(balance => {
            if (balance) {
                assets = assets.push(balance.get("asset_type"));
                amounts.push({asset_id: balance.get("asset_type"), amount: parseInt(balance.get("balance"), 10)});
            }
        });

        for (let asset in debt) {
            if (!assets.has(asset)) {
                assets = assets.push(asset);
            }
        }

        for (let asset in openOrders) {
            if (!assets.has(asset)) {
                assets = assets.push(asset);
            }
        }

        return <ValueStoreWrapper inHeader={inHeader} balances={amounts} openOrders={openOrders} debt={debt} collateral={collateral} fromAssets={assets}/>;
    }
}

@BindToChainState({keep_updating: true})
class AccountWrapper extends React.Component {

    static propTypes = {
        accounts: ChainTypes.ChainAccountsList.isRequired
    };

    shouldComponentUpdate(nextProps) {
        return !utils.are_equal_shallow(nextProps.accounts, this.props.accounts);
    }

    render() {
        let balanceList = Immutable.List(), collateral = 0, debt = {}, openOrders = {};

        this.props.accounts.forEach(account => {

            if (account) {

                account.get("orders") && account.get("orders").forEach( (orderID, key) => {
                    let order = ChainStore.getObject(orderID);
                    if (order) {
                        let orderAsset = order.getIn(["sell_price", "base", "asset_id"]);
                        if (!openOrders[orderAsset]) {
                            openOrders[orderAsset] = parseInt(order.get("for_sale"), 10);
                        } else {
                            openOrders[orderAsset] += parseInt(order.get("for_sale"), 10);
                        }
                    }
                });

                account.get("call_orders") && account.get("call_orders").forEach( (callID, key) => {
                    let position = ChainStore.getObject(callID);
                    if (position) {
                        collateral += parseInt(position.get("collateral"), 10);

                        let debtAsset = position.getIn(["call_price", "quote", "asset_id"]);
                        if (!debt[debtAsset]) {
                            debt[debtAsset] = parseInt(position.get("debt"), 10);
                        } else {
                            debt[debtAsset] += parseInt(position.get("debt"), 10);
                        }
                    }
                });

                let account_balances = account.get("balances");
                account_balances && account_balances.forEach( balance => {
                    let balanceAmount = ChainStore.getObject(balance);
                    if (!balanceAmount || !balanceAmount.get("balance")) {
                        return null;
                    }
                    balanceList = balanceList.push(balance);
                });
            }
        })

        return balanceList.size ? <TotalBalanceValue inHeader={this.props.inHeader} balances={balanceList} openOrders={openOrders} debt={debt} collateral={collateral}/> : null;
    }
}

TotalBalanceValue.AccountWrapper = AccountWrapper;
export default TotalBalanceValue;
