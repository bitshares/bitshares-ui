
import React from "react";
import d3 from "d3";

import ReStock from "react-stockcharts";

const { ChartCanvas, Chart, EventCapture, interactive } = ReStock;

const { CandlestickSeries, BarSeries, LineSeries, AreaSeries, BollingerSeries } = ReStock.series;
const { XAxis, YAxis } = ReStock.axes;
const { fitWidth } = ReStock.helper;
const { discontinuousTimeScaleProvider } = ReStock.scale;
const { EdgeIndicator } = ReStock.coordinates;
const { ema, sma, bollingerBand } = ReStock.indicator;
const { CrossHairCursor, MouseCoordinateX, MouseCoordinateY, CurrentCoordinate } = ReStock.coordinates;
const { TooltipContainer, OHLCTooltip, MovingAverageTooltip, BollingerBandTooltip } = ReStock.tooltip;
const { FibonacciRetracement, TrendLine } = interactive;

import utils from "common/utils";

const ema20 = ema()
			.id(0)
			.windowSize(20)
			.merge((d, c) => {d.ema20 = c;})
			.accessor(d => d.ema20);

const ema50 = ema()
	.id(2)
	.windowSize(50)
	.merge((d, c) => {d.ema50 = c;})
	.accessor(d => d.ema50);

const smaVolume70 = sma()
	.id(3)
	.windowSize(70)
	.source(d => d.volume)
	.merge((d, c) => {d.smaVolume70 = c;})
	.accessor(d => d.smaVolume70);

class CandleStickChartWithZoomPan extends React.Component {

	constructor() {
		super();

		this.state = {
			enableTrendLine: false,
			enableFib: true
		};

		this.onTrendLineComplete = this.onTrendLineComplete.bind(this);
		this.onFibComplete = this.onFibComplete.bind(this);
	}

	onTrendLineComplete() {
		this.setState({
			enableTrendLine: false
		})
	}

	onFibComplete() {
		this.setState({
			enableFib: false
		})
	}

