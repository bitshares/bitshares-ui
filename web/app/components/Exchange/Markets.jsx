import React from "react";
import {PropTypes} from "react";
import MarketCard from "./MarketCard";
import MarketsActions from "actions/MarketsActions";
import Translate from "react-translate-component";
import {Link} from "react-router";
import AssetActions from "actions/AssetActions";
import SettingsActions from "actions/SettingsActions";
import ChainStore from "api/ChainStore";

class Markets extends React.Component {

    constructor() {
        super();
        this.state = {
            filterMarket: "",
            searchTerm: "",
            assetsFetched: 0
        };
    }

    componentDidMount() {
      this._checkAssets(this.props.assets, true);
    }

    _checkAssets(assets, force) {

      let lastAsset = assets.sort((a, b) => {
          if (a.symbol > b.symbol) {
              return 1;
          } else if (a.symbol < b.symbol) {
              return -1;
          } else {
              return 0;
          }
      }).last();

      // console.log("assets.size:", assets.size, "assetsFetched:", this.state.assetsFetched);
      
      if (assets.size === 0 || force) {
          AssetActions.getAssetList("A", 100);
          this.setState({assetsFetched: 100});  
      } else if (assets.size >= this.state.assetsFetched) {
          // console.log("assets.last():", lastAsset.symbol);
          AssetActions.getAssetList(lastAsset.symbol, 100);           
          this.setState({assetsFetched: this.state.assetsFetched + 99}); 
      }
    }

    componentWillReceiveProps(nextProps) {
      this._checkAssets(nextProps.assets);
    }

    _onChangeBase(e) {
        let base = this.props.assets.get(e.target[e.target.selectedIndex].id);
        MarketsActions.changeBase({id: base.id, symbol: base.symbol, precision: base.precision});
    }

    _onFilterInput(e) {
        this.setState({filterMarket: e.target.value});
    }

    _onSearchInput(e) {
        this.setState({searchTerm: e.target.value});
    }

    _addMarket(quote, base) {
        MarketsActions.addMarket(quote, base);
        SettingsActions.addMarket(quote, base); // we can't listen to MarketsActions in SettingsStore due to circular dependencies
    }

    _removeMarket(quote, base) {
        MarketsActions.removeMarket(quote, base);
        SettingsActions.removeMarket(quote, base); // we can't listen to MarketsActions in SettingsStore due to circular dependencies
    }

    _isPreferred(quote, base) {
        let defaultMarkets = this.props.settings.get("defaultMarkets");
        for (var i = 0; i < defaultMarkets.length; i++) {
            if (defaultMarkets[i].quote === quote && defaultMarkets[i].base === base) {
                return true;
            }
        }
        return false;
    }

    render() {
        let {assets, baseAsset} = this.props;
        let defaultMarkets = this.props.settings.get("defaultMarkets");
        let {searchTerm, filterMarket, } = this.state;

        let marketSearch = null;
        if (searchTerm.length > 0) {

            marketSearch = assets
            .filter(a => {
                return a.symbol.indexOf(searchTerm.toUpperCase()) !== -1;
            }) 
            .map(a => {
                if (a.symbol !== baseAsset.symbol) {
                    let marketID = a.symbol + "_" + baseAsset.symbol;
                    let marketName = a.symbol + "/" + baseAsset.symbol;
                    let isPreferred = this._isPreferred(a.id, baseAsset.id);
                    return (
                        <tr key={marketID + "_search"}>
                            <td><Link to="exchange" params={{marketID: marketID}}>{marketName}</Link></td>
                            {isPreferred ?
                                <td className="clickable" onClick={this._removeMarket.bind(this, a.id, baseAsset.id)}>-</td> :
                                <td className="clickable" onClick={this._addMarket.bind(this, a.id, baseAsset.id)}>+</td>
                            }
                        </tr>
                    );
                }
            }).filter(a => {
                return a !== undefined;
            }).toArray();   
        }

        let preferredMarkets = defaultMarkets
            //.filter(a => {
            //    let asset = ChainStore.getAsset(a.quote);
            //    if (!asset) {
            //        return null;
            //    }
            //    return asset.get("symbol").indexOf(filterMarket.toUpperCase()) !== -1;
            //})
            .sort((a, b) => {
                let a_asset = ChainStore.getAsset(a.quote);
                let b_asset = ChainStore.getAsset(b.quote);
                if (!a_asset || !b_asset) {
                    return 0;
                }
                if (a_asset.get("symbol") > b_asset.get("symbol")) {
                    return 1;
                } else if (a_asset.get("symbol") < b_asset.get("symbol")) {
                    return -1;
                } else {
                    return 0;
                }
            })
            .map(market => {
                return (
                    <MarketCard
                        key={"pref_" + market.quote + "__" + market.base}
                        quote={market.quote}
                        base={market.base}
                        removeMarket={this._removeMarket.bind(market, market.quote, market.base)}
                        />
                );
        });

        let baseOptions = assets.map(a => {
            return <option key={a.symbol} id={a.id}>{a.symbol}</option>;
        }).sort((a, b) => {
            if (a.key > b.key) {
                return 1;
            } else if (a.key < b.key) {
                return -1;
            } else {
                return 0;
            }
        }).toArray();

        return (
            <div className="grid-block page-layout">
                <div className="grid-block left-column-2 small-5 medium-3" style={{minWidth: "20rem"}}>
                    <div className="grid-content">
                        <h2>Market search</h2>
                        <div className="grid-content">
                            <section className="block-list" style={{marginLeft: 0, marginRight: 0}}>
                                <header><Translate content="markets.choose_base" />:</header>
                                    <ul>
                                        <li className="with-dropdown">
                                        <select style={{lineHeight: "1.2em"}} value={baseAsset.symbol} onChange={this._onChangeBase.bind(this)}>
                                            {baseOptions}
                                        </select>
                                        </li>
                                    </ul>
                            </section>
                            <h5><Translate content="markets.search" />:</h5>
                            <input type="text" value={this.state.searchTerm} onChange={this._onSearchInput.bind(this)}></input>
                            <table className="table table-hover">
                                <tbody>
                                    {marketSearch}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="grid-block small-7 medium-9 flex-start" style={{overflowY: "auto", zIndex: 1}}>
                    <div className="grid-block vertical">
                        <h2>My Preferred Markets:</h2>
                        {/* preferred markets search is temporary disabled
                         <div className="small-12 medium-5">
                            <h5><Translate content="markets.filter" />:</h5>
                            <input type="text" value={this.state.filterMarket} onChange={this._onFilterInput.bind(this)}></input>
                        </div>*/}
                        <div className="grid-block small-up-1 medium-up-2 large-up-3">
                            {preferredMarkets}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

Markets.defaultProps = {
    assets: {},
    settings: {},
    markets: {}
};

Markets.propTypes = {
    assets: PropTypes.object.isRequired,
    settings: PropTypes.object.isRequired,
    markets: PropTypes.object
};

export default Markets;
