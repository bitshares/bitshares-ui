import React from "react";
import Immutable from "immutable";
import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import {connect} from "alt-react";
import MarketRow from "./MarketRow";
import SettingsStore from "stores/SettingsStore";
import MarketsStore from "stores/MarketsStore";
import AssetStore from "stores/AssetStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import AssetName from "../Utility/AssetName";
import SettingsActions from "actions/SettingsActions";
import AssetActions from "actions/AssetActions";
import MarketsActions from "actions/MarketsActions";
import cnames from "classnames";
import {debounce} from "lodash";
import AssetSelector from "../Utility/AssetSelector";
import counterpart from "counterpart";
import LoadingIndicator from "../LoadingIndicator";
import {ChainValidation} from "bitsharesjs/es";

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
        let open = props.findMarketTab
            ? true
            : props.viewSettings.get(`myMarketsBase_${props.index}`);
        return {
            open: open !== undefined ? open : true,
            inverseSort: props.viewSettings.get("myMarketsInvert", true),
            sortBy: props.viewSettings.get("myMarketsSort", "volume"),
            inputValue: ""
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.findMarketTab !== this.props.findMarketTab) {
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
            nextProps.marketStats !== this.props.marketStats ||
            nextProps.userMarkets !== this.props.userMarkets
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
        if (!this.props.findMarketTab) {
            let open = !this.state.open;
            this.setState({
                open: open
            });

            let setting = {};
            setting[`myMarketsBase_${this.props.index}`] = open;
            SettingsActions.changeViewSetting(setting);
        }
    }

    _onToggleUserMarket(market) {
        let [base, quote] = market.split("_");
        let newValue = !this.props.userMarkets.get(market);
        SettingsActions.setUserMarket(base, quote, newValue);
    }

    render() {
        let {
            columns,
            markets,
            base,
            marketStats,
            starredMarkets,
            current,
            findMarketTab
        } = this.props;
        let {sortBy, inverseSort, open} = this.state;

        if (!markets || !markets.length) {
            return null;
        }

        let headers = columns.map(header => {
            switch (header.name) {
                case "market":
                    return (
                        <th
                            key={header.name}
                            className="clickable"
                            onClick={this._changeSort.bind(this, "name")}
                        >
                            <Translate content="exchange.market" />
                        </th>
                    );

                case "vol":
                    return (
                        <th
                            key={header.name}
                            className="clickable"
                            onClick={this._changeSort.bind(this, "volume")}
                            style={{textAlign: "right"}}
                        >
                            <Translate content="exchange.vol_short" />
                        </th>
                    );

                case "price":
                    return (
                        <th key={header.name} style={{textAlign: "right"}}>
                            <Translate content="exchange.price" />
                        </th>
                    );

                case "quoteSupply":
                    return (
                        <th key={header.name}>
                            <Translate content="exchange.quote_supply" />
                        </th>
                    );

                case "baseSupply":
                    return (
                        <th key={header.name}>
                            <Translate content="exchange.base_supply" />
                        </th>
                    );

                case "change":
                    return (
                        <th
                            key={header.name}
                            className="clickable"
                            onClick={this._changeSort.bind(this, "change")}
                            style={{textAlign: "right"}}
                        >
                            <Translate content="exchange.change" />
                        </th>
                    );

                case "issuer":
                    return (
                        <th key={header.name}>
                            <Translate content="explorer.assets.issuer" />
                        </th>
                    );

                case "add":
                    return (
                        <th key={header.name} style={{textAlign: "right"}}>
                            <Translate content="account.perm.confirm_add" />
                        </th>
                    );

                default:
                    return <th key={header.name} />;
            }
        });

        let index = 0;

        let marketRows = markets
            .map(market => {
                return (
                    <MarketRow
                        key={market.id}
                        name={
                            base === "others" ? (
                                <span>
                                    <AssetName name={market.quote} />:<AssetName
                                        name={market.base}
                                    />
                                </span>
                            ) : (
                                <AssetName
                                    dataPlace="left"
                                    name={market.quote}
                                />
                            )
                        }
                        quote={market.quote}
                        base={market.base}
                        columns={columns}
                        leftAlign={true}
                        compact={true}
                        noSymbols={true}
                        stats={marketStats.get(market.id)}
                        starred={starredMarkets.has(market.id)}
                        current={current === market.id}
                        isChecked={this.props.userMarkets.has(market.id)}
                        isDefault={
                            this.props.defaultMarkets &&
                            this.props.defaultMarkets.has(market.id)
                        }
                        onCheckMarket={this._onToggleUserMarket.bind(this)}
                    />
                );
            })
            .filter(a => {
                return a !== null;
            })
            .sort((a, b) => {
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
                                return inverseSort ? 1 : -1;
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
            });

        let caret = open ? <span>&#9660;</span> : <span>&#9650;</span>;

        return (
            <div style={{paddingRight: 10}}>
                {open ? (
                    <table className="table table-hover text-right">
                        <thead>
                            <tr>{headers}</tr>
                        </thead>
                        {marketRows && marketRows.length ? (
                            <tbody>{marketRows}</tbody>
                        ) : null}
                    </table>
                ) : null}
            </div>
        );
    }
}

