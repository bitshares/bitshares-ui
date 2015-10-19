import React from "react";
import MarketCard from "./MarketCard";
import Translate from "react-translate-component";
import {Link} from "react-router";
import SettingsActions from "actions/SettingsActions";
import MarketsActions from "actions/MarketsActions";
import Immutable from "immutable";
import AssetActions from "actions/AssetActions";
import _ from "lodash";

class PreferredMarketsList extends React.Component {

    constructor(props) {
        super();

        this.state = {
            filter: props.viewSettings.get("favMarketFilter"),
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            true ||
            !Immutable.is(nextProps.markets, this.props.markets) ||
            nextState.filter !== this.state.filter
        );
    }

    _onFilterMarkets(e) {
        SettingsActions.changeViewSetting({favMarketFilter: e.target.value.toUpperCase()});
        this.setState({filter: e.target.value.toUpperCase()});
    }

    render() {
        let {  markets } = this.props;
        let { filter } = this.state;
        let preferredMarkets = markets
            .sort((a, b) => {
                if (a.quote > b.quote) {
                    return 1;
                } else if (a.quote < b.quote) {
                    return -1;
                } else {
                    return 0;
                }
            })
            .map(market => {
                return (
                    <MarketCard
                        key={market.quote + "_" + market.base}
                        quote={market.quote}
                        base={market.base}
                        removeMarket={this.props.removeMarket.bind(market, market.quote, market.base)}
                    />
                );
            })
            .filter((a) => {
                if (!filter) {
                    return true;
                }
                return a.key.indexOf(filter.toUpperCase()) !== -1;
            })
            .toArray();

        return (
            <div className="grid-block vertical">
                <h2><Translate content="markets.preferred" />:</h2>
                <div className="small-12 medium-5">
                    <h5><Translate content="markets.filter" />:</h5>
                    <input type="text" value={this.state.filter} onChange={this._onFilterMarkets.bind(this)}></input>
                </div>
                <div className="grid-block small-up-1 medium-up-2 large-up-3" style={{minHeight: "20rem"}}>
                    {preferredMarkets}
                </div>
            </div>
        );
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
                        removeMarket={this._removeMarket}
                    />
                </div>
            </div>
        );
    }
}

export default Markets;
