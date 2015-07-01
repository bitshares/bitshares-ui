import React from "react";
import {PropTypes} from "react";
import Immutable from "immutable";
import Highcharts from "react-highcharts/stocks";
import utils from "common/utils";

class DepthHighChart extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.orders, this.props.orders) ||
            nextProps.plotLine !== this.props.plotLine
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
        let {flat_bids, flat_asks, quoteSymbol, baseSymbol, totalBids} = this.props;

        let priceSymbol = `${baseSymbol}/${quoteSymbol}`;

        let totalAsks = 0;

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
            tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                formatter: function() {
                    let name = this.series.name.split(" ")[0];
                    return `<span style="font-size: 90%;">${Highcharts.Highcharts.numberFormat(this.x, 2)} ${priceSymbol}</span><br/>
                        <span style="color:${this.series.color}">\u25CF</span>
                        ${name}: <b>${Highcharts.Highcharts.numberFormat(this.y, 2)} ${quoteSymbol}</b>`;
                },
                style: {
                    color: "#FFFFFF"
                }
            },
            series: [
                {
                    name: `Bid ${quoteSymbol}`,
                    data: flat_bids,
                    color: "#50D2C2"
                },
                {
                    name: `Ask ${quoteSymbol}`,
                    data: flat_asks,
                    color: "#E3745B"
                }
            ],
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
                    }
                },
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
        if (flat_bids.length > 0 && flat_asks.length > 0) {
            let middleValue = (flat_asks[0][0] + flat_bids[flat_bids.length - 1][0]) / 2;
            config.xAxis.min = middleValue * 0.25;
            config.xAxis.max = middleValue * 1.75;
        }

        // Add plotline if defined
        if (this.props.plotLine) {
            config.xAxis.plotLines.push({
                color: "red",
                id: "plot_line",
                dashStyle: "longdashdot",
                value: this.props.plotLine,
                width: 1,
                zIndex: 5
            });
        }

        // Fix the height if defined, if not use offsetHeight
        if (this.props.height) {
            config.chart.height = this.props.height;
        } else if (this.state.offsetHeight) {
            config.chart.height = this.state.offsetHeight;
        }

        // Add onClick eventlistener if defined
        if (this.props.onClick) {
            config.chart.events = {
                click: this.props.onClick
            };
        }

        return (
            <div className="grid-content">
                <p className="bid-total">{utils.format_number(totalBids, 2)} {baseSymbol}</p>
                <p className="ask-total">{utils.format_number(totalAsks, 2)} {quoteSymbol}</p>
                {flat_bids && flat_asks ? <Highcharts config={config}/> : null}
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
