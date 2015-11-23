import React from "react";
import {PropTypes} from "react/addons";
import Immutable from "immutable";
import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
import connectToStores from "alt/utils/connectToStores";
import MarketRow from "./MarketRow";
import SettingsStore from "stores/SettingsStore";
import MarketsStore from "stores/MarketsStore";
import AssetStore from "stores/AssetStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import SettingsActions from "actions/SettingsActions";
import AssetActions from "actions/AssetActions";
import MarketsActions from "actions/MarketsActions";
import cnames from "classnames";
import Icon from "../Icon/Icon";
import {debounce} from "lodash";

let lastLookup = new Date();

@BindToChainState()
class MyMarkets extends React.Component {

    static propTypes = {
        core: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        activeTab: "starred",
        core: "1.3.0"
    };

    static contextTypes = {
        router: React.PropTypes.func.isRequired
    };

    constructor(props) {
        super();

        let inputValue = props.viewSettings.get("marketLookupInput");
        let symbols = inputValue ? inputValue.split(":") : [null];
        let quote = symbols[0];
        let base = symbols.length === 2 ? symbols[1] : null;

        this.state = {
            inverseSort: props.viewSettings.get("myMarketsInvert"),
            sortBy: props.viewSettings.get("myMarketsSort"),
            activeTab: props.viewSettings.get("favMarketTab") || "starred",
            lookupQuote: quote,
            lookupBase: base,
            inputValue: inputValue
        };

        this.getAssetList = _.debounce(AssetActions.getAssetList, 150);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.assets, this.props.assets) ||
            !Immutable.is(nextProps.searchAssets, this.props.searchAssets) ||
            !Immutable.is(nextProps.markets, this.props.markets) ||
            !Immutable.is(nextProps.starredMarkets, this.props.starredMarkets) ||
            !Immutable.is(nextProps.marketStats, this.props.marketStats) ||
            nextState.inverseSort !== this.state.inverseSort ||
            nextState.sortBy !== this.state.sortBy ||
            nextState.activeTab !== this.state.activeTab ||
            nextState.lookupQuote !== this.state.lookupQuote ||
            nextState.lookupBase !== this.state.lookupBase ||
            nextProps.current !== this.props.current
        );
    }

    componentDidMount() {
        let historyContainer = React.findDOMNode(this.refs.favorites);
        Ps.initialize(historyContainer);

        if (this.state.activeTab === "all") {
            this._lookupAssets({target: {value: this.state.inputValue}}, true);
        }
    }

    componentDidUpdate() {
        let historyContainer = React.findDOMNode(this.refs.favorites);
        Ps.update(historyContainer);
    }

    _inverseSort() {
        SettingsActions.changeViewSetting({
            myMarketsInvert: !this.state.myMarketsInvert
        });
        this.setState({
            inverseSort: !this.state.inverseSort
        });
    }

    _changeSort(type) {
        if (type !== this.state.sortBy) {
            SettingsActions.changeViewSetting({
                myMarketsSort: type
            });
            this.setState({
                sortBy: type
            });
        } else {
            this._inverseSort();
        }
    }

    _goMarkets() {
        this.context.router.transitionTo("markets");
    }

    _changeTab(tab) {
        SettingsActions.changeViewSetting({
            favMarketTab: tab
        });
        this.setState({
            activeTab: tab
        });
    }

    _lookupAssets(e, force = false) {
        let now = new Date();

        let symbols = e.target.value.toUpperCase().split(":");
        let quote = symbols[0];
        let base = symbols.length === 2 ? symbols[1] : null;

        this.setState({
            lookupQuote: quote,
            lookupBase: base,
            inputValue: e.target.value.toUpperCase()
        });

        SettingsActions.changeViewSetting({
            marketLookupInput: e.target.value.toUpperCase()
        });

        if (this.state.lookupQuote !== quote || force) {
            if (quote.length < 2 || now - lastLookup <= 250) {
                return false;
            }
            this.getAssetList(quote, 50);
        } else {
            if (base && this.state.lookupBase !== base) {
                if (base.length < 2 || now - lastLookup <= 250) {
                    return false;
                }
                this.getAssetList(base, 50);
            }
        }
    }

    render() {
        let {starredMarkets, marketStats, columns, searchAssets, core, current} = this.props;
        let {inverseSort, activeTab, sortBy, lookupQuote, lookupBase} = this.state;
        let marketRows = <tr></tr>;

        let coreSymbol = core.get("symbol");
        // Add some default base options
        let defaultBases = [coreSymbol, "BTC", "CNY", "USD"];
        let baseOptions = [
            // coreSymbol, "BTC", "CNY", "USD"
        ];

        searchAssets
        .filter(a => {
            // Always keep core asset as an option
            // if (defaultBases.indexOf(a.symbol) === 0) {
            //     return true;
            // }
            if (lookupBase && lookupBase.length) {
                return a.symbol.indexOf(lookupBase) === 0;
            }
            return a.symbol.indexOf(lookupQuote) !== -1;
        })
        .forEach(asset => {
            if (lookupBase && lookupBase.length) {
                if (asset.symbol.indexOf(lookupBase) === 0) {
                    baseOptions.push(asset.symbol);
                }
            } else if (defaultBases.indexOf(asset.symbol) < 0 ) {
                if (asset.symbol.length >= lookupQuote.length && asset.symbol.length < lookupQuote.length + 3) {
                    baseOptions.push(asset.symbol);
                }
            }
        });

        baseOptions = baseOptions.concat(defaultBases.filter(a => {if (!lookupBase || !lookupBase.length) {return true}; return a.indexOf(lookupBase) === 0;}));

        baseOptions = baseOptions
        .filter(base => {
            // Always keep core asset as an option
            // if (defaultBases.indexOf(base) !== -1) {
            //     return true;
            // }
            if (lookupBase && lookupBase.length > 1) {
                return base.indexOf(lookupBase) === 0;
            } else {
                return true;
            }
        });

        let allMarkets = [];

        if (searchAssets.size) {
            searchAssets
            .filter(a => {
                return (
                    a.symbol.indexOf(lookupQuote) !== -1 &&
                    a.symbol.length >= lookupQuote.length
                );
            })
            .forEach(asset => {
                baseOptions.forEach(base => {
                    let marketID = asset.symbol + "_" + base;

                    if (base !== asset.symbol) {
                        allMarkets.push([marketID, {quote: asset.symbol, base: base}]);
                    }
                });
            });
        }

        allMarkets = allMarkets
        .filter(a => {
            // If a base asset is specified, limit the quote asset to the exact search term
            if (lookupBase) {
                return a[1].quote === lookupQuote;
            }
            return true;
        })

        allMarkets = Immutable.Map(allMarkets);

        let activeMarkets = activeTab === "starred" ? starredMarkets : allMarkets;

        if (activeMarkets.size > 0) {
            marketRows = activeMarkets
            .filter(a => {
                if (activeTab === "all") {
                    if (lookupQuote.length < 2) {return false; }
                    return a.quote.indexOf(lookupQuote) !== -1;
                } else {
                    return true;
                }
            })
            .map(market => {
                let marketID = market.quote + "_" + market.base;
                    return (
                        <MarketRow
                            key={marketID}
                            quote={market.quote}
                            base={market.base}
                            columns={columns}
                            leftAlign={true}
                            compact={true}
                            noSymbols={true}
                            stats={marketStats.get(marketID)}
                            starred={starredMarkets.has(marketID)}
                            current={current === marketID}
                        />
                    );
            }).filter(a => {
                return a !== null;
            }).sort((a, b) => {
                let a_symbols = a.key.split("_");
                let b_symbols = b.key.split("_");
                let aStats = marketStats.get(a_symbols[0] + "_" + a_symbols[1]);
                let bStats = marketStats.get(b_symbols[0] + "_" + b_symbols[1]);

                switch (sortBy) {

                    case "name":
                        if (a_symbols[0] > b_symbols[0]) {
                            return inverseSort ? -1 : 1;
                        } else if (a_symbols[0] < b_symbols[0]) {
                            return inverseSort ? 1 : -1;
                        } else {
                            if (a_symbols[1] > b_symbols[1]) {
                                return inverseSort ? -1 : 1;
                            } else if (a_symbols[1] < b_symbols[1]) {
                                return inverseSort ? 1 : -1
                            } else {
                                return 0;
                            }
                        }

                    case "volume":
                        if (aStats && bStats) {
                            if (inverseSort) {
                                return bStats.volumeQuote - aStats.volumeQuote;
                            } else {
                                return aStats.volumeQuote - bStats.volumeQuote;
                            }
                        } else {
                            return 0;
                        }

                    case "change":
                        if (aStats && bStats) {
                            if (inverseSort) {
                                return bStats.change - aStats.change;
                            } else {
                                return aStats.change - bStats.change;
                            }
                        } else {
                            return 0;
                        }
                }

            })
            .take(activeTab === "starred" ? 100 : 30)
            .toArray();
        }

        let hc = "mymarkets-header clickable";
        let starClass = cnames(hc, {inactive: activeTab === "all"});
        let allClass = cnames(hc, {inactive: activeTab === "starred"});

        let headers = columns.map(header => {
            switch (header.name) {
                case "market":
                    return <th className="clickable" onClick={this._changeSort.bind(this, "name")}><Translate content="exchange.market" /></th>;

                case "vol":
                    return <th className="clickable" onClick={this._changeSort.bind(this, "volume")}style={{textAlign: "right"}}><Translate content="exchange.vol_short" /></th>;

                case "price":
                    return <th style={{textAlign: "right"}}><Translate content="exchange.price" /></th>;

                case "quoteSupply":
                    return <th><Translate content="exchange.quote_supply" /></th>;

                case "baseSupply":
                    return <th><Translate content="exchange.base_supply" /></th>;

                case "change":
                    return <th className="clickable" onClick={this._changeSort.bind(this, "change")} style={{textAlign: "right"}}><Translate content="exchange.change" /></th>;

                default:
                    return <th></th>;
            }
        });

        return (
            <div className={this.props.className} style={this.props.style}>
                <div style={this.props.headerStyle} className="grid-block shrink left-orderbook-header bottom-header">
                    <div className={starClass} onClick={this._changeTab.bind(this, "starred")}>
                        <Icon className="gold-star title-star" name="fi-star"/><Translate content="exchange.market_name" />
                    </div>
                    <div className={allClass} onClick={this._changeTab.bind(this, "all")} >
                        <Translate content="exchange.more" />
                    </div>
                </div>

                {activeTab === "all" || this.props.controls ? (
                    <div className="small-12 medium-6" style={{padding: "1rem 0"}}>
                        {this.props.controls ? <div style={{paddingBottom: "0.5rem"}}>{this.props.controls}</div> : null}
                        {activeTab === "all" ? <input type="text" value={this.state.inputValue} onChange={this._lookupAssets.bind(this)} placeholder="SYMBOL:SYMBOL" /> : null}
                    </div> ) : null}
                <div className="table-container grid-content mymarkets-list" ref="favorites">
                    <table className="table table-hover text-right market-right-padding">
                        <thead>
                            <tr>{headers}</tr>
                        </thead>
                        {marketRows && marketRows.length ?
                            <tbody>{marketRows}</tbody> : null
                        }
                    </table>
                </div>
            </div>
        );
    }
}

@connectToStores
class MyMarketsWrapper extends React.Component {
    static getStores() {
        return [SettingsStore, MarketsStore, AssetStore]
    }

    static getPropsFromStores() {
        return {
            starredMarkets: SettingsStore.getState().starredMarkets,
            viewSettings: SettingsStore.getState().viewSettings,
            marketStats: MarketsStore.getState().allMarketStats,
            searchAssets: AssetStore.getState().assets
        }
    }

    render () {
        return (
            <MyMarkets
                {...this.props}
            />
        );
    }
}

export default MyMarketsWrapper;
