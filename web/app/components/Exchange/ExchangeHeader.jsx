import React from "react";
import {Link} from "react-router/es";
import Icon from "../Icon/Icon";
import AssetName from "../Utility/AssetName";
import MarketsActions from "actions/MarketsActions";
import SettingsActions from "actions/SettingsActions";
import PriceStat from "./PriceStat";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import cnames from "classnames";
import { debounce, compose, property } from "lodash";

export default class ExchangeHeader extends React.Component {
	constructor() {
		super();

		this.state = {
			dropdowns: {
				indicators: false,
				tools: false,
				settings: false
			}
		};

		this._listener = this._listener.bind(this);
		this._onInputHeight = this._onInputHeight.bind(this)
	}

	shouldComponentUpdate(nextProps) {
		if (!nextProps.marketReady) return false;
		return true;
	}

	_addMarket(quote, base) {
		let marketID = `${quote}_${base}`;
		if (!this.props.starredMarkets.has(marketID)) {
			SettingsActions.addStarMarket(quote, base);
		} else {
			SettingsActions.removeStarMarket(quote, base);
		}
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
			document.addEventListener("click", this._listener, false);
		}
		this.setState({dropdowns: newState});
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

	_listener(e) {
		this._resetDropdowns();
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

	render() {
		const {quoteAsset, baseAsset, starredMarkets, hasPrediction, feedPrice,
			showCallLimit, lowestCallPrice, marketReady, latestPrice, currentPeriod,
			marketStats, showDepthChart, buckets, bucketSize, showIndicators,
			onBorrowBase, onBorrowQuote, indicators, indicatorSettings} = this.props;

		const {dropdowns} = this.state;

		const baseSymbol = baseAsset.get("symbol");
		const quoteSymbol = quoteAsset.get("symbol");

		// Favorite star
		const marketID = `${quoteSymbol}_${baseSymbol}`;
		const starClass = starredMarkets.has(marketID) ? "gold-star" : "grey-star";

		// Market stats
		const dayChange = marketStats.get("change");

		const dayChangeClass = parseFloat(dayChange) === 0 ? "" : parseFloat(dayChange) < 0 ? "negative" : "positive";
		const dayChangeArrow = dayChangeClass === "" ? "" : dayChangeClass === "positive" ? "change-up" : "change-down";
		const volumeBase = marketStats.get("volumeBase");
		const volumeQuote = marketStats.get("volumeQuote");

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

		return (
			<div className="grid-block shrink no-padding overflow-visible top-bar">
				<div className="grid-block overflow-visible">
					<div className="grid-block shrink" style={{borderRight: "1px solid grey"}}>
						<span style={{paddingRight: 0}} onClick={this._addMarket.bind(this, quoteSymbol, baseSymbol)} className="market-symbol">
							<Icon className={starClass} name="fi-star"/>
						</span>
						{!hasPrediction ? (
						<Link onClick={() => {MarketsActions.switchMarket();}} className="market-symbol" to={`/market/${baseSymbol}_${quoteSymbol}`}>
							<span><AssetName name={quoteSymbol} replace={true} /> : <AssetName name={baseSymbol} replace={true} /></span>
						</Link>) : (
						<a className="market-symbol">
							<span>{`${quoteSymbol} : ${baseSymbol}`}</span>
						</a>
						)}
					</div>

					<div className="grid-block vertical" style={{overflow: "visible"}}>
						<div className="grid-block show-for-medium wrap" style={{borderBottom: "1px solid grey"}}>
							<ul className="market-stats stats top-stats">
								{latestPrice ?
									<PriceStat ready={marketReady} price={latestPrice.full} quote={quoteAsset} base={baseAsset} content="exchange.latest"/> : null}

								<li className="stat">
									<span>
										<Translate component="span" content="account.hour_24" />
										<br />
										<b className={"value " + dayChangeClass}>{marketReady ? dayChange : 0}<span className={dayChangeArrow}>&nbsp;{dayChangeArrow === "" ? null : dayChangeArrow === "change-up" ? <span>&#8593;</span> : <span>&#8595;</span>}</span></b>
										<span>%</span>
									</span>
								</li>

								{(volumeBase >= 0) ? <PriceStat ready={marketReady} decimals={0} volume={true} price={volumeBase} className="column-hide-small" volume2={volumeQuote} base={baseAsset} quote={quoteAsset} content="exchange.volume_24"/> : null}

								{!hasPrediction && feedPrice ?
									<PriceStat toolTip={counterpart.translate("tooltip.settle_price")} ready={marketReady} className="column-hide-small" price={feedPrice.toReal()} quote={quoteAsset} base={baseAsset} content="exchange.settle"/> : null}

								{lowestCallPrice && showCallLimit ?
									<PriceStat toolTip={counterpart.translate("tooltip.call_limit")} ready={marketReady} className="column-hide-medium is-call" price={lowestCallPrice} quote={quoteAsset} base={baseAsset} content="explorer.block.call_limit"/> : null}

								{feedPrice && showCallLimit ?
									<PriceStat toolTip={counterpart.translate("tooltip.margin_price")} ready={marketReady} className="column-hide-medium is-call" price={feedPrice.getSqueezePrice({real: true})} quote={quoteAsset} base={baseAsset} content="exchange.squeeze"/> : null}
							</ul>
							<div className="grid-block" style={{minHeight: 39, justifyContent: "flex-end"}}>
								<ul className="float-right market-stats stats top-stats">
									<li className="stat float-right clickable" style={{height: "100%", borderLeft: "1px solid grey", borderRight: "none", padding: "3px 15px 0 15px"}} onClick={this.props.onToggleCharts}>
										<div className="indicators">
										   {!showDepthChart ? <Translate content="exchange.order_depth" /> : <Translate content="exchange.price_history" />}
										</div>
									</li>
								</ul>
							</div>

						</div>
						<div className="grid-block wrap overflow-visible" style={{justifyContent: "space-between"}}>
							<ul className="market-stats stats bottom-stats">
								{/* Chart controls */}
								{!showDepthChart ? (
									<li className="stat">
										<span>
											<span><Translate content="exchange.zoom" />:</span>
											<span>{zoomOptions}</span>
										</span>
									</li>) : null}
								{!showDepthChart ? (
									<li className="stat">
										<span>
											<span><Translate content="exchange.time" />:</span>
											<span>{bucketOptions}</span>
										</span>
									</li>) : null}
								{showIndicators ? (
									<li className="stat custom-dropdown">
										<div className="indicators clickable" onClick={this._toggleDropdown.bind(this, "indicators")}>
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
									</li>) : null}
								{showIndicators ? (
									<li className="stat custom-dropdown">
										<div className="indicators clickable" onClick={this._toggleDropdown.bind(this, "tools")}>
											<Translate content="exchange.chart_options.tools" />
										</div>
										{dropdowns.tools ?
										<div className="custom-dropdown-content"  onClick={this._stopPropagation}>
											<ul>
												{toolsOptions}
											</ul>
										</div> : null}
									</li>) : null}

								{showIndicators ?
									<li className="stat custom-dropdown">
										<div className="indicators clickable" onClick={this._toggleDropdown.bind(this, "settings")}>
											<Icon className="icon-14px settings-cog" name="cog"/>
										</div>
										{dropdowns.settings ?
										<div className="custom-dropdown-content" onClick={this._stopPropagation}>
											<ul>
												{settingsOptions}
											</ul>
										</div> : null}
									</li> : null}
							</ul>
							<ul className="market-stats stats bottom-stats">
								{/* Borrow buttons */}
								{onBorrowQuote ? <li className="stat clickable" style={{borderLeft: "1px solid grey", borderRight: "none"}} onClick={onBorrowQuote}>
									<div className="indicators">
									   <Translate content="exchange.borrow" />&nbsp;{quoteAsset.get("symbol")}
									</div>
								</li> : null}

								{onBorrowBase ? <li className="stat clickable" style={{borderLeft: "1px solid grey", borderRight: "none"}} onClick={onBorrowBase}>
									<div className="indicators">
									   <Translate content="exchange.borrow" />&nbsp;{baseAsset.get("symbol")}
									</div>
								</li> : null}
							</ul>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
