import React from "react";
import Immutable from "immutable";
import Highcharts from "react-highcharts/stocks";
import {PropTypes} from "react";
import utils from "common/utils";

class BalanceTreemap extends React.Component {

    shouldComponentUpdate(nextProps) {

        return (
            !Immutable.is(nextProps.assets, this.props.assets) ||
            !nextProps.balances.equals(this.props.balances)
        );
    }

    render() {
        let {assets, balances} = this.props;
        let accountBalances = null;

        if (balances && balances.length > 0 && assets.size > 0) {
            accountBalances = balances.map((balance, index) => {
                let asset = assets.get(balance.asset_id);
                return {
                        name: asset.symbol,
                        value: utils.get_asset_amount(balance.amount, asset),
                        colorValue: index
                    };

            });
        }

        if (accountBalances && accountBalances.length === 1 && accountBalances[0].value === 0) {
            accountBalances = null;
        }

        let config = {
            chart: {
                backgroundColor: "rgba(255, 0, 0, 0)",
                height: 125,
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

BalanceTreemap.defaultProps = {
    assets: {},
    balances: {}
};

BalanceTreemap.propTypes = {
    assets: PropTypes.object.isRequired,
    balances: PropTypes.object.isRequired
};

export default BalanceTreemap;
