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
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import SettingsActions from "actions/SettingsActions";
import MarketsActions from "actions/MarketsActions";
import cnames from "classnames";
import Icon from "../Icon/Icon";

@BindToChainState()
class MyMarkets extends React.Component {

    static propTypes = {
        assets: ChainTypes.ChainAssetsList.isRequired
    };

    static defaultProps = {
        activeTab: "starred"
    };

    static contextTypes = {
        router: React.PropTypes.func.isRequired
    };

    constructor(props) {
        super();
        this.state = {
            inverseSort: props.viewSettings.get("myMarketsInvert"),
            sortBy: props.viewSettings.get("myMarketsSort"),
            activeTab: props.viewSettings.get("favMarketTab")
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.assets, this.props.assets) ||
            !Immutable.is(nextProps.markets, this.props.markets) ||
            !Immutable.is(nextProps.starredMarkets, this.props.starredMarkets) ||
            !Immutable.is(nextProps.marketStats, this.props.marketStats) ||
            nextState.inverseSort !== this.state.inverseSort ||
            nextState.sortBy !== this.state.sortBy ||
            nextState.activeTab !== this.state.activeTab
        );
    }

    componentDidMount() {
        let historyContainer = React.findDOMNode(this.refs.favorites);
        Ps.initialize(historyContainer);
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

    render() {
        let {markets, starredMarkets, marketStats} = this.props;
        let {inverseSort, activeTab, sortBy} = this.state;
        let marketRows = null;

        let columns = [
            {name: "star", index: 1},
            {name: "market", index: 2},
            {name: "vol", index: 3},
            {name: "price", index: 4},
            {name: "change", index: 5}
        ];

        let assets = {};
        this.props.assets.forEach(asset => {
            if (asset && asset.toJS()) {
                assets[asset.get("symbol")] = asset;
            }
        });

        let activeMarkets = activeTab === "starred" ? starredMarkets : markets;


        if (activeMarkets.size > 0) {
            marketRows = activeMarkets.map(market => {
                let marketID = market.quote + "_" + market.base;

                if (assets[market.quote] && assets[market.base]) {
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
                        />
                    );
                } else {
                    return null;
                }
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

            }).toArray();

        }

        // if (!marketRows.length || !marketRows) {
        //     return null;
        // }
        let hc = "mymarkets-header clickable";
        let starClass = cnames(hc, {inactive: activeTab === "all"});
        let allClass = cnames(hc, {inactive: activeTab === "starred"});

        return (
            <div className="left-order-book no-padding no-overflow">
                <div style={{padding: 0}} className="grid-block shrink left-orderbook-header bottom-header">
                    <div className={starClass} onClick={this._changeTab.bind(this, "starred")}>
                        <Icon className="gold-star title-star" name="fi-star"/><Translate content="exchange.market_name" />
                    </div>
                    <div className={allClass} onClick={this._changeTab.bind(this, "all")} >
                        <Translate content="exchange.more" />
                    </div>
                </div>
                <div className="table-container grid-content mymarkets-list" ref="favorites">
                    <table className="table table-hover text-right market-right-padding">
                        <thead>
                            <tr>
                                <th></th>
                                <th className="clickable" onClick={this._changeSort.bind(this, "name")}>MARKET</th>
                                <th className="clickable" onClick={this._changeSort.bind(this, "volume")}style={{textAlign: "right"}}>VOL</th>
                                <th style={{textAlign: "right"}}>PRICE</th>
                                <th className="clickable" onClick={this._changeSort.bind(this, "change")} style={{textAlign: "right"}}>CHANGE</th>
                            </tr>
                        </thead>
                        <tbody>
                        {
                            marketRows
                        }
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

@connectToStores
class MyMarketsWrapper extends React.Component {
    static getStores() {
        return [SettingsStore, MarketsStore]
    }

    static getPropsFromStores() {
        return {
            markets: SettingsStore.getState().defaultMarkets,
            starredMarkets: SettingsStore.getState().starredMarkets,
            viewSettings: SettingsStore.getState().viewSettings,
            marketStats: MarketsStore.getState().allMarketStats
        }
    }

    render () {
        let assets = [];

        this.props.markets.forEach(market => {
            if (assets.indexOf(market.quote) === -1) {
                assets.push(market.quote);
            }
            if (assets.indexOf(market.base) === -1) {
                assets.push(market.base);
            }
        });

        return (
            <MyMarkets
                {...this.props}
                assets={Immutable.List(assets)}
            />
        );
    }
}

export default MyMarketsWrapper;
