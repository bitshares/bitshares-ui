import React from "react";
import {PropTypes} from "react";
import Immutable from "immutable";
import Highcharts from "react-highcharts";

class DepthHighChart extends React.Component {

    shouldComponentUpdate(nextProps) {
        return !Immutable.is(nextProps.orders, this.props.orders);
    }

    constructor() {
        super();
        this.state = {offsetHeight: null};
    }

    componentWillReceiveProps() {
        let height = React.findDOMNode(this).offsetHeight;
        let clientHeight = React.findDOMNode(this).clientHeight;
        console.log("componentWillReceiveProps DepthHighChart offsetHeight:", height);
        console.log("componentWillReceiveProps DepthHighChart clientHeight:", clientHeight);
        this.setState({offsetHeight: height - 10});
    }


    render() {
        let {flat_bids, flat_asks, quoteSymbol, baseSymbol} = this.props;

        let priceSymbol = `${baseSymbol}/${quoteSymbol}`;

        let config = {
            chart: {
                type: "area",
                backgroundColor: "rgba(255, 0, 0, 0)"
            },
            title: {
                text: null
            },
            credits: {
                enabled: false
            },
            legend: {
                itemStyle: {
                    color: "#FFFFFF"
                }
            },
            tooltip: {
                formatter: function() {
                    return `<b>${this.series.name}</b><br/>Price: ${this.x} ${priceSymbol}<br/>Amount: ${this.y} ${quoteSymbol}`;
                }
            },
            series: [
                {
                    name: `Buy ${quoteSymbol}`,
                    data: flat_bids,
                    color: "#50D2C2"
                },
                {
                    name: `Sell ${quoteSymbol}`,
                    data: flat_asks,
                    color: "#E3745B"
                }
            ],
            yAxis: {
                labels: {
                    style: {
                        color: "#FFFFFF"
                    }
                },
                title: {
                    text: `Amount (${quoteSymbol})`,
                    style: {
                        color: "#FFFFFF"
                    }
                }
            },
            xAxis: {
                labels: {
                    style: {
                        color: "#FFFFFF"
                    }
                },
                title: {
                    text: `Price (${priceSymbol})`,
                    style: {
                        color: "#FFFFFF"
                    }
                }
            },
            plotOptions: {
                area: {
                    animation: false,
                    marker: {
                        enabled: false
                    },
                    series: {
                        fillOpacity: 0.25
                    }
                }
            }
        };

        if (this.props.height) {
            config.chart.height = this.props.height;
        } else if (this.state.offsetHeight) {
            config.chart.height = this.state.offsetHeight;
        }

        return (
            <div className="grid-content">
                <div className="card">
                    {flat_bids && flat_asks ? <Highcharts config={config}/> : null}
                    </div>
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
