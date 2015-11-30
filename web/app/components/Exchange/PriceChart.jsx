import React from "react";
import {PropTypes} from "react";
import Highcharts from "react-highcharts/highstock";
import utils from "common/utils";
import _ from "lodash";
import Translate from "react-translate-component";

require("./technical-indicators.src.js");
require("./rsi.js");
require("./ema.js");
require("./atr.js");
require("./sma.js");
require("./indicators.css");
require("./highstock-current-price-indicator.js")

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

        return (
            !utils.are_equal_shallow(nextProps.priceData, this.props.priceData) ||
            nextState.lastPointY !== this.state.lastPointY ||
            nextProps.baseSymbol !== this.props.baseSymbol ||
            nextProps.leftOrderBook !== this.props.leftOrderBook ||
            !utils.are_equal_shallow(nextProps.indicatorSettings, this.props.indicatorSettings)            
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

    componentWillReceiveProps() {
        let height = React.findDOMNode(this).offsetHeight;
        this.setState({offsetHeight: height - 10});
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
                                stroke: 'green',
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
        let {priceData, volumeData, quoteSymbol, baseSymbol, base, quote, marketReady, indicators, indicatorSettings} = this.props;
        // let {open, close, lastPointY} = this.state;

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

        let currentIndicator = this.getIndicators(this.props);       

        let config = {
            chart: {
                backgroundColor: "rgba(255, 0, 0, 0)",
                dataGrouping: {
                    enabled: false
                },
                pinchType: "x",
                spacing: [20, 10, 5, 10]
            },
            
            indicators: priceData.length ? currentIndicator : [],
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
                    lineColor: "#D7DBDE"
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
                backgroundColor: "rgba(255, 0, 0, 0)",
                borderWidth: 0,
                shadow: false,
                useHTML: true,
                padding: 0,
                formatter: function () {
                    let price_dec = base.get("precision");
                    let vol_dec = quote.get("precision");
                    let time =  Highcharts.Highcharts.dateFormat("%Y-%m-%d %H:%M", this.x);

                    
                    if (!this.points || this.points.length === 0) {
                        return "";
                    }
                    let TA = _(this.points[0].indicators).reduce((finalString, indicator, key) => {
                        return finalString + "<b>" + key.toUpperCase() + "</b>" + ": " + Highcharts.Highcharts.numberFormat(indicator[1], price_dec, ".", ",") + "  ";
                    }, "");

                    return ("<span style='color: white;fill: white'><b>T:&nbsp;</b>" + time + 
                            "&nbsp;<b>O:&nbsp;</b>" + Highcharts.Highcharts.numberFormat(this.points[0].point.open, price_dec, ".", ",") +
                            "&nbsp;&nbsp;<b>H:&nbsp;</b>" + Highcharts.Highcharts.numberFormat(this.points[0].point.high, price_dec, ".", ",") +
                            "&nbsp;&nbsp;<b>L:&nbsp;</b>" + Highcharts.Highcharts.numberFormat(this.points[0].point.low, price_dec, ".", ",") +
                            "&nbsp;&nbsp;<b>C:&nbsp;</b>" + Highcharts.Highcharts.numberFormat(this.points[0].point.close, price_dec, ".", ",") +
                            "<b>&nbsp;V:&nbsp;</b>" + Highcharts.Highcharts.numberFormat(this.points[1] ? this.points[1].point.y : 0, vol_dec, ".", ",") + " " +
                            quoteSymbol + "<br/>" + TA + "</span>");

                },
                positioner: function () {
                    return { x: 110, y: -5 };
                }
            },
            series: [
                {
                    id: "primary",
                    type: "candlestick",
                    name: `Price`,
                    data: _.cloneDeep(priceData)
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
                        format: "{value:,." + (base.get("precision")) + "f}"
                    },
                    opposite: true,
                    title: {
                        text: null,
                        style: {
                            color: "#FFFFFF"
                        }
                    },
                    top: "0%",
                    height: "80%",
                    offset: 5,
                    gridLineWidth: 0,
                    plotLines: [],
                    crosshair: {
                        snap: false
                    },
                    startOnTick: false,
                    endOnTick: false,
                    showLastLabel: true,
                    maxPadding: 0,
                    currentPriceIndicator: {
                        precision: base.get("precision"),
                        backgroundColor: '#000000',
                        borderColor: '#000000',
                        lineColor: '#000000',
                        lineDashStyle: 'Solid',
                        lineOpacity: 0.6,
                        enabled: priceData.length > 0 && marketReady,
                        style: {
                            color: '#ffffff',
                            fontSize: '12px'
                        },
                        x: -30,
                        y: 0,
                        zIndex: 99,
                        width: 80
                    }
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
                    top: "80%",
                    height: "20%",
                    offset: 5,
                    gridLineWidth: 0,
                    title: {
                        text: null,
                        style: {
                            color: "#FFFFFF"
                        }
                    },
                    showFirstLabel: true,
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
            <div className="grid-content no-padding no-overflow">
                {!priceData.length ? <span className="no-data"><Translate content="exchange.no_data" /></span> : null}
                <div style={{paddingTop: 0, paddingBottom: "0.5rem"}}>
                    {priceData && volumeData ? <Highcharts ref="chart" config={config}/> : null}
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
