import React from "react";
import {Link} from "react-router/es";
import Icon from "../Icon/Icon";
import AssetName from "../Utility/AssetName";
import MarketsActions from "actions/MarketsActions";
import SettingsActions from "actions/SettingsActions";
import PriceStatWithLabel from "./PriceStatWithLabel";
import Translate from "react-translate-component";
import counterpart from "counterpart";

export default class ExchangeHeader extends React.Component {

    constructor() {
        super();

        this.state = {
            volumeShowQuote: true
        };
    }

    shouldComponentUpdate(nextProps) {
        if (!nextProps.marketReady)
            return false;
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

    changeVolumeBase() {
        this.setState({
            volumeShowQuote: !this.state.volumeShowQuote
        });
    }

    render() {
        const {quoteAsset, baseAsset, starredMarkets, hasPrediction, feedPrice,
            showCallLimit, lowestCallPrice, marketReady, latestPrice,
            marketStats, showDepthChart} = this.props;

        const baseSymbol = baseAsset.get("symbol");
        const quoteSymbol = quoteAsset.get("symbol");

        // Favorite star
        const marketID = `${quoteSymbol}_${baseSymbol}`;
        const starClass = starredMarkets.has(marketID) ? "gold-star" : "grey-star";

        // Market stats
        const dayChange = marketStats.get("change");

        const dayChangeClass = parseFloat(dayChange) === 0 ? "" : parseFloat(dayChange) < 0 ? "negative" : "positive";
        const volumeBase = marketStats.get("volumeBase");
        const volumeQuote = marketStats.get("volumeQuote");
        const dayChangeWithSign = (dayChange > 0) ? "+" + dayChange : dayChange;
        
        const volume24h = this.state.volumeShowQuote?volumeQuote:volumeBase;
        const volume24hAsset = this.state.volumeShowQuote?quoteAsset:baseAsset; 
        
        return (
                <div className="grid-block shrink no-padding overflow-visible top-bar">
                    <div className="grid-block overflow-visible">
                        <div className="grid-block shrink show-for-large">
                            <div style={{padding: "10px"}}>
                                {!hasPrediction ? (
                                                                <span style={{padding: "0 5px"}}>
                                                                    <Link to={`/asset/${quoteSymbol}`}><AssetName name={quoteSymbol} replace={true} /></Link>
                                                                    <Link onClick={() => {
                                                                                    MarketsActions.switchMarket();
                                                }} className="market-symbol" to={`/market/${baseSymbol}_${quoteSymbol}`}>
                                                                    <Icon className="shuffle" name="shuffle"/>
                                                                    </Link>
                                                                    <Link to={`/asset/${baseSymbol}`}><AssetName name={baseSymbol} replace={true} /></Link>
                                                                </span>
                                                        ) : (
                                                                <a className="market-symbol">
                                                                    <span>{`${quoteSymbol} : ${baseSymbol}`}</span>
                                                                </a>
                                                        )}
                                <Translate component="div" style={{padding: "5px 0 0 5px"}} className="stat-text" content="exchange.trading_pair" />
                            </div>
                        </div>
                
                        <div className="grid-block vertical" style={{overflow: "visible"}}>
                            <div className="grid-block wrap market-stats-container">
                                <ul className="market-stats stats top-stats">
                                    {latestPrice ? <PriceStatWithLabel ready={marketReady} price={latestPrice.full} quote={quoteAsset} base={baseAsset} market={marketID} content="exchange.latest"/> : null}
                                    <li className={"stressed-stat daily_change " + dayChangeClass}>
                                        <span>
                                            <b className="value">{marketReady ? dayChangeWithSign : 0}</b>
                                            <span> %</span>
                                        </span>
                                    <Translate component="div" className="stat-text" content="account.hour_24" />
                                    </li>
                
                                    {(volumeBase >= 0) ? <PriceStatWithLabel onClick={this.changeVolumeBase.bind(this)} ready={marketReady} decimals={0} volume={true} price={volume24h} className="column-hide-small clickable" base={volume24hAsset} market={marketID} content="exchange.volume_24"/> : null}
                
                                    {!hasPrediction && feedPrice ?
                                                                        <PriceStatWithLabel toolTip={counterpart.translate("tooltip.settle_price")} ready={marketReady} className="column-hide-small" price={feedPrice.toReal()} quote={quoteAsset} base={baseAsset} market={marketID} content="exchange.settle"/> : null}
                
                                    {lowestCallPrice && showCallLimit ?
                                                                        <PriceStatWithLabel toolTip={counterpart.translate("tooltip.call_limit")} ready={marketReady} className="column-hide-medium is-call" price={lowestCallPrice} quote={quoteAsset} base={baseAsset} market={marketID} content="explorer.block.call_limit"/> : null}
                
                                    {feedPrice && showCallLimit ?
                                                                        <PriceStatWithLabel toolTip={counterpart.translate("tooltip.margin_price")} ready={marketReady} className="column-hide-medium is-call" price={feedPrice.getSqueezePrice({real: true})} quote={quoteAsset} base={baseAsset} market={marketID} content="exchange.squeeze"/> : null}
                                </ul>
                                <ul className="market-stats stats top-stats">
                                    <li className="stressed-stat input clickable" style={{padding:"16px"}} onClick={this.props.onToggleCharts}>
                                        {!showDepthChart ? <Translate content="exchange.order_depth" /> : <Translate content="exchange.price_history" />}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div> 
                );
            }
        }
