import React from "react";
import Immutable from "immutable";
import Highcharts from "react-highcharts/highstock";
import {PropTypes} from "react";
import utils from "common/utils";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";


@BindToChainState({keep_updating: true})
class BalanceTreemap extends React.Component {

    static propTypes = {
        assets: ChainTypes.ChainObjectsList,
        balances: PropTypes.object
    }

    // shouldComponentUpdate(nextProps) {

    //     return (
    //         !Immutable.is(nextProps.assets, this.props.assets) ||
    //         !nextProps.balances.equals(this.props.balances)
    //     );
    // }

    render() {
        let {assets, balances, resolved} = this.props;
        if (!resolved) {
            return null;
        }
        let accountBalances = null;
        let assetsList = {};
        let balanceList = [];
        assets.forEach(asset => {
            assetsList[asset.get("id")] = asset.toJS();
        })

        let coreAsset = assetsList["1.3.0"];

        balances.forEach(balance => {
            balanceList.push(balance);
        })

        if ( balanceList && balanceList.length ) {
            accountBalances = balanceList.map((balance, index) => {
                let asset = assetsList[balance.get("asset_type")];
                if (asset) {
                    let value = asset.id !== "1.3.0" ? balance.get("balance") * asset.options.core_exchange_rate.quote.amount / asset.options.core_exchange_rate.base.amount : balance.get("balance");
                    if (value) {
                        return {
                            name: asset.symbol,
                            value: utils.get_asset_amount(value, coreAsset),
                            colorValue: index
                        };
                    }
                }

            });
        }

        if (accountBalances && accountBalances.length === 1 && accountBalances[0].value === 0) {
            accountBalances = null;
        }

        let config = {
            chart: {
                backgroundColor: "rgba(255, 0, 0, 0)",
                height: 300,
                spacingLeft: 0,
                spacingRight: 0,
                spacingBottom: 0
            },
            colorAxis: {
                minColor: "#FCAB53",
                maxColor: "#50D2C2"
            },
            credits: {
                enabled: false
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                treemap: {
                    animation: false,
                    tooltip: {
                        pointFormat: "<b>{point.name}</b>: {point.value:,.0f} " + coreAsset.symbol
                    }
                }
            },
            series: [{
                type: "treemap",
                levels: [{
                    level: 1,
                    layoutAlgorithm: "stripes",
                    dataLabels: {
                        enabled: true,
                        align: "center",
                        verticalAlign: "middle",
                        style: {
                            fontSize: "13px",
                            fontWeight: "bold"
                        }
                    }
                }],
                data: accountBalances
        }],
            title: {
                text: null
            }
        };

        return (
            accountBalances ? <Highcharts config={config}/> : null
        );
    }
}

@BindToChainState({keep_updating: true})
class BalancesWrapper extends React.Component {

    static propTypes = {
        balances: ChainTypes.ChainObjectsList
    }

    render() {
        let balanceAssetsList = Immutable.List();

        this.props.balances.forEach(balance => {
            balanceAssetsList = balanceAssetsList.push(balance.get("asset_type"));
        })

        if (!balanceAssetsList.has("1.3.0")) {
            balanceAssetsList = balanceAssetsList.push("1.3.0");
        }

        return <BalanceTreemap {...this.props} assets={balanceAssetsList} />;
    }
}

export default BalancesWrapper;
