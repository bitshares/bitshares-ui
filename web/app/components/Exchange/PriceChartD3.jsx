import React from "react";
import ReStock from "react-stockcharts";
import d3 from "d3";
import utils from "common/utils";

let { ChartCanvas, Chart, DataSeries, EventCapture } = ReStock;
let { CandlestickSeries, HistogramSeries, LineSeries, AreaSeries, MACDSeries } = ReStock.series;
let { MouseCoordinates, CurrentCoordinate, EdgeContainer, EdgeIndicator } = ReStock.coordinates;
let { MACD, EMA, SMA } = ReStock.indicator;
let { TooltipContainer, OHLCTooltip, MovingAverageTooltip, MACDTooltip } = ReStock.tooltip;
let { StockscaleTransformer } = ReStock.transforms;

let { XAxis, YAxis } = ReStock.axes;

let { fitWidth, TypeChooser } = ReStock.helper;

class CandleStickChartWithZoomPan extends React.Component {

    render() {
        var { type, width, priceData, quote, base } = this.props;

        let pricePrecision = base.get("precision");
        let height = 600;

        var margin = {left: 70, right: 70, top:20, bottom: 30};

        let gridHeight = height - margin.top - margin.bottom;
        let gridWidth = width - margin.left - margin.right;

        let showGrid = true;
        let yGrid = showGrid ? { innerTickSize: -1 * gridWidth, tickStrokeOpacity: 0.1 } : {};
        let xGrid = showGrid ? { innerTickSize: -1 * gridHeight, tickStrokeOpacity: 0.1 } : {};

        return (
            <ChartCanvas
                width={width - 20}
                height={600}
                margin={margin}
                data={priceData}
                type="hybrid"
                xScale={d3.time.scale()}
            >
                <Chart
                    id={1}
                    xAccessor={(d) => d.date}
                    yMousePointerDisplayLocation="right"
                    yMousePointerDisplayFormat={(y) => y.toFixed(pricePrecision)} 
                    padding={{ top: 10, right: 0, bottom: 20, left: 0 }}
                    height={300}
                >
                    <YAxis axisAt="right" orient="right" ticks={5} {...yGrid} tickStroke="#FFFFFF"/>
                    <DataSeries id={0} yAccessor={CandlestickSeries.yAccessor} >
                        <CandlestickSeries wickStroke={{ up: "#6BA583", down: "#db0000" }} fill={{ up: "#6BA583", down: "#db0000" }}/>
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
                <Chart
                    xAccessor={(d) => d.date}
                    id={2}
                    yMousePointerDisplayLocation="left"
                    yMousePointerDisplayFormat={d3.format(".4s")}
                    height={150}
                    origin={(w, h) => [0, h - 300]}
                >
                    <YAxis axisAt="left" orient="left" ticks={5} tickFormat={d3.format("s")} tickStroke="#FFFFFF"/>
                    <DataSeries id={0} yAccessor={(d) => d.volume}>
                        <HistogramSeries fill={(d) => d.close > d.open ? "#6BA583" : "red"} />
                    </DataSeries>
                    <DataSeries id={1} indicator={SMA} options={{ period: 10, pluck:"volume" }} >
                        <AreaSeries />
                    </DataSeries>
                </Chart>
                <Chart
                    xAccessor={(d) => d.date}
                    id={3}
                    yMousePointerDisplayLocation="right"
                    yMousePointerDisplayFormat={(y) => y.toFixed(2)}
                    height={150}
                    origin={(w, h) => [0, h - 150]}
                    padding={{ top: 10, right: 0, bottom: 10, left: 0 }}
                >
                    <XAxis axisAt="bottom" orient="bottom" tickStroke="#FFFFFF" stroke="#FFFFFF"/>
                    <YAxis axisAt="right" orient="right" ticks={2} {...yGrid} tickStroke="#FFFFFF"/>
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
                <EventCapture mouseMove={true} zoom={true} pan={true} mainChart={1} defaultFocus={false} />                
                <TooltipContainer>
                    <OHLCTooltip forChart={1} origin={[-40, 0]} yPrecision={pricePrecision}/>
                    <MovingAverageTooltip forChart={1} onClick={(e) => console.log(e)} origin={[-38, 15]} yPrecision={pricePrecision}/>
                    <MACDTooltip forChart={3} origin={[-38, 15]} yPrecision={pricePrecision}/>
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
