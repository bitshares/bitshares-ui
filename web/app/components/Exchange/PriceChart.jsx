import React from "react";
import {PropTypes} from "react";
import Highcharts from "react-highcharts/highstock";
import utils from "common/utils";

class Chart {
    shouldComponentUpdate(nextProps) {
        return (
            nextProps.quoteSymbol !== this.props.quoteSymbol ||
            !utils.are_equal_shallow(nextProps.config.series[0], this.props.config.series[0]) ||
            !utils.are_equal_shallow(nextProps.config.series[1], this.props.config.series[1])
        );
    }

    render() {
        return <Highcharts config={this.props.config}/>;
    }
}

class PriceChart extends React.Component {

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !utils.are_equal_shallow(nextProps.priceData, this.props.priceData) ||
            nextState.lastPointY !== this.state.lastPointY ||
            nextProps.baseSymbol !== this.props.baseSymbol ||
            nextProps.leftOrderBook !== this.props.leftOrderBook
            
        );
    }

    constructor() {
        super();
        this.state = {offsetHeight: null,
                      lastPointY: -100,
                      close: 0,
                      open: 0};
    }

    componentWillReceiveProps() {
        let height = React.findDOMNode(this).offsetHeight;
        this.setState({offsetHeight: height - 10});
    }


    render() {
        let {priceData, volumeData, quoteSymbol, baseSymbol, base, quote} = this.props;
        let {open, close, lastPointY} = this.state;

        let maxVolume = 0;
        let volumeColors = [], colorByPoint = false;

        if (volumeData.length === priceData.length) {
            colorByPoint = true;
        }
        for (var i = 0; i < volumeData.length; i++) {
            maxVolume = Math.max(maxVolume, volumeData[i][1]);
            if (colorByPoint) {
                volumeColors.push(priceData[i][1] <= priceData[i][4] ? "#50D2C2" : "#E3745B");
            }
        }

        let config = {
            chart: {
                backgroundColor: "rgba(255, 0, 0, 0)",
                dataGrouping: {
                    enabled: false
                },
                pinchType: "x",
                spacing: [10, 20, 5, 0],
                events: {
                    redraw: (e) => {
                        if (e.target.series[0].points.length > 0) {
                            let point = e.target.series[0].points[e.target.series[0].points.length - 1];
                            this.setState({lastPointY: e.target.plotTop + e.target.yAxis[0].toPixels(point.close, true),
                                        close: point.close,
                                        open: point.open
                                    });
                        }
                    },
                    load: (e) => {
                        if (e.target.series[0].points.length > 0) {
                            let point = e.target.series[0].points[e.target.series[0].points.length - 1];
                            this.setState({lastPointY: e.target.plotTop + e.target.yAxis[0].toPixels(point.close, true),
                                        close: point.close,
                                        open: point.open
                                    });
                        }
                    }
                }
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
                enabled: true
            },
            rangeSelector: {
                enabled: false
            },
            plotOptions: {
                candlestick: {
                    animation: false,
                    color: "#E3745B",
                    upColor: "#50D2C2",
                    lineColor: "#D7DBDE",
                    lineWidth: 1,
                    pointWidth: 4
                },
                column: {
                    animation: false,
                    borderColor: "#000000"
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
                borderWidth: 0,
                shadow: false,
                useHTML: true,
                padding: 0,
                crosshairs: [true, true],
                // pointFormat: " O: {point.open:.4f} H: {point.high:.4f} L: {point.low:.4f} C: {point.close:.4f}"
                formatter: function () {
                    let price_dec = base.precision;
                    let vol_dec = quote.precision;
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
                            quoteSymbol + TA + "</span>");
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
                        align: "left",
                        x: 10,
                        format: "{value:,." + (base.precision) + "f}"
                    },
                    opposite: true,
                    title: {
                        text: null,
                        style: {
                            color: "#FFFFFF"
                        }
                    },
                    top: "0%",
                    height: "70%",
                    offset: 23,
                    gridLineWidth: 0,
                    plotLines: []
                },
                {
                    labels: {
                        style: {
                            color: "#FFFFFF"
                        },
                        align: "left",
                        x: 10,
                        formatter: function() {
                            if (this.value !== 0) {
                                if ( this.value > 1000000 ) {
                                    return Highcharts.Highcharts.numberFormat( this.value / 1000, 2) + "M";
                                } else if ( this.value > 1000 ) {
                                    return Highcharts.Highcharts.numberFormat( this.value / 1000, 1) + "k";
                                } else {
                                    return this.value;
                                }
                            } else {
                                return null;
                            }
                        }
                    },
                    opposite: true,
                    top: "77%",
                    height: "23%",
                    offset: 23,
                    gridLineWidth: 0,
                    title: {
                        text: null,
                        style: {
                            color: "#FFFFFF"
                        }
                    },
                    tickInterval: Math.floor(maxVolume / 2.5),
                    min: 0,
                    max: maxVolume
            }],
            xAxis: {
                type: "datetime",
                lineWidth: 1,
                lineColor: "#000000",
                labels: {
                    style: {
                        color: "#FFFFFF"
                    }
                },
                title: {
                    text: null
                },
                plotLines: []

            }
        };

        // Set up/down colors on volume series
        if (colorByPoint) {
            config.plotOptions.column.colorByPoint = true;
            config.plotOptions.column.colors = volumeColors;
        }

        // Add plotline if defined
        // if (this.props.plotLine) {
        //     config.xAxis.plotLines.push({
        //         color: "red",
        //         id: "plot_line",
        //         dashStyle: "longdashdot",
        //         value: this.props.plotLine,
        //         width: 1,
        //         zIndex: 5
        //     });
        // }

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

        let boxHeight = 20;
        
        let currentValue = open <= close ?
            (<div
                className="chart-label"
                style={{height: boxHeight, color: "#000000", backgroundColor: "#50D2C2", right: "25px", top: lastPointY - 2 + boxHeight / 2}}
            >
                {utils.format_number(close, 1 + quote.precision)}
            </div>) :
            (<div
                className="chart-label"
                style={{height: boxHeight, backgroundColor: "#E3745B", right: "25px",  top: lastPointY - 2 + boxHeight / 2}}
            >
                {utils.format_number(close, 1 + quote.precision)}
            </div>);

        // let addLine = function(yPos, color) {
        //     return <span style={{position: "absolute", top: yPos, border: "solid 1px " + color, width: "500px", borderBottom: "0"}}></span>;
        // };

        return (
            <div className="grid-content no-padding no-overflow middle-content">
                <div style={{position: "relative"}}>
                    {currentValue}
                </div>
                <div style={{paddingTop: "1.5rem", paddingBottom: "0.5rem"}}>
                    {priceData && volumeData ? <Chart quoteSymbol={quoteSymbol} config={config} /> : null}
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
