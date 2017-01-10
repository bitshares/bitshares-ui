import React from "react";
import {Link} from "react-router/es";
import Icon from "../Icon/Icon";
import AssetName from "../Utility/AssetName";
import MarketsActions from "actions/MarketsActions";
import SettingsActions from "actions/SettingsActions";
import PriceStat from "./PriceStat";
import Translate from "react-translate-component";
import utils from "common/utils";
import counterpart from "counterpart";
import cnames from "classnames";

export default class ExchangeHeader extends React.Component {

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
            onBorrowBase, onBorrowQuote} = this.props;
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

        let oneHour = 3600;
        let zoomPeriods = [oneHour * 6, oneHour * 48, oneHour * 48 * 2, oneHour * 24 * 7, oneHour * 24 * 14, oneHour * 24 * 30, "all"];

        let zoomOptions = zoomPeriods.map(period => {
            return <div key={period} className={cnames("label bucket-option", {"active-bucket": currentPeriod === period})} onClick={this.props.changeZoomPeriod.bind(this, period)}>{bucketText(period)}</div>;
        });

        return (
            <div className="grid-block shrink no-padding overflow-visible top-bar">
                <div className="grid-block no-overflow">
                    <div className="grid-block shrink" style={{borderRight: "1px solid grey"}}>
                        <span style={{paddingRight: 0}} onClick={this._addMarket.bind(this, quoteSymbol, baseSymbol)} className="market-symbol">
                            <Icon className={starClass} name="fi-star"/>
                        </span>
                        {!hasPrediction ? (
                        <Link onClick={() => {MarketsActions.switchMarket();}}className="market-symbol" to={`/market/${baseSymbol}_${quoteSymbol}`}>
                            <span><AssetName name={quoteSymbol} replace={true} /> : <AssetName name={baseSymbol} replace={true} /></span>
                        </Link>) : (
                        <a className="market-symbol">
                            <span>{`${quoteSymbol} : ${baseSymbol}`}</span>
                        </a>
                        )}
                    </div>

                    <div className="grid-block vertical">
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

                                {volumeBase >= 0 ? <PriceStat ready={marketReady} decimals={0} volume={true} price={volumeBase} className="column-hide-small" volume2={volumeQuote} base={baseAsset} quote={quoteAsset} content="exchange.volume_24"/> : null}

                                {feedPrice ?
                                    <PriceStat toolTip={counterpart.translate("tooltip.settle_price")} ready={marketReady} className="column-hide-small" price={feedPrice.toReal()} quote={quoteAsset} base={baseAsset} content="exchange.settle"/> : null}

                                {lowestCallPrice && showCallLimit ?
                                    <PriceStat toolTip={counterpart.translate("tooltip.call_limit")} ready={marketReady} className="column-hide-medium is-call" price={lowestCallPrice} quote={quoteAsset} base={baseAsset} content="explorer.block.call_limit"/> : null}

                                {feedPrice && showCallLimit ?
                                    <PriceStat toolTip={counterpart.translate("tooltip.margin_price")} ready={marketReady} className="column-hide-medium is-call" price={feedPrice.getSqueezePrice({real: true})} quote={quoteAsset} base={baseAsset} content="exchange.squeeze"/> : null}
                            </ul>
                        </div>
                        <div className="grid-block wrap no-overflow" style={{justifyContent: "space-between"}}>

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
                                    <li className="stat clickable" onClick={this.props.onSelectIndicators}>
                                        <div className="indicators">
                                            <Translate content="exchange.settings" />
                                        </div>
                                    </li>) : null}
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

                                <li className="stat float-right clickable" style={{borderLeft: "1px solid grey", borderRight: "none", padding: "3px 15px 0 15px"}} onClick={this.props.onToggleCharts}>
                                    <div className="indicators">
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
