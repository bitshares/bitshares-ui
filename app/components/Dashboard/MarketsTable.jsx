import React from "react";
import {connect} from "alt-react";
import {Link} from "react-router-dom";
import {ChainStore} from "bitsharesjs";
import Translate from "react-translate-component";
import cnames from "classnames";
import MarketsStore from "stores/MarketsStore";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import ChainTypes from "../Utility/ChainTypes";
import Icon from "../Icon/Icon";
import AssetName from "../Utility/AssetName";
import BindToChainState from "../Utility/BindToChainState";
import MarketsActions from "actions/MarketsActions";
import utils from "common/utils";
import PaginatedList from "../Utility/PaginatedList";

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

MarketRow = BindToChainState(MarketRow);

class MarketsTable extends React.Component {
    constructor() {
        super();
        this.state = {
            filter: "",
            showFlip: false,
            showHidden: false,
            markets: [],
            sortBy: "volumeQuote",
            sortDirection: true
        };

        this.update = this.update.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        this.update(nextProps);
    }

    componentWillMount() {
        this.update();
        ChainStore.subscribe(this.update);
    }

    componentWillUnmount() {
        ChainStore.unsubscribe(this.update);
    }

    _onToggleSort(key) {
        if (key === this.state.sortBy) {
            return this.setState({sortDirection: !this.state.sortDirection});
        }
        this.setState({sortBy: key});
    }

    update(nextProps = null) {
        let props = nextProps || this.props;
        let showFlip = props.forceDirection;
        let markets = props.markets
            .toArray()
            .map(market => {
                let quote = ChainStore.getAsset(market.quote);
                let base = ChainStore.getAsset(market.base);
                if (!base || !quote) return null;
                let marketName = `${market.base}_${market.quote}`;

                return {
                    key: marketName,
                    inverted: undefined,
                    quote: market.quote,
                    base: market.base,
                    isHidden: props.hiddenMarkets.includes(marketName),
                    isFavorite: props.isFavorite,
                    marketStats: props.allMarketStats.get(marketName, {}),
                    isStarred: this.props.starredMarkets.has(marketName)
                };
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

    render() {
        let {markets, showFlip, showHidden, filter} = this.state;

        const marketRows = markets
            .filter(m => {
                if (!!filter || m.isStarred) return true;
                if (m.marketStats && "volumeBase" in m.marketStats) {
                    return !!m.marketStats.volumeBase;
                } else {
                    return true;
                }
            })
            .sort((a, b) => {
                const {sortBy, sortDirection} = this.state;

                switch (sortBy) {
                    case "price":
                        if (a.marketStats.price && b.marketStats.price) {
                            if (sortDirection) {
                                return (
                                    b.marketStats.price.toReal() -
                                    a.marketStats.price.toReal()
                                );
                            }

                            return (
                                a.marketStats.price.toReal() -
                                b.marketStats.price.toReal()
                            );
                        }
                        break;

                    case "change":
                        if (sortDirection) {
                            return (
                                parseFloat(b.marketStats[sortBy]) -
                                parseFloat(a.marketStats[sortBy])
                            );
                        } else {
                            return (
                                parseFloat(a.marketStats[sortBy]) -
                                parseFloat(b.marketStats[sortBy])
                            );
                        }

                        break;

                    default:
                        if (sortDirection) {
                            return (
                                b.marketStats[sortBy] - a.marketStats[sortBy]
                            );
                        } else {
                            return (
                                a.marketStats[sortBy] - b.marketStats[sortBy]
                            );
                        }
                }
            })
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

                if (!visible) return null;

                return (
                    <MarketRow
                        {...row}
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
                        starredMarkets={this.props.starredMarkets}
                    />
                );
            })
            .filter(r => !!r);
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
                <PaginatedList
                    style={{paddingLeft: 0, paddingRight: 0}}
                    className="table dashboard-table table-hover"
                    header={
                        <tr>
                            <th style={{textAlign: "left", width: "75px"}} />
                            <th style={{textAlign: "left"}}>
                                <Translate
                                    component="span"
                                    content="account.asset"
                                />
                            </th>
                            {this.props.isFavorite ? null : (
                                <th style={{textAlign: "right"}}>
                                    <Translate content="account.user_issued_assets.quote_name" />
                                </th>
                            )}
                            <th
                                onClick={this._onToggleSort.bind(this, "price")}
                                className={cnames(
                                    "column-hide-small is-sortable",
                                    {"is-active": this.state.sortBy === "price"}
                                )}
                                style={{textAlign: "right"}}
                            >
                                <Translate content="exchange.price" />
                            </th>
                            <th
                                onClick={this._onToggleSort.bind(
                                    this,
                                    "change"
                                )}
                                className={cnames("is-sortable", {
                                    "is-active": this.state.sortBy === "change"
                                })}
                                style={{textAlign: "right"}}
                            >
                                <Translate content="account.hour_24_short" />
                            </th>
                            <th
                                onClick={this._onToggleSort.bind(
                                    this,
                                    "volumeQuote"
                                )}
                                className={cnames("is-sortable", {
                                    "is-active":
                                        this.state.sortBy === "volumeQuote"
                                })}
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
                    }
                    rows={
                        !marketRows.length ? (
                            <tr className="table-empty">
                                <td colSpan={showFlip ? 7 : 6}>
                                    <Translate content="dashboard.table_empty" />
                                </td>
                            </tr>
                        ) : (
                            marketRows
                        )
                    }
                    pageSize={25}
                    label="utility.total_x_markets"
                    leftPadding="1.5rem"
                />
            </div>
        );
    }
}

export default connect(
    MarketsTable,
    {
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
    }
);
