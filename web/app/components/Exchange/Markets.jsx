import React from "react";
import MarketCard from "./MarketCard";
import MarketRow from "./MarketRow";
import Translate from "react-translate-component";
import {Link} from "react-router";
import SettingsActions from "actions/SettingsActions";
import MarketsActions from "actions/MarketsActions";
import Immutable from "immutable";
import AssetActions from "actions/AssetActions";
import _ from "lodash";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import LoadingIndicator from "../LoadingIndicator";

@BindToChainState()
class PreferredMarketsList extends React.Component {

    static propTypes = {
        assets: ChainTypes.ChainAssetsList.isRequired
    }

    constructor(props) {
        super();

        this.state = {
            filter: props.viewSettings.get("favMarketFilter"),
            marketsCardView: props.viewSettings.get("marketsCardView"),
            sortBy: props.viewSettings.get("marketsSortBy")
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.markets, this.props.markets) ||
            !Immutable.is(nextProps.assets, this.props.assets) ||
            nextState.filter !== this.state.filter ||
            nextState.marketsCardView !== this.state.marketsCardView ||
            nextState.sortBy !== this.state.sortBy
        );
    }

    _onFilterMarkets(e) {
        SettingsActions.changeViewSetting({favMarketFilter: e.target.value.toUpperCase()});
        this.setState({filter: e.target.value.toUpperCase()});
    }

    _toggleView() {
        SettingsActions.changeViewSetting({
            marketsCardView: !this.state.marketsCardView
        });

        this.setState({
            marketsCardView: !this.state.marketsCardView
        });
    }

    _setSort(field) {
        SettingsActions.changeViewSetting({marketsSortBy: field});
        this.setState({
          sortBy: field,
          inverseSort: field === this.state.sortBy ? !this.state.inverseSort : this.state.inverseSort
        });
    }

    render() {
        let {sortBy, inverseSort} = this.state;
        let assets = {};
        let resolvedCount = 0;
        this.props.assets.forEach(asset => {
            if (asset && asset.toJS()) {
                assets[asset.get("symbol")] = asset;
                resolvedCount++;
            }
        });

        let {  markets } = this.props;
        let { filter, marketsCardView } = this.state;
        let preferredMarkets = markets
            .sort((a, b) => {

                switch (sortBy) {
                    case 'name':
                        if (a.quote > b.quote) {
                            return inverseSort ? 1 : -1;
                        } else if (a.quote < b.quote) {
                            return inverseSort ? -1 : 1;
                        } else {
                            return 0;
                        }
                        break;

                    default:
                        return 0;
                }

            })
            .map(market => {
                if (marketsCardView) {
                    return (
                        <MarketCard
                            key={market.quote + "_" + market.base}
                            quote={market.quote}
                            base={market.base}
                            removeMarket={this.props.removeMarket.bind(market, market.quote, market.base)}
                        />
                    );
            } else {
                if (assets[market.quote] && assets[market.base]) {
                    return (
                            <MarketRow
                                key={market.quote + "_" + market.base}
                                quote={market.quote}
                                base={market.base}
                                removeMarket={this.props.removeMarket.bind(market, market.quote, market.base)}
                            />
                        );
                    } else {
                        return null;
                }
            }
            })
            .filter((a) => {
                if (!a || !a.key) {
                    return false;
                }
                if (!filter) {
                    return true;
                }
                return a.key.indexOf(filter.toUpperCase()) !== -1;
            })
            .toArray();

        if (!marketsCardView) {
            return (
                <div className="grid-block vertical">
                    <h2><Translate content="markets.preferred" />:</h2>
                    <div className="grid-block">
                        <div className="small-12 medium-6">
                            <h5><Translate content="markets.filter" />:</h5>
                            <input type="text" value={this.state.filter} onChange={this._onFilterMarkets.bind(this)}></input>
                        </div>
                        <span className="view-switcher small-12 medium-6 no-padding">
                            <span className="button outline" onClick={this._toggleView.bind(this)}>{!marketsCardView ? <Translate content="explorer.witnesses.card"/> : <Translate content="explorer.witnesses.table"/>}</span>
                        </span>
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="clickable" onClick={this._setSort.bind(this, 'name')}><Translate content="exchange.market_name" /></th>
                                <th><Translate content="exchange.price" /></th>
                                <th><Translate content="exchange.quote_supply" /></th>
                                <th><Translate content="exchange.base_supply" /></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {preferredMarkets}
                        </tbody>
                    </table>
                    {resolvedCount !== this.props.assets.length - 1 ? <LoadingIndicator /> : null}
                </div>
            );
        } else {
            return (
                <div className="grid-block vertical">
                    <h2><Translate content="markets.preferred" />:</h2>
                    <div className="grid-block">
                        <div className="small-12 medium-6">
                            <h5><Translate content="markets.filter" />:</h5>
                            <input type="text" value={this.state.filter} onChange={this._onFilterMarkets.bind(this)}></input>
                        </div>
                        <div className="view-switcher small-12 medium-6 no-padding">
                            <span className="button outline" onClick={this._toggleView.bind(this)}>{!marketsCardView ? <Translate content="explorer.witnesses.card"/> : <Translate content="explorer.witnesses.table"/>}</span>
                        </div>
                    </div>
                    <div className="grid-block small-up-1 medium-up-2 large-up-3" style={{minHeight: "20rem"}}>
                        {preferredMarkets}
                    </div>
                </div>
            );
        }
    }
}

class MarketSelector extends React.Component {
    constructor(props) {
        super();
        this.state = {
            searchTerms: {
                baseSearch: props.viewSettings.get("baseSearch"),
                quoteSearch: props.viewSettings.get("quoteSearch")
            },
            showSearch: {
                baseSearch: props.viewSettings.get("showSearch_baseSearch"),
                quoteSearch: props.viewSettings.get("showSearch_quoteSearch")
            }
        }

        this._assetLookup = _.debounce(this._assetLookup, 150);
    }

