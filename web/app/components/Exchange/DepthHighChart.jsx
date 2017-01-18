import React from "react";
import {PropTypes} from "react";
let ReactHighstock = require("react-highcharts/dist/ReactHighstock");
import utils from "common/utils";
import counterpart from "counterpart";
import {cloneDeep} from "lodash";
import Translate from "react-translate-component";
import colors from "assets/colors";
import AssetName from "../Utility/AssetName";
import {didOrdersChange} from "common/MarketClasses";

class DepthHighChart extends React.Component {

    shouldComponentUpdate(nextProps) {
        let settleCheck = isNaN(nextProps.settlementPrice) ? false : nextProps.settlementPrice !== this.props.settlementPrice;

        return (
            didOrdersChange(nextProps.orders, this.props.orders) ||
            didOrdersChange(nextProps.call_orders, this.props.call_orders) ||
            settleCheck ||
            nextProps.feedPrice !== this.props.feedPrice ||
            nextProps.leftOrderBook !== this.props.leftOrderBook ||
            // nextProps.SQP !== this.props.SQP ||
            nextProps.LCP !== this.props.LCP ||
            nextProps.showCallLimit !== this.props.showCallLimit ||
            nextProps.hasPrediction !== this.props.hasPrediction ||
            nextProps.settlementPrice !== this.props.settlementPrice
        );
    }

    // constructor() {
    //     super();
    //     this.state = {offsetHeight: null};
    // }

    componentDidMount() {
        this.reflowChart(500);
    }

    componentWillReceiveProps(nextProps) {
        if (this.refs.depthChart && nextProps.verticalOrderbook !== this.props.verticalOrderbook) {
            this.reflowChart(100);
        }
    }

    reflowChart(timeout) {
        setTimeout(() => {
            if (this.refs.depthChart) {
                this.refs.depthChart.chart.reflow();
            }
        }, timeout);
    }


