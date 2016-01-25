import React from "react";
import ReStock from "react-stockcharts";
import d3 from "d3";
import utils from "common/utils";

var { ChartCanvas, Chart, DataSeries, EventCapture } = ReStock;
var { CandlestickSeries, HistogramSeries, LineSeries, AreaSeries, MACDSeries } = ReStock.series;
var { MouseCoordinates, CurrentCoordinate, EdgeContainer, EdgeIndicator } = ReStock.coordinates;
var { MACD, EMA, SMA } = ReStock.indicator;
var { TooltipContainer, OHLCTooltip, MovingAverageTooltip, MACDTooltip } = ReStock.tooltip;
var { StockscaleTransformer } = ReStock.transforms;

var { XAxis, YAxis } = ReStock.axes;

var { fitWidth, TypeChooser } = ReStock.helper;

var parseDate = d3.time.format("%Y-%m-%d").parse;


class CandleStickChartWithZoomPan extends React.Component {

    render() {
        var { type, width, priceData, quote, base } = this.props;

        let pricePrecision = base.get("precision");

        return (
            <ChartCanvas
                width={width - 30}
                height={600}
                margin={{
                    left: 50,
                    right: 50,
                    top:10,
                    bottom: 30
                }}
                initialDisplay={200}
                dataTransform={[ { transform: StockscaleTransformer } ]}
                data={priceData}
                type="hybrid"
            >
                <Chart
                    id={1}
                    yMousePointerDisplayLocation="right"
                    yMousePointerDisplayFormat={(y) => y.toFixed(pricePrecision)} 
                    padding={{ top: 10, right: 0, bottom: 20, left: 0 }}
                    height={350}
                >
                    <XAxis axisAt="bottom" orient="bottom" />
                    <YAxis axisAt="right" orient="right" ticks={5} />
                    <DataSeries id={0} yAccessor={CandlestickSeries.yAccessor} >
                        <CandlestickSeries />
                    </DataSeries>
                    <DataSeries id={1} indicator={SMA} options={{ period: 20, pluck: "close" }}>
                        <LineSeries/>
                    </DataSeries>
                    <DataSeries id={2} indicator={EMA} options={{ period: 20 }} >
                        <LineSeries/>
                    </DataSeries>
                    <DataSeries id={3} indicator={EMA} options={{ period: 50 }} >
                        <LineSeries/>
                    </DataSeries>
                </Chart>
                <CurrentCoordinate forChart={1} forDataSeries={1} />
                <CurrentCoordinate forChart={1} forDataSeries={2} />
                <CurrentCoordinate forChart={1} forDataSeries={3} />
                <Chart id={2} yMousePointerDisplayLocation="left" yMousePointerDisplayFormat={d3.format(".4s")}
                        height={150} origin={(w, h) => [0, h - 300]}>
                    <YAxis axisAt="left" orient="left" ticks={5} tickFormat={d3.format("s")}/>
                    <DataSeries id={0} yAccessor={(d) => d.volume}>
                        <HistogramSeries fill={(d) => d.close > d.open ? "#6BA583" : "red"} />
                    </DataSeries>
                    <DataSeries id={1} indicator={SMA} options={{ period: 10, pluck:"volume" }} >
                        <AreaSeries />
                    </DataSeries>
                </Chart>
                <Chart id={3} yMousePointerDisplayLocation="right" yMousePointerDisplayFormat={(y) => y.toFixed(2)}
                        height={150} origin={(w, h) => [0, h - 150]} padding={{ top: 10, right: 0, bottom: 10, left: 0 }} >
                    <XAxis axisAt="bottom" orient="bottom"/>
                    <YAxis axisAt="right" orient="right" ticks={2}/>
                    <DataSeries id={0} indicator={MACD} options={{ fast: 12, slow: 26, signal: 9 }} >
                        <MACDSeries />
                    </DataSeries>
                </Chart>
                <EdgeContainer>
                    <EdgeIndicator displayFormat={(y) => y.toFixed(pricePrecision)} itemType="last" orient="right" edgeAt="right" forChart={1} forDataSeries={1} />
                    <EdgeIndicator displayFormat={(y) => y.toFixed(pricePrecision)} itemType="last" orient="right" edgeAt="right" forChart={1} forDataSeries={2} />
                    <EdgeIndicator displayFormat={(y) => y.toFixed(pricePrecision)} itemType="last" orient="right" edgeAt="right" forChart={1} forDataSeries={3} />
                    <EdgeIndicator displayFormat={(y) => y.toFixed(pricePrecision)} itemType="first" orient="left" edgeAt="left" forChart={1} forDataSeries={1} />
                    <EdgeIndicator displayFormat={(y) => y.toFixed(pricePrecision)} itemType="first" orient="left" edgeAt="left" forChart={1} forDataSeries={2} />
                    <EdgeIndicator displayFormat={(y) => y.toFixed(pricePrecision)} itemType="first" orient="left" edgeAt="left" forChart={1} forDataSeries={3} />
                </EdgeContainer>
                <MouseCoordinates xDisplayFormat={d3.time.format("%Y-%m-%d")} type="crosshair" />
                <EventCapture mouseMove={true} zoom={true} pan={true} mainChart={1} defaultFocus={false} />                <TooltipContainer>
                    <OHLCTooltip forChart={1} origin={[-40, 0]}/>
                    <MovingAverageTooltip forChart={1} onClick={(e) => console.log(e)} origin={[-38, 15]}/>
                    <MACDTooltip forChart={3} origin={[-38, 15]}/>
                </TooltipContainer>

            </ChartCanvas>
        );
    }
}

CandleStickChartWithZoomPan = fitWidth(CandleStickChartWithZoomPan)

export default class Wrapper extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        if (!nextProps.priceData.length) {
            return false;
        }
        return !utils.are_equal_shallow(nextProps.priceData, this.props.priceData);
    }

    render() {
        if (!this.props.priceData.length) {
            return null;
        }

        return (
            <CandleStickChartWithZoomPan {...this.props} />
        )
    }
}
