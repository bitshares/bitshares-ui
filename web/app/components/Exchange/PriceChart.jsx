import React from "react";
import ReactDOM from "react-dom";
import {PropTypes} from "react";
import Highcharts from "highcharts/highstock";
var ReactHighstock = require("react-highcharts/dist/ReactHighstock");
import utils from "common/utils";
import {cloneDeep} from "lodash";
import Translate from "react-translate-component";
import colors from "assets/colors";

require("./highcharts-plugins/technical-indicators.src.js");
require("./highcharts-plugins/rsi.js");
require("./highcharts-plugins/ema.js");
require("./highcharts-plugins/atr.js");
require("./highcharts-plugins/sma.js");
require("./highcharts-plugins/indicators.css");
require("./highcharts-plugins/highstock-current-price-indicator.js")

class PriceChart extends React.Component {

    shouldComponentUpdate(nextProps, nextState) {
        let chart = this.refs.chart.chart;
        if (chart && (!utils.are_equal_shallow(nextProps.indicators, this.props.indicators))) {
            let changed, added;

            for (let key in nextProps.indicators) {
                if (nextProps.indicators[key] !== this.props.indicators[key]) {
                    changed = key;
                    added = nextProps.indicators[key];
                }
            }

            let indicator = added ? this.getIndicators(nextProps, changed)[0] : changed;

            if (added) {
                chart.addIndicator(indicator, true);
            } else {
                let indicators = chart.indicators.allItems;
                for (var i = indicators.length - 1 ; i >= 0 ; i--) {
                    if (indicators[i].name === changed) {
                        indicators[i].destroy();
                        break;
                    }
                };
            }
            return false;
        }

        if (chart && (!utils.are_equal_shallow(nextProps.indicatorSettings, this.props.indicatorSettings))) {
            let changed, added, changedSetting;

            for (let key in nextProps.indicatorSettings) {
                let change = _(nextProps.indicatorSettings[key]).reduce((total, a, settingKey) => {

                    let change = a !== this.props.indicatorSettings[key][settingKey];
                    changedSetting = change ? settingKey : changedSetting;
                    return total ? total : a !== this.props.indicatorSettings[key][settingKey];
                }, null);

                changed = change ? key : changed;
            }

            if (changedSetting !== "period") {
                let indicators = chart.indicators.allItems;
                let options = this.getIndicators(nextProps, changed)[0]

                for (var i = indicators.length - 1 ; i >= 0 ; i--) {
                        if (indicators[i].name === changed) {
                            indicators[i].update(options);
                            break;
                        }
                    };
                chart.redraw();
                return false;
            }
        }

        let latestCheck = false;
        if ((nextProps.priceData && !nextProps.priceData.length) && (nextProps.latest && this.props.latest)) {
            latestCheck = nextProps.latest.full !== this.props.latest.full;
        }
        return (
            !utils.are_equal_shallow(nextProps.priceData, this.props.priceData) ||
            nextState.lastPointY !== this.state.lastPointY ||
            nextProps.baseSymbol !== this.props.baseSymbol ||
            latestCheck ||
            nextProps.leftOrderBook !== this.props.leftOrderBook ||
            !utils.are_equal_shallow(nextProps.indicatorSettings, this.props.indicatorSettings) ||
            nextProps.verticalOrderbook !== this.props.verticalOrderbook ||
            nextProps.height !== this.props.height ||
            nextProps.zoom !== this.props.zoom
        );
    }

    constructor() {
        super();
        this.state = {
            offsetHeight: null,
            lastPointY: -100,
            close: 0,
            open: 0
        };
    }

    componentDidMount() {
        this.reflowChart(500);
    }

    componentWillReceiveProps(nextProps) {
        let height = ReactDOM.findDOMNode(this).offsetHeight;
        this.setState({offsetHeight: height - 10});

        if (this.refs.chart && 
            (nextProps.verticalOrderbook !== this.props.verticalOrderbook ||
            nextProps.height !== this.props.height)
                ) {
            this.reflowChart(100);
        }
    }

    reflowChart(timeout) {
        setTimeout(() => {
            if (this.refs.chart) {
                this.refs.chart.chart.reflow();
            }
        }, timeout);   
    }

