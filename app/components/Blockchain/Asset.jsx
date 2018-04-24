import React from "react";
import {Link} from "react-router/es";
import Translate from "react-translate-component";
import LinkToAccountById from "../Utility/LinkToAccountById";
import AssetWrapper from "../Utility/AssetWrapper";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import AssetName from "../Utility/AssetName";
import TimeAgo from "../Utility/TimeAgo";
import HelpContent from "../Utility/HelpContent";
import assetUtils from "common/asset_utils";
import utils from "common/utils";
import FormattedTime from "../Utility/FormattedTime";
import {ChainStore} from "bitsharesjs/es";
import {Apis} from "bitsharesjs-ws";
import {Tabs, Tab} from "../Utility/Tabs";
import {CallOrder, FeedPrice} from "common/MarketClasses";

class AssetFlag extends React.Component {
    render() {
        let {isSet, name} = this.props;
        if (!isSet) {
            return <span />;
        }

        return (
            <span className="asset-flag">
                <span className="label info">
                    <Translate content={"account.user_issued_assets." + name} />
                </span>
            </span>
        );
    }
}

//-------------------------------------------------------------
class AssetPermission extends React.Component {
    render() {
        let {isSet, name} = this.props;

        if (!isSet) {
            return <span />;
        }

        return (
            <span className="asset-flag">
                <span className="label info">
                    <Translate content={"account.user_issued_assets." + name} />
                </span>
            </span>
        );
    }
}

