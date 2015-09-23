
import React from "react";
import Highcharts from "react-highcharts/stocks";

class TransactionChart extends React.Component {

    shouldComponentUpdate(nextProps) {
        if (nextProps.blocks.size < 20) {
            return false;
        }
        return nextProps.blocks !== this.props.blocks;
    }

    render() {
        console.log("update trx chart");
        let {blocks} = this.props;

        let trxData = [];
        let max = 0;
        trxData = blocks.sort((a, b) => {
            return a.id - b.id;
        }).takeLast(30).map(block => {
            max = Math.max(block.transactions.length, max);
            return [block.id, block.transactions.length];
        }).toArray();

        let colors = trxData.map(entry => {
            // console.log("entry:", entry);
            if (entry[1] <= 5) {
                return "#50D2C2";
            } else if (entry[1] <= 10) {
                return "#A0D3E8";
            } else if (entry[1] <= 20) {
                return "#FCAB53";
            } else {
                return "#deb869";
            }
        })

        let config = {
            chart: {
                type: "column",
                backgroundColor: "rgba(255, 0, 0, 0)",
                spacing: [0, 0, 5, 0],
                height: 100
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
            // tooltip: {
                // positioner: function(w, h, point) {
                //     return {x: point.plotX, y: point.plotY - 30};
                // }
                // formatter: function() {
                //     return this.point.y;
                // }
            // },
            series: [
                {
                    name: "Transactions",
                    data: trxData,
                    color: "#50D2C2"
                }
            ],
            xAxis: {
                labels: {
                    enabled: false
                },
                title: {
                    text: null
                }
            },
            yAxis: {
                min: 0,
                max: Math.max(1.5, max + 0.5),
                title: {
                    text: null
                },
                labels: {
                    enabled: false
                },
                gridLineWidth: 0
            },
            plotOptions: {
                column: {
                    animation: false,
                    minPointLength: 3,
                    colorByPoint: true,
                    colors: colors,
                    borderWidth: 0
                }
            }
        };

        return (
            trxData.length ? <Highcharts config={config}/> : null
        );
    }
};

export default TransactionChart;