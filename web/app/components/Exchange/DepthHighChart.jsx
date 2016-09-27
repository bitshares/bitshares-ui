import React from "react";
import ReactDOM from "react-dom";
import {PropTypes} from "react";
import Immutable from "immutable";
import Highcharts from "highcharts/highstock.src";
let ReactHighstock = require("react-highcharts/dist/ReactHighstock");
import utils from "common/utils";
import counterpart from "counterpart";
import {cloneDeep} from "lodash";
import Translate from "react-translate-component";
import colors from "assets/colors";
import AssetName from "../Utility/AssetName";

class DepthHighChart extends React.Component {

    shouldComponentUpdate(nextProps) {
        let settleCheck = isNaN(nextProps.settlementPrice) ? false : nextProps.settlementPrice !== this.props.settlementPrice;
        return (
            !Immutable.is(nextProps.orders, this.props.orders) ||
            !Immutable.is(nextProps.call_orders, this.props.call_orders) ||
            settleCheck ||
            nextProps.feedPrice !== this.props.feedPrice ||
            nextProps.leftOrderBook !== this.props.leftOrderBook ||
            nextProps.SQP !== this.props.SQP ||
            nextProps.LCP !== this.props.LCP ||
            nextProps.showCallLimit !== this.props.showCallLimit ||
            nextProps.hasPrediction !== this.props.hasPrediction
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
        // let height = ReactDOM.findDOMNode(this).offsetHeight;
        // this.setState({offsetHeight: height - 10});
        //
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

        let {flat_bids, flat_asks, flat_calls, settles, quoteSymbol, baseSymbol, totalBids, totalCalls, spread, base, quote, theme} = this.props;

        let priceSymbol = `${baseSymbol}/${quoteSymbol}`;

        let totalAsks = 0;

        let power = 1;

        let flatBids = cloneDeep(flat_bids), flatAsks = cloneDeep(flat_asks), flatCalls = cloneDeep(flat_calls);

        if (flat_bids.length) {
            while ((flat_bids[flat_bids.length - 1][0] * power) < 1) {
                power *= 10;
            }
        } else if (flat_asks.length) {
            while ((flat_asks[0][0] * power) < 1) {
                power *= 10;
            }
        } else if (flat_calls && flat_calls.length) {
            while ((flat_calls[flat_calls.length - 1][0] * power) < 1) {
                power *= 10;
            }
        }

        power *= 10;

        if (power !== 1) {
            if (flatBids.length) {
                flatBids.forEach(bid => {
                    bid[0] *= power;
                })
            }

            if (flatAsks.length) {
                flatAsks.forEach(ask => {
                    ask[0] *= power;
                })
            }

            if (flatCalls && flatCalls.length) {
                flatCalls.forEach(call => {
                    call[0] *= power;
                })
            }
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

        // Total asks value
        if (flat_asks.length > 0) {
            totalAsks = flat_asks[flat_asks.length - 1][1];
        }

        // Center the charts between bids and asks
        if (flatBids.length > 0 && flatAsks.length > 0) {
            let middleValue = (flatAsks[0][0] + flatBids[flatBids.length - 1][0]) / 2;
            let adjustedSpread = spread * power;

            config.xAxis.min = middleValue * 0.4 // middleValue * (this.props.noFrame ? 0.8 : 0.50);
            config.xAxis.max = middleValue * 1.6; //(this.props.noFrame ? 1.2 : 1.50);

            // if (adjustedSpread > 0 && adjustedSpread > middleValue) {
            //     config.xAxis.min = Math.max(0, middleValue - 1.5 * adjustedSpread);
            //     config.xAxis.max = middleValue + 1.5 * adjustedSpread;
            // }
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


        if (this.props.settlementPrice) {
            config.xAxis.plotLines.push({
                color: "#7B1616",
                id: "plot_line",
                dashStyle: "solid",
                value: this.props.settlementPrice * power,
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
                })
                if (this.props.invertedCalls) {
                    totalAsks += totalCalls;
                } else {
                    totalBids += totalCalls;
                }
            }
        }

        // Add settle orders
        if (this.props.settlementPrice && this.props.settles.size) {
            let settleAsset, amountRatio, inverted;
            if (quote.get("id") === "1.3.0") {
                amountRatio = this.props.settlementPrice;
                settleAsset = base;
                inverted = true;
            } else {
                amountRatio = 1;
                settleAsset = quote;
                inverted = false;
            }

            let flat_settles = this.props.settles.reduce((final, a) => {
                if (!final) {
                    return [[this.props.settlementPrice * power, utils.get_asset_amount(a.balance.amount, settleAsset) / amountRatio]];
                } else {
                    final[0][1] = final[0][1] + utils.get_asset_amount(a.balance.amount, settleAsset) / amountRatio;
                    return final;
                }
            }, null);

            if (inverted) {
                flat_settles.unshift([0, flat_settles[0][1]]);
            } else {
                flat_settles.push([flat_asks[flat_asks.length-1][0] * power, flat_settles[0][1]]);
            }

            config.series.push({
                name: `Settle ${quoteSymbol}`,
                data: flat_settles,
                color: colors[theme].settleColor,
                fillColor: colors[theme].settleFillColor
            })

        }

        // Push asks and bids
        if (flatBids.length) {
            config.series.push({
                step: "right",
                name: `Bid ${quoteSymbol}`,
                data: flatBids,
                color: colors[theme].bidColor,
                fillColor: colors[theme].bidFillColor
            })
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
