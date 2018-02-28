import React from "react";
import Immutable from "immutable";
import ReactHighcharts from "react-highcharts";
import Treemap from 'highcharts/modules/treemap';
import Heatmap from 'highcharts/modules/heatmap';
import {PropTypes} from "react";
import utils from "common/utils";
import ChainTypes from "../Utility/ChainTypes";
import {ChainStore} from "bitsharesjs/es";
import BindToChainState from "../Utility/BindToChainState";
import AltContainer from "alt-container";
import { Asset, Price } from "common/MarketClasses";
import MarketUtils from "common/market_utils";
import MarketsStore from "stores/MarketsStore";
import SettingsStore from "stores/SettingsStore";

Treemap(ReactHighcharts.Highcharts);
Heatmap(ReactHighcharts.Highcharts);

class AccountTreemap extends React.Component {

    static propTypes = {
        balanceAssets: ChainTypes.ChainAssetsList,
        core_asset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        balanceAssets: [],
        core_asset: "1.3.0"
    }

    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(nextProps) {
        return (
            !utils.are_equal_shallow(nextProps.balanceAssets, this.props.balanceAssets)
        );
    }

    render() {
        let {balanceAssets, core_asset, settings, marketStats} = this.props;
        let preferredUnit = core_asset;
        if (settings.get("unit")) {
            preferredUnit = ChainStore.getAsset(settings.get("unit"));
        }

        balanceAssets = balanceAssets.toJS ? balanceAssets.toJS() : balanceAssets;
        let accountBalances = null;

        if (balanceAssets && balanceAssets.length > 0) {
            accountBalances = balanceAssets.map((balance, index) => {
                let balanceObject = typeof(balance) == 'string' ? ChainStore.getObject(balance) : balance;
                let asset_type = balanceObject.get("asset_type");
                let asset = ChainStore.getAsset(asset_type);

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
                        name: asset.get("symbol"),
                        value: finalValue,
                        colorValue: index
                    } : null;

            }).filter(n => { return n; });
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
            colorAxis: {
                min: 0,
                minColor: '#ffffff',
                maxColor: ReactHighcharts.Highcharts.getOptions().colors[0]
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
                        pointFormat: "<b>{point.name}</b>: {point.value:,.0f}"
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
            <AccountTreemap
                {...this.props}
                ref={this.props.refCallback}
            />
          </AltContainer>
        );
    }
}