    render() {
        var { type, width, priceData, quote, base, height } = this.props;
    	let pricePrecision = base.get("precision");
		let volumePrecision = quote.get("precision");
		let priceFormat = d3.format(`.${pricePrecision}f`);
		let timeFormat = d3.time.format("%Y-%m-%d %H:%M");
		let volumeFormat = d3.format(`.${volumePrecision}r`);

        var margin = {left: 70, right: 70, top:20, bottom: 30};

        let gridHeight = height - margin.top - margin.bottom;
        let gridWidth = width - margin.left - margin.right;

        let showGrid = true;
        let yGrid = showGrid ? { innerTickSize: -1 * gridWidth, tickStrokeOpacity: 0.1 } : {};
        let xGrid = showGrid ? { innerTickSize: -1 * gridHeight, tickStrokeOpacity: 0.1 } : {};
		console.log("height:", height);
        return (
            <ChartCanvas
				className="ps-child no-overflow Stockcharts__wrapper ps-must-propagate"
                width={width - 20}
                height={height}
                margin={margin}
                data={priceData}
                type="hybrid"
                xScale={d3.time.scale()}
                seriesName="PriceChart"
                xExtents={[priceData[0].date, priceData[priceData.length - 1].date]}
                xAccessor={d => d.date}
                calculator={[ema20, ema50, smaVolume70]}
				style={{overflow: "auto"}}
            >
                <Chart id={2}
                    yExtents={[d => d.volume, smaVolume70.accessor()]}
                    height={height * 0.2}
					origin={(w, h) => [0, h - height * 0.2]}
				>
	                <YAxis tickStroke="#FFFFFF" stroke="#FFFFFF" axisAt="left" orient="left" ticks={5} tickFormat={volumeFormat}/>
					<XAxis axisAt="bottom" orient="bottom" ticks={2} tickStroke="#FFFFFF" stroke="#FFFFFF" opacity={0.5}/>

					<MouseCoordinateX id={1}
						rectWidth={125}
                        at="bottom"
                        orient="bottom"
                        displayFormat={timeFormat} />
					<MouseCoordinateY id={1}
						at="left"
						orient="left"
						displayFormat={priceFormat} />
					<MouseCoordinateY id={0}
						at="right"
						orient="right"
						displayFormat={priceFormat} />

	                <BarSeries yAccessor={d => d.volume} fill={d => d.close > d.open ? "#6BA583" : "#FF0000"} />
	                <AreaSeries yAccessor={smaVolume70.accessor()} stroke={smaVolume70.stroke()} fill={smaVolume70.fill()}/>

	                <CurrentCoordinate id={0} yAccessor={smaVolume70.accessor()} fill={smaVolume70.stroke()} />
	                <CurrentCoordinate id={1} yAccessor={d => d.volume} fill="#9B0A47" />

	                <EdgeIndicator itemType="first" orient="left" edgeAt="left"
	                    yAccessor={d => d.volume} displayFormat={volumeFormat} fill="#0F0F0F"/>
	                <EdgeIndicator itemType="last" orient="right" edgeAt="right"
	                    yAccessor={d => d.volume} displayFormat={volumeFormat} fill="#0F0F0F"/>
	                <EdgeIndicator itemType="first" orient="left" edgeAt="left"
	                    yAccessor={smaVolume70.accessor()} displayFormat={volumeFormat} fill={smaVolume70.fill()}/>
	                <EdgeIndicator itemType="last" orient="right" edgeAt="right"
	                    yAccessor={smaVolume70.accessor()} displayFormat={volumeFormat} fill={smaVolume70.fill()}/>
	            </Chart>

                <Chart
					height={height * 0.78}
                    id={1}
                    yExtents={[d => [d.high, d.low], ema20.accessor(), ema50.accessor()]}
                    padding={{ top: 10, bottom: 20 }}
                >
                    <YAxis axisAt="right" orient="right" ticks={5} tickStroke="#FFFFFF" stroke="#FFFFFF"/>

                    <MouseCoordinateX id={0}
						rectWidth={125}
                        at="top"
                        orient="top"
                        displayFormat={timeFormat} />
					<MouseCoordinateY id={1}
						at="left"
						orient="left"
						displayFormat={priceFormat} />
                    <MouseCoordinateY id={0}
                        at="right"
                        orient="right"
                        displayFormat={priceFormat} />


                    <CandlestickSeries
                        wickStroke={d => d.close > d.open ? "#6BA583" : "#DB0000"}
                        fill={d => d.close > d.open ? "#6BA583" : "#DB0000"}
                    />

                    <LineSeries yAccessor={ema20.accessor()} stroke={ema20.stroke()}/>
					<LineSeries yAccessor={ema50.accessor()} stroke={ema50.stroke()}/>

                    <EdgeIndicator itemType="last" orient="right" edgeAt="right"
                        yAccessor={d => d.close} displayFormat={priceFormat} fill={d => d.close > d.open ? "#6BA583" : "#FF0000"}
					/>
                    <EdgeIndicator itemType="first" orient="left" edgeAt="left"
                        yAccessor={d => d.close} displayFormat={priceFormat} fill={d => d.close > d.open ? "#6BA583" : "#FF0000"}
					/>

					{/*<TrendLine
						ref="trend"
						enabled={this.state.enableTrendLine}
						type="LINE"
						snap={true} snapTo={d => [d.high, d.low]}
						onStart={() => console.log("START")}
						onComplete={this.onTrendLineComplete}
					/>*/}
                </Chart>

                <CrossHairCursor />
                <EventCapture mouseMove zoom pan>
					{/*<TrendLine
						forChart={1} id={1} ref="trend"
						enabled={this.state.enableTrendLine}
						type="LINE"
						snap={true} snapTo={d => [d.high, d.low]}
						onStart={() => console.log("START")}
						onComplete={this.onTrendLineComplete}
					/>*/}
					<FibonacciRetracement forChart={1} id={1} ref="fib"
						enabled={this.state.enableFib}
						type="BOUND"
						onComplete={this.onFibComplete}
						stroke="white"
						fontStroke="white"
					/>
				</EventCapture>

                <TooltipContainer>
					<OHLCTooltip xDisplayFormat={timeFormat} volumeFormat={volumeFormat} ohlcFormat={priceFormat} forChart={1} origin={[-40, 10]}/>
                    <MovingAverageTooltip forChart={1} origin={[-40, 20]}
						calculators={[ema20, ema50]}
                    />
				</TooltipContainer>
            </ChartCanvas>
        );
    }
}

CandleStickChartWithZoomPan = fitWidth(CandleStickChartWithZoomPan);

export default class Wrapper extends React.Component {
    shouldComponentUpdate(np, nextState) {
        if (!np.priceData.length) {
            return false;
        }
        return (
			!utils.are_equal_shallow(np.priceData, this.props.priceData) ||
			np.height !== this.props.height
		);
    }

    render() {
        if (!this.props.priceData.length) {
            return null;
        }

        return (
            <CandleStickChartWithZoomPan {...this.props} />
        );
    }
}