class Asset extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            callOrders: [],
            marginTableSort: "price",
            sortDirection: true
        };
    }

    componentWillMount() {
        if (this.props.asset.has("bitasset")) {
            const assets = {
                [this.props.asset.get("id")]: this.props.asset.toJS(),
                [this.props.backingAsset.get(
                    "id"
                )]: this.props.backingAsset.toJS()
            };

            const isPredictionMarket = this.props.asset.getIn(
                ["bitasset", "is_prediction_market"],
                false
            );
            let sqr = this.props.asset.getIn([
                "bitasset",
                "current_feed",
                "maximum_short_squeeze_ratio"
            ]);
            let settlePrice = this.props.asset.getIn([
                "bitasset",
                "current_feed",
                "settlement_price"
            ]);

            /* Prediction markets don't need feeds for shorting, so the settlement price can be set to 1:1 */
            if (
                isPredictionMarket &&
                settlePrice.getIn(["base", "asset_id"]) ===
                    settlePrice.getIn(["quote", "asset_id"])
            ) {
                if (!assets[this.props.backingAsset.get("id")])
                    assets[this.props.backingAsset.get("id")] = {
                        precision: this.props.asset.get("precision")
                    };
                settlePrice = settlePrice.setIn(["base", "amount"], 1);
                settlePrice = settlePrice.setIn(
                    ["base", "asset_id"],
                    this.props.backingAsset.get("id")
                );
                settlePrice = settlePrice.setIn(["quote", "amount"], 1);
                settlePrice = settlePrice.setIn(
                    ["quote", "asset_id"],
                    this.props.asset.get("id")
                );
                sqr = 1000;
            }

            try {
                const feedPrice = new FeedPrice({
                    priceObject: settlePrice,
                    market_base: this.props.asset.get("id"),
                    sqr,
                    assets
                });

                Apis.instance()
                    .db_api()
                    .exec("get_call_orders", [this.props.asset.get("id"), 300])
                    .then(call_orders => {
                        let callOrders = call_orders.map(c => {
                            return new CallOrder(
                                c,
                                assets,
                                this.props.asset.get("id"),
                                feedPrice,
                                isPredictionMarket
                            );
                        });
                        this.setState({callOrders});
                    });
            } catch (e) {
                // console.log(err);
            }
        }
    }

    _toggleSortOrder(type) {
        if (type !== this.state.marginTableSort) {
            this.setState({
                marginTableSort: type
            });
        } else {
            this.setState({sortDirection: !this.state.sortDirection});
        }
    }

    _assetType(asset) {
        return "bitasset" in asset
            ? asset.bitasset.is_prediction_market ? "Prediction" : "Smart"
            : "Simple";
    }

    renderFlagIndicators(flags, names) {
        return (
            <div>
                {names.map(name => {
                    return (
                        <AssetFlag
                            key={`flag_${name}`}
                            name={name}
                            isSet={flags[name]}
                        />
                    );
                })}
            </div>
        );
    }

    renderPermissionIndicators(permissions, names) {
        return (
            <div>
                {names.map(name => {
                    return (
                        <AssetPermission
                            key={`perm_${name}`}
                            name={name}
                            isSet={permissions[name]}
                        />
                    );
                })}
            </div>
        );
    }

    formattedPrice(price, hide_symbols = false, hide_value = false) {
        var base = price.base;
        var quote = price.quote;
        return (
            <FormattedPrice
                base_amount={base.amount}
                base_asset={base.asset_id}
                quote_amount={quote.amount}
                quote_asset={quote.asset_id}
                hide_value={hide_value}
                hide_symbols={hide_symbols}
            />
        );
    }

    renderAuthorityList(authorities) {
        return authorities.map(function(authority) {
            return (
                <span>
                    {" "}
                    <LinkToAccountById account={authority} />
                </span>
            );
        });
    }

    renderMarketList(asset, markets) {
        var symbol = asset.symbol;
        return markets.map(
            function(market) {
                if (market == symbol) return null;
                var marketID = market + "_" + symbol;
                var marketName = market + "/" + symbol;
                return (
                    <span>
                        <Link to={`/market/${marketID}`}>{marketName}</Link>{" "}
                        &nbsp;
                    </span>
                );
            }.bind(this)
        );
    }

    renderAboutBox(asset, originalAsset) {
        var issuer = ChainStore.getObject(asset.issuer, false, false);
        var issuerName = issuer ? issuer.get("name") : "";

        // Add <a to any links included in the description
        let description = assetUtils.parseDescription(
            asset.options.description
        );
        let desc = description.main;
        let short_name = description.short_name ? description.short_name : null;

        let urlTest = /(http?):\/\/(www\.)?[a-z0-9\.:].*?(?=\s)/g;

        // Regexp needs a whitespace after a url, so add one to make sure
        desc = desc && desc.length > 0 ? desc + " " : desc;
        let urls = desc.match(urlTest);

        // Add market link
        const core_asset = ChainStore.getAsset("1.3.0");
        let preferredMarket = description.market
            ? description.market
            : core_asset ? core_asset.get("symbol") : "BTS";
        if ("bitasset" in asset && asset.bitasset.is_prediction_market) {
            preferredMarket = ChainStore.getAsset(
                asset.bitasset.options.short_backing_asset
            );
            if (preferredMarket) {
                preferredMarket = preferredMarket.get("symbol");
            } else {
                preferredMarket = core_asset.get("symbol");
            }
        }
        if (asset.symbol === core_asset.get("symbol")) preferredMarket = "USD";
        if (urls && urls.length) {
            urls.forEach(url => {
                let markdownUrl = `<a target="_blank" rel="noopener noreferrer" href="${url}">${url}</a>`;
                desc = desc.replace(url, markdownUrl);
            });
        }

        let {name, prefix} = utils.replaceName(originalAsset);

        return (
            <div style={{overflow: "visible"}}>
                <HelpContent
                    path={"assets/" + asset.symbol}
                    alt_path="assets/Asset"
                    section="summary"
                    symbol={(prefix || "") + name}
                    description={desc}
                    issuer={issuerName}
                    hide_issuer="true"
                />
                {short_name ? <p>{short_name}</p> : null}
                <Link
                    className="button market-button"
                    to={`/market/${asset.symbol}_${preferredMarket}`}
                >
                    <Translate content="exchange.market" />
                </Link>
            </div>
        );
    }

    renderSummary(asset) {
        // TODO: confidential_supply: 0 USD   [IF NOT ZERO OR NOT DISABLE CONFIDENTIAL]
        let dynamic = this.props.getDynamicObject(asset.dynamic_asset_data_id);
        if (dynamic) dynamic = dynamic.toJS();
        var options = asset.options;

        let flagBooleans = assetUtils.getFlagBooleans(
            asset.options.flags,
            this.props.asset.has("bitasset_data_id")
        );

        let bitNames = Object.keys(flagBooleans);

        var currentSupply = dynamic ? (
            <tr>
                <td>
                    {" "}
                    <Translate content="explorer.asset.summary.current_supply" />{" "}
                </td>
                <td>
                    {" "}
                    <FormattedAsset
                        amount={dynamic.current_supply}
                        asset={asset.id}
                    />{" "}
                </td>
            </tr>
        ) : null;

        var stealthSupply = dynamic ? (
            <tr>
                <td>
                    {" "}
                    <Translate content="explorer.asset.summary.stealth_supply" />{" "}
                </td>
                <td>
                    {" "}
                    <FormattedAsset
                        amount={dynamic.confidential_supply}
                        asset={asset.id}
                    />{" "}
                </td>
            </tr>
        ) : null;

        var marketFee = flagBooleans["charge_market_fee"] ? (
            <tr>
                <td>
                    {" "}
                    <Translate content="explorer.asset.summary.market_fee" />{" "}
                </td>
                <td> {options.market_fee_percent / 100.0} % </td>
            </tr>
        ) : null;

        // options.max_market_fee initially a string
        var maxMarketFee = flagBooleans["charge_market_fee"] ? (
            <tr>
                <td>
                    {" "}
                    <Translate content="explorer.asset.summary.max_market_fee" />{" "}
                </td>
                <td>
                    {" "}
                    <FormattedAsset
                        amount={+options.max_market_fee}
                        asset={asset.id}
                    />{" "}
                </td>
            </tr>
        ) : null;

        return (
            <div className="asset-card no-padding">
                <div className="card-divider">
                    <AssetName name={asset.symbol} />
                </div>
                <table className="table key-value-table table-hover">
                    <tbody>
                        <tr>
                            <td>
                                {" "}
                                <Translate content="explorer.asset.summary.asset_type" />{" "}
                            </td>
                            <td> {this._assetType(asset)} </td>
                        </tr>
                        <tr>
                            <td>
                                {" "}
                                <Translate content="explorer.asset.summary.issuer" />{" "}
                            </td>
                            <td>
                                {" "}
                                <LinkToAccountById
                                    account={asset.issuer}
                                />{" "}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {" "}
                                <Translate content="explorer.assets.precision" />{" "}
                            </td>
                            <td> {asset.precision} </td>
                        </tr>
                        {currentSupply}
                        {stealthSupply}
                        {marketFee}
                        {maxMarketFee}
                    </tbody>
                </table>
                <br />
                {this.renderFlagIndicators(flagBooleans, bitNames)}
            </div>
        );
    }

    renderPriceFeed(asset, sortedCallOrders) {
        var title = <Translate content="explorer.asset.price_feed.title" />;
        var bitAsset = asset.bitasset;
        if (!("current_feed" in bitAsset)) return <div header={title} />;
        var currentFeed = bitAsset.current_feed;

        /*
        console.log(
            "force settlement delay: " +
                bitAsset.options.force_settlement_delay_sec
        );
        console.log(
            "force settlement offset: " +
                bitAsset.options.force_settlement_offset_percent
        );
        */

        let settlementDelay = bitAsset.options.force_settlement_delay_sec;
        let settlementOffset = bitAsset.options.force_settlement_offset_percent;

        var globalSettlementPrice = this.getGlobalSettlementPrice();

        return (
            <div className="asset-card no-padding">
                <div className="card-divider">{title}</div>

                <table
                    className="table key-value-table table-hover"
                    style={{padding: "1.2rem"}}
                >
                    <tbody>
                        <tr>
                            <td>
                                {" "}
                                <Translate content="explorer.asset.price_feed.settlement_price" />{" "}
                            </td>
                            <td>
                                {" "}
                                {this.formattedPrice(
                                    currentFeed.settlement_price
                                )}{" "}
                            </td>
                        </tr>

                        <tr>
                            <td>
                                {" "}
                                <Translate content="explorer.asset.price_feed.maintenance_collateral_ratio" />{" "}
                            </td>
                            <td>
                                {" "}
                                {currentFeed.maintenance_collateral_ratio /
                                    10}%{" "}
                            </td>
                        </tr>

                        <tr>
                            <td>
                                {" "}
                                <Translate content="explorer.asset.price_feed.maximum_short_squeeze_ratio" />{" "}
                            </td>
                            <td>
                                {" "}
                                {currentFeed.maximum_short_squeeze_ratio /
                                    10}%{" "}
                            </td>
                        </tr>

                        <tr>
                            <td>
                                {" "}
                                <Translate content="explorer.asset.price_feed.global_settlement_price" />{" "}
                            </td>
                            <td>
                                {" "}
                                {globalSettlementPrice
                                    ? globalSettlementPrice
                                    : "-"}{" "}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <table
                    className="table key-value-table table-hover"
                    style={{marginTop: "2rem"}}
                >
                    <tbody>
                        <tr>
                            <td>
                                {" "}
                                <Translate content="explorer.asset.price_feed.settlement_delay" />{" "}
                            </td>
                            <td>
                                {" "}
                                <FormattedTime time={settlementDelay} />{" "}
                            </td>
                        </tr>

                        <tr>
                            <td>
                                {" "}
                                <Translate content="explorer.asset.price_feed.force_settlement_offset" />{" "}
                            </td>
                            <td> {settlementOffset / 100}% </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    renderFeePool(asset) {
        let dynamic = this.props.getDynamicObject(asset.dynamic_asset_data_id);
        if (dynamic) dynamic = dynamic.toJS();
        var options = asset.options;
        return (
            <div className="asset-card no-padding">
                <div className="card-divider">
                    {<Translate content="explorer.asset.fee_pool.title" />}
                </div>
                <table
                    className="table key-value-table"
                    style={{padding: "1.2rem"}}
                >
                    <tbody>
                        <tr>
                            <td>
                                {" "}
                                <Translate content="explorer.asset.fee_pool.core_exchange_rate" />{" "}
                            </td>
                            <td>
                                {" "}
                                {this.formattedPrice(
                                    options.core_exchange_rate
                                )}{" "}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {" "}
                                <Translate content="explorer.asset.fee_pool.pool_balance" />{" "}
                            </td>
                            <td>
                                {" "}
                                {dynamic ? (
                                    <FormattedAsset
                                        asset="1.3.0"
                                        amount={dynamic.fee_pool}
                                    />
                                ) : null}{" "}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {" "}
                                <Translate content="explorer.asset.fee_pool.unclaimed_issuer_income" />{" "}
                            </td>
                            <td>
                                {" "}
                                {dynamic ? (
                                    <FormattedAsset
                                        asset={asset.id}
                                        amount={dynamic.accumulated_fees}
                                    />
                                ) : null}{" "}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    // TODO: Blacklist Authorities: <Account list like Voting>
    // TODO: Blacklist Market: Base/Market, Base/Market
    renderPermissions(asset) {
        //var dynamic = asset.dynamic;

        var options = asset.options;

        let permissionBooleans = assetUtils.getFlagBooleans(
            asset.options.issuer_permissions,
            this.props.asset.has("bitasset_data_id")
        );

        let bitNames = Object.keys(permissionBooleans);

        // options.blacklist_authorities = ["1.2.3", "1.2.4"];
        // options.whitelist_authorities = ["1.2.1", "1.2.2"];
        // options.blacklist_markets = ["JPY", "RUB"];
        // options.whitelist_markets = ["USD", "EUR", "GOLD"];

        // options.max_market_fee initially a string
        var maxMarketFee = permissionBooleans["charge_market_fee"] ? (
            <tr>
                <td>
                    {" "}
                    <Translate content="explorer.asset.permissions.max_market_fee" />{" "}
                </td>
                <td>
                    {" "}
                    <FormattedAsset
                        amount={+options.max_market_fee}
                        asset={asset.id}
                    />{" "}
                </td>
            </tr>
        ) : null;

        // options.max_supply initially a string
        var maxSupply = (
            <tr>
                <td>
                    {" "}
                    <Translate content="explorer.asset.permissions.max_supply" />{" "}
                </td>
                <td>
                    {" "}
                    <FormattedAsset
                        amount={+options.max_supply}
                        asset={asset.id}
                    />{" "}
                </td>
            </tr>
        );

        var whiteLists = permissionBooleans["white_list"] ? (
            <span>
                <br />
                <Translate content="explorer.asset.permissions.blacklist_authorities" />:
                &nbsp;{this.renderAuthorityList(options.blacklist_authorities)}
                <br />
                <Translate content="explorer.asset.permissions.blacklist_markets" />:
                &nbsp;{this.renderMarketList(asset, options.blacklist_markets)}
                <br />
                <Translate content="explorer.asset.permissions.whitelist_authorities" />:
                &nbsp;{this.renderAuthorityList(options.whitelist_authorities)}
                <br />
                <Translate content="explorer.asset.permissions.whitelist_markets" />:
                &nbsp;{this.renderMarketList(asset, options.whitelist_markets)}
            </span>
        ) : null;

        return (
            <div className="asset-card no-padding">
                <div className="card-divider">
                    {<Translate content="explorer.asset.permissions.title" />}{" "}
                </div>
                <table
                    className="table key-value-table table-hover"
                    style={{padding: "1.2rem"}}
                >
                    <tbody>
                        {maxMarketFee}
                        {maxSupply}
                    </tbody>
                </table>

                <br />
                {this.renderPermissionIndicators(permissionBooleans, bitNames)}
                <br />

                {/*whiteLists*/}
            </div>
        );
    }

    // return a sorted list of call orders
    getMarginPositions() {
        const {sortDirection} = this.state;

        let sortFunctions = {
            name: function(a, b) {
                let nameA = ChainStore.getAccount(a.borrower, false);
                if (nameA) nameA = nameA.get("name");
                let nameB = ChainStore.getAccount(b.borrower, false);
                if (nameB) nameB = nameB.get("name");
                if (nameA > nameB) return sortDirection ? 1 : -1;
                if (nameA < nameB) return sortDirection ? -1 : 1;
                return 0;
            },
            price: function(a, b) {
                return (
                    (sortDirection ? 1 : -1) *
                    (a.call_price.toReal() - b.call_price.toReal())
                );
            },
            collateral: function(a, b) {
                return (
                    (sortDirection ? 1 : -1) *
                    (b.getCollateral().getAmount() -
                        a.getCollateral().getAmount())
                );
            },
            debt: function(a, b) {
                return (
                    (sortDirection ? 1 : -1) *
                    (b.amountToReceive().getAmount() -
                        a.amountToReceive().getAmount())
                );
            },
            ratio: function(a, b) {
                return (sortDirection ? 1 : -1) * (a.getRatio() - b.getRatio());
            }
        };

        return this.state.callOrders.sort(
            sortFunctions[this.state.marginTableSort]
        );
    }

    // the global settlement price is defined as the
    // the price at which the least collateralized short
    // 's collateral no longer enough to back the debt
    // he/she owes. If the feed price goes above this,
    // then
    getGlobalSettlementPriceFromSorted(sortedCallOrders) {
        console.log("global settlement sorted called");
        // first get the least collateralized short position
        if (!sortedCallOrders || sortedCallOrders.length <= 0) {
            console.log("length array 0 passed in");
            return null;
        }
        console.log("sortedCallOrders exists according to sorted get globa");

        let leastColShort = sortedCallOrders[0];

        // this price will happen when the CR is 1.
        // The CR is 1 iff collateral / (debt x feed_ price) == 1
        // Rearranging, this means that the CR is 1 iff
        // feed_price == collateral / debt
        let debt = leastColShort.amountToReceive().getAmount();
        let collateral = leastColShort.getCollateral().getAmount();

        return (
            <FormattedPrice
                base_amount={collateral}
                base_asset={leastColShort.call_price.base.asset_id}
                quote_amount={debt}
                quote_asset={leastColShort.call_price.quote.asset_id}
            />
        );
    }

    // the global settlement price is defined as the
    // the price at which the least collateralized short
    // 's collateral no longer enough to back the debt
    // he/she owes. If the feed price goes above this,
    // then
    getGlobalSettlementPrice() {
        var call_orders;
        if (!this.state.callOrders) {
            return null;
        } else {
            // put the call order on the stack
            call_orders = this.state.callOrders;
        }

        // first get the least collateralized short position
        var leastColShort = null;
        var leastColShortRatio = null;
        var len = this.state.callOrders.length;
        for (var i = 0; i < len; i++) {
            let call_order = this.state.callOrders[i];

            if (leastColShort == null) {
                leastColShort = call_order;
                leastColShortRatio = call_order.getRatio();
            } else if (call_order.getRatio() < leastColShortRatio) {
                leastColShortRatio = call_order.getRatio();
                leastColShort = call_order;
            }
        }

        if (leastColShort == null) {
            // couldn't find the least colshort?
            console.log("couldn't find the least col short");
            return null;
        }

        // this price will happen when the CR is 1.
        // The CR is 1 iff collateral / (debt x feed_ price) == 1
        // Rearranging, this means that the CR is 1 iff
        // feed_price == collateral / debt
        let debt = leastColShort.amountToReceive().getAmount();
        let collateral = leastColShort.getCollateral().getAmount();
        let globalSettlementPrice = collateral / debt;

        return (
            <FormattedPrice
                base_amount={collateral}
                base_asset={leastColShort.call_price.base.asset_id}
                quote_amount={debt}
                quote_asset={leastColShort.call_price.quote.asset_id}
            />
        );
    }

    // return two tabs
    // one tab is for the price feed data from the
    // witness for the given asset
    // the other tab is a list of the margin positions
    // for this asset (if it's a bitasset)
    renderPriceFeedData(asset, sortedCallOrders) {
        // first we compute the price feed tab
        var bitAsset = asset.bitasset;
        if (
            !("feeds" in bitAsset) ||
            bitAsset.feeds.length == 0 ||
            bitAsset.is_prediction_market
        ) {
            return null;
        }

        let now = new Date().getTime();
        let oldestValidDate = new Date(
            now - asset.bitasset.options.feed_lifetime_sec * 1000
        );

        // Filter by valid feed lifetime, Sort by published date
        var feeds = bitAsset.feeds;
        feeds = feeds
            .filter(a => {
                return new Date(a[1][0]) > oldestValidDate;
            })
            .sort(function(feed1, feed2) {
                return new Date(feed2[1][0]) - new Date(feed1[1][0]);
            });

        if (!feeds.length) {
            return null;
        }

        var rows = [];
        var settlement_price_header = feeds[0][1][1].settlement_price;
        var core_exchange_rate_header = feeds[0][1][1].core_exchange_rate;
        let header = (
            <thead>
                <tr>
                    <th style={{textAlign: "left"}}>
                        {" "}
                        <Translate content="explorer.asset.price_feed_data.publisher" />{" "}
                    </th>
                    <th>
                        <Translate content="explorer.asset.price_feed_data.settlement_price" />
                        <br />
                        ({this.formattedPrice(
                            settlement_price_header,
                            false,
                            true
                        )})
                    </th>
                    <th>
                        <Translate content="explorer.asset.price_feed_data.core_exchange_rate" />
                        <br />
                        ({this.formattedPrice(
                            core_exchange_rate_header,
                            false,
                            true
                        )})
                    </th>
                    <th>
                        {" "}
                        <Translate content="explorer.asset.price_feed_data.maintenance_collateral_ratio" />{" "}
                    </th>
                    <th>
                        {" "}
                        <Translate content="explorer.asset.price_feed_data.maximum_short_squeeze_ratio" />{" "}
                    </th>
                    <th>
                        {" "}
                        <Translate content="explorer.asset.price_feed_data.published" />{" "}
                    </th>
                </tr>
            </thead>
        );
        for (var i = 0; i < feeds.length; i++) {
            var feed = feeds[i];
            var publisher = feed[0];
            var publishDate = new Date(feed[1][0] + "Z");
            var settlement_price = feed[1][1].settlement_price;
            var core_exchange_rate = feed[1][1].core_exchange_rate;
            var maintenance_collateral_ratio =
                "" + feed[1][1].maintenance_collateral_ratio / 10 + "%";
            var maximum_short_squeeze_ratio =
                "" + feed[1][1].maximum_short_squeeze_ratio / 10 + "%";
            rows.push(
                <tr key={publisher}>
                    <td>
                        {" "}
                        <LinkToAccountById account={publisher} />{" "}
                    </td>
                    <td style={{textAlign: "right"}}>
                        {this.formattedPrice(settlement_price, true)}
                    </td>
                    <td style={{textAlign: "right"}}>
                        {" "}
                        {this.formattedPrice(core_exchange_rate, true)}{" "}
                    </td>
                    <td style={{textAlign: "right"}}>
                        {" "}
                        {maintenance_collateral_ratio}
                    </td>
                    <td style={{textAlign: "right"}}>
                        {" "}
                        {maximum_short_squeeze_ratio}
                    </td>
                    <td style={{textAlign: "right"}}>
                        <TimeAgo time={publishDate} />
                    </td>
                </tr>
            );
        }

        // now we compute the margin position tab
        let header2 = (
            <thead>
                <tr>
                    <th
                        className="clickable"
                        onClick={this._toggleSortOrder.bind(this, "name")}
                        style={{textAlign: "left"}}
                    >
                        <Translate content="transaction.borrower" />
                    </th>
                    <th
                        className="clickable"
                        onClick={this._toggleSortOrder.bind(this, "collateral")}
                    >
                        <Translate content="transaction.collateral" />
                        {this.state.callOrders.length ? (
                            <span>
                                &nbsp;(<FormattedAsset
                                    amount={this.state.callOrders[0]
                                        .getCollateral()
                                        .getAmount()}
                                    asset={
                                        this.state.callOrders[0].getCollateral()
                                            .asset_id
                                    }
                                    hide_amount
                                />{" "}
                                )
                            </span>
                        ) : null}
                    </th>
                    <th
                        className="clickable"
                        onClick={this._toggleSortOrder.bind(this, "debt")}
                    >
                        <Translate content="transaction.borrow_amount" />
                        {this.state.callOrders.length ? (
                            <span>
                                &nbsp;(<FormattedAsset
                                    amount={this.state.callOrders[0]
                                        .amountToReceive()
                                        .getAmount()}
                                    asset={
                                        this.state.callOrders[0].amountToReceive()
                                            .asset_id
                                    }
                                    hide_amount
                                />{" "}
                                )
                            </span>
                        ) : null}
                    </th>
                    <th style={{paddingRight: 10}} className="clickable">
                        <span
                            onClick={this._toggleSortOrder.bind(this, "price")}
                        >
                            <Translate content="exchange.call" />
                        </span>
                        {this.state.callOrders.length ? (
                            <span>
                                &nbsp;(<FormattedPrice
                                    base_amount={
                                        this.state.callOrders[0].call_price.base
                                            .amount
                                    }
                                    base_asset={
                                        this.state.callOrders[0].call_price.base
                                            .asset_id
                                    }
                                    quote_amount={
                                        this.state.callOrders[0].call_price
                                            .quote.amount
                                    }
                                    quote_asset={
                                        this.state.callOrders[0].call_price
                                            .quote.asset_id
                                    }
                                    hide_value
                                    noPopOver
                                />)
                            </span>
                        ) : null}
                    </th>
                    <th
                        className="clickable"
                        onClick={this._toggleSortOrder.bind(this, "ratio")}
                    >
                        <Translate content="borrow.coll_ratio" />
                    </th>
                </tr>
            </thead>
        );

        let rows2 = sortedCallOrders.map(c => {
            return (
                <tr className="margin-row" key={c.id}>
                    <td>
                        <LinkToAccountById account={c.borrower} />
                    </td>
                    <td style={{textAlign: "right"}}>
                        <FormattedAsset
                            amount={c.getCollateral().getAmount()}
                            asset={c.getCollateral().asset_id}
                            hide_asset
                        />
                    </td>
                    <td style={{textAlign: "right"}}>
                        <FormattedAsset
                            amount={c.amountToReceive().getAmount()}
                            asset={c.amountToReceive().asset_id}
                            hide_asset
                        />
                    </td>
                    <td style={{textAlign: "right", paddingRight: 10}}>
                        <FormattedPrice
                            base_amount={c.call_price.base.amount}
                            base_asset={c.call_price.base.asset_id}
                            quote_amount={c.call_price.quote.amount}
                            quote_asset={c.call_price.quote.asset_id}
                            hide_symbols
                        />
                    </td>
                    <td className={c.getStatus()} style={{textAlign: "right"}}>
                        {c.getRatio().toFixed(3)}
                    </td>
                </tr>
            );
        });

        return (
            <div className="grid-block">
                <div className="grid-content no-padding">
                    <div className="">
                        <Tabs
                            defaultActiveTab={0}
                            segmented={false}
                            setting="bitassetDataTabs"
                        >
                            <Tab title="explorer.asset.price_feed_data.title">
                                <div className="responsive-table">
                                    <table
                                        className=" table order-table table-hover"
                                        style={{padding: "1.2rem"}}
                                    >
                                        {header}
                                        <tbody>{rows}</tbody>
                                    </table>
                                </div>
                            </Tab>

                            <Tab title="explorer.asset.margin_positions.title">
                                <table
                                    className=" table order-table table-hover"
                                    style={{padding: "1.2rem"}}
                                >
                                    {header2}
                                    <tbody>{rows2}</tbody>
                                </table>
                            </Tab>
                        </Tabs>
                    </div>
                </div>
            </div>
        );
    }

    render() {
        var asset = this.props.asset.toJS();
        var sortedCallOrders = this.getMarginPositions();
        var priceFeed =
            "bitasset" in asset
                ? this.renderPriceFeed(asset, sortedCallOrders)
                : null;
        var priceFeedData =
            "bitasset" in asset
                ? this.renderPriceFeedData(asset, sortedCallOrders)
                : null;

        return (
            <div className="grid-container">
                <div className="grid-block page-layout">
                    <div className="grid-block main-content wrap regular-padding">
                        <div
                            className="grid-block small-up-1"
                            style={{width: "100%"}}
                        >
                            {this.renderAboutBox(asset, this.props.asset)}
                        </div>
                        <div className="grid-block small-up-1 medium-up-2">
                            <div className="grid-content">
                                {this.renderSummary(asset)}
                            </div>
                            <div className="grid-content">
                                {priceFeed
                                    ? priceFeed
                                    : this.renderPermissions(asset)}
                            </div>
                        </div>
                        <div className="grid-block small-up-1 medium-up-2">
                            <div className="grid-content">
                                {this.renderFeePool(asset)}
                            </div>
                            <div className="grid-content">
                                {priceFeed
                                    ? this.renderPermissions(asset)
                                    : null}
                            </div>
                        </div>
                        {priceFeedData ? priceFeedData : null}
                    </div>
                </div>
            </div>
        );
    }
}

Asset = AssetWrapper(Asset, {
    propNames: ["backingAsset"]
});

class AssetContainer extends React.Component {
    render() {
        let backingAsset = this.props.asset.has("bitasset")
            ? this.props.asset.getIn([
                  "bitasset",
                  "options",
                  "short_backing_asset"
              ])
            : "1.3.0";
        return <Asset {...this.props} backingAsset={backingAsset} />;
    }
}
AssetContainer = AssetWrapper(AssetContainer, {
    withDynamic: true
});

export default class AssetSymbolSplitter extends React.Component {
    render() {
        let symbol = this.props.params.symbol;
        return <AssetContainer {...this.props} asset={symbol} />;
    }
}
