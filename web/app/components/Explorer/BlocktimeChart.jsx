
import React from "react";
import Highcharts from "react-highcharts/stocks";
import _ from "lodash";

class BlocktimeChart extends React.Component {

    shouldComponentUpdate(nextProps) {

        if (nextProps.blockTimes.length < 19) {
            return false;
        } else if (this.props.blockTimes.length === 0) {
            return true;
        }

        return (
            nextProps.blockTimes[nextProps.blockTimes.length - 1][0] !== this.props.blockTimes[this.props.blockTimes.length - 1][0] ||
            nextProps.blockTimes.length !== this.props.blockTimes.length
        );
    }

    render() {

        let {blockTimes} = this.props;

        blockTimes.filter(a => {
            return a[0] >= (this.props.head_block_number - 30)
        });

        if (blockTimes && blockTimes.length) {
            blockTimes = _.takeRight(blockTimes, 30);
        }

        let colors = blockTimes.map(entry => {
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
            tooltip: {
                formatter: function() {
                    return this.point.y + "s";
                }
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
            blockTimes.length ? <Highcharts config={config}/> : null
        );
    }
};

export default BlocktimeChart;