import React from "react";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import Translate from "react-translate-component";
import { ChartCanvas, Chart, series, scale, coordinates, tooltip, axes,
    indicator, helper, interactive } from "react-stockcharts/es";

const { CandlestickSeries, BarSeries, LineSeries, AreaSeries, BollingerSeries,
     MACDSeries } = series;
const { XAxis, YAxis } = axes;
const { fitWidth } = helper;
const { discontinuousTimeScaleProvider } = scale;
const { EdgeIndicator } = coordinates;
const { ema, sma, macd, bollingerBand } = indicator;
const { CrossHairCursor, MouseCoordinateX, MouseCoordinateY, CurrentCoordinate } = coordinates;
const { FibonacciRetracement, TrendLine } = interactive;
const { OHLCTooltip, MovingAverageTooltip, BollingerBandTooltip, MACDTooltip } = tooltip;
import colors from "assets/colors";
import { cloneDeep } from "lodash";
import utils from "common/utils";
import cnames from "classnames";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";

class CandleStickChartWithZoomPan extends React.Component {
    constructor(props) {
        super();

        const pricePrecision = props.base.get("precision");
        const volumePrecision = props.quote.get("precision");

        const priceFormat = format(`.${pricePrecision}f`);
        const timeFormatter = timeFormat("%Y-%m-%d %H:%M");
        const volumeFormat = format(`.${volumePrecision}r`);

        this.state = {
            enableTrendLine: false,
            enableFib: false,
            tools: [],
            priceFormat,
            timeFormatter,
            volumeFormat,
            margin: {left: 75, right: 75, top:20, bottom: 30},
            calculators: this._getCalculators(props)
        };

        this.onTrendLineComplete = this.onTrendLineComplete.bind(this);
        this.onFibComplete = this.onFibComplete.bind(this);
        this.onKeyPress = this.onKeyPress.bind(this);
    }

    componentDidMount() {
        document.addEventListener("keyup", this.onKeyPress, {capture: false, passive: true});
    }
    componentWillUnmount() {
        document.removeEventListener("keyup", this.onKeyPress);
    }

    onTrendLineComplete() {
        this.setState({
            enableTrendLine: false
        });
    }

    onFibComplete() {
        this.setState({
            enableFib: false
        });
    }

    onKeyPress(e) {
        const tools = cloneDeep(this.state.tools);
        const ref = this.refs[tools[tools.length - 1]];
        var keyCode = e.which;
        switch (keyCode) {
            case 46: { // DEL
                if (ref) ref.removeLast();
                tools.pop();
                this.setState({tools});
                break;
            }
            case 27: { // ESC
                if (ref) ref.terminate();
                this.setState({
                    [enableFib]: false
                });
                break;
            }
        }
    }

    componentWillReceiveProps(np) {
        let tools = cloneDeep(this.state.tools);
        if (np.tools && np.tools.trendline) {
            this.setState({enableTrendLine: true});
            tools.push("enableTrendLine");
        };
        if (np.tools && np.tools.fib) {
            this.setState({enableFib: true});
            tools.push("enableFib");
        };
        this.setState({tools});

        if (!utils.are_equal_shallow(np.indicators, this.props.indicators) ||
            !utils.are_equal_shallow(np.indicatorSettings, this.props.indicatorSettings)) {
            this.setState({calculators: this._getCalculators(np)});
        }
    }

    _getThemeColors(props = this.props) {
        return colors[props.theme];
    }

