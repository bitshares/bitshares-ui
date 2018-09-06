import React from "react";
import ChainTypes from "../Utility/ChainTypes";
import Icon from "../Icon/Icon";
import AssetName from "../Utility/AssetName";
import BindToChainState from "../Utility/BindToChainState";
import MarketsActions from "actions/MarketsActions";
import {Link} from "react-router-dom";
import utils from "common/utils";
import cnames from "classnames";

class MarketsRow extends React.Component {
    static propTypes = {
        quote: ChainTypes.ChainAsset.isRequired,
        base: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        tempComponent: "tr"
    };

    constructor() {
        super();

        this.statsInterval = null;
        this.state = {
            imgError: false
        };
    }

    shouldComponentUpdate(np, ns) {
        return (
            utils.check_market_stats(np.marketStats, this.props.marketStats) ||
            np.base.get("id") !== this.props.base.get("id") ||
            np.quote.get("id") !== this.props.quote.get("id") ||
            ns.imgError !== this.state.imgError ||
            np.starredMarkets.size !== this.props.starredMarkets.size
        );
    }

    componentWillMount() {
        this._setInterval();
    }

    componentWillUnmount() {
        this._clearInterval();
    }

    componentWillReceiveProps(nextProps) {
        if (
            nextProps.base.get("id") !== this.props.base.get("id") ||
            nextProps.quote.get("id") !== this.props.quote.get("id")
        ) {
            this._clearInterval();
            this._setInterval(nextProps);
        }
    }

    _setInterval(nextProps = null) {
        let {base, quote} = nextProps || this.props;
        this.statsChecked = new Date();
        this.statsInterval = MarketsActions.getMarketStatsInterval(
            35 * 1000,
            base,
            quote
        );
    }

    _clearInterval() {
        if (this.statsInterval) this.statsInterval();
    }

    _onError(imgName) {
        if (!this.state.imgError) {
            this.refs[imgName.toLowerCase()].src = "asset-symbols/bts.png";
            this.setState({
                imgError: true
            });
        }
    }

    _toggleFavoriteMarket(quote, base) {
        let marketID = `${quote}_${base}`;
        if (!this.props.starredMarkets.has(marketID)) {
            SettingsActions.addStarMarket(quote, base);
        } else {
            SettingsActions.removeStarMarket(quote, base);
        }
    }

    render() {
        let {
            base,
            quote,
            marketStats,
            isHidden,
            inverted,
            handleHide,
            handleFlip
        } = this.props;

        function getImageName(asset) {
            let symbol = asset.get("symbol");
            if (
                symbol === "OPEN.BTC" ||
                symbol === "GDEX.BTC" ||
                symbol === "RUDEX.BTC"
            )
                return symbol;
            let imgName = asset.get("symbol").split(".");
            return imgName.length === 2 ? imgName[1] : imgName[0];
        }
        let imgName = getImageName(quote);
        let changeClass = !marketStats
            ? ""
            : parseFloat(marketStats.change) > 0
                ? "change-up"
                : parseFloat(marketStats.change) < 0
                    ? "change-down"
                    : "";

        let marketID = `${quote.get("symbol")}_${base.get("symbol")}`;

        const starClass = this.props.starredMarkets.has(marketID)
            ? "gold-star"
            : "grey-star";

        return (
            <tr>
                <td>
                    <div
                        onClick={this._toggleFavoriteMarket.bind(
                            this,
                            quote.get("symbol"),
                            base.get("symbol")
                        )}
                    >
                        <Icon
                            style={{cursor: "pointer"}}
                            className={starClass}
                            name="fi-star"
                            title="icons.fi_star.market"
                        />
                    </div>
                </td>
                <td style={{textAlign: "left"}}>
                    <Link
                        to={`/market/${this.props.quote.get(
                            "symbol"
                        )}_${this.props.base.get("symbol")}`}
                    >
                        <img
                            ref={imgName.toLowerCase()}
                            className="column-hide-small"
                            onError={this._onError.bind(this, imgName)}
                            style={{maxWidth: 20, marginRight: 10}}
                            src={`${__BASE_URL__}asset-symbols/${imgName.toLowerCase()}.png`}
                        />
                        <AssetName dataPlace="top" name={quote.get("symbol")} />
                        &nbsp;
                        {this.props.isFavorite ? (
                            <span>
                                :&nbsp;
                                <AssetName
                                    dataPlace="top"
                                    name={base.get("symbol")}
                                />
                            </span>
                        ) : null}
                    </Link>
                </td>
                {this.props.isFavorite ? null : (
                    <td style={{textAlign: "right"}}>
                        <AssetName noTip name={base.get("symbol")} />
                    </td>
                )}
                <td className="column-hide-small" style={{textAlign: "right"}}>
                    {marketStats && marketStats.price
                        ? utils.price_text(
                              marketStats.price.toReal(true),
                              quote,
                              base
                          )
                        : null}
                </td>
                <td
                    style={{textAlign: "right"}}
                    className={cnames(changeClass)}
                >
                    {!marketStats ? null : marketStats.change}%
                </td>
                <td style={{textAlign: "right"}}>
                    {!marketStats
                        ? null
                        : utils.format_volume(
                              marketStats.volumeQuote,
                              base.get("precision")
                          )}
                </td>
                {inverted === null || !this.props.isFavorite ? null : (
                    <td className="column-hide-small">
                        <a onClick={handleFlip}>
                            <Icon name="shuffle" title="icons.shuffle" />
                        </a>
                    </td>
                )}
                <td>
                    <a
                        style={{marginRight: 0}}
                        className={isHidden ? "action-plus" : "order-cancel"}
                        onClick={handleHide}
                    >
                        <Icon
                            name={isHidden ? "plus-circle" : "cross-circle"}
                            title={
                                isHidden
                                    ? "icons.plus_circle.show_market"
                                    : "icons.cross_circle.hide_market"
                            }
                            className="icon-14px"
                        />
                    </a>
                </td>
            </tr>
        );
    }
}

MarketsRow = BindToChainState(MarketsRow);
export default MarketsRow;