    _assetLookup(symbol, type) {

        AssetActions.lookupAsset(symbol, type);
        let newState = {showSearch: {}};
        for (let term in this.state.searchTerms) {
            if (term === type) {
                newState.showSearch[term] = true;
                SettingsActions.changeViewSetting({["showSearch_" + term]: true});
            } else {
                SettingsActions.changeViewSetting({["showSearch_" + term]: false});
                newState.showSearch[term] = false;
            }
        }

        this.setState(newState);
    }

    _onLookupAsset(type, e) {
        let newState = {searchTerms: {}};

        for (let term in this.state.searchTerms) {
            if (term === type) {
                newState.searchTerms[term] = e.target.value.toUpperCase();
                SettingsActions.changeViewSetting({[term]: e.target.value.toUpperCase()});
            } else {
                newState.searchTerms[term] = this.state.searchTerms[term];
            }
        }

        this.setState(newState);
        this._assetLookup(e.target.value.toUpperCase(), type);
    }

    _onChangeBase(base) {
        MarketsActions.changeBase(base);
    }

    _addMarket(quote, base) {
        SettingsActions.addMarket(quote, base);
    }

    _isPreferred(quote, base) {
        let marketID = quote + "_" + base;
        return this.props.markets.has(marketID);
    }

    render() {

        let { lookupResults, marketBase } = this.props;
        let { showSearch, searchTerms } = this.state;
        let results;
        if (showSearch.baseSearch) {
            results = lookupResults
            .filter(result => {
                if (!searchTerms.baseSearch || searchTerms.baseSearch === "") {
                    return false;
                }
                if (result) {
                    return result.get("symbol").indexOf(searchTerms.baseSearch) !== -1;
                }
            })
            .map(result => {
                if (result) {
                    return (
                        <tr>
                            <td className="clickable" style={{fontWeight: "bold", color: "#50D2C2"}} onClick={this._onChangeBase.bind(this, result.get("symbol"))}>{result.get("symbol")}</td>
                        </tr>
                    );
                }
            })
        }


        if (showSearch.quoteSearch) {

            results = lookupResults
            .filter(result => {
                if (!searchTerms.quoteSearch || searchTerms.quoteSearch === "") {
                    return false;
                }
                if (result) {
                    return result.get("symbol").indexOf(searchTerms.quoteSearch) !== -1;
                }
            })
            .map(a => {
                if (!a) {
                    return null;
                }
                if (a.get("symbol") !== marketBase) {
                    let marketID = a.get("symbol") + "_" + marketBase;
                    let marketName = a.get("symbol") + " : " + marketBase;
                    let isPreferred = this._isPreferred(a.get("symbol"), marketBase);
                    return (
                        <tr key={marketID + "_search"}>
                            <td><Link to="exchange" params={{marketID: marketID}}>{marketName}</Link></td>
                            {isPreferred ?
                                <td className="clickable" onClick={this.props.removeMarket.bind(this, a.get("symbol"), marketBase)}>-</td> :
                                <td className="clickable" onClick={this._addMarket.bind(this, a.get("symbol"), marketBase)}>+</td>
                            }
                        </tr>
                    );
                }
            });
        }

        return (
            <div className="grid-content">
                <h2><Translate content="markets.market_search" /></h2>
                <h4><Translate content="markets.base" />: <span style={{fontWeight: "bold"}}>{marketBase}</span></h4>
                <input
                    type="text"
                    value={searchTerms.baseSearch}
                    onChange={this._onLookupAsset.bind(this, "baseSearch")}
                    onClick={this._assetLookup.bind(this, searchTerms.baseSearch, "baseSearch")}
                />
                {showSearch.baseSearch ?
                    (<table className="table table-hover">
                        <tbody>
                            {results}
                        </tbody>
                    </table>) : null}
                <h4><Translate content="markets.search" />:</h4>
                <input
                    type="text"
                    value={searchTerms.quoteSearch}
                    onChange={this._onLookupAsset.bind(this, "quoteSearch")}
                    onClick={this._assetLookup.bind(this, searchTerms.quoteSearch, "quoteSearch")}
                />
                {showSearch.quoteSearch ?
                    (<table className="table table-hover">
                        <tbody>
                            {results}
                        </tbody>
                    </table>) : null}
            </div>
        )
    }
}

class Markets extends React.Component {

    _removeMarket(quote, base) {
        SettingsActions.removeMarket(quote, base);
    }

    render() {
        let {defaultMarkets} = this.props;
        let assets = [];

        defaultMarkets.forEach(market => {
            if (assets.indexOf(market.quote) === -1) {
                assets.push(market.quote);
            }
            if (assets.indexOf(market.base) === -1) {
                assets.push(market.base);
            }
        });

        return (
            <div className="grid-block page-layout">
                <div className="grid-block left-column-2 small-5 medium-3" style={{minWidth: "20rem"}}>
                    <MarketSelector
                        viewSettings={this.props.viewSettings}
                        lookupResults={this.props.lookupResults}
                        marketBase={this.props.marketBase}
                        removeMarket={this._removeMarket}
                        markets={defaultMarkets}
                    />
                </div>
                <div className="grid-block small-7 medium-9 flex-start" style={{overflowY: "auto", zIndex: 1}}>
                    <PreferredMarketsList
                        viewSettings={this.props.viewSettings}
                        markets={defaultMarkets}
                        assets={assets}
                        removeMarket={this._removeMarket}
                    />
                </div>
            </div>
        );
    }
}

export default Markets;