    _getCalculators(props = this.props) {
        const { positiveColor, negativeColor } = this._getThemeColors(props);
        const { indicatorSettings } = props;
        const calculators = {};

        calculators.sma = sma()
            .windowSize(parseInt(indicatorSettings["sma"], 10))
            .sourcePath("close")
            .stroke("#1f77b4")
            .fill("#1f77b4")
            .merge((d, c) => {d.sma = c;})
            .accessor(d => d.sma);

        calculators.ema1 = ema()
            .windowSize(parseInt(indicatorSettings["ema1"], 10))
            .merge((d, c) => {d.ema1 = c;})
            .accessor(d => d.ema1);

        calculators.ema2 = ema()
            .windowSize(parseInt(indicatorSettings["ema2"], 10))
            .merge((d, c) => {d.ema2 = c;})
            .accessor(d => d.ema2);

        calculators.smaVolume = sma()
            .windowSize(parseInt(indicatorSettings["smaVolume"], 10))
            .sourcePath("volume")
            .merge((d, c) => {d.smaVolume = c;})
            .stroke("#1f77b4")
            .fill("#1f77b4")
            .accessor(d => d.smaVolume);

        calculators.bb = bollingerBand()
            .merge((d, c) => {d.bb = c;})
            .accessor(d => d.bb);

        calculators.macd = macd()
            .fast(12)
            .slow(26)
            .signal(9)
            .stroke({macd: negativeColor, signal: positiveColor})
            .merge((d, c) => {d.macd = c;})
            .accessor(d => d.macd);

        return calculators;
    }

    _renderVolumeChart(chartMultiplier) {
        const { height, indicators } = this.props;
        const { timeFormatter, volumeFormat, calculators } = this.state;
        const { axisLineColor, volumeColor, indicatorLineColor } = this._getThemeColors();

        return <Chart id={2}
            yExtents={[d => d.volume, calculators.smaVolume.accessor()]}
            height={height * 0.2}
            origin={(w, h) => [0, h - (chartMultiplier * height * 0.2)]}
        >

            {indicators.macd ? null : <XAxis tickStroke={axisLineColor} stroke={axisLineColor} axisAt="bottom" orient="bottom" opacity={0.5}/>}
            <YAxis tickStroke={axisLineColor} stroke={axisLineColor} axisAt="left" orient="left" ticks={4} tickFormat={volumeFormat}/>

            {indicators.macd ? null : <MouseCoordinateX id={1}
                rectWidth={125}
                at="bottom"
                orient="bottom"
                displayFormat={timeFormatter}
            />}

            <MouseCoordinateY id={1}
                rectWidth={65}
                at="left"
                orient="left"
                displayFormat={volumeFormat} />
            <MouseCoordinateY id={0}
                rectWidth={65}
                at="right"
                orient="right"
                displayFormat={volumeFormat} />

            <BarSeries yAccessor={d => d.volume} fill={volumeColor} />
            {indicators.smaVolume ? <AreaSeries yAccessor={calculators.smaVolume.accessor()} stroke={calculators.smaVolume.stroke()} fill={calculators.smaVolume.fill()} /> : null}

            {indicators.smaVolume ? <CurrentCoordinate yAccessor={calculators.smaVolume.accessor()} fill={calculators.smaVolume.stroke()} /> : null}
            <CurrentCoordinate yAccessor={d => d.volume} fill={volumeColor} />

            <EdgeIndicator lineStroke={indicatorLineColor} rectWidth={65} itemType="first" orient="left" edgeAt="left"
                yAccessor={d => d.volume} displayFormat={volumeFormat} fill="#0F0F0F"/>
            <EdgeIndicator lineStroke={indicatorLineColor} rectWidth={65} itemType="last" orient="right" edgeAt="right"
                yAccessor={d => d.volume} displayFormat={volumeFormat} fill="#0F0F0F"/>
            {indicators.smaVolume ? <EdgeIndicator lineStroke={indicatorLineColor} rectWidth={65} itemType="first" orient="left" edgeAt="left"
                yAccessor={calculators.smaVolume.accessor()} displayFormat={volumeFormat} fill={calculators.smaVolume.fill()}/> : null}
            {indicators.smaVolume ? <EdgeIndicator lineStroke={indicatorLineColor} rectWidth={65} itemType="last" orient="right" edgeAt="right"
                yAccessor={calculators.smaVolume.accessor()} displayFormat={volumeFormat} fill={calculators.smaVolume.fill()}/> : null}
        </Chart>;
    }

