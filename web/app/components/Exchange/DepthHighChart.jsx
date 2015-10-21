import React from "react";
import {PropTypes} from "react";
import Immutable from "immutable";
import Highstock from "react-highcharts/highstock";
import utils from "common/utils";
import counterpart from "counterpart";
import _ from "lodash";

class DepthHighChart extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.orders, this.props.orders) ||
            !Immutable.is(nextProps.call_orders, this.props.call_orders) ||
            nextProps.plotLine !== this.props.plotLine ||
            nextProps.feedPrice !== this.props.feedPrice ||
            nextProps.settlementPrice !== this.props.settlementPrice ||
            nextProps.leftOrderBook !== this.props.leftOrderBook
        );
    }

    constructor() {
        super();
        this.state = {offsetHeight: null};
    }

    componentWillReceiveProps() {
        let height = React.findDOMNode(this).offsetHeight;
        this.setState({offsetHeight: height - 10});
    }


    render() {
        let {flat_bids, flat_asks, flat_calls, quoteSymbol, baseSymbol, totalBids, totalCalls, spread, base, quote} = this.props;

        let priceSymbol = `${baseSymbol}/${quoteSymbol}`;

        let totalAsks = 0;

        let power = 1;

        let flatBids = _.cloneDeep(flat_bids), flatAsks = _.cloneDeep(flat_asks), flatCalls = _.cloneDeep(flat_calls);

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
        console.log("power:", power, flat_bids.length);
        if (power !== 1) {
            if (flatBids.length) {
                flatBids.forEach(bid => {
                    bid[0] *= power;
                })
            }

            console.log("power:", power, flatBids.length);

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
                crosshairs: [true, true],
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                formatter: function() {
                    let name = this.series.name.split(" ")[0];
                    return `<span style="font-size: 90%;">${utils.format_number(this.x / power, base.precision)} ${priceSymbol}</span><br/>
                        <span style="color:${this.series.color}">\u25CF</span>
                        ${name}: <b>${utils.format_number(this.y, base.precision)} ${quoteSymbol}</b>`;
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
                gridLineWidth: 0
            },
            xAxis: {
                labels: {
                    style: {
                        color: "#FFFFFF"
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
                        fillOpacity: 0.25,
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
            config.xAxis.min = middleValue * 0.25;
            config.xAxis.max = middleValue * 1.75;
            if (spread > 0 && spread > middleValue) {
                config.xAxis.min = Math.max(0, middleValue - 1.5 * spread);
                config.xAxis.max = middleValue + 1.5 * spread;
            }
        }

        // Add plotlines if defined
        if (this.props.plotLine) {
            config.xAxis.plotLines.push({
                color: "red",
                id: "plot_line",
                dashStyle: "longdashdot",
                value: this.props.plotLine * power,
                width: 1,
                zIndex: 5
            });
        }

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

        if (this.props.SQP) {
            config.xAxis.plotLines.push({
                color: "#B6B6B6",
                id: "plot_line",
                dashStyle: "longdash",
                value: this.props.SQP * power,
                label: {
                    text: counterpart.translate("exchange.squeeze"),
                    style: {
                        color: "#DADADA",
                        fontWeight: "bold"
                    }
                },
                width: 2,
                zIndex: 5
            });
        }

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
                    color: "#BBBF2B"
                })
                if (this.props.invertedCalls) {
                    totalAsks += totalCalls;
                } else {
                    totalBids += totalCalls;
                }
            }
        }

        // Push asks and bids
        if (flatBids.length) {
            config.series.push({
                name: `Bid ${quoteSymbol}`,
                data: flatBids,
                color: "#50D2C2"
            })
        }

        if (flatAsks.length) {
            config.series.push({
                name: `Ask ${quoteSymbol}`,
                data: flatAsks,
                color: "#E3745B"
            });
        }

        // Fix the height if defined, if not use offsetHeight
        if (this.props.height) {
            config.chart.height = this.props.height;
        } else if (this.state.offsetHeight) {
            config.chart.height = this.state.offsetHeight;
        }

        // Add onClick event listener if defined
        if (this.props.onClick) {
            config.chart.events = {
                click: this.props.onClick
            };
        }

        console.log("flatBids:", flatBids.length, "flatAsks:", flatAsks.length, config);

        return (
            <div className="grid-content no-overflow middle-content">
                <p className="bid-total">{utils.format_number(totalBids, base.precision)} {baseSymbol}</p>
                <p className="ask-total">{utils.format_number(totalAsks, quote.precision)} {quoteSymbol}</p>
                {flatBids || flatAsks || flatCalls ? <Highstock config={config}/> : null}
            </div>
        );
    }
}

DepthHighChart.defaultProps = {
    flat_bids: [],
    flat_asks: [],
    orders: {},
    quoteSymbol: "",
    baseSymbol: ""
};

DepthHighChart.propTypes = {
    flat_bids: PropTypes.array.isRequired,
    flat_asks: PropTypes.array.isRequired,
    orders: PropTypes.object.isRequired,
    baseSymbol: PropTypes.string.isRequired,
    quoteSymbol: PropTypes.string.isRequired
};

export default DepthHighChart;
