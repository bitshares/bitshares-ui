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

export default class ExchangeHeader extends React.Component {
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

	render() {
		const {quoteAsset, baseAsset, starredMarkets, hasPrediction, feedPrice,
			showCallLimit, lowestCallPrice, marketReady, latestPrice, currentPeriod,
			marketStats, showDepthChart, buckets, bucketSize, showIndicators,
			onBorrowBase, onBorrowQuote, indicators, indicatorSettings} = this.props;

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

		return (
			<div className="grid-block shrink no-padding overflow-visible top-bar">
				<div className="grid-block overflow-visible">
					<div className="grid-block shrink show-for-large" style={{borderRight: "1px solid grey"}}>
						<div className="v-align">
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
					</div>

					<div className="grid-block vertical" style={{overflow: "visible"}}>
						<div className="grid-block wrap market-stats-container">
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
                            <ul className="market-stats stats top-stats">
                                <li className="stat input clickable v-align" style={{borderLeft: "1px solid grey", borderRight: "none", padding: "3px 15px 0 15px"}} onClick={this.props.onToggleCharts}>
                                    <div className="v-align indicators">
                                       {!showDepthChart ? <Translate content="exchange.order_depth" /> : <Translate content="exchange.price_history" />}
                                    </div>
                                </li>
                            </ul>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