    _renderCandleStickChart(chartMultiplier, maCalcs) {
        const { height, width, showVolumeChart, indicators } = this.props;
        const { timeFormatter, volumeFormat, priceFormat, margin, enableTrendLine,
            enableFib, calculators } = this.state;
        const { positiveColor, negativeColor, axisLineColor, indicatorLineColor } = this._getThemeColors();

        let gridHeight = height - margin.top - margin.bottom;
        let gridWidth = width - margin.left - margin.right;

        let showGrid = false;
        let yGrid = showGrid ? { innerTickSize: -1 * gridWidth, tickStrokeOpacity: 0.1 } : {};
        let xGrid = showGrid ? { innerTickSize: -1 * gridHeight, tickStrokeOpacity: 0.1 } : {};

        return <Chart
            id={1}
            height={height * ((chartMultiplier ? 1 : 0.9) - (0.20 * chartMultiplier))}
            yExtents={[d => [d.high, d.low], calculators.ema1.accessor(), calculators.ema2.accessor(), calculators.sma.accessor()]}
            padding={{ top: 10, bottom: 20 }}
        >
            {indicators.macd || showVolumeChart ? null :
                <XAxis tickStroke={axisLineColor} stroke={axisLineColor} axisAt="bottom" orient="bottom" opacity={0.5}/>}
            <YAxis axisAt="right" orient="right" {...yGrid} ticks={5} tickStroke={axisLineColor} stroke={axisLineColor} />

            {indicators.macd || showVolumeChart ? null :
            <MouseCoordinateX id={1}
                rectWidth={125}
                at="bottom"
                orient="bottom"
                displayFormat={timeFormatter}
            />}

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
                opacity={0.8}
            />
            {indicators.bb ? <BollingerSeries calculator={calculators.bb} /> : null}

            {indicators.sma ? <LineSeries yAccessor={calculators.sma.accessor()} stroke={calculators.sma.stroke()}/> : null}
            {indicators.ema1 ? <LineSeries yAccessor={calculators.ema1.accessor()} stroke={calculators.ema1.stroke()}/> : null}
            {indicators.ema2 ? <LineSeries yAccessor={calculators.ema2.accessor()} stroke={calculators.ema2.stroke()}/> : null}

            {indicators.sma ? <CurrentCoordinate yAccessor={calculators.sma.accessor()} fill={calculators.sma.stroke()} /> : null}
            {indicators.ema1 ? <CurrentCoordinate yAccessor={calculators.ema1.accessor()} fill={calculators.ema1.stroke()} /> : null}
            {indicators.ema2 ? <CurrentCoordinate yAccessor={calculators.ema2.accessor()} fill={calculators.ema2.stroke()} /> : null}

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

            {maCalcs.length ?
            <MovingAverageTooltip
                origin={[-40, 0]}
                calculators={maCalcs}
            /> : null}

            {indicators.bb ? <BollingerBandTooltip origin={[-40, 40]} calculator={calculators.bb} /> : null}

            <TrendLine ref="enableTrendLine"
                enabled={enableTrendLine}
                type="LINE"
                snap={true} snapTo={d => [d.high, d.low]}
                onComplete={this.onTrendLineComplete}
                stroke={axisLineColor}
                fontStroke={axisLineColor}
            />

            <FibonacciRetracement ref="enableFib"
                enabled={enableFib}
                type="BOUND"
                onComplete={this.onFibComplete}
                stroke={axisLineColor}
                fontStroke={axisLineColor}
            />
        </Chart>;
    }

