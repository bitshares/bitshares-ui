import React from "react";
import {Link} from "react-router/es";
import Icon from "../Icon/Icon";
import AssetName from "../Utility/AssetName";
import MarketsActions from "actions/MarketsActions";
import SettingsActions from "actions/SettingsActions";
import PriceStatWithLabel from "./PriceStatWithLabel";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import Immutable from "immutable";
import {ChainStore} from "bitsharesjs/es";
import ExchangeHeaderCollateral from "./ExchangeHeaderCollateral";

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
            marketStats, showDepthChart,account} = this.props;

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

        const volume24h = this.state.volumeShowQuote ? volumeQuote : volumeBase;
        const volume24hAsset = this.state.volumeShowQuote ? quoteAsset : baseAsset;

        let showCollateralRatio = false;
        
        const quoteId = quoteAsset.get("id");
        const baseId = baseAsset.get("id");

        const marginableAssets = Immutable.Set(["1.3.103", "1.3.113", "1.3.120", "1.3.121", "1.3.958", "1.3.1325", "1.3.1362", "1.3.105", "1.3.106"])

        const lookForMarginAsset = (quoteId == "1.3.0") ? baseId : (baseId == "1.3.0" ? quoteId : null);
        
        let collOrderObject = "";
        
        if (marginableAssets.includes(lookForMarginAsset)) {

            if (account.toJS && account.has("call_orders")) {
                
                const call_orders = account.get("call_orders").toJS();
                
                for (let i = 0; i < call_orders.length; i++) {
                
                    let callID = call_orders[i];
                    
                    let position = ChainStore.getObject(callID);
                    let debtAsset = position.getIn(["call_price", "quote", "asset_id"]);
                    let baseAsset = position.getIn(["call_price", "base", "asset_id"]);
                    
                    if (debtAsset === lookForMarginAsset) {
                         collOrderObject = callID;
                         showCollateralRatio = true;
                         break;
                    } else {
                        console.log('not same',debtAsset,lookForMarginAsset,baseAsset)
                    }
                };
            }
        }


        return (
                <div className="grid-block shrink no-padding overflow-visible top-bar">
                    <div className="grid-block overflow-visible">
                        <div className="grid-block shrink">
                            <div style={{padding: "10px"}}>
                                {!hasPrediction ? (
                                                <div style={{padding: "0 5px", fontSize: "18px", marginTop: "1px"}}>
                                                    <Link to={`/asset/${quoteSymbol}`} className="asset-prefix"><AssetName name={quoteSymbol} replace={true} /></Link>
                                                    <span style={{padding: "0 5px"}}>/</span>
                                                    <Link to={`/asset/${baseSymbol}`} className="asset-prefix"><AssetName name={baseSymbol} replace={true} /></Link>
                                                </div>
                                                                        ) : (
                                                                <a className="market-symbol">
                                                                    <span>{`${quoteSymbol} : ${baseSymbol}`}</span>
                                                                </a>
                                                                        )}
                                <div className="label-actions">
                                    <Translate component="span" style={{padding: "5px 0 0 5px"}} className="stat-text" content="exchange.trading_pair" />
                                    <Link onClick={() => {
                                                        MarketsActions.switchMarket();
                                                                    }} to={`/market/${baseSymbol}_${quoteSymbol}`}>
                                    <Icon className="shuffle" name="shuffle"/>
                                    </Link>
                
                
                                    <Link onClick={() => {
                                                            this._addMarket(this.props.quoteAsset.get("symbol"), this.props.baseAsset.get("symbol"));
                                 }}>
                                    <Icon className={starClass} name="fi-star"/>
                                    </Link>
                                </div>
                            </div>
                        </div>
                
                        <div className="grid-block vertical" style={{overflow: "visible"}}>
                            <div className="grid-block wrap market-stats-container">
                                <ul className="market-stats stats top-stats">
                                    {latestPrice ? <PriceStatWithLabel ignoreColorChange={true} ready={marketReady} price={latestPrice.full} quote={quoteAsset} base={baseAsset} market={marketID} content="exchange.latest"/> : null}
                
                                    <li className={"hide-order-1 stressed-stat daily_change " + dayChangeClass}>
                                        <span>
                                            <b className="value">{marketReady ? dayChangeWithSign : 0}</b>
                                            <span> %</span>
                                        </span>
                                    <Translate component="div" className="stat-text" content="account.hour_24" />
                                    </li>
                
                                    {(volumeBase >= 0) ? <PriceStatWithLabel ignoreColorChange={true} onClick={this.changeVolumeBase.bind(this)} ready={marketReady} decimals={0} volume={true} price={volume24h} className="hide-order-2 clickable" base={volume24hAsset} market={marketID} content="exchange.volume_24"/> : null}
                                    {!hasPrediction && feedPrice ?<PriceStatWithLabel ignoreColorChange={true} toolTip={counterpart.translate("tooltip.settle_price")} ready={marketReady} className="hide-order-3" price={feedPrice.toReal()} quote={quoteAsset} base={baseAsset} market={marketID} content="exchange.settle"/> : null}
                                    {showCollateralRatio ?<ExchangeHeaderCollateral object={collOrderObject} account={account}/>:null}
                                    {lowestCallPrice && showCallLimit ?<PriceStatWithLabel toolTip={counterpart.translate("tooltip.call_limit")} ready={marketReady} className="hide-order-4 is-call" price={lowestCallPrice} quote={quoteAsset} base={baseAsset} market={marketID} content="explorer.block.call_limit"/> : null}
                                    {feedPrice && showCallLimit ?<PriceStatWithLabel toolTip={counterpart.translate("tooltip.margin_price")} ready={marketReady} className="hide-order-5 is-call" price={feedPrice.getSqueezePrice({real: true})} quote={quoteAsset} base={baseAsset} market={marketID} content="exchange.squeeze"/> : null}
                                </ul>
                                <ul className="market-stats stats top-stats">
                                    <li className="stressed-stat input clickable" style={{padding: "16px"}} onClick={this.props.onToggleCharts}>
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
