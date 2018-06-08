import {connect} from "alt-react";
import AssetStore from "stores/AssetStore";
import React from "react";
import MarketsActions from "actions/MarketsActions";
import {Link} from "react-router-dom";
import AssetName from "../Utility/AssetName";
import Icon from "../Icon/Icon";
import {debounce} from "lodash-es";
import {ChainStore} from "bitsharesjs/es";
import Translate from "react-translate-component";
import LoadingIndicator from "../LoadingIndicator";
import AssetActions from "actions/AssetActions";
import {ChainValidation} from "bitsharesjs/es";
import counterpart from "counterpart";
import utils from "common/utils";
import {hasGatewayPrefix} from "common/gatewayUtils";

class MarketPickerWrapper extends React.Component {
    constructor() {
        super();

        this.state = this.initialState();

        this.getAssetList = debounce(AssetActions.getAssetList.defer, 150);
    }

    initialState() {
        return {
            marketsList: "",
            issuersList: "",
            lookupQuote: null,
            allMarkets: "",
            allIssuers: "",
            inputValue: ""
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.marketPickerAsset !== this.props.marketPickerAsset)
            this.setState(this.initialState());

        if (nextProps.searchAssets !== this.props.searchAssets)
            this.assetFilter();
    }

    shouldComponentUpdate(np, ns) {
        return (
            np.marketPickerAsset !== this.props.marketPickerAsset ||
            np.searchAssets !== this.props.searchAssets ||
            ns.marketsList !== this.state.marketsList ||
            ns.issuersList !== this.state.issuersList ||
            !utils.are_equal_shallow(ns, this.state)
        );
    }

    _onSelectIssuer(e) {
        let filterByIssuerName = e.target.value == "0" ? null : e.target.value;
        this.assetFilter(filterByIssuerName);
    }

    _onInputName(getBackedAssets, e) {
        let toFind = e.target.value.trim().toUpperCase();
        let isValidName = !ChainValidation.is_valid_symbol_error(toFind, true);

        /* Don't lookup invalid asset names */
        if (toFind && toFind.length >= 3 && !isValidName) return;

        this.setState({
            inputValue: e.target.value.trim(),
            activeSearch: true,
            allMarkets: "",
            allIssuers: "",
            marketsList: "",
            issuersList: ""
        });

        if (this.state.inputValue !== toFind) {
            this.timer && clearTimeout(this.timer);
        }

        this.timer = setTimeout(() => {
            this._lookupAssets(toFind, getBackedAssets);
        }, 1500);
    }

    _lookupAssets(value, gatewayAssets = false) {
        if (!value && value !== "") return;

        let quote = value.toUpperCase();

        if (quote.length >= 3) this.getAssetList(quote, 10, gatewayAssets);

        this.setState({
            lookupQuote: quote
        });
    }

    _changeMarketPickerFilter(value) {
        this.setState({
            marketsList: "",
            issuersList: "",
            lookupQuote: null,
            allMarkets: "",
            allIssuers: "",
            inputValue: "",
            marketPickerTab: value,
            activeSearch: false
        });
    }

    _fetchIssuer(asset) {
        let issuer = ChainStore.getObject(asset.issuer, false, false);
        // Issuer may sometimes not resolve at first.
        // A waiter may be required here
        if (!issuer) {
            return;
        } else {
            return issuer;
        }
    }