    render() {
        const { width, priceData, height, ratio, theme, zoom,
            indicators, showVolumeChart } = this.props;
        const { timeFormatter, enableFib, enableTrendLine, margin, calculators } = this.state;
        const themeColors = colors[theme];
        const { axisLineColor, indicatorLineColor} = themeColors;
        let chartMultiplier = showVolumeChart ? 1 : 0; // Used to adjust the height of the charts and their positioning
        // if (indicators.bb) calc.push(bb);

        // Indicator calculators
        let calc = [], maCalcs = [], tooltipIncludes = ["sma", "ema1", "ema2", "smaVolume"];

        // if (showVolumeChart) maCalcs.push(calculators["smaVolume"]);

        for (let i in indicators) {
            if (indicators[i]) {
                // Don't add volume indicators if the volume chart is off
                if (i.toLowerCase().indexOf("volume") !== -1 && !showVolumeChart) continue;
                // Add active calculators
                calc.push(calculators[i]);
                // Add calculators needing tooltips
                if (tooltipIncludes.indexOf(i) !== -1) maCalcs.push(calculators[i]);
            }
        };
        if (indicators["macd"]) chartMultiplier++;

        const filterDate = new Date((new Date).getTime() - zoom * 1000);
        const filteredData = zoom === "all" ? priceData : priceData.filter(a => {
            return a.date > filterDate;
        });

        return (
            <ChartCanvas
                ratio={ratio} width={width - 20} height={height}
                seriesName="PriceChart"
                margin={margin}
                data={filteredData} calculator={calc}
                xAccessor={d => d.date} xScaleProvider={discontinuousTimeScaleProvider}
                xExtents={[filteredData[0].date, filteredData[filteredData.length - 1].date]}
                type="hybrid"
                className="ps-child no-overflow Stockcharts__wrapper ps-must-propagate"
                drawMode={enableTrendLine || enableFib}>
            >
                {showVolumeChart ? this._renderVolumeChart(chartMultiplier)
                 : <span></span>}

                {this._renderCandleStickChart(chartMultiplier, maCalcs)}

                {indicators.macd ?
                    <Chart
                        id={3} height={height * 0.2}
                        yExtents={calculators.macd.accessor()}
                        origin={(w, h) => [0, h - ((chartMultiplier - (showVolumeChart ? 1 : 0) ) * height * 0.2)]}
                        padding={{ top: 40, bottom: 10 }} >
                    <XAxis tickStroke={axisLineColor} stroke={axisLineColor} axisAt="bottom" orient="bottom"/>
                    <YAxis tickStroke={axisLineColor} stroke={axisLineColor} axisAt="right" orient="right" ticks={2} />

                    <MouseCoordinateX
                        rectWidth={125}
                        at="bottom"
                        orient="bottom"
                        displayFormat={timeFormatter}
                    />
                    <MouseCoordinateY
                        at="right"
                        orient="right"
                        displayFormat={format(".2f")}
                    />

                    <MACDSeries calculator={calculators.macd} />
                    <MACDTooltip origin={[-40, 35]} calculator={calculators.macd}/>
                </Chart> : <span></span> /* Need to return an empty element here, null triggers an error */}

                <CrossHairCursor stroke={indicatorLineColor}/>
            </ChartCanvas>
        );
    }
}

CandleStickChartWithZoomPan = fitWidth(CandleStickChartWithZoomPan);

export default class Wrapper extends React.Component {
    constructor() {
        super();

        this.state = {
            dropdowns: {
                indicators: false,
                tools: false,
                settings: false
            }
        };

        this._onInputHeight = this._onInputHeight.bind(this);
        this._listener = this._listener.bind(this);
    }

    shouldComponentUpdate(np, ns) {
        if (!np.marketReady && !this.props.marketReady) return false;
        if (!np.priceData.length && !this.props.priceData.length) return false;
        return (
            !utils.are_equal_shallow(np.priceData, this.props.priceData) ||
            !utils.are_equal_shallow(np.indicators, this.props.indicators) ||
            !utils.are_equal_shallow(np.indicatorSettings, this.props.indicatorSettings) ||
            !utils.are_equal_shallow(np.tools, this.props.tools) ||
            !utils.are_equal_shallow(ns, this.state) ||
            np.height !== this.props.height ||
            np.width !== this.props.width ||
            np.leftOrderBook !== this.props.leftOrderBook ||
            np.zoom !== this.props.zoom ||
            np.showVolumeChart !== this.props.showVolumeChart
        );
    }

    componentDidUpdate(prevProps) {
        if (prevProps.leftOrderBook !== this.props.leftOrderBook) {
            if (this.refs.FitWidth) this.refs.FitWidth.handleWindowResize();
        }
    }

    componentWillUnmount() {
        document.removeEventListener("click", this._listener);
    }

    _toggleTools(key) {
        this._resetDropdowns();
        this.props.onChangeTool(key);
        this.forceUpdate();
    }

