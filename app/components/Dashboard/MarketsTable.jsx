import React from "react";
import {connect} from "alt-react";
import {ChainStore} from "bitsharesjs";
import Translate from "react-translate-component";
import cnames from "classnames";
import MarketsStore from "stores/MarketsStore";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import utils from "common/utils";
import PaginatedList from "../Utility/PaginatedList";
import {Input, Tooltip} from "bitshares-ui-style-guide";
import Icon from "../Icon/Icon";
import AssetName from "../Utility/AssetName";
import {Link} from "react-router-dom";
import {Icon as AntIcon} from "bitshares-ui-style-guide";

class MarketsTable extends React.Component {
    constructor() {
        super();
        this.state = {
            filter: "",
            showFlip: false,
            showHidden: false,
            markets: []
        };

        this.update = this.update.bind(this);
        for (let key in this.sortFunctions) {
            this.sortFunctions[key] = this.sortFunctions[key].bind(this);
        }
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

    update(nextProps = null) {
        let props = nextProps || this.props;
        let showFlip = props.forceDirection;

        if (props.markets && props.markets.size > 0) {
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
                        basePrecision: base.get("precision"),
                        isHidden: props.hiddenMarkets.includes(marketName),
                        isFavorite: props.isFavorite,
                        marketStats: props.allMarketStats.get(marketName, {}),
                        isStarred: this.props.starredMarkets.has(marketName)
                    };
                })
                .filter(a => a !== null);
            this.setState({showFlip, markets});
        }
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

    sort(aPrice, bPrice) {
        const convert = price => {
            price = price.replace(/\,/g, "");
            if (price.includes("k")) price = price.replace(/k/g, "") * 1000;
            if (price.includes("M"))
                price = price.replace(/M/g, "") * 1000 * 1000;
            return price;
        };
        aPrice = convert(aPrice);
        bPrice = convert(bPrice);

        if (aPrice === null && bPrice !== null) {
            return 1;
        } else if (aPrice !== null && bPrice === null) {
            return -1;
        } else {
            return aPrice - bPrice;
        }
    }

    sortFunctions = {
        alphabetic: function(a, b, force) {
            if (a.key > b.key) return force ? 1 : -1;
            if (a.key < b.key) return force ? -1 : 1;
            return 0;
        },
        priceValue: function(a, b) {
            let aPrice = a.price.props.children;
            let bPrice = b.price.props.children;
            if (aPrice && bPrice) {
                return this.sort(aPrice, bPrice);
            } else {
                return this.sortFunctions.alphabetic(a, b, true);
            }
        },
        volumeValue: function(a, b) {
            let aPrice = a.volume || 0;
            let bPrice = b.volume || 0;
            let compared = 0;
            if (aPrice && bPrice) {
                compared = aPrice - bPrice;
            }
            if (compared == 0) {
                return this.sortFunctions.alphabetic(a, b, true);
            } else {
                return compared;
            }
        },
        changeValue: function(a, b) {
            let aValue = parseFloat(a.hour_24);
            let bValue = parseFloat(b.hour_24);
            let compared = 0;
            if (aValue && bValue && !isNaN(aValue) && !isNaN(bValue)) {
                compared = aValue - bValue;
            }
            if (compared == 0) {
                return this.sortFunctions.alphabetic(a, b, true);
            } else {
                return compared;
            }
        }
    };

    getHeader() {
        const {showFlip, showHidden} = this.state;
        return [
            {
                dataIndex: "star",
                align: "right",
                width: "75px",
                render: item => {
                    return (
                        <span style={{whiteSpace: "nowrap", cursor: "pointer"}}>
                            {item}
                        </span>
                    );
                }
            },
            {
                title: <Translate content="account.asset" />,
                dataIndex: "asset",
                render: item => {
                    return (
                        <span
                            style={{
                                whiteSpace: "nowrap"
                            }}
                        >
                            {item}
                        </span>
                    );
                }
            },
            this.props.isFavorite
                ? {}
                : {
                      title: (
                          <Translate content="account.user_issued_assets.quote_name" />
                      ),
                      dataIndex: "quote_name",
                      align: "right",
                      render: item => {
                          return (
                              <span style={{whiteSpace: "nowrap"}}>{item}</span>
                          );
                      }
                  },
            {
                title: <Translate content="exchange.price" />,
                dataIndex: "price",
                align: "right",
                sorter: this.sortFunctions.priceValue,
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                title: <Translate content="account.hour_24_short" />,
                dataIndex: "hour_24",
                align: "right",
                sorter: this.sortFunctions.changeValue,
                render: (text, record, index) => {
                    const changeClass =
                        parseFloat(record.hour_24) > 0
                            ? "change-up"
                            : parseFloat(record.hour_24) < 0
                                ? "change-down"
                                : "";
                    return (
                        <span
                            style={{whiteSpace: "nowrap", textAlign: "right"}}
                            className={changeClass}
                        >
                            {record.hour_24}%
                        </span>
                    );
                }
            },
            {
                title: <Translate content="exchange.volume" />,
                dataIndex: "volume",
                align: "right",
                sorter: this.sortFunctions.volumeValue,
                defaultSortOrder: "descend",
                render: (text, record, index) => {
                    return (
                        <span style={{whiteSpace: "nowrap"}}>
                            {utils.format_volume(
                                record.volume,
                                record.basePrecision
                            )}
                        </span>
                    );
                }
            },
            showFlip
                ? {
                      title: <Translate content="exchange.flip" />,
                      dataIndex: "flip",
                      render: item => {
                          return (
                              <span
                                  className="column-hide-small"
                                  style={{whiteSpace: "nowrap"}}
                              >
                                  {item}
                              </span>
                          );
                      }
                  }
                : {},
            {
                title: (
                    <Translate
                        content={
                            !showHidden ? "exchange.hide" : "account.perm.show"
                        }
                    />
                ),
                dataIndex: "hide",
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            }
        ];
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
    getTableData(row) {
        let {base, quote, marketStats, isHidden, inverted, basePrecision} = row;

        function getImageName(symbol) {
            if (symbol === "OPEN.BTC" || symbol === "GDEX.BTC") return symbol;
            if (symbol.startsWith("RUDEX.")) return symbol;

            let imgName = symbol.split(".");
            return imgName.length === 2 ? imgName[1] : imgName[0];
        }
        let imgName = getImageName(quote);

        let marketID = `${quote}_${base}`;

        const starClass = this.props.starredMarkets.has(marketID)
            ? "gold-star"
            : "grey-star";

        return {
            key: marketID,
            star: (
                <div
                    onClick={this._toggleFavoriteMarket.bind(this, quote, base)}
                >
                    <Icon
                        style={{cursor: "pointer"}}
                        className={starClass}
                        name="fi-star"
                        title="icons.fi_star.market"
                    />
                </div>
            ),
            asset: (
                <Link to={`/market/${quote}_${base}`}>
                    <img
                        ref={imgName.toLowerCase()}
                        className="column-hide-small"
                        onError={this._onError.bind(this, imgName)}
                        style={{maxWidth: 20, marginRight: 10}}
                        src={`${__BASE_URL__}asset-symbols/${imgName.toLowerCase()}.png`}
                    />
                    <AssetName dataPlace="top" name={quote} />
                    &nbsp;
                    {this.props.isFavorite ? (
                        <span>
                            :&nbsp;
                            <AssetName dataPlace="top" name={base} />
                        </span>
                    ) : null}
                </Link>
            ),
            quote_name: this.props.isFavorite ? null : (
                <span style={{textAlign: "right"}}>
                    <AssetName noTip name={base} />
                </span>
            ),
            price: (
                <div className="column-hide-small" style={{textAlign: "right"}}>
                    {marketStats && marketStats.price
                        ? utils.price_text(
                              marketStats.price.toReal(true),
                              ChainStore.getAsset(quote),
                              ChainStore.getAsset(base)
                          )
                        : null}
                </div>
            ),
            hour_24:
                !marketStats ||
                !marketStats.change ||
                marketStats.change === "0.00"
                    ? 0
                    : marketStats.change,
            volume:
                !marketStats || !marketStats.volumeQuote
                    ? 0
                    : marketStats.volumeQuote,
            flip:
                inverted === null || !this.props.isFavorite ? null : (
                    <span className="column-hide-small">
                        <a
                            onClick={this._handleFlip.bind(
                                this,
                                row,
                                !row.inverted
                            )}
                        >
                            <Icon name="shuffle" title="icons.shuffle" />
                        </a>
                    </span>
                ),
            hide: (
                <Tooltip
                    title={
                        isHidden ? (
                            <Translate content="icons.plus_circle.show_market" />
                        ) : (
                            <Translate content="icons.cross_circle.hide_market" />
                        )
                    }
                    style={{marginRight: 0}}
                    onClick={this._handleHide.bind(this, row, !row.isHidden)}
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
                </Tooltip>
            ),
            basePrecision: basePrecision
        };
    }

    render() {
        let {markets, showHidden, filter} = this.state;

        const marketRows = markets
            .filter(m => {
                if (!!filter || m.isStarred) return true;
                if (
                    this.props.onlyLiquid ||
                    (m.marketStats && "volumeBase" in m.marketStats)
                ) {
                    return !!m.marketStats.volumeBase || false;
                } else {
                    return true;
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

                return this.getTableData({...row});
            })
            .filter(r => !!r);
        return (
            <div>
                <div className="header-selector">
                    <div className="filter inline-block">
                        <Input
                            type="text"
                            placeholder="Filter..."
                            onChange={this._handleFilterInput.bind(this)}
                            addonAfter={<AntIcon type="search" />}
                        />
                    </div>

                    <div
                        className="selector inline-block"
                        style={{position: "relative", top: "6px"}}
                    >
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

                    <div style={{paddingTop: "0.5rem"}}>
                        <label
                            style={{margin: "3px 0 0", width: "fit-content"}}
                        >
                            <input
                                style={{position: "relative", top: 3}}
                                className="no-margin"
                                type="checkbox"
                                checked={this.props.onlyLiquid}
                                onChange={() => {
                                    SettingsActions.changeViewSetting({
                                        onlyLiquid: !this.props.onlyLiquid
                                    });
                                }}
                            />
                            <span style={{paddingLeft: "0.4rem"}}>
                                <Translate content="exchange.show_only_liquid" />
                            </span>
                        </label>
                    </div>
                </div>
                <PaginatedList
                    style={{paddingLeft: 0, paddingRight: 0}}
                    className="table dashboard-table table-hover"
                    header={this.getHeader()}
                    rows={marketRows.length ? marketRows : []}
                    pageSize={20}
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
                starredMarkets: SettingsStore.getState().starredMarkets,
                onlyLiquid: SettingsStore.getState().viewSettings.get(
                    "onlyLiquid",
                    true
                )
            };
        }
    }
);
