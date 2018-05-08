import React from "react";
import MarketsActions from "actions/MarketsActions";
import {Link} from "react-router/es";
import AssetName from "../Utility/AssetName";
import Icon from "../Icon/Icon";
import {debounce} from "lodash";
import {ChainStore} from "bitsharesjs/es";
import Translate from "react-translate-component";
import LoadingIndicator from "../LoadingIndicator";
import AssetActions from "actions/AssetActions";
import {ChainValidation} from "bitsharesjs/es";
import counterpart from "counterpart";

let lastLookup = new Date();

export default class MarketPicker extends React.Component {
    constructor() {
        super();

        this.state = {
            marketsList: "",
            issuersList: "",
            lookupQuote: null,
            filterByIssuerName: null
        };

        this.getAssetList = debounce(AssetActions.getAssetList.defer, 150);
    }

    _onSelectIssuer(e) {
        this.setState({
            filterByIssuerName: e.target.value == "0" ? null : e.target.value
        });
    }

    _onInputName(getBackedAssets, e) {
        let toFind = e.target.value.trim().toUpperCase();
        let isValidName = !ChainValidation.is_valid_symbol_error(toFind, true);

        this.setState({
            inputValue: e.target.value.trim(),
            marketsList: "",
            issuersList: "",
            filterByIssuerName: null
        });

        /* Don't lookup invalid asset names */
        if (toFind && toFind.length >= 3 && !isValidName) {
            return this.setState({
                assetNameError: true
            });
        } else {
            this.setState({
                assetNameError: false
            });
        }
        this._lookupAssets(toFind, getBackedAssets);
    }

    _lookupAssets(value, gatewayAssets = false, force = false) {
        // console.log("__lookupAssets", value, force);
        if (!value && value !== "") {
            return;
        }
        let now = new Date();

        let quote = value.toUpperCase();

        this.setState({
            lookupQuote: quote
        });

        if (this.state.lookupQuote !== quote || force) {
            if (quote.length < 1 || now - lastLookup <= 250) {
                return false;
            }
            this.getAssetList(quote, 25, gatewayAssets);
        }
    }

    _changeMarketPickerFilter(value) {
        this.setState({
            marketPickerTab: value,
            inputValue: "",
            marketsList: "",
            issuersList: "",
            filterByIssuerName: null
        });
    }

    render() {
        let {searchAssets, assetsLoading, marketPickerAsset} = this.props;

        let {
            lookupQuote,
            marketPickerTab,
            filterByIssuerName,
            inputValue
        } = this.state;

        let baseSymbol = this.props.baseAsset.get("symbol");
        let quoteSymbol = this.props.quoteAsset.get("symbol");

        let allMarkets = [];
        let allIssuers = [];
        let marketsList = this.state.marketsList;
        let issuersList = this.state.issuersList;
        let assetCount = 0;

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

                    return (
                        a.symbol.indexOf(lookupQuote) !== -1 &&
                        a.symbol.length >= lookupQuote.length
                    );
                })
                .forEach(asset => {
                    if (assetCount > 100) return;
                    assetCount++;
                    let issuer = ChainStore.getObject(
                        asset.issuer,
                        false,
                        false
                    );
                    if (!issuer) return;

                    let base = this.props.baseAsset.get("symbol");
                    let marketID = asset.symbol + "_" + base;

                    if (
                        base !== asset.symbol &&
                        (!filterByIssuerName ||
                            filterByIssuerName == issuer.get("name")) &&
                        ((marketPickerTab == "search" &&
                            asset.symbol.startsWith(inputValue)) ||
                            (!marketPickerTab || marketPickerTab == "filter"))
                    ) {
                        allMarkets.push([
                            marketID,
                            {
                                quote: asset.symbol,
                                base: base,
                                issuer: issuer.get("name")
                            }
                        ]);
                    }
                    if (!allIssuers.includes(issuer.get("name")))
                        allIssuers.push(issuer.get("name"));
                });
        }

        issuersList = allIssuers
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

        marketsList = allMarkets
            .sort((a, b) => {
                if (a[1]["quote"] > b[1]["quote"]) {
                    return 1;
                } else if (a[1]["quote"] < b[1]["quote"]) {
                    return -1;
                } else {
                    return 0;
                }
            })
            .map(market => {
                let isQuoteAsset =
                    this.props.quoteAsset.get("symbol") == marketPickerAsset;
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
                                    isQuoteAsset
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
                                            <Translate content="exchange.market_picker.show_all" />
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
                        total_assets={allMarkets.length}
                    />
                </section>
                {assetsLoading && allMarkets.length ? (
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
