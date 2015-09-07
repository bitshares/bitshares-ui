
import React from "react";
import Highcharts from "react-highcharts/stocks";

class BlocktimeChart extends React.Component {

    shouldComponentUpdate(nextProps) {
        if (nextProps.blockTimes.length === 0 || this.props.blockTimes.length === 0) {
            return false;
        }
        return nextProps.blockTimes[0][0] !== this.props.blockTimes[0][0];
    }

    render() {

        let {blockTimes} = this.props;

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
            series: [
                {
                    name: "Block time",
                    data: blockTimes,
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
                title: {
                    text: null
                },
                labels: {
                    enabled: false
                }
            },
            plotOptions: {
                column: {
                    animation: false,
                    minPointLength: 3
                }
            }
        };

        return (
            blockTimes.length ? <Highcharts config={config}/> : null
        );
    }
};

export default BlocktimeChart;