
import React from "react";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import { ChartCanvas, Chart, series, scale, coordinates, tooltip, axes,
	indicator, helper, interactive } from "react-stockcharts";

const { CandlestickSeries, BarSeries, LineSeries, AreaSeries, BollingerSeries } = series;
const { XAxis, YAxis } = axes;
const { fitWidth } = helper;
const { discontinuousTimeScaleProvider } = scale;
const { EdgeIndicator } = coordinates;
const { ema, sma, bollingerBand } = indicator;
const { CrossHairCursor, MouseCoordinateX, MouseCoordinateY, CurrentCoordinate } = coordinates;
const { FibonacciRetracement, TrendLine } = interactive;
const { OHLCTooltip, MovingAverageTooltip, BollingerBandTooltip } = tooltip;
import colors from "assets/colors";

import utils from "common/utils";

const ema20 = ema()
	.id(2)
	.windowSize(20)
	.merge((d, c) => {d.ema20 = c;})
	.accessor(d => d.ema20);

const ema50 = ema()
	.id(1)
	.windowSize(50)
	.merge((d, c) => {d.ema50 = c;})
	.accessor(d => d.ema50);

const smaVolume70 = sma()
	.id(0)
	.windowSize(50)
	.sourcePath("volume")
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
		const { width, priceData, quote, base, height, ratio, theme } = this.props;
		const pricePrecision = base.get("precision");
		const volumePrecision = quote.get("precision");
		const priceFormat = format(`.${pricePrecision}f`);
		const timeFormatter = timeFormat("%Y-%m-%d %H:%M");
		const volumeFormat = format(`.${volumePrecision}r`);

		const themeColors = colors[theme];
		const { positiveColor, negativeColor, axisLineColor, indicatorLineColor} = themeColors;

        var margin = {left: 75, right: 75, top:20, bottom: 30};

        let gridHeight = height - margin.top - margin.bottom;
        let gridWidth = width - margin.left - margin.right;

        let showGrid = false;
        let yGrid = showGrid ? { innerTickSize: -1 * gridWidth, tickStrokeOpacity: 0.1 } : {};
        let xGrid = showGrid ? { innerTickSize: -1 * gridHeight, tickStrokeOpacity: 0.1 } : {};

        return (
            <ChartCanvas
				ratio={ratio} width={width - 20} height={height}
				seriesName="PriceChart"
                margin={margin}
                data={priceData} calculator={[ema20, ema50, smaVolume70]}
                xAccessor={d => d.date} xScaleProvider={discontinuousTimeScaleProvider}
                xExtents={[priceData[0].date, priceData[priceData.length - 1].date]}
                type="hybrid"
				className="ps-child no-overflow Stockcharts__wrapper ps-must-propagate"
            >
                <Chart id={2}
                    yExtents={[d => d.volume, smaVolume70.accessor()]}
                    height={height * 0.2}
					origin={(w, h) => [0, h - height * 0.2]}
				>
	                <YAxis tickStroke={axisLineColor} stroke={axisLineColor} axisAt="left" orient="left" ticks={4} tickFormat={volumeFormat}/>
					<XAxis tickStroke={axisLineColor} stroke={axisLineColor} axisAt="bottom" orient="bottom" opacity={0.5}/>

					<MouseCoordinateX id={1}
						rectWidth={125}
                        at="bottom"
                        orient="bottom"
                        displayFormat={timeFormatter} />

					<MouseCoordinateY id={1}
						at="left"
						orient="left"
						displayFormat={volumeFormat} />
					<MouseCoordinateY id={0}
						at="right"
						orient="right"
						displayFormat={volumeFormat} />

	                <BarSeries yAccessor={d => d.volume} fill={d => d.close > d.open ? positiveColor : negativeColor} />
	                <AreaSeries yAccessor={smaVolume70.accessor()} stroke={smaVolume70.stroke()} fill={smaVolume70.fill()}/>

	                <EdgeIndicator lineStroke={indicatorLineColor} rectWidth={65} itemType="first" orient="left" edgeAt="left"
	                    yAccessor={d => d.volume} displayFormat={volumeFormat} fill="#0F0F0F"/>
	                <EdgeIndicator lineStroke={indicatorLineColor} rectWidth={65} itemType="last" orient="right" edgeAt="right"
	                    yAccessor={d => d.volume} displayFormat={volumeFormat} fill="#0F0F0F"/>
	                <EdgeIndicator lineStroke={indicatorLineColor} rectWidth={65} itemType="first" orient="left" edgeAt="left"
	                    yAccessor={smaVolume70.accessor()} displayFormat={volumeFormat} fill={smaVolume70.fill()}/>
	                <EdgeIndicator lineStroke={indicatorLineColor} rectWidth={65} itemType="last" orient="right" edgeAt="right"
	                    yAccessor={smaVolume70.accessor()} displayFormat={volumeFormat} fill={smaVolume70.fill()}/>
	            </Chart>

                <Chart
					id={1}
					height={height * 0.78}
                    yExtents={[d => [d.high, d.low], ema20.accessor(), ema50.accessor()]}
                    padding={{ top: 10, bottom: 20 }}
                >
                    <YAxis axisAt="right" orient="right" {...yGrid} ticks={5} tickStroke={axisLineColor} stroke={axisLineColor}/>

					<MouseCoordinateY id={1}
						rectWidth={65}
						at="left"
						orient="left"
						displayFormat={priceFormat} />

                    <MouseCoordinateY id={0}
						rectWidth={65}
                        at="right"
                        orient="right"
                        displayFormat={priceFormat} />

                    <CandlestickSeries
                        wickStroke={d => d.close > d.open ? positiveColor : negativeColor}
                        fill={d => d.close > d.open ? positiveColor : negativeColor}
                    />

                    <LineSeries yAccessor={ema20.accessor()} stroke={ema20.stroke()}/>
					<LineSeries yAccessor={ema50.accessor()} stroke={ema50.stroke()}/>

					<CurrentCoordinate yAccessor={ema20.accessor()} fill={ema20.stroke()} />
					<CurrentCoordinate yAccessor={ema50.accessor()} fill={ema50.stroke()} />

                    <EdgeIndicator lineStroke={indicatorLineColor} rectWidth={65} itemType="last" orient="right" edgeAt="right"
                        yAccessor={d => d.close} displayFormat={priceFormat} fill={d => d.close > d.open ? positiveColor : negativeColor}
					/>
                    <EdgeIndicator lineStroke={indicatorLineColor} rectWidth={65} itemType="first" orient="left" edgeAt="left"
                        yAccessor={d => d.close} displayFormat={priceFormat} fill={d => d.close > d.open ? positiveColor : negativeColor}
					/>

					<OHLCTooltip
						xDisplayFormat={timeFormatter}
						volumeFormat={volumeFormat}
						ohlcFormat={priceFormat}
						origin={[-40, -10]}
					/>
					<MovingAverageTooltip
						origin={[-40, 0]}
						calculators={[ema20, ema50]}
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

                <CrossHairCursor stroke={indicatorLineColor}/>
                {/* <EventCapture mouseMove zoom pan> */}
					{/*<TrendLine
						forChart={1} id={1} ref="trend"
						enabled={this.state.enableTrendLine}
						type="LINE"
						snap={true} snapTo={d => [d.high, d.low]}
						onStart={() => console.log("START")}
						onComplete={this.onTrendLineComplete}
					/>*/}
					{/* <FibonacciRetracement forChart={1} id={1} ref="fib"
						enabled={this.state.enableFib}
						type="BOUND"
						onComplete={this.onFibComplete}
						stroke="white"
						fontStroke="white"
					/> */}
				{/* </EventCapture> */}
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