class MyMarkets extends React.Component {
    static propTypes = {
        core: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        activeTab: "my-market",
        core: "1.3.0",
        setMinWidth: false
    };

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    };

    constructor(props) {
        super();

        // let inputValue = null; // props.viewSettings.get("marketLookupInput", null);
        // let symbols = inputValue ? inputValue.split(":") : [null];
        // let quote = symbols[0];
        // let base = symbols.length === 2 ? symbols[1] : null;

        this.state = {
            inverseSort: props.viewSettings.get("myMarketsInvert", true),
            sortBy: props.viewSettings.get("myMarketsSort", "volume"),
            activeTab: props.viewSettings.get("favMarketTab", "my-market"),
            activeMarketTab: props.viewSettings.get("activeMarketTab", 0),
            lookupQuote: null,
            lookupBase: null,
            inputValue: "",
            minWidth: "100%",
            findBaseInput: "USD",
            activeFindBase: "USD"
        };

        this._setMinWidth = this._setMinWidth.bind(this);
        this.getAssetList = debounce(AssetActions.getAssetList.defer, 150);
    }

    shouldComponentUpdate(nextProps, nextState) {
        /* Trigger a lookup when switching tabs to find-market */
        if (
            this.state.activeTab !== "find-market" &&
            nextState.activeTab === "find-market" &&
            !nextProps.searchAssets.size
        ) {
            this._lookupAssets("OPEN.", true);
        }

        return (
            !Immutable.is(nextProps.searchAssets, this.props.searchAssets) ||
            !Immutable.is(nextProps.markets, this.props.markets) ||
            !Immutable.is(
                nextProps.starredMarkets,
                this.props.starredMarkets
            ) ||
            !Immutable.is(
                nextProps.defaultMarkets,
                this.props.defaultMarkets
            ) ||
            !Immutable.is(nextProps.marketStats, this.props.marketStats) ||
            !utils.are_equal_shallow(nextState, this.state) ||
            nextProps.current !== this.props.current ||
            nextProps.minWidth !== this.props.minWidth ||
            nextProps.listHeight !== this.props.listHeight ||
            nextProps.preferredBases !== this.props.preferredBases ||
            nextProps.onlyStars !== this.props.onlyStars ||
            nextProps.assetsLoading !== this.props.assetsLoading ||
            nextProps.userMarkets !== this.props.userMarkets
        );
    }

    componentWillMount() {
        if (this.props.setMinWidth) {
            window.addEventListener("resize", this._setMinWidth, {
                capture: false,
                passive: true
            });
        }

        if (this.props.currrent) {
            const currentBase = this.props.current.split("_")[1];
            const currentIndex = this.props.preferredBases.findIndex(
                a => a === currentBase
            );
            if (
                currentIndex !== -1 &&
                currentIndex !== this.state.activeMarketTab
            ) {
                this.setState({activeMarketTab: currentIndex});
            }
        }
    }

    componentDidMount() {
        let historyContainer = this.refs.favorites;
        Ps.initialize(historyContainer);

        this._setMinWidth();

        if (this.state.activeTab === "find-market") {
            this._lookupAssets("OPEN.", true);
        }
    }

    componetWillUnmount() {
        if (this.props.setMinWidth) {
            window.removeEventListener("resize", this._setMinWidth);
        }
    }

    _setMinWidth() {
        if (
            this.props.setMinWidth &&
            this.refs.favorites &&
            this.props.activeTab === "my-market"
        ) {
            if (this.state.minWidth !== this.refs.favorites.offsetWidth) {
                this.setState({
                    minWidth: this.refs.favorites.offsetWidth
                });
            }
        }
    }

    componentDidUpdate() {
        if (this.refs.favorites) {
            let historyContainer = this.refs.favorites;
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
        this.context.router.push("/markets");
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

    _onInputName(e) {
        let inputValue = e.target.value.trim().toUpperCase();
        let isValidName = !ChainValidation.is_valid_symbol_error(
            inputValue,
            true
        );

        this.setState({
            inputValue
        });

        /* Don't lookup invalid asset names */
        if (inputValue && inputValue.length >= 3 && !isValidName) {
            return this.setState({
                assetNameError: true
            });
        } else {
            this.setState({
                assetNameError: false
            });
        }
        this._lookupAssets(inputValue);
    }

    _lookupAssets(value, force = false) {
        // console.log("__lookupAssets", value, force);
        if (!value && value !== "") {
            return;
        }
        let now = new Date();

        let symbols = value.toUpperCase().split(":");
        let quote = symbols[0];
        let base = symbols.length === 2 ? symbols[1] : null;

        this.setState({
            lookupQuote: quote,
            lookupBase: base
        });

        SettingsActions.changeViewSetting.defer({
            marketLookupInput: value.toUpperCase()
        });

        if (this.state.lookupQuote !== quote || force) {
            if (quote.length < 1 || now - lastLookup <= 250) {
                return false;
            }
            this.getAssetList(quote, 50);
        } else {
            if (base && this.state.lookupBase !== base) {
                if (base.length < 1 || now - lastLookup <= 250) {
                    return false;
                }
                this.getAssetList(base, 50);
            }
        }
    }

    toggleActiveMarketTab(index) {
        SettingsActions.changeViewSetting({
            activeMarketTab: index
        });

        this.setState({
            activeMarketTab: index
        });
    }

    _onInputBaseAsset(asset) {
        this.setState({
            findBaseInput: asset.toUpperCase(),
            error: null
        });
    }

    _onFoundBaseAsset(asset) {
        if (asset) {
            this.setState({activeFindBase: asset.get("symbol")});
        }
    }

    clearInput = e => {
        this.setState({myMarketFilter: ""});
    };

    handleSearchUpdate = e => {
        this.setState({
            myMarketFilter: e.target.value && e.target.value.toUpperCase()
        });
    };

    render() {
        let {
            starredMarkets,
            defaultMarkets,
            marketStats,
            columns,
            searchAssets,
            assetsLoading,
            preferredBases,
            core,
            current,
            viewSettings,
            listHeight,
            onlyStars,
            userMarkets
        } = this.props;
        let {activeMarketTab, activeTab, lookupQuote, lookupBase} = this.state;
        let otherMarkets = <tr />;
        const myMarketTab = activeTab === "my-market";

        let defaultBases = preferredBases.map(a => a);

        if (!myMarketTab) {
            preferredBases = preferredBases.clear();
            preferredBases = preferredBases.push(this.state.activeFindBase);
        }

        // Add some default base options
        // let preferredBases = [coreSymbol, "BTC", "USD", "CNY"];
        let baseGroups = {};

        let bases = [
            // coreSymbol, "BTC", "CNY", "USD"
        ];

        /* By default, show the OPEN.X assets */
        if (!lookupQuote) lookupQuote = "OPEN.";

        /* In the find-market tab, only use market tab 0 */
        if (!myMarketTab) activeMarketTab = 0;

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
                    if (
                        asset.symbol.length >= lookupQuote.length &&
                        asset.symbol.length < lookupQuote.length + 3
                    ) {
                        bases.push(asset.symbol);
                    }
                }
            });

        bases = bases.concat(
            preferredBases
                .filter(a => {
                    if (!lookupBase || !lookupBase.length) {
                        return true;
                    }
                    return a.indexOf(lookupBase) === 0;
                })
                .toArray()
        );

        bases = bases.filter(base => {
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
                    try {
                        if (a.options.description) {
                            let description = JSON.parse(a.options.description);
                            if ("visible" in description) {
                                if (!description.visible) return false;
                            }
                        }
                    } catch (e) {}

                    return (
                        a.symbol.indexOf(lookupQuote) !== -1 &&
                        a.symbol.length >= lookupQuote.length
                    );
                })
                .forEach(asset => {
                    bases.forEach(base => {
                        let marketID = asset.symbol + "_" + base;

                        if (base !== asset.symbol) {
                            allMarkets.push([
                                marketID,
                                {quote: asset.symbol, base: base}
                            ]);
                        }
                    });
                });
        }

        allMarkets = allMarkets.filter(a => {
            // If a base asset is specified, limit the quote asset to the exact search term
            if (lookupBase) {
                return a[1].quote === lookupQuote;
            }
            return true;
        });

        allMarkets = Immutable.Map(allMarkets);
        let activeMarkets = myMarketTab ? defaultMarkets : allMarkets;
        if (myMarketTab && userMarkets.size) {
            userMarkets.forEach((market, key) => {
                activeMarkets = activeMarkets.set(key, market);
            });
        }

        if (activeMarkets.size > 0) {
            otherMarkets = activeMarkets
                .filter(a => {
                    if (!myMarketTab) {
                        if (lookupQuote.length < 1) {
                            return false;
                        }

                        return a.quote.indexOf(lookupQuote) !== -1;
                    } else {
                        const ID = a.quote + "_" + a.base;
                        if (!!this.state.myMarketFilter) {
                            return ID.indexOf(this.state.myMarketFilter) !== -1;
                        }
                        if (onlyStars && !starredMarkets.has(ID)) {
                            return false;
                        }
                        return true;
                    }
                })
                .map(market => {
                    let marketID = market.quote + "_" + market.base;
                    if (preferredBases.includes(market.base)) {
                        if (!baseGroups[market.base]) {
                            baseGroups[market.base] = [];
                        }
                        baseGroups[market.base].push({
                            id: marketID,
                            quote: market.quote,
                            base: market.base
                        });
                        return null;
                    } else {
                        return {
                            id: marketID,
                            quote: market.quote,
                            base: market.base
                        };
                    }
                })
                .filter(a => {
                    return a !== null;
                })
                .take(myMarketTab ? 100 : 20)
                .toArray();
        }

        const hasOthers = otherMarkets && otherMarkets.length;

        let hc = "mymarkets-header clickable";
        let starClass = cnames(hc, {inactive: !myMarketTab});
        let allClass = cnames(hc, {inactive: myMarketTab});

        let listStyle = {
            minWidth: this.state.minWidth,
            minHeight: "6rem"
        };
        if (listHeight) {
            listStyle.height = listHeight;
        }

        const translator = require("counterpart");

        return (
            <div className={this.props.className} style={this.props.style}>
                <div
                    style={this.props.headerStyle}
                    className="grid-block shrink left-orderbook-header bottom-header"
                >
                    <div
                        ref="myMarkets"
                        className={starClass}
                        onClick={this._changeTab.bind(this, "my-market")}
                        data-intro={translator.translate(
                            "walkthrough.my_markets_tab"
                        )}
                    >
                        <Translate content="exchange.market_name" />
                    </div>
                    <div
                        className={allClass}
                        onClick={this._changeTab.bind(this, "find-market")}
                        data-intro={translator.translate(
                            "walkthrough.find_markets_tab"
                        )}
                    >
                        <Translate content="exchange.more" />
                    </div>
                </div>

                {this.props.controls ? (
                    <div
                        className="small-12 medium-6"
                        style={{padding: "1rem 0"}}
                    >
                        {this.props.controls ? (
                            <div style={{paddingBottom: "0.5rem"}}>
                                {this.props.controls}
                            </div>
                        ) : null}
                        {/* {!myMarketTab ? <input type="text" value={this.state.inputValue} onChange={this._lookupAssets.bind(this)} placeholder="SYMBOL:SYMBOL" /> : null} */}
                    </div>
                ) : null}

                {myMarketTab ? (
                    <div
                        className="grid-block shrink"
                        style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "0.75rem 0.5rem"
                        }}
                    >
                        <label style={{margin: "3px 0 0"}}>
                            <input
                                style={{position: "relative", top: 3}}
                                className="no-margin"
                                type="checkbox"
                                checked={this.props.onlyStars}
                                onChange={() => {
                                    MarketsActions.toggleStars();
                                }}
                            />
                            <span style={{paddingLeft: "0.4rem"}}>
                                <TranslateWithLinks
                                    string="exchange.show_only_star_formatter"
                                    keys={[
                                        {
                                            type: "icon",
                                            value: "fi-star",
                                            className: "gold-star",
                                            arg: "star_icon"
                                        }
                                    ]}
                                />
                            </span>
                        </label>
                        <div
                            className="float-right search-wrapper"
                            style={{paddingLeft: 20}}
                        >
                            <form>
                                <input
                                    autoComplete="off"
                                    style={{
                                        fontSize: "0.9rem",
                                        height: "inherit",
                                        position: "relative",
                                        top: 1,
                                        padding: 2
                                    }}
                                    type="text"
                                    className="no-margin market-filter-input"
                                    placeholder={counterpart.translate(
                                        "exchange.filter"
                                    )}
                                    maxLength="16"
                                    name="focus"
                                    required="required"
                                    value={this.state.myMarketFilter}
                                    onChange={this.handleSearchUpdate}
                                />
                                <button
                                    className="clear-text"
                                    type="reset"
                                    onClick={this.clearInput}
                                />
                            </form>
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "0.75rem 0.5rem"
                        }}
                    >
                        <table>
                            <tbody>
                                <tr style={{width: "100%"}}>
                                    <td>
                                        <AssetSelector
                                            onAssetSelect={this._onFoundBaseAsset.bind(
                                                this
                                            )}
                                            assets={defaultBases}
                                            onChange={this._onInputBaseAsset.bind(
                                                this
                                            )}
                                            asset={this.state.findBaseInput}
                                            assetInput={
                                                this.state.findBaseInput
                                            }
                                            tabIndex={1}
                                            style={{
                                                width: "100%",
                                                paddingBottom: "1.5rem"
                                            }}
                                            onFound={this._onFoundBaseAsset.bind(
                                                this
                                            )}
                                            label="exchange.quote"
                                            noLabel
                                            inputStyle={{fontSize: "0.9rem"}}
                                        />
                                    </td>
                                </tr>
                                <tr style={{width: "100%"}}>
                                    <td>
                                        <label>
                                            <Translate content="account.user_issued_assets.name" />:
                                        </label>
                                        <input
                                            style={{
                                                fontSize: "0.9rem",
                                                position: "relative",
                                                top: 1
                                            }}
                                            type="text"
                                            value={this.state.inputValue}
                                            onChange={this._onInputName.bind(
                                                this
                                            )}
                                            placeholder={counterpart.translate(
                                                "exchange.search"
                                            )}
                                            maxLength="16"
                                            tabIndex={2}
                                        />
                                        {this.state.assetNameError ? (
                                            <div
                                                className="error-area"
                                                style={{paddingTop: 10}}
                                            >
                                                <span
                                                    style={{
                                                        wordBreak: "break-all"
                                                    }}
                                                >
                                                    <Translate
                                                        content="explorer.asset.invalid"
                                                        name={
                                                            this.state
                                                                .inputValue
                                                        }
                                                    />
                                                </span>
                                            </div>
                                        ) : null}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                <ul className="mymarkets-tabs">
                    {preferredBases.map((base, index) => {
                        if (!base) return null;
                        return (
                            <li
                                key={base}
                                onClick={this.toggleActiveMarketTab.bind(
                                    this,
                                    index
                                )}
                                className={cnames("mymarkets-tab", {
                                    active: activeMarketTab === index
                                })}
                            >
                                <AssetName name={base} dataPlace="left" />
                            </li>
                        );
                    })}
                    {myMarketTab && hasOthers ? (
                        <li
                            key={"others"}
                            style={{textTransform: "uppercase"}}
                            onClick={this.toggleActiveMarketTab.bind(
                                this,
                                preferredBases.size + 1
                            )}
                            className={cnames("mymarkets-tab", {
                                active:
                                    activeMarketTab === preferredBases.size + 1
                            })}
                        >
                            <Translate content="exchange.others" />
                        </li>
                    ) : null}
                </ul>

                <div
                    style={listStyle}
                    className="table-container grid-block vertical mymarkets-list"
                    ref="favorites"
                >
                    {assetsLoading ? (
                        <div
                            style={{
                                position: "absolute",
                                paddingTop: "3rem",
                                textAlign: "center",
                                width: "100%"
                            }}
                        >
                            <LoadingIndicator type="three-bounce" />
                        </div>
                    ) : null}
                    {preferredBases
                        .filter(a => {
                            return a === preferredBases.get(activeMarketTab);
                        })
                        .map((base, index) => {
                            return (
                                <MarketGroup
                                    userMarkets={this.props.userMarkets}
                                    defaultMarkets={this.props.defaultMarkets}
                                    index={index}
                                    allowChange={false}
                                    key={base}
                                    current={current}
                                    starredMarkets={starredMarkets}
                                    marketStats={marketStats}
                                    viewSettings={viewSettings}
                                    columns={
                                        myMarketTab
                                            ? columns
                                            : this.props.findColumns || columns
                                    }
                                    markets={baseGroups[base]}
                                    base={base}
                                    maxRows={myMarketTab ? 20 : 10}
                                    findMarketTab={!myMarketTab}
                                />
                            );
                        })}
                    {activeMarketTab === preferredBases.size + 1 &&
                    myMarketTab &&
                    hasOthers ? (
                        <MarketGroup
                            userMarkets={this.props.userMarkets}
                            index={preferredBases.size}
                            current={current}
                            starredMarkets={starredMarkets}
                            marketStats={marketStats}
                            viewSettings={viewSettings}
                            columns={columns}
                            markets={otherMarkets}
                            base="others"
                            maxRows={myMarketTab ? 20 : 10}
                            findMarketTab={!myMarketTab}
                        />
                    ) : null}
                </div>
            </div>
        );
    }
}
MyMarkets = BindToChainState(MyMarkets);

class MyMarketsWrapper extends React.Component {
    render() {
        return <MyMarkets {...this.props} />;
    }
}

export default connect(MyMarketsWrapper, {
    listenTo() {
        return [SettingsStore, MarketsStore, AssetStore];
    },
    getProps() {
        return {
            starredMarkets: SettingsStore.getState().starredMarkets,
            defaultMarkets: SettingsStore.getState().defaultMarkets,
            viewSettings: SettingsStore.getState().viewSettings,
            preferredBases: SettingsStore.getState().preferredBases,
            marketStats: MarketsStore.getState().allMarketStats,
            userMarkets: SettingsStore.getState().userMarkets,
            searchAssets: AssetStore.getState().assets,
            onlyStars: MarketsStore.getState().onlyStars,
            assetsLoading: AssetStore.getState().assetsLoading
        };
    }
});
