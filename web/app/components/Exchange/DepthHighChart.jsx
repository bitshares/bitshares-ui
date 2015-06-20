import React from "react";
import Immutable from "immutable";
import Highcharts from "react-highcharts";

// var config = {

//     xAxis: {
//         categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
//     },

//     series: [{
//         data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
//     }]

// };

class DepthHighChart extends React.Component {
    constructor() {
        super();
        this.state = {
            parentWidth: 0
        };
    }

    shouldComponentUpdate(nextProps) {
        return !Immutable.is(nextProps.orders, this.props.orders);
    }

    render() {
        let {flat_bids, flat_asks, quoteSymbol, baseSymbol} = this.props;
        if (flat_bids.length === 0) {
            console.log("flat_bids:", flat_bids);
        }
        if (flat_asks.length === 0) {
            console.log("flat_asks:", flat_asks);
        }
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
        // data = [
        //     {
        //     label: "somethingA",
        //     values: [{x: 0, y: 2}, {x: 1.3, y: 5}, {x: 3, y: 6}, {x: 3.5, y: 6.5}, {x: 4, y: 6}, {x: 4.5, y: 6}, {x: 5, y: 7}, {x: 5.5, y: 8}, {x: 10, y: 0}]
        //     },
        //     {
        //     label: "somethingB",
        //     values: [{x: 1.3, y: 4}, {x: 3, y: 7}, {x: 3.5, y: 8}, {x: 4, y: 7}, {x: 4.5, y: 7}, {x: 5, y: 7.8}, {x: 7, y: 9}, {x: 10, y: 9}, {x: 15, y: 9}]
        //     }
        // ];

        // if(orders.size > 0 && base && quote) {
           
        //     data = [
        //     {
        //         label: "Bids",
        //         values: this.props.flat_bids
        //     },
        //     {
        //         label: "Asks",
        //         values: this.props.flat_asks
        //     }];

        //     console.log("depth data:", data);

        // }


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
    width: "100%",
    height: 300,
    margin: { left: -1, top: 10, bottom: 0, right: 1 }
};

export default DepthHighChart;
