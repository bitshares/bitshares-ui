import React from "react";
import {connect} from "alt-react";
import {Link} from "react-router-dom";
import {ChainStore} from "bitsharesjs/es";
import Translate from "react-translate-component";
import cnames from "classnames";

import MarketsStore from "stores/MarketsStore";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import ChainTypes from "../Utility/ChainTypes";
import Icon from "../Icon/Icon";
import AssetName from "../Utility/AssetName";
import AssetImage from "../Utility/AssetImage";
import BindToChainState from "../Utility/BindToChainState";
import MarketsActions from "actions/MarketsActions";
import utils from "common/utils";
import market_utils from "common/market_utils";

class MarketRow extends React.Component {
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
        this.lastRender = null;

        this.state = {
            imgError: false
        };
    }

    _checkStats(newStats = {close: {}}, oldStats = {close: {}}) {
        return (
            newStats.volumeBase !== oldStats.volumeBase ||
            !utils.are_equal_shallow(
                newStats.close && newStats.close.base,
                oldStats.close && oldStats.close.base
            ) ||
            !utils.are_equal_shallow(
                newStats.close && newStats.close.quote,
                oldStats.close && oldStats.close.quote
            )
        );
    }

    shouldComponentUpdate(np, ns) {
        if (
            !this.lastRender ||
            np.base.get("id") !== this.props.base.get("id") ||
            np.quote.get("id") !== this.props.quote.get("id") ||
            np.visible !== this.props.visible ||
            ns.imgError !== this.state.imgError ||
            np.starredMarkets.size !== this.props.starredMarkets.size
        ) {
            return true;
        }

        if (this._checkStats(np.marketStats, this.props.marketStats)) {
            this._renderDeferred();
        }

        return false;
    }

    componentWillMount() {
        this._setInterval();
    }

    componentWillUnmount() {
        this.unmounted = true;
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
        MarketsActions.getMarketStats(base, quote);
        this.statsChecked = new Date();
        this.statsInterval = setInterval(
            MarketsActions.getMarketStats.bind(this, base, quote),
            35 * 1000
        );
    }

    _clearInterval() {
        clearInterval(this.statsInterval);
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

    _renderDeferred() {
        if (!this.renderDeferredTimeout) {
            this.renderDeferredTimeout = setTimeout(() => {
                if (this.unmounted) {
                    return;
                }

                this.lastRender = null;
                this.forceUpdate();
            }, 1000);
        }
    }

    render() {
        this.lastRender = new Date();

        let {
            base,
            quote,
            marketStats,
            isHidden,
            inverted,
            visible,
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
            <tr style={{display: visible ? "" : "none"}}>
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
                        <AssetImage
                            style={{width: 40, margin: "5px 20px 5px 0"}}
                            marketId={marketID}
                        />
                        <AssetName dataPlace="top" name={quote.get("symbol")} />{" "}
                        :{" "}
                        <AssetName dataPlace="top" name={base.get("symbol")} />
                    </Link>
                </td>
                <td style={{textAlign: "right"}}>
                    {marketStats && marketStats.price
                        ? utils.price_text(
                              marketStats.price.toReal(),
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
                <td className="column-hide-small" style={{textAlign: "right"}}>
                    {!marketStats
                        ? null
                        : utils.format_volume(
                              marketStats.volumeBase,
                              base.get("precision")
                          )}
                </td>
                {inverted === null ? null : (
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

MarketRow = BindToChainState(MarketRow);
// MarketRow = connect(MarketRow, {
//     listenTo() {
//         return [MarketsStore];
//     },
//     getProps(props) {
//         return {
//             marketStats: MarketsStore.getState().allMarketStats.get(
//                 props.marketId
//             ),
//             starredMarkets: SettingsStore.getState().starredMarkets
//         };
//     }
// });

class MarketsPagination extends React.Component {
    shouldComponentUpdate(nextProps) {
        return nextProps !== this.props;
    }

    onPageClick = page => {
        console.log(page);

        if (this.props.onPageChange) {
            this.props.onPageChange(page);
        }
    };

    render() {
        const {size, perPage, page} = this.props;

        const pages = new Array(Math.ceil(size / perPage)).fill(0);

        return (
            <nav aria-label="Pagination">
                <ul className="pagination">
                    {pages.map((p, i) => {
                        p = i + 1;

                        return (
                            <li
                                key={"page" + p}
                                className={p === page ? "current" : ""}
                                onClick={this.onPageClick.bind(this, p)}
                            >
                                {p}
                            </li>
                        );
                    })}
                </ul>
            </nav>
        );
    }
}

class MarketsTable extends React.Component {
    constructor() {
        super();
        this.state = {
            filter: "",
            showFlip: true,
            showHidden: false,
            markets: [],
            page: 1
        };

        this.update = this.update.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        this.update(nextProps);
    }

    componentWillMount() {
        ChainStore.subscribe(this.update);
        this.update();
    }

    componentWillUnmount() {
        ChainStore.unsubscribe(this.update);
    }

    update(nextProps = null) {
        let props = nextProps || this.props;
        let showFlip = !props.forceDirection || props.handleFlip;
        let markets = props.markets
            .map(pair => {
                let [first, second] = pair;

                if (props.forceDirection) {
                    let key = `${first}_${second}`;
                    return {
                        key,
                        inverted: showFlip ? false : null,
                        marketId: key,
                        quote: first,
                        base: second,
                        isHidden: props.hiddenMarkets.includes(key)
                    };
                } else {
                    let {
                        marketName: key,
                        first: quote,
                        second: base
                    } = market_utils.getMarketName(
                        ChainStore.getAsset(first),
                        ChainStore.getAsset(second)
                    );
                    if (!quote || !base) return null;

                    let inverted = props.marketDirections.get(key);
                    if (inverted) {
                        [quote, base] = [base, quote];
                    }

                    return {
                        key,
                        inverted,
                        marketId: `${quote.get("symbol")}_${base.get(
                            "symbol"
                        )}`,
                        quote: quote.get("symbol"),
                        base: base.get("symbol"),
                        isHidden: props.hiddenMarkets.includes(key)
                    };
                }
            })
            .filter(a => a !== null);

        this.setState({showFlip, markets});
    }

    _toggleShowHidden(val) {
        if (this.state.showHidden === val) return;

        this.setState({
            showHidden: val
        });
    }

    _handleFilterInput(e) {
        e.preventDefault();
        this.setState({filter: e.target.value.toUpperCase()});
    }

    _handleHide(row, status) {
        if (this.props.handleHide) {
            return this.props.handleHide(row, status);
        }

        SettingsActions.hideMarket(row.key, status);
    }

    _handleFlip(row, status) {
        if (this.props.handleFlip) {
            return this.props.handleFlip(row, status);
        }

        SettingsActions.changeMarketDirection({
            [row.key]: status
        });
    }

    _onPageChange = page => {
        this.setState({
            page
        });
    };

    render() {
        let {markets, showFlip, showHidden, filter, page} = this.state;
        this.loaded = true;

        const rowsPerPage = 50;

        let visibleRow = 0;
        markets = markets
            .map(row => {
                let visible = true;

                if (row.isHidden !== this.state.showHidden) {
                    visible = false;
                } else if (filter) {
                    const quoteObject = ChainStore.getAsset(row.quote);
                    const baseObject = ChainStore.getAsset(row.base);

                    const {isBitAsset: quoteIsBitAsset} = utils.replaceName(
                        quoteObject
                    );
                    const {isBitAsset: baseIsBitAsset} = utils.replaceName(
                        baseObject
                    );

                    let quoteSymbol = row.quote;
                    let baseSymbol = row.base;

                    if (quoteIsBitAsset) {
                        quoteSymbol = "bit" + quoteSymbol;
                    }

                    if (baseIsBitAsset) {
                        baseSymbol = "bit" + baseSymbol;
                    }

                    const filterPair = filter.includes(":");

                    if (filterPair) {
                        const quoteFilter = filter.split(":")[0].trim();
                        const baseFilter = filter.split(":")[1].trim();

                        visible =
                            quoteSymbol
                                .toLowerCase()
                                .includes(String(quoteFilter).toLowerCase()) &&
                            baseSymbol
                                .toLowerCase()
                                .includes(String(baseFilter).toLowerCase());
                    } else {
                        visible =
                            quoteSymbol
                                .toLowerCase()
                                .includes(String(filter).toLowerCase()) ||
                            baseSymbol
                                .toLowerCase()
                                .includes(String(filter).toLowerCase());
                    }
                }

                if (visible) ++visibleRow;
                else return null;

                return (
                    <MarketRow
                        {...row}
                        visible={visible}
                        marketStats={this.props.allMarketStats.get(
                            row.marketId
                        )}
                        starredMarkets={this.props.starredMarkets}
                        handleHide={this._handleHide.bind(
                            this,
                            row,
                            !row.isHidden
                        )}
                        handleFlip={this._handleFlip.bind(
                            this,
                            row,
                            !row.inverted
                        )}
                    />
                );
            })
            .filter(market => market !== null);

        if ((page - 1) * rowsPerPage > markets.length) {
            page = 1;
        }

        const paginatedMarkets = markets.slice(
            (page - 1) * rowsPerPage,
            (page - 1) * rowsPerPage + rowsPerPage
        );

        return (
            <div>
                <div className="header-selector">
                    <div className="filter inline-block">
                        <input
                            type="text"
                            placeholder="Filter"
                            onChange={this._handleFilterInput.bind(this)}
                        />
                    </div>
                    <div className="selector inline-block">
                        <div
                            className={cnames("inline-block", {
                                inactive: showHidden
                            })}
                            onClick={this._toggleShowHidden.bind(this, false)}
                        >
                            <Translate content="account.hide_hidden" />
                        </div>
                        <div
                            className={cnames("inline-block", {
                                inactive: !showHidden
                            })}
                            onClick={this._toggleShowHidden.bind(this, true)}
                        >
                            <Translate content="account.show_hidden" />
                        </div>
                    </div>
                </div>
                <table className="table dashboard-table table-hover">
                    <thead>
                        <tr>
                            <th style={{textAlign: "left", width: "75px"}} />
                            <th style={{textAlign: "left"}}>
                                <Translate
                                    component="span"
                                    content="account.asset"
                                />
                            </th>
                            <th style={{textAlign: "right"}}>
                                <Translate content="exchange.price" />
                            </th>
                            <th style={{textAlign: "right"}}>
                                <Translate content="account.hour_24_short" />
                            </th>
                            <th
                                className="column-hide-small"
                                style={{textAlign: "right"}}
                            >
                                <Translate content="exchange.volume" />
                            </th>
                            {showFlip ? (
                                <th className="column-hide-small">
                                    <Translate content="exchange.flip" />
                                </th>
                            ) : null}
                            <th>
                                <Translate
                                    content={
                                        !showHidden
                                            ? "exchange.hide"
                                            : "account.perm.show"
                                    }
                                />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            className="table-empty"
                            style={{display: visibleRow ? "none" : ""}}
                        >
                            <td colSpan={showFlip ? 6 : 5}>
                                <Translate content="dashboard.table_empty" />
                            </td>
                        </tr>
                        {paginatedMarkets}
                    </tbody>
                    {visibleRow > rowsPerPage ? (
                        <tfoot>
                            <tr>
                                <td colSpan={showFlip ? 6 : 5}>
                                    <MarketsPagination
                                        onPageChange={this._onPageChange}
                                        page={page}
                                        perPage={rowsPerPage}
                                        size={markets.length}
                                    />
                                </td>
                            </tr>
                        </tfoot>
                    ) : null}
                </table>
            </div>
        );
    }
}

export default connect(MarketsTable, {
    listenTo() {
        return [SettingsStore, MarketsStore];
    },
    getProps() {
        let {marketDirections, hiddenMarkets} = SettingsStore.getState();

        return {
            marketDirections,
            hiddenMarkets,
            allMarketStats: MarketsStore.getState().allMarketStats,
            starredMarkets: SettingsStore.getState().starredMarkets
        };
    }
});