    assetFilter(filterByIssuerName = null) {
        let {searchAssets, marketPickerAsset} = this.props;

        let {inputValue, lookupQuote, marketPickerTab} = this.state;

        this.setState({
            activeSearch: true
        });

        let assetCount = 0;
        let allMarkets = [];
        let allIssuers = [];

        let baseSymbol = this.props.baseAsset.get("symbol");
        let quoteSymbol = this.props.quoteAsset.get("symbol");

        if (searchAssets.size && !!inputValue && inputValue.length > 2) {
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

                    return a.symbol.indexOf(lookupQuote) !== -1;
                })
                .forEach(asset => {
                    if (assetCount > 100) return;
                    assetCount++;

                    let issuer = this._fetchIssuer(asset);

                    let base = this.props.baseAsset.get("symbol");
                    let marketID = asset.symbol + "_" + base;

                    let isQuoteAsset = quoteSymbol == marketPickerAsset;
                    let includeAsset =
                        (isQuoteAsset && asset.symbol != baseSymbol) ||
                        (!isQuoteAsset && asset.symbol != quoteSymbol);

                    if (
                        includeAsset &&
                        (!filterByIssuerName ||
                            filterByIssuerName == issuer.get("name")) &&
                        ((marketPickerTab == "search" &&
                            asset.symbol.startsWith(
                                inputValue.toUpperCase()
                            )) ||
                            (!marketPickerTab || marketPickerTab == "filter"))
                    ) {
                        allMarkets.push([
                            marketID,
                            {
                                quote: asset.symbol,
                                base: base,
                                issuer: !issuer ? null : issuer.get("name")
                            }
                        ]);
                    }
                    if (
                        includeAsset &&
                        issuer &&
                        !allIssuers.includes(issuer.get("name"))
                    )
                        allIssuers.push(issuer.get("name"));
                });
        }

        let marketsList = this.state.marketsList;
        let issuersList = this.state.issuersList;

        issuersList = !allIssuers
            ? null
            : allIssuers
                  .sort((a, b) => {
                      if (a > b) {
                          return 1;
                      } else if (a < b) {
                          return -1;
                      } else {
                          return 0;
                      }
                  })
                  .map(issuer => {
                      return (
                          <option key={issuer} value={issuer}>
                              {issuer}
                          </option>
                      );
                  });

        marketsList = !allMarkets
            ? null
            : allMarkets
                  .sort((a, b) => {
                      let aIsKnownGateway = hasGatewayPrefix(a[1]["quote"]);
                      let bIsKnownGateway = hasGatewayPrefix(b[1]["quote"]);

                      if (aIsKnownGateway && !bIsKnownGateway) {
                          return -1;
                      } else if (bIsKnownGateway && !aIsKnownGateway) {
                          return 1;
                      } else if (a[1]["quote"] > b[1]["quote"]) {
                          return 1;
                      } else if (a[1]["quote"] < b[1]["quote"]) {
                          return -1;
                      } else {
                          return 0;
                      }
                  })
                  .map(market => {
                      return (
                          <li key={market[0]}>
                              <AssetName name={market[1]["quote"]} />

                              <span style={{float: "right"}}>
                                  <Link
                                      onClick={() => {
                                          this.props.onToggleMarketPicker(null),
                                              MarketsActions.switchMarket();
                                      }}
                                      to={
                                          quoteSymbol == marketPickerAsset
                                              ? `/market/${
                                                    market[1]["quote"]
                                                }_${baseSymbol}`
                                              : `/market/${quoteSymbol}_${
                                                    market[1]["quote"]
                                                }`
                                      }
                                  >
                                      <Translate content="exchange.market_picker.use" />
                                  </Link>
                              </span>
                          </li>
                      );
                  });

        this.setState({
            allMarkets,
            allIssuers,
            marketsList,
            issuersList,
            activeSearch: false
        });
    }

    render() {
        let {marketPickerAsset} = this.props;

        let {
            marketPickerTab,
            inputValue,
            allMarkets,
            issuersList,
            marketsList
        } = this.state;

        return (
            <div className="marketPicker">
                <div className="marketPicker__header">
                    <div className="marketPicker__filterType">
                        <Translate
                            className="marketPicker__filterHeader"
                            component="span"
                            content="exchange.market_picker.search_mode"
                        />
                        <Icon
                            style={{marginLeft: 5, cursor: "pointer"}}
                            className={
                                !this.state.marketPickerTab ||
                                this.state.marketPickerTab == "filter"
                                    ? "blue-icon"
                                    : ""
                            }
                            size="1_5x"
                            onClick={this._changeMarketPickerFilter.bind(
                                this,
                                "filter"
                            )}
                            name="filter"
                            title="icons.filter"
                        />
                        <Icon
                            style={{marginLeft: 5, cursor: "pointer"}}
                            className={
                                this.state.marketPickerTab == "search"
                                    ? "blue-icon"
                                    : ""
                            }
                            size="1_5x"
                            onClick={this._changeMarketPickerFilter.bind(
                                this,
                                "search"
                            )}
                            name="zoom"
                            title="icons.zoom"
                        />
                    </div>
                    <Translate
                        className="marketPicker__title"
                        component="span"
                        content="exchange.market_picker.title"
                    />
                </div>
                <div className="marketPicker__subHeader">
                    <Translate content="exchange.market_picker.sub_title" />&nbsp;
                    <Link
                        to={`/asset/${marketPickerAsset}`}
                        style={{
                            cursor: "pointer",
                            color: "lightblue !important"
                        }}
                    >
                        <AssetName name={marketPickerAsset} />
                        <Icon
                            className="blue-icon"
                            style={{marginLeft: 5}}
                            name="info-circle-o"
                            title="icons.info_circle_o"
                        />
                    </Link>
                </div>
                <hr />
                <div
                    id="search"
                    style={{display: marketPickerTab == "search" ? "" : "none"}}
                >
                    <div>
                        <section className="block-list no-border-bottom">
                            <header>
                                <Translate
                                    component="span"
                                    content="exchange.market_picker.search_for_asset"
                                />
                            </header>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={this._onInputName.bind(this, false)}
                                placeholder={counterpart.translate(
                                    "exchange.market_picker.search"
                                )}
                                maxLength="16"
                                tabIndex={2}
                            />
                        </section>
                    </div>
                </div>
                <div
                    id="filter"
                    style={{
                        display:
                            !this.state.marketPickerTab ||
                            this.state.marketPickerTab == "filter"
                                ? ""
                                : "none"
                    }}
                >
                    <div>
                        <section className="block-list no-border-bottom">
                            <header>
                                <Translate
                                    component="span"
                                    content="exchange.market_picker.find_by_asset"
                                />
                            </header>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={this._onInputName.bind(this, true)}
                                placeholder={counterpart.translate(
                                    "exchange.market_picker.search"
                                )}
                                maxLength="16"
                                tabIndex={2}
                            />
                        </section>
                    </div>
                    <div>
                        <section className="block-list no-border-bottom">
                            <header>
                                <Translate
                                    component="span"
                                    content="exchange.market_picker.filter_by_issuer"
                                />
                            </header>
                            <ul>
                                <li className="with-dropdpwn">
                                    <select
                                        className="settings-select"
                                        onChange={this._onSelectIssuer.bind(
                                            this
                                        )}
                                        style={{border: 0}}
                                    >
                                        <option key="0" value="0">
                                            {counterpart.translate(
                                                "exchange.market_picker.show_all"
                                            )}{" "}
                                        </option>
                                        {issuersList}
                                    </select>
                                </li>
                            </ul>
                        </section>
                    </div>
                </div>
                <section className="block-list no-border-bottom">
                    <Translate
                        component="header"
                        content="exchange.market_picker.results"
                        total_assets={!allMarkets ? 0 : allMarkets.length}
                    />
                </section>
                {this.state.activeSearch &&
                this.state.inputValue.length != 0 ? (
                    <div style={{textAlign: "center"}}>
                        <LoadingIndicator type="three-bounce" />
                    </div>
                ) : (
                    <div className="results">
                        <ul style={{marginLeft: 0}}>{marketsList}</ul>
                    </div>
                )}
            </div>
        );
    }
}

class MarketPicker extends React.Component {
    render() {
        return <MarketPickerWrapper {...this.props} />;
    }
}

MarketPicker = connect(MarketPicker, {
    listenTo() {
        return [AssetStore];
    },
    getProps() {
        return {
            searchAssets: AssetStore.getState().assets,
            assetsLoading: AssetStore.getState().assetsLoading
        };
    }
});

export default MarketPicker;