    _changeSettings(payload, e) {
        e.persist();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
    }

    _onInputHeight(e) {
        const val = e.target.value;
        this.props.onChangeChartHeight({value: parseInt(val, 10)});
    }

    _toggleDropdown(key, e) {
        e.stopPropagation();
        const {dropdowns} = this.state;
        let newState = {};
        for (let k in this.state.dropdowns) {
            if (k === key) newState[k] = !dropdowns[k];
            else newState[k] = false;
        }
        if (newState[key]) {
            document.addEventListener("click", this._listener, {capture: false, passive: true});
        }
        this.setState({dropdowns: newState});
    }

    _listener() {
        this._resetDropdowns();
        document.removeEventListener("click", this._listener);
    }

    _stopPropagation(e) {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
    }

    _resetDropdowns() {
        let dropdowns = {};
        for (let key in this.state.dropdowns) {
            dropdowns[key] = false;
        }
        this.setState({dropdowns});
    }

    render() {
        const {currentPeriod, buckets, bucketSize, indicators,
            indicatorSettings} = this.props;
        const {dropdowns} = this.state;

        // Lower bar
		let bucketText = function(size) {
			if (size === "all") {
				return counterpart.translate("exchange.zoom_all");
			} else if (size < 60) {
				return size + "s";
			} else if (size < 3600) {
				return (size / 60) + "m";
			} else if (size < 86400) {
				return (size / 3600) + "h";
			} else if (size < 604800) {
				return (size / 86400) + "d";
			} else if (size < 2592000) {
				return (size / 604800) + "w";
			} else {
				return (size / 2592000) + "m";
			}
		};

		let bucketOptions = buckets.filter(bucket => {
			return bucket > 60 * 4;
		}).map(bucket => {
			return <div key={bucket} className={cnames("label bucket-option", {"active-bucket": bucketSize === bucket})} onClick={this.props.changeBucketSize.bind(this, bucket)}>{bucketText(bucket)}</div>;
		});

		let oneHour = 3600, oneDay = oneHour * 24;
		let zoomPeriods = [oneHour * 6, oneHour * 48, oneHour * 48 * 2, oneHour * 24 * 7, oneDay * 14, oneDay * 30, oneDay * 30 * 3, "all"];

		let zoomOptions = zoomPeriods.map(period => {
			return <div key={period} className={cnames("label bucket-option", {"active-bucket": currentPeriod === period})} onClick={this.props.changeZoomPeriod.bind(this, period)}>{bucketText(period)}</div>;
		});

		/* Indicators dropdown */
		const indicatorOptionsVolume = [];
		const indicatorOptionsPrice = Object.keys(indicators).map(i => {
			let hasSetting = i in indicatorSettings;
			let settingInput = hasSetting ?
				<div style={{float: "right", clear: "both"}}>
					<div className="inline-block" style={{paddingRight: 5}}><Translate content="exchange.chart_options.period" />:</div>
					<input style={{margin: 0}} type="number" value={indicatorSettings[i]} onChange={this.props.onChangeIndicatorSetting.bind(null, i)} />
				</div> : null;

			if (i.toLowerCase().indexOf("volume") !== -1) {
				if (!this.props.showVolumeChart) return null;
				indicatorOptionsVolume.push(
					<li className="indicator" key={i}>
						<input className="clickable" type="checkbox" checked={indicators[i]} onClick={this.props.onChangeIndicators.bind(null, i)}/>
						<div onClick={this.props.onChangeIndicators.bind(null, i)} className="clickable"><Translate content={`exchange.chart_options.${i}`} /></div>
						{ settingInput }
					</li>
				);
			} else {
				return (
					<li className="indicator" key={i} >
						<input className="clickable" type="checkbox" checked={indicators[i]} onClick={this.props.onChangeIndicators.bind(null, i)}/>
						<div className="clickable"><Translate content={`exchange.chart_options.${i}`} onClick={this.props.onChangeIndicators.bind(null, i)}/></div>
						{ settingInput }
					</li>
				);
			}
		}).filter(a => !!a);

		/* Tools dropdown */
		const toolsOptions = Object.keys(this.props.tools).map(i => {
			return (
				<li className="clickable" key={i} onClick={this._toggleTools.bind(this, i)}>
					<div style={{marginLeft: 5}} className="inline-block">
						<Translate content={`exchange.chart_options.${i}`} />
					</div>
				</li>
			);
		});

		/* Tools dropdown */
		const settingsOptions = ["volume", "height"].map(i => {
			let content;
			switch (i) {
				case "height": {
					content = (
						<li className="indicator" key={i}>
							<div style={{marginLeft: 0, paddingRight: 10}}>
								<div><Translate content="exchange.chart_options.height" />:</div>
							</div>
							<div>
								<input style={{margin: 0, textAlign: "right", maxWidth: 75}} value={this.props.chartHeight} type="number" onChange={this._onInputHeight} />
							</div>
						</li>
					);
					break;
				}

				case "volume": {
					content = (
						<li className="clickable indicator" key={i} onClick={this.props.onToggleVolume}>
							<input type="checkbox" checked={this.props.showVolumeChart} />
							<div><Translate content={`exchange.chart_options.${i}`} /></div>
						</li>
					);
					break;
				}

				default:{
					content = (
						<li key={i}>
							TBD
						</li>
					);
				}
			}
			return content;
		});

        if (!this.props.priceData.length) {
            return (
                <div className="grid-content text-center">
                    <div style={{paddingTop: this.props.height / 2, height: this.props.height}}>
                        <Translate content="exchange.no_data" component="h2" />
                    </div>
                </div>
            );
        }

        return (
            <div className="grid-block no-margin no-padding vertical" style={{overflow: "visible"}}>
                <CandleStickChartWithZoomPan ref="FitWidth" {...this.props} />
                <div style={{paddingTop: 5}}>
                    <ul style={{justifyContent: "center"}} className="market-stats stats bottom-stats">
                        {/* Chart controls */}
                            <li className="stat">
                                <span>
                                    <span><Translate content="exchange.zoom" />:</span>
                                    <span>{zoomOptions}</span>
                                </span>
                            </li>
                            <li className="stat">
                                <span>
                                    <span><Translate content="exchange.time" />:</span>
                                    <span>{bucketOptions}</span>
                                </span>
                            </li>
                    </ul>

                    <ul style={{justifyContent: "center", paddingTop: 5, paddingBottom: 15}} className="market-stats stats bottom-stats">
                        <li className="stat input custom-dropdown">
                            <div className="v-align indicators clickable" onClick={this._toggleDropdown.bind(this, "indicators")}>
                                <Translate content="exchange.chart_options.title" />
                            </div>
                            {dropdowns.indicators ?
                            <div className="custom-dropdown-content" onClick={this._stopPropagation}>
                                <ul>
                                    <li className="indicator-title"><Translate content="exchange.chart_options.price_title" /></li>
                                    {indicatorOptionsPrice}

                                    {indicatorOptionsVolume.length ? <li className="indicator-title"><Translate content="exchange.chart_options.volume_title" /></li> : null}
                                    {indicatorOptionsVolume}
                                </ul>
                            </div> : null}
                        </li>

                        <li className="stat input custom-dropdown">
                            <div className="v-align indicators clickable" onClick={this._toggleDropdown.bind(this, "tools")}>
                                <Translate content="exchange.chart_options.tools" />
                            </div>
                            {dropdowns.tools ?
                            <div className="custom-dropdown-content"  onClick={this._stopPropagation}>
                                <ul>
                                    {toolsOptions}
                                </ul>
                            </div> : null}
                        </li>

                       <li className="stat input custom-dropdown">
                            <div className="indicators clickable" onClick={this._toggleDropdown.bind(this, "settings")}>
                                <Icon className="icon-14px settings-cog" name="cog"/>
                            </div>
                            {dropdowns.settings ?
                            <div className="custom-dropdown-content" onClick={this._stopPropagation}>
                                <ul>
                                    {settingsOptions}
                                </ul>
                            </div> : null}
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
}