    getIndicators(props, select = false) {

        let {indicators, indicatorSettings} = props;
        let currentIndicator = [];

        for (let indicator in indicators) {
            if (indicators[indicator] && (!select || select === indicator)) {
                // console.log(indicator, "params:", indicatorSettings[indicator]);
                switch (indicator) {
                    case "sma":
                        currentIndicator.push({
                            id: 'primary',
                            type: 'sma',
                            params: indicatorSettings[indicator],
                            tooltip:{
                                pointFormat: '<span style="color: {point.color}; ">pointFormat SMA: </span> {point.y}<br>'
                            },
                        })
                        break;

                    case "ema":
                        currentIndicator.push({
                            id: 'primary',
                            type: 'ema',
                            params: indicatorSettings[indicator],
                            styles: {
                                strokeWidth: 2,
                                stroke: props.priceData.length ? "green" : "black",
                                dashstyle: 'solid'
                            }
                        })
                        break;

                    case "rsi":
                        currentIndicator.push({
                            id: 'primary',
                            type: 'rsi',
                            params: indicatorSettings[indicator],
                            styles: {
                                strokeWidth: 2,
                                stroke: '#A7DACD',
                                dashstyle: 'solid'
                            },
                            yAxis: {
                                lineWidth:2,
                                title: {
                                    text:'RSI',
                                    style: {
                                        color: "#FFFFFF"
                                    }
                                },
                                labels: {
                                    style: {
                                        color: "#FFFFFF"
                                    }
                                }
                            }
                        });
                        break;

                    case "atr":
                        currentIndicator.push({
                            id: 'primary',
                            type: 'atr',
                            params: indicatorSettings[indicator],
                            styles: {
                                strokeWidth: 2,
                                stroke: 'orange',
                                dashstyle: 'solid'
                            },
                            yAxis: {
                                lineWidth: 2,
                                title: {
                                    text: 'ATR',
                                    style: {
                                        color: "#FFFFFF"
                                    }
                                },
                                labels: {
                                    style: {
                                        color: "#FFFFFF"
                                    }
                                }
                            }
                        });
                        break;

                    default:
                        currentIndicator = [];
                }
            }
        }

        return currentIndicator;
    }

