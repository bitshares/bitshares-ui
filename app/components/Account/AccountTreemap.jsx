import React from "react";
import ReactHighcharts from "react-highcharts";
import Treemap from "highcharts/modules/treemap";
import Heatmap from "highcharts/modules/heatmap";
import utils from "common/utils";
import ChainTypes from "../Utility/ChainTypes";
import {ChainStore} from "bitsharesjs/es";
import BindToChainState from "../Utility/BindToChainState";
import AltContainer from "alt-container";
import MarketUtils from "common/market_utils";
import MarketsStore from "stores/MarketsStore";
import SettingsStore from "stores/SettingsStore";

Treemap(ReactHighcharts.Highcharts);
Heatmap(ReactHighcharts.Highcharts);

class AccountTreemap extends React.Component {

    static propTypes = {
        assets: ChainTypes.ChainAssetsList
    };

    static defaultProps = {
        assets: []
    }

    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(nextProps) {
        return (
            !utils.are_equal_shallow(nextProps.balanceObjects, this.props.balanceObjects) ||
            !utils.are_equal_shallow(nextProps.assets, this.props.assets)
        );
    }

    render() {
        let {balanceObjects, core_asset, settings, marketStats} = this.props;
        let preferredUnit = core_asset;
        if (settings.get("unit")) {
            preferredUnit = ChainStore.getAsset(settings.get("unit"));
        }

        // balanceObjects = balanceObjects.toJS ? balanceObjects.toJS() : balanceObjects;
        let accountBalances = null;

        if (balanceObjects && balanceObjects.length > 0) {
            let totalValue = 0;
            accountBalances = balanceObjects.forEach((balance) => {
                if (!balance) return;
                let balanceObject = typeof(balance) == "string" ? ChainStore.getObject(balance) : balance;
                let asset_type = balanceObject.get("asset_type");
                let asset = ChainStore.getAsset(asset_type);
                if (!asset) return;
                let amount = Number(balanceObject.get("balance"));

                const eqValue = MarketUtils.convertValue(
                    amount,
                    preferredUnit,
                    asset,
                    true,
                    marketStats,
                    core_asset
                );

                if (!eqValue) return;
                const precision = utils.get_asset_precision(preferredUnit.get("precision"));
                totalValue += (eqValue / precision);
            });

            accountBalances = balanceObjects.map((balance, index) => {
                if (!balance) return null;
                let balanceObject = typeof(balance) == "string" ? ChainStore.getObject(balance) : balance;
                let asset_type = balanceObject.get("asset_type");
                let asset = ChainStore.getAsset(asset_type);
                if (!asset) return null;
                let amount = Number(balanceObject.get("balance"));

                const eqValue = MarketUtils.convertValue(
                    amount,
                    preferredUnit,
                    asset,
                    true,
                    marketStats,
                    core_asset
                );

                if (!eqValue) { return null; }

                const precision = utils.get_asset_precision(preferredUnit.get("precision"));
                const finalValue = eqValue / precision;

                return finalValue >= 1 ? {
                    name: `${asset.get("symbol")} (${totalValue === 0 ? 0 : (finalValue / totalValue * 100).toFixed(2)}%)`,
                    value: finalValue,
                    color: ReactHighcharts.Highcharts.getOptions().colors[index]
                } : null;

            }).filter(n => !!n);
        }

        if (accountBalances && accountBalances.length === 1 && accountBalances[0].value === 0) {
            accountBalances = null;
        }

        let config = {
            chart: {
                backgroundColor: "rgba(255, 0, 0, 0)",
                height: 250,
                spacingLeft: 0,
                spacingRight: 0,
                spacingBottom: 0
            },
            // colorAxis: {
            //     min: 0,
            //     minColor: "#ffffff",
            //     maxColor: ReactHighcharts.Highcharts.getOptions().colors[0]
            // },
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
                        pointFormatter: function() {
                            return `<b>${this.name}</b>: ${ReactHighcharts.Highcharts.numberFormat(this.value, 0)} ${preferredUnit.get("symbol")}`;
                        }
                    }
                }
            },
            series: [{
                type: "treemap",
                levels: [{
                    level: 1,
                    layoutAlgorithm: "sliceAndDice",
                    dataLabels: {
                        enabled: true,
                        align: "center",
                        verticalAlign: "middle",
                    }
                }],
                data: accountBalances
            }],
            title: {
                text: null
            }
        };

        return (
            <div className="account-treemap"><ReactHighcharts config={config}/></div>
        );
    }
}

AccountTreemap = BindToChainState(AccountTreemap);

class AccountTreemapBalanceWrapper extends React.Component {
    static propTypes = {
        balanceObjects: ChainTypes.ChainObjectsList,
        core_asset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        balanceObjects: [],
        core_asset: "1.3.0"
    }

    render() {
        let assets = this.props.balanceObjects.filter(a => !!a).map(a => {
            return a.get("asset_type");
        });
        return <AccountTreemap assets={assets} {...this.props} />;
    }
}

AccountTreemapBalanceWrapper = BindToChainState(AccountTreemapBalanceWrapper);

export default class AccountTreemapWrapper extends React.Component {

    render() {
        return (
          <AltContainer
            stores={[SettingsStore, MarketsStore]}
            inject={{
                marketStats: () => {
                    return MarketsStore.getState().allMarketStats;
                },
                settings: () => {
                    return SettingsStore.getState().settings;
                }
            }}
          >
            <AccountTreemapBalanceWrapper
                {...this.props}
                ref={this.props.refCallback}
            />
          </AltContainer>
        );
    }
}
