import React from "react";
import ReactDOM from "react-dom";
import {PropTypes} from "react-router";
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
import {debounce} from "lodash";

let lastLookup = new Date();

class MarketGroup extends React.Component {

    static defaultProps = {
        maxRows: 20
    };

    constructor(props) {
        super();
        this.state = this._getInitialState(props);
    }

    _getInitialState(props) {
        let open = props.forceOpen ? true : props.viewSettings.get(`myMarketsBase_${props.index}`);
        return {
            open: open !== undefined ? open : true,
            inverseSort: props.viewSettings.get("myMarketsInvert", true),
            sortBy: props.viewSettings.get("myMarketsSort", "volume")
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.forceOpen !== this.props.forceOpen) {
            this.setState(this._getInitialState(nextProps));
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!nextProps.markets || !this.props.markets) {
            return true;
        }
        return (
            !utils.are_equal_shallow(nextState, this.state) ||
            !utils.are_equal_shallow(nextProps.markets, this.props.markets) ||
            nextProps.starredMarkets !== this.props.starredMarkets ||
            nextProps.marketStats !== this.props.marketStats
        );
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

    // _onSelectBase(e) {
    //     e.preventDefault();
    //     e.stopPropagation();

    //     SettingsActions.changeBase(this.props.index, e.target.value);
    // }

    _onToggle(e) {
        if (!this.props.forceOpen) {
            let open = !this.state.open;
            this.setState({
                open: open
            });

            let setting = {};
            setting[`myMarketsBase_${this.props.index}`] = open;
            SettingsActions.changeViewSetting(setting);
        }
    }

    render() {
        let {columns, markets, base, marketStats, starredMarkets,
            current, maxRows, baseOptions} = this.props;
        let {sortBy, inverseSort, open} = this.state;

        if (!markets || !markets.length) {
            return null;
        }

        let headers = columns.map(header => {
            switch (header.name) {
                case "market":
                    return <th key={header.name} className="clickable" onClick={this._changeSort.bind(this, "name")}><Translate content="exchange.market" /></th>;

                case "vol":
                    return <th key={header.name} className="clickable" onClick={this._changeSort.bind(this, "volume")}style={{textAlign: "right"}}><Translate content="exchange.vol_short" /></th>;

                case "price":
                    return <th key={header.name} style={{textAlign: "right"}}><Translate content="exchange.price" /></th>;

                case "quoteSupply":
                    return <th key={header.name}><Translate content="exchange.quote_supply" /></th>;

                case "baseSupply":
                    return <th key={header.name}><Translate content="exchange.base_supply" /></th>;

                case "change":
                    return <th key={header.name} className="clickable" onClick={this._changeSort.bind(this, "change")} style={{textAlign: "right"}}><Translate content="exchange.change" /></th>;

                default:
                    return <th key={header.name}></th>;
            }
        });

        let index = 0;

        let marketRows = markets
            .map(market => {

                return (
                    <MarketRow
                        key={market.id}
                        name={base === "others" ? market.quote + ":" + market.base : market.quote}
                        quote={market.quote}
                        base={market.base}
                        columns={columns}
                        leftAlign={true}
                        compact={true}
                        noSymbols={true}
                        stats={marketStats.get(market.id)}
                        starred={starredMarkets.has(market.id)}
                        current={current === market.id}
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
                                return bStats.volumeBase - aStats.volumeBase;
                            } else {
                                return aStats.volumeBase - bStats.volumeBase;
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
            }).filter(() => {
                ++index;
                return index < maxRows;
            });

        let options = baseOptions.map((option, index) => {
            return <option key={index} value={option}>{option}</option>;
        });

        let caret = open ? <span>&#9660;</span> : <span>&#9650;</span>;

        return (
            <div style={{paddingRight: 10}}>
            <div
                id={base}
                onClick={this._onToggle.bind(this)}
                className="mymarkets-group-header"
            >
                <div style={{zIndex: 10}}>
                    {base !== "others" && this.props.allowChange ?
                    (<span>
                        <select
                            onChange={this._onSelectBase.bind(this)}
                            className="mymarkets-base-select"
                            value={base}
                        >
                            {options}
                        </select>
                         ({marketRows.length})
                    </span>) :
                    base !== "others" ? <span>{base} ({marketRows.length})</span> : <span><Translate content="exchange.others" /> ({marketRows.length})</span>}
                    {!this.props.forceOpen ? <div className="float-right">{caret}</div> : null}
                </div>
            </div>
                {open ? (
                <table className="table table-hover text-right">
                    <thead>
                        <tr>{headers}</tr>
                    </thead>
                    {marketRows && marketRows.length ?
                        <tbody>{marketRows}</tbody> : null
                    }
                </table>) : null}
            </div>
        );
    }
}

@BindToChainState()
class MyMarkets extends React.Component {

    static propTypes = {
        core: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        activeTab: "starred",
        core: "1.3.0",
        setMinWidth: false
    };

    static contextTypes = {
        history: PropTypes.history
    };

    constructor(props) {
        super();

        let inputValue = props.viewSettings.get("marketLookupInput", null);
        let symbols = inputValue ? inputValue.split(":") : [null];
        let quote = symbols[0];
        let base = symbols.length === 2 ? symbols[1] : null;

        this.state = {
            inverseSort: props.viewSettings.get("myMarketsInvert", true),
            sortBy: props.viewSettings.get("myMarketsSort", "volume"),
            activeTab: props.viewSettings.get("favMarketTab", "starred"),
            lookupQuote: quote,
            lookupBase: base,
            inputValue: inputValue,
            minWidth: "100%"
        };

        this._setMinWidth = this._setMinWidth.bind(this);
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
            nextProps.current !== this.props.current ||
            nextProps.minWidth !== this.props.minWidth ||
            nextProps.listHeight !== this.props.listHeight ||
            nextProps.preferredBases !== this.props.preferredBases
        );
    }

    componentDidMount() {
        let historyContainer = ReactDOM.findDOMNode(this.refs.favorites);
        Ps.initialize(historyContainer);

        this._setMinWidth();

        if (this.state.activeTab === "all" && this.state.inputValue) {
            this._lookupAssets({target: {value: this.state.inputValue}}, true);
        }

    }

    componentWillMount() {
        if (this.props.setMinWidth) {
            window.addEventListener("resize", this._setMinWidth, false);
        }
    }

    componetWillUnmount() {
        if (this.props.setMinWidth) {
            window.removeEventListener("resize", this._setMinWidth, false);
        }
    }

    _setMinWidth() {
        if (this.props.setMinWidth && this.refs.favorites && this.props.activeTab === "starred") {
            
            if (this.state.minWidth !== this.refs.favorites.offsetWidth) {
                this.setState({
                    minWidth: this.refs.favorites.offsetWidth
                });
            }
        }
    }

    componentDidUpdate() {
        if (this.refs.favorites) {
            let historyContainer = ReactDOM.findDOMNode(this.refs.favorites);
            Ps.update(historyContainer);
        }
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
        this.context.history.pushState(null, "/markets");
    }

    _changeTab(tab) {
        SettingsActions.changeViewSetting({
            favMarketTab: tab
        });
        this.setState({
            activeTab: tab
        });

        this._setMinWidth();
    }

    _lookupAssets(e, force = false) {
        if (!e.target.value && e.target.value !== "") {
            return;
        }
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
        let {starredMarkets, marketStats, columns, searchAssets,
            preferredBases, core, current, viewSettings, listHeight, baseOptions} = this.props;
        let {inverseSort, activeTab, sortBy, lookupQuote, lookupBase} = this.state;
        let otherMarkets = <tr></tr>;

        let coreSymbol = core.get("symbol");
        // Add some default base options
        // let preferredBases = [coreSymbol, "BTC", "USD", "CNY"];
        let baseGroups = {};

        let bases = [
            // coreSymbol, "BTC", "CNY", "USD"
        ];

        searchAssets
        .filter(a => {
            // Always keep core asset as an option
            // if (preferredBases.indexOf(a.symbol) === 0) {
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
                    bases.push(asset.symbol);
                }
            } else if (preferredBases.includes(asset.symbol)) {
                if (asset.symbol.length >= lookupQuote.length && asset.symbol.length < lookupQuote.length + 3) {
                    bases.push(asset.symbol);
                }
            }
        });

