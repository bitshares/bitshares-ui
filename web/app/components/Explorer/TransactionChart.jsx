
import React from "react";
import Highcharts from "react-highcharts/stocks";

class TransactionChart extends React.Component {

    shouldComponentUpdate(nextProps) {
        return nextProps.blocks !== this.props.blocks;
    }

    render() {

        let {blocks} = this.props;

        let trxData = [];
        let max = 0;
        trxData = blocks.sort((a, b) => {
            return a.id - b.id;
        }).map(block => {
            max = Math.max(block.transactions.length, max);
            return [block.id, block.transactions.length];
        }).toArray();

        let config = {
            chart: {
                type: "line",
                backgroundColor: "rgba(255, 0, 0, 0)",
                spacing: [0, 0, 5, 0],
                height: 200
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
            series: [
                {
                    name: "Transaction frequency",
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
                }
            },
            plotOptions: {
                line: {
                    animation: false
                }
            }
        };



        return (
            <div className="grid-content">
                {trxData.length ? <Highcharts config={config}/> : null}
            </div>
        );
    }
};

export default TransactionChart;