    render() {
        let {priceData, volumeData, quoteSymbol, baseSymbol, base, quote, marketReady,
            indicators, indicatorSettings, latest, bucketSize, theme} = this.props;

        let priceSeriesData = cloneDeep(priceData);
        let currentIndicator = this.getIndicators(this.props);

        let positiveColor = colors[theme].positiveColor;
        let negativeColor = colors[theme].negativeColor;
        
        if (!priceSeriesData.length && latest) {
            let now = (new Date).getTime();
            priceSeriesData.push([now, latest.full, latest.full, latest.full, latest.full]);
            volumeData.push([now, 0]);
            for (var i = 1; i < 100; i++) {
                priceSeriesData.unshift([now - (bucketSize * 1000) * i, latest.full, latest.full, latest.full, latest.full]);
                volumeData.unshift([now - (bucketSize * 1000) * i, 0]);
            };
            // is this required?
            positiveColor = "black";
            negativeColor = "black";
        }

        // Find max volume
        // let maxVolume = 0;
        let volumeColors = [], colorByPoint = false;

        // if (volumeData.length === priceSeriesData.length) {
        //     colorByPoint = true;
        // }
        // for (var i = 0; i < volumeData.length; i++) {
        //     maxVolume = Math.max(maxVolume, volumeData[i][1]);
            // if (colorByPoint) {
            //     volumeColors.push(priceSeriesData[i][1] <= priceSeriesData[i][4] ? positiveColor : negativeColor);
            // }
        // }

        // Find highest price
        // let maxPrice = 0;
        // if (priceSeriesData.length) {
        //     for (var i = 0; i < priceSeriesData.length; i++) {
        //         maxPrice = Math.max(maxPrice, priceSeriesData[i][2]);
        //     }
        // }

        let config = {
            chart: {
                backgroundColor: "rgba(255, 0, 0, 0)",
                dataGrouping: {
                    enabled: false
                },
                pinchType: "x",
                spacing: [20, 10, 5, 10],
                alignTicks: false
            },

            indicators: priceSeriesData.length ? currentIndicator : [],
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
                enabled: true,
                height: 30,
                margin: 10
            },
            rangeSelector: {
                enabled: false
            },
            plotOptions: {
                candlestick: {
                    oxymoronic: false,
                    animation: false,
                    color: negativeColor,
                    lineColor: negativeColor,
                    upColor: positiveColor,
                    upLineColor: positiveColor,
                    lineWidth: 4
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
                enabledIndicators: true,
                shared: true,
                backgroundColor: colors[theme].tooltipBackgroundColor,
                borderWidth: 0,
                shadow: false,
                useHTML: true,
                padding: 0,
                formatter: function () {
                    let price_dec = base.get("precision");
                    let vol_dec = quote.get("precision");
                    let time =  Highcharts.dateFormat("%Y-%m-%d %H:%M", this.x);


                    if (!this.points || this.points.length === 0) {
                        return "";
                    }
                    let TA = _(this.points[1].indicators).reduce((finalString, indicator, key) => {
                        return finalString + "<b>" + key.toUpperCase() + "</b>" + ": " + Highcharts.numberFormat(indicator[1], price_dec, ".", ",") + "  ";
                    }, "");

                   return ("<span style='color: " + colors[theme].tooltipColor +";fill: "+ colors[theme].tooltipFillColor + "'>" +
                             "<b>Open:&nbsp;&nbsp;&nbsp;</b>" + Highcharts.numberFormat(this.points[1].point.open, price_dec, ".", ",") +
                             "<b>&nbsp;&nbsp;High:&nbsp;&nbsp;&nbsp;</b>" + Highcharts.numberFormat(this.points[1].point.high, price_dec, ".", ",") +
                             "<b>&nbsp;&nbsp;Time:&nbsp;&nbsp;&nbsp;</b>" + time +
                             "<br/><b>Close:&nbsp;&nbsp;</b>" + Highcharts.numberFormat(this.points[1].point.close, price_dec, ".", ",") +
                             "<b>&nbsp;&nbsp;Low:&nbsp;&nbsp;&nbsp;&nbsp;</b>" + Highcharts.numberFormat(this.points[1].point.low, price_dec, ".", ",") +
                             "<b>&nbsp;&nbsp;&nbsp;Vol:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</b>" + Highcharts.numberFormat(this.points[1] ? this.points[0].point.y : 0, vol_dec, ".", ",") + "&nbsp;&nbsp;" + quoteSymbol + "<br/>"
                             + TA + "</span>");

                },
                positioner: function () {
                    return { x: 50, y: -5 };
                }
            },
            series: [
                {
                    type: "column",
                    name: `Volume`,
                    data: volumeData,
                    color: colors[theme].volumeColor,
                    yAxis: 1
                },
                {
                    id: "primary",
                    type: "candlestick",
                    name: `Price`,
                    data: priceSeriesData
                }
            ],
            yAxis: [{
                    labels: {
                        style: {
                            color: colors[theme].axisLabelsColor
                        },
                        align: "left",
                        x: 10,
                        format: "{value:,." + (base.get("precision")) + "f}"
                    },
                    opposite: true,
                    title: {
                        text: null,
                        style: {
                            color: colors[theme].axisLabelsColor
                        }
                    },
                    offset: 5,
                    lineWidth: 1,
                    lineColor: "rgba(183, 183, 183, 0.29)",
                    gridLineWidth: 0,
                    plotLines: [],
                    crosshair: {
                        snap: false
                    },
                    startOnTick: false,
                    endOnTick: true,
                    showLastLabel: true,
                    maxPadding: 0,
                    currentPriceIndicator: {
                        precision: base.get("precision"),
                        backgroundColor: '#C38B8B',
                        borderColor: '#000000',
                        lineColor: '#C38B8B',
                        lineDashStyle: 'Solid',
                        lineOpacity: 0.8,
                        enabled: priceSeriesData.length > 0 && marketReady,
                        style: {
                            color: '#ffffff',
                            fontSize: '10px'
                        },
                        x: -30,
                        y: 0,
                        zIndex: 99,
                        width: 80
                    },
                    height: "90%"
                },
                {
                    labels: {
                        style: {
                            color: colors[theme].axisLabelsColor
                        },
                        align: "left",
                        x: 10,
                        formatter: function() {
                            if (this.value !== 0) {
                                if ( this.value > 1000000 ) {
                                    return Highcharts.numberFormat( this.value / 1000, 2) + "M";
                                } else if ( this.value > 1000 ) {
                                    return Highcharts.numberFormat( this.value / 1000, 1) + "k";
                                } else {
                                    return this.value;
                                }
                            } else {
                                return null;
                            }
                        }
                    },
                    opposite: false,
                    offset: 5,
                    gridLineWidth: 0,
                    lineWidth: 1,
                    lineColor: "rgba(183, 183, 183, 0.29)",
                    endOnTick: true,
                    showLastLabel: true,
                    title: {
                        text: null,
                        style: {
                            color: "#FFFFFF"
                        }
                    },
                    showFirstLabel: true,
                    min: 0,
                    crosshair: {
                        snap: false
                    },
                    height: "50%",
                    top: "50%"
            }],
            xAxis: {
                type: "datetime",
                lineWidth: 1,
                lineColor: colors[theme].axisLineColor,
                labels: {
                    style: {
                        color: colors[theme].axisLabelsColor
                    }
                },
                title: {
                    text: null
                },
                plotLines: [],
                min: this.props.zoom === "all" ? null : new Date().getTime() - 1000 * this.props.zoom

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
            config.chart.height = this.props.height + 20 * currentIndicator.length;
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

        return (
            <div className="grid-content no-padding no-margin no-overflow middle-content">
                <div className="exchange-bordered" style={{margin: 10}}>
                    <div className="exchange-content-header">
                        <Translate content="exchange.price_history" />
                        <div className="float-right">
                            <div style={{display: "inline-block", marginBottom: -3, marginTop: -6, padding: "3px 8px"}} className="button outline clickable" onClick={this.props.onChangeSize.bind(this, false)}>-</div>
                            <div style={{display: "inline-block", marginBottom: -3, marginTop: -6, padding: "3px 8px"}} className="button outline clickable" onClick={this.props.onChangeSize.bind(this, true)}>+</div>
                        </div>
                    </div>
                    {!priceSeriesData.length ? <span className="no-data"><Translate content="exchange.no_data" /></span> : null}
                    <div style={{paddingTop: 0, paddingBottom: "0.5rem"}}>
                        {priceSeriesData && volumeData ? <ReactHighstock ref="chart" config={config}/> : null}
                    </div>
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