        bases = bases.concat(preferredBases.filter(a => {
            if (!lookupBase || !lookupBase.length) {
                return true
            }
            return a.indexOf(lookupBase) === 0;
        }).toArray());

        bases = bases
        .filter(base => {
            // Always keep core asset as an option
            // if (preferredBases.indexOf(base) !== -1) {
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
                bases.forEach(base => {
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
        });

        allMarkets = Immutable.Map(allMarkets);
        let activeMarkets = activeTab === "starred" ? starredMarkets : allMarkets;

        if (activeMarkets.size > 0) {
            otherMarkets = activeMarkets
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
                if (preferredBases.includes(market.base)) {
                    if (!baseGroups[market.base]) {
                        baseGroups[market.base] = [];
                    }
                    baseGroups[market.base].push(
                        {
                            id: marketID,
                            quote: market.quote,
                            base: market.base
                        }
                    );
                    return null;
                } else {
                    return (
                        {
                            id: marketID,
                            quote: market.quote,
                            base: market.base
                        }
                    ); 
                }
                   
            }).filter(a => {
                return a !== null;
            })
            .take(activeTab === "starred" ? 100 : 20)
            .toArray();
        }

        let hc = "mymarkets-header clickable";
        let starClass = cnames(hc, {inactive: activeTab === "all"});
        let allClass = cnames(hc, {inactive: activeTab === "starred"});

        let listStyle = {
            minWidth: this.state.minWidth,
            paddingTop: 8
        };
        if (listHeight) {
            listStyle.height = listHeight;
        }

        // Filter out already picked baseOptions
        baseOptions = baseOptions.filter(a => {
            return !preferredBases.includes(a);
        });

        return (
            <div className={this.props.className} style={this.props.style}>
                <div
                    style={this.props.headerStyle}
                    className="grid-block shrink left-orderbook-header bottom-header"
                >
                    <div ref="myMarkets" className={starClass} onClick={this._changeTab.bind(this, "starred")}>
                        <Translate content="exchange.market_name" />
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

                <div
                    style={listStyle}
                    className="table-container grid-block vertical mymarkets-list"
                    ref="favorites"
                >
                    {preferredBases.map((base, index) => {
                        return <MarketGroup
                            index={index}
                            allowChange={false}
                            key={base}
                            current={current}
                            starredMarkets={starredMarkets}
                            baseOptions={baseOptions}
                            marketStats={marketStats}
                            viewSettings={viewSettings}
                            columns={columns}
                            markets={baseGroups[base]}
                            base={base}
                            maxRows={activeTab === "starred" ? 20 : 10}
                            forceOpen={activeTab === "all"}
                        />
                    })}

                    <MarketGroup
                        index={preferredBases.size}
                        current={current}
                        starredMarkets={starredMarkets}
                        baseOptions={baseOptions}
                        marketStats={marketStats}
                        viewSettings={viewSettings}
                        columns={columns}
                        markets={otherMarkets}
                        base="others"
                        maxRows={activeTab === "starred" ? 20 : 10}
                        forceOpen={activeTab === "all"}
                    />
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
            preferredBases: SettingsStore.getState().preferredBases,
            baseOptions: SettingsStore.getState().baseOptions,
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
