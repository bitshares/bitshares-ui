import React from "react";
import {PropTypes} from "react";
import Highcharts from "react-highcharts/stocks";

class PriceChart extends React.Component {

    shouldComponentUpdate(nextProps) {

        if (this.props.priceData.length === 0) {
            return nextProps.priceData.length > 0;
        } else {
            return (
                nextProps.priceData[nextProps.priceData.length - 1][0] !== this.props.priceData[this.props.priceData.length - 1][0] ||
                nextProps.priceData.length !== this.props.priceData.length
            );
        }


    }

    constructor() {
        super();
        this.state = {offsetHeight: null};
    }

    componentWillReceiveProps() {
        let height = React.findDOMNode(this).offsetHeight;
        // console.log("componentWillReceiveProps PriceChart offsetHeight:", height);
        // console.log("componentWillReceiveProps PriceChart clientHeight:", clientHeight);
        this.setState({offsetHeight: height - 10});
    }


    render() {
        let {priceData, volumeData, quoteSymbol, baseSymbol} = this.props;

        let maxVolume = 0;
        for (var i = 0; i < volumeData.length; i++) {
            maxVolume = Math.max(maxVolume, volumeData[i][1]);
        }

        let config = {
            chart: {
                backgroundColor: "rgba(255, 0, 0, 0)",
                dataGrouping: {
                    enabled: false
                },
                pinchType: "x"
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
            scrollbar: {
                enabled: false
            },
            navigator: {
                enabled: false
            },
            plotOptions: {
                candlestick: {
                    animation: false,
                    color: "#f01717",
                    upColor: "#0ab92b"
                },
                column: {
                    animation: false
                },
                series: {
                    marker: {
                        enabled: false
                    },
                    enableMouseTracking: true
                }
            },
            tooltip: {
                shared: true,
                backgroundColor: "rgba(255, 0, 0, 0)",
                crosshairs: true,
                borderWidth: 0,
                shadow: false,
                useHTML: true,
                padding: 0,
                // pointFormat: " O: {point.open:.4f} H: {point.high:.4f} L: {point.low:.4f} C: {point.close:.4f}"
                formatter: function () {
                    let price_dec = 3;
                    let vol_dec = 0;
                    let time = new Date(this.x).toLocaleString() + "  ";
                    let TA = "";
                    if (this.points.length === 0) {
                        return "";
                    }
                    // if ((this.points[0].point && this.points[0].point.open) && (this.points[1].point && this.points[1].point.y)) {
                    return ("<span style='color: white;fill: white'>T:" + time +
                            "&nbsp;&nbsp;&nbsp;O:" + Highcharts.Highcharts.numberFormat(this.points[0].point.open, price_dec, ".", ",") +
                            "&nbsp;&nbsp;H:" + Highcharts.Highcharts.numberFormat(this.points[0].point.high, price_dec, ".", ",") +
                            "&nbsp;&nbsp;L:" + Highcharts.Highcharts.numberFormat(this.points[0].point.low, price_dec, ".", ",") +
                            "&nbsp;&nbsp;C:" + Highcharts.Highcharts.numberFormat(this.points[0].point.close, price_dec, ".", ",") +
                            "&nbsp;&nbsp;V:" + Highcharts.Highcharts.numberFormat(this.points[1].point.y, vol_dec, ".", ",") + " " +
                            baseSymbol + TA + "</span>");
                    // }
                    // else if this.points.length == 1 && this.points[0] && this.points[0].point.open
                    //     return time + "O:" + Highcharts.numberFormat(this.points[0].point.open, price_dec,".",",") + "  H:" + Highcharts.numberFormat(this.points[0].point.high, price_dec,".",",")+ "  L:" + Highcharts.numberFormat(this.points[0].point.low, price_dec,".",",") + "  C:" + Highcharts.numberFormat(this.points[0].point.close, price_dec,".",",")+TA
                    // else if this.points.length == 1 && this.points[1] && this.points[1].point.y
                    //     return time + "V:" + Highcharts.numberFormat(this.points[1].point.y, vol_dec,".",",")+" "+scope.volumeSymbol+TA
                    // else {
                    //     return ""
                    // }
                },
                positioner: function () {
                    return { x: 200, y: -5 };
                }
            },
            series: [
                {
                    id: "primary",
                    type: "candlestick",
                    name: `Price`,
                    data: priceData
                },
                {
                    type: "column",
                    name: `Volume`,
                    data: volumeData,
                    color: "#E3745B",
                    yAxis: 1
                }
            ],
            yAxis: [{
                    labels: {
                        style: {
                            color: "#FFFFFF"
                        },
                        align: "right",
                        x: -3,
                        format: "{value:,.2f}"
                    },
                    opposite: true,
                    title: {
                        text: "OHLC",
                        style: {
                            color: "#FFFFFF"
                        }
                    },
                    height: "70%",
                    gridLineWidth: 0
                },
                {
                    labels: {
                        style: {
                            color: "#FFFFFF"
                        },
                        align: "right",
                        x: -3
                    },
                    opposite: true,
                    top: "77%",
                    height: "20%",
                    offset: 0,
                    gridLineWidth: 0,
                    title: {
                        text: "Volume",
                        style: {
                            color: "#FFFFFF"
                        }
                    },
                    tickInterval: Math.floor(maxVolume / 2.5),
                    max: maxVolume

            }],
            xAxis: {
                type: "datetime",
                lineWidth: 0,
                labels: {
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
                plotLines: []
            }
        };

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
                <div className="card">
                    {priceData && volumeData ? <Highcharts config={config}/> : null}
                    </div>
            </div>
        );
    }
}

PriceChart.defaultProps = {
    flat_bids: [],
    flat_asks: [],
    orders: {},
    quoteSymbol: "",
    baseSymbol: ""
};

PriceChart.propTypes = {
    flat_bids: PropTypes.array.isRequired,
    flat_asks: PropTypes.array.isRequired,
    orders: PropTypes.object.isRequired,
    baseSymbol: PropTypes.string.isRequired,
    quoteSymbol: PropTypes.string.isRequired
};

export default PriceChart;