    render() {

        let {flat_bids, flat_asks, flat_calls, flat_settles, totalBids, totalAsks,
            base, quote, theme, settlementPrice} = this.props;

        const baseSymbol = base.get("symbol");
        const quoteSymbol = quote.get("symbol");

        let flatBids = cloneDeep(flat_bids), flatAsks = cloneDeep(flat_asks),
            flatCalls = cloneDeep(flat_calls), flatSettles = cloneDeep(flat_settles);


        function findNormalizationPower(power, array) {
            while ((array[array.length - 1][0] * power) < 1) {
                power *= 10;
            }
            return power;
        }

        function normalizeValues(array) {
            if (array.length) {
                array.forEach(entry => {
                    entry[0] *= power;
                });
            }
        }

        /*
        * Because Highstock does not deal with X axis values below 1, we need to
        * normalize the values and use the normalizing factor when displaying the
        * values on the chart
        */
        let power = 1;
        if (flat_bids.length) {
            power = findNormalizationPower(power, flat_bids);
        } else if (flat_asks.length) {
            power = findNormalizationPower(power, flat_asks);
        } else if (flat_calls && flat_calls.length) {
            power = findNormalizationPower(power, flat_calls);
        } else if (flat_settles && flat_settles.length) {
            power = findNormalizationPower(power, flat_settles);
        }

        // Add one more factor of 10 to make sure it's enough
        power *= 10;

        if (power !== 1) {
            normalizeValues(flatBids);
            normalizeValues(flatAsks);
            normalizeValues(flatCalls);
            normalizeValues(flatSettles);
        }

        let config = {
            chart: {
                type: "area",
                backgroundColor: "rgba(255, 0, 0, 0)",
                spacing: [10, 0, 5, 0]
            },
            title: {
                text: null
            },
            credits: {
                enabled: false
            },
            legend: {
                enabled: false
            },
            rangeSelector: {
                enabled: false
            },
            navigator: {
                enabled: false
            },
            scrollbar: {
                enabled: false
            },
            dataGrouping: {
                enabled: false
            },
            tooltip: {
                shared: false,
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                useHTML: true,
                formatter: function() {

                    return `
                    <table>
                        <tr>
                            <td>${counterpart.translate("exchange.price")}:</td>
                            <td style="text-align: right">${utils.format_number(this.x / power, base.get("precision"))} ${baseSymbol}</td>
                        </tr>
                        <tr>
                            <td>${counterpart.translate("exchange.quantity")}:</td>
                            <td style="text-align: right">${utils.format_number(this.y, quote.get("precision"))} ${quoteSymbol}</td>
                        </tr>
                    </table>
                    `;
                },
                style: {
                    color: "#FFFFFF"
                }
            },
            series: [],
            yAxis: {
                labels: {
                    enabled: false,
                    style: {
                        color: "#FFFFFF"
                    }
                },
                title: {
                    text: null,
                    style: {
                        color: "#FFFFFF"
                    }
                },
                gridLineWidth: 0,
                crosshair: {
                    snap: false
                },
                currentPriceIndicator: {
                    enabled: false
                }
            },
            xAxis: {
                labels: {
                    style: {
                        color: colors[theme].primaryText
                    },
                    formatter: function () {return this.value / power; }
                },
                ordinal: false,
                lineColor: "#000000",
                title: {
                    text: null
                },
                plotLines: []
            },
            plotOptions: {
                area: {
                    animation: false,
                    marker: {
                        enabled: false
                    },
                    series: {
                        enableMouseTracking: false
                    }
                }
            }
        };

        // Center the charts between bids and asks
        if (flatBids.length > 0 && flatAsks.length > 0) {
            let middleValue = (flatAsks[0][0] + flatBids[flatBids.length - 1][0]) / 2;

            config.xAxis.min = middleValue * 0.4;
            config.xAxis.max = middleValue * 1.6;

        } else if (flatBids.length && !flatAsks.length) {
            config.xAxis.min = flatBids[flatBids.length - 1][0] * 0.4;
            config.xAxis.max = flatBids[flatBids.length - 1][0] * 1.6;
        }

        if (this.props.hasPrediction) {
            config.xAxis.min = -0.05 * power;
            config.xAxis.max = 1.05 * power;
        }

        // Add plotlines if defined
        // if (falsethis.props.plotLine) {
        //     config.xAxis.plotLines.push({
        //         color: "red",
        //         id: "plot_line",
        //         dashStyle: "longdashdot",
        //         value: this.props.plotLine * power,
        //         width: 1,
        //         zIndex: 5
        //     });
        // }

        // Market asset
        if (this.props.LCP) {
            config.xAxis.plotLines.push({
                color: "#B6B6B6",
                id: "plot_line",
                dashStyle: "longdash",
                value: this.props.LCP * power,
                label: {
                    text: counterpart.translate("explorer.block.call_limit"),
                    style: {
                        color: "#DADADA",
                        fontWeight: "bold"
                    }
                },
                width: 2,
                zIndex: 5
            });
        }

        // if (this.props.SQP) {
        //     config.xAxis.plotLines.push({
        //         color: "#B6B6B6",
        //         id: "plot_line",
        //         dashStyle: "longdash",
        //         value: this.props.SQP * power,
        //         label: {
        //             text: counterpart.translate("exchange.squeeze"),
        //             style: {
        //                 color: "#DADADA",
        //                 fontWeight: "bold"
        //             }
        //         },
        //         width: 2,
        //         zIndex: 5
        //     });
        // }


        if (settlementPrice) {
            config.xAxis.plotLines.push({
                color: "#7B1616",
                id: "plot_line",
                dashStyle: "solid",
                value: settlementPrice * power,
                label: {
                    text: counterpart.translate("explorer.block.settlement_price"),
                    style: {
                        color: "#DADADA",
                        fontWeight: "bold"
                    }
                },
                width: 2,
                zIndex: 5
            });

            // Add calls if present
            if (flatCalls && flatCalls.length) {
                config.series.push({
                    name: `Call ${quoteSymbol}`,
                    data: flatCalls,
                    color: colors[theme].callColor
                });
            }
        }

        // Add settle orders
        if (settlementPrice && (flatSettles && flatSettles.length)) {
            // flat_settles.forEach(settle => {
            //     settle[0] *= power;
            // });

            config.series.push({
                name: `Settle ${quoteSymbol}`,
                data: flatSettles,
                color: colors[theme].settleColor,
                fillColor: colors[theme].settleFillColor
            });
        }

        // Push asks and bids
        if (flatBids.length) {
            config.series.push({
                step: "right",
                name: `Bid ${quoteSymbol}`,
                data: flatBids,
                color: colors[theme].bidColor,
                fillColor: colors[theme].bidFillColor
            });
        }

        if (flatAsks.length) {
            config.series.push({
                step: "left",
                name: `Ask ${quoteSymbol}`,
                data: flatAsks,
                color: colors[theme].askColor,
                fillColor: colors[theme].askFillColor
            });
        }

        // Fix the height if defined, else use 400px;
        if (this.props.height) {
            config.chart.height = this.props.height;
        } else {
            config.chart.height = "400px";
        }

        // Add onClick event listener if defined
        if (this.props.onClick) {
            config.chart.events = {
                click: this.props.onClick.bind(this, power)
            };
        }

        if (this.props.noFrame) {
            return (
                <div className="grid-content no-overflow no-padding">
                        {!flatBids.length && !flatAsks.length && !flatCalls.length ? <span className="no-data"><Translate content="exchange.no_data" /></span> : null}
                        {this.props.noText ? null : <p className="bid-total">{utils.format_number(totalBids, base.get("precision"))} {baseSymbol}</p>}
                        {this.props.noText ? null : <p className="ask-total">{utils.format_number(totalAsks, quote.get("precision"))} {quoteSymbol}</p>}
                        {flatBids || flatAsks || flatCalls ? <ReactHighstock config={config}/> : null}
                </div>
            );
        } else {
            return (
                <div className="grid-content no-overflow no-padding middle-content">
                    <div className="exchange-bordered" style={{margin: 10}}>
                        <div className="exchange-content-header">
                            {this.props.noText ? null : <span className="bid-total">{utils.format_number(totalBids, base.get("precision"))} <AssetName name={baseSymbol} /></span>}
                            {this.props.noText ? null : <span className="ask-total float-right">{utils.format_number(totalAsks, quote.get("precision"))} <AssetName name={quoteSymbol} /></span>}
                        </div>
                        {!flatBids.length && !flatAsks.length && !flatCalls.length ? <span className="no-data"><Translate content="exchange.no_data" /></span> : null}
                        {flatBids || flatAsks || flatCalls ? <ReactHighstock ref="depthChart" config={config}/> : null}
                    </div>
                </div>
            );
        }
    }
}

DepthHighChart.defaultProps = {
    flat_bids: [],
    flat_asks: [],
    orders: {},
    quoteSymbol: "",
    baseSymbol: "",
    noText: false,
    noFrame: true
};

DepthHighChart.propTypes = {
    flat_bids: PropTypes.array.isRequired,
    flat_asks: PropTypes.array.isRequired,
    orders: PropTypes.object.isRequired,
    baseSymbol: PropTypes.string.isRequired,
    quoteSymbol: PropTypes.string.isRequired
};

export default DepthHighChart;
