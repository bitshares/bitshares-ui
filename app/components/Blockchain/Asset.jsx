import React from "react";
import {Link} from "react-router/es";
import Translate from "react-translate-component";
import LinkToAccountById from "../Utility/LinkToAccountById";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import AssetName from "../Utility/AssetName";
import TimeAgo from "../Utility/TimeAgo";
import HelpContent from "../Utility/HelpContent";
import Icon from "../Icon/Icon";
import assetUtils from "common/asset_utils";
import utils from "common/utils";
import {ChainStore} from "bitsharesjs/es";
import {Apis} from "bitsharesjs-ws";
import { Tabs, Tab } from "../Utility/Tabs";
import { CallOrder, FeedPrice } from "common/MarketClasses";

class AssetFlag extends React.Component {
    render()
    {
        let {isSet, name} = this.props;
        if (!isSet) {
            return ( <span></span> );
        }

        return (
            <span className="asset-flag">
                <span className="label info">
                    <Translate content={"account.user_issued_assets." + name}/>
                </span>
            </span>
        );
    }
}


//-------------------------------------------------------------
class AssetPermission extends React.Component {
    render()
    {
        let {isSet, name} = this.props;

        if (!isSet) {
            return ( <span></span> );
        }

        return (
            <span className="asset-flag">
                <span className="label info">
                    <Translate content={"account.user_issued_assets." + name}/>
                </span>
            </span>
        );
    }
}


class Asset extends React.Component {

    static propTypes = {
        backingAsset: ChainTypes.ChainAsset.isRequired
    };

    constructor( props ) {
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
                [this.props.backingAsset.get("id")]: this.props.backingAsset.toJS()
            };

            const isPredictionMarket = this.props.asset.getIn(["bitasset", "is_prediction_market"], false);
            let sqr = this.props.asset.getIn(["bitasset", "current_feed", "maximum_short_squeeze_ratio"]);
            let settlePrice = this.props.asset.getIn(["bitasset", "current_feed", "settlement_price"]);

            /* Prediction markets don't need feeds for shorting, so the settlement price can be set to 1:1 */
            if (isPredictionMarket && settlePrice.getIn(["base", "asset_id"]) === settlePrice.getIn(["quote", "asset_id"])) {
                if (!assets[this.props.backingAsset.get("id")]) assets[this.props.backingAsset.get("id")] = {precision: this.props.asset.get("precision")};
                settlePrice = settlePrice.setIn(["base", "amount"], 1);
                settlePrice = settlePrice.setIn(["base", "asset_id"], this.props.backingAsset.get("id"));
                settlePrice = settlePrice.setIn(["quote", "amount"], 1);
                settlePrice = settlePrice.setIn(["quote", "asset_id"], this.props.asset.get("id"));
                sqr = 1000;
            }
            const feedPrice = new FeedPrice({
                priceObject: settlePrice,
                market_base: this.props.asset.get("id"),
                sqr,
                assets
            });

            Apis.instance().db_api().exec("get_call_orders", [
                this.props.asset.get("id"), 300
            ]).then(call_orders => {
                let callOrders = call_orders.map(c => {
                    return new CallOrder(c, assets, this.props.asset.get("id"), feedPrice, isPredictionMarket);
                });
                this.setState({callOrders});
            });
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
        return ('bitasset' in asset) ?
        (asset.bitasset.is_prediction_market ? 'Prediction' : 'Smart') :
        'Simple';
    }


    renderFlagIndicators(flags, names)
    {
        return (

            <div>
                {names.map((name) => {
                    return <AssetFlag key={`flag_${name}`} name={name} isSet={flags[name]}/>
                })}
            </div>
        );
    }


    renderPermissionIndicators(permissions, names)
    {
        return (
            <div>
                {names.map((name) => {
                    return <AssetPermission key={`perm_${name}`}name={name} isSet={permissions[name]}/>
                })}
            </div>
        );
    }


    formattedPrice(price, hide_symbols=false, hide_value=false) {
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
        return authorities.map(
            function (authority) {
                return (
                    <span>
                        {' '}
                        <LinkToAccountById account={authority}/>
                    </span>
                );
            }
        );
    }


    renderMarketList(asset, markets) {
        var symbol = asset.symbol;
        return markets.map(
            function (market) {
                if (market == symbol)
                return null;
                var marketID = market + '_' + symbol;
                var marketName = market + '/' + symbol;
                return (
                    <span>
                        <Link to={`/market/${marketID}`}>{marketName}</Link> &nbsp;
                    </span>
                );
            }.bind(this)
        );
    }


    renderAboutBox(asset) {
        var issuer = ChainStore.getObject(asset.issuer, false, false);
        var issuerName = issuer ? issuer.get('name') : '';

        var icon = (<Icon name="asset" className="asset" size="4x"/>);


        // Add <a to any links included in the description

        let description = assetUtils.parseDescription(asset.options.description);
        let desc = description.main;
        let short_name = description.short_name ? description.short_name : null;

        let urlTest = /(http?):\/\/(www\.)?[a-z0-9\.:].*?(?=\s)/g;

        // Regexp needs a whitespace after a url, so add one to make sure
        desc = desc && desc.length > 0 ? desc + " " : desc;
        let urls = desc.match(urlTest);

        // Add market link
        const core_asset = ChainStore.getAsset("1.3.0");
        let preferredMarket = description.market ? description.market : core_asset ? core_asset.get("symbol") : "BTS";
        if ("bitasset" in asset && asset.bitasset.is_prediction_market) {
            preferredMarket = ChainStore.getAsset(asset.bitasset.options.short_backing_asset);
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

        let {name, prefix} = utils.replaceName(asset.symbol, "bitasset" in asset && !asset.bitasset.is_prediction_market && asset.issuer === "1.2.0");

        return (
            <div style={{overflow:"visible"}}>
                <HelpContent
                    path = {"assets/" + asset.symbol}
                    alt_path = "assets/Asset"
                    section="summary"
                    symbol={(prefix || "") + name}
                    description={desc}
                    issuer= {issuerName}
                />
                {short_name ? <p>{short_name}</p> : null}
                <a style={{textTransform: "uppercase"}} href={`${__HASH_HISTORY__ ? "#" : ""}/market/${asset.symbol}_${preferredMarket}`}><Translate content="exchange.market"/></a>
            </div>
        );
    }


    renderSummary(asset) {
        // TODO: confidential_supply: 0 USD   [IF NOT ZERO OR NOT DISABLE CONFIDENTIAL]
        var dynamic = asset.dynamic;
        var options = asset.options;

        let flagBooleans = assetUtils.getFlagBooleans(asset.options.flags, this.props.asset.has("bitasset_data_id"));

        let bitNames = Object.keys(flagBooleans);

        var currentSupply = (dynamic) ? (
            <tr>
                <td> <Translate content="explorer.asset.summary.current_supply"/> </td>
                <td> <FormattedAsset amount={dynamic.current_supply} asset={asset.id}/> </td>
            </tr>
        ) : null;

        var stealthSupply = (dynamic) ? (
            <tr>
                <td> <Translate content="explorer.asset.summary.stealth_supply"/> </td>
                <td> <FormattedAsset amount={dynamic.confidential_supply} asset={asset.id}/> </td>
            </tr>
        ) : null;


        var marketFee = flagBooleans["charge_market_fee"] ? (
            <tr>
                <td> <Translate content="explorer.asset.summary.market_fee"/> </td>
                <td> {options.market_fee_percent / 100.0} % </td>
            </tr>
        ) : null;

        // options.max_market_fee initially a string
        var maxMarketFee = flagBooleans["charge_market_fee"] ? (
            <tr>
                <td> <Translate content="explorer.asset.summary.max_market_fee"/> </td>
                <td> <FormattedAsset amount={+options.max_market_fee} asset={asset.id} /> </td>
            </tr>
        ) : null;

        return (
            <div className="asset-card">
                <div className="card-divider"><AssetName name={asset.symbol} /></div>
                <table className="table key-value-table table-hover">
                    <tbody>
                        <tr>
                            <td> <Translate content="explorer.asset.summary.asset_type"/> </td>
                            <td> {this._assetType(asset)} </td>
                        </tr>
                        <tr>
                            <td> <Translate content="explorer.asset.summary.issuer"/> </td>
                            <td> <LinkToAccountById account={asset.issuer}/> </td>
                        </tr>
                        <tr>
                            <td> <Translate content="explorer.assets.precision"/> </td>
                            <td> {asset.precision} </td>
                        </tr>
                        {currentSupply}
                        {stealthSupply}
                        {marketFee}
                        {maxMarketFee}
                    </tbody>
                </table>

                <br/>
                {this.renderFlagIndicators(flagBooleans, bitNames)}
            </div>
        );
    }


    renderPriceFeed(asset) {
        var title = (<Translate content="explorer.asset.price_feed.title"/>);
        var bitAsset = asset.bitasset;
        if (!('current_feed' in bitAsset))
            return ( <div header= {title} /> );
        var currentFeed = bitAsset.current_feed;

        return (
            <div className="asset-card">
                <div className="card-divider">{title}</div>

                <table className="table key-value-table table-hover"  style={{ padding:"1.2rem"}}>
                    <tbody>

                        <tr>
                            <td> <Translate content="explorer.asset.price_feed.settlement_price"/> </td>
                            <td> {this.formattedPrice(currentFeed.settlement_price)} </td>
                        </tr>

                        <tr>
                            <td> <Translate content="explorer.asset.price_feed.maintenance_collateral_ratio"/> </td>
                            <td> {currentFeed.maintenance_collateral_ratio/10}% </td>
                        </tr>

                        <tr>
                            <td> <Translate content="explorer.asset.price_feed.maximum_short_squeeze_ratio"/> </td>
                            <td> {currentFeed.maximum_short_squeeze_ratio/10}% </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }


    renderFeePool(asset) {
        var dynamic = asset.dynamic;
        var options = asset.options;
        return (
            <div className="asset-card">
                <div className="card-divider">{(<Translate content="explorer.asset.fee_pool.title"/>)}</div>
                <table className="table key-value-table" style={{ padding:"1.2rem"}}>
                    <tbody>
                        <tr>
                            <td> <Translate content="explorer.asset.fee_pool.core_exchange_rate"/> </td>
                            <td> {this.formattedPrice(options.core_exchange_rate)} </td>
                        </tr>
                        <tr>
                            <td> <Translate content="explorer.asset.fee_pool.pool_balance"/> </td>
                            <td> {dynamic ? <FormattedAsset asset="1.3.0" amount={dynamic.fee_pool} /> : null} </td>
                        </tr>
                        <tr>
                            <td> <Translate content="explorer.asset.fee_pool.unclaimed_issuer_income"/> </td>
                            <td> {dynamic ? <FormattedAsset asset={asset.id} amount={dynamic.accumulated_fees} /> : null} </td>
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

        let permissionBooleans = assetUtils.getFlagBooleans(asset.options.issuer_permissions, this.props.asset.has("bitasset_data_id"));

        let bitNames = Object.keys(permissionBooleans);

        // options.blacklist_authorities = ["1.2.3", "1.2.4"];
        // options.whitelist_authorities = ["1.2.1", "1.2.2"];
        // options.blacklist_markets = ["JPY", "RUB"];
        // options.whitelist_markets = ["USD", "EUR", "GOLD"];

        // options.max_market_fee initially a string
        var maxMarketFee = permissionBooleans["charge_market_fee"] ? (
            <tr>
                <td> <Translate content="explorer.asset.permissions.max_market_fee"/> </td>
                <td> <FormattedAsset amount={+options.max_market_fee} asset={asset.id} /> </td>
            </tr>
        ) : null;

        // options.max_supply initially a string
        var maxSupply = (
            <tr>
                <td> <Translate content="explorer.asset.permissions.max_supply"/> </td>
                <td> <FormattedAsset amount={+options.max_supply} asset={asset.id} /> </td>
            </tr>
        );

        var whiteLists = permissionBooleans["white_list"] ? (
            <span>
                <br/>
                <Translate content="explorer.asset.permissions.blacklist_authorities"/>:
                &nbsp;{this.renderAuthorityList(options.blacklist_authorities)}
                <br/>
                <Translate content="explorer.asset.permissions.blacklist_markets"/>:
                &nbsp;{this.renderMarketList(asset, options.blacklist_markets)}
                <br/>
                <Translate content="explorer.asset.permissions.whitelist_authorities"/>:
                &nbsp;{this.renderAuthorityList(options.whitelist_authorities)}
                <br/>
                <Translate content="explorer.asset.permissions.whitelist_markets"/>:
                &nbsp;{this.renderMarketList(asset, options.whitelist_markets)}
            </span>
        ) : null;

        return (
            <div className="asset-card">
                <div className="card-divider">{(<Translate content="explorer.asset.permissions.title"/>)} </div>
                <table className="table key-value-table table-hover" style={{ padding:"1.2rem"}}>
                    <tbody>
                        {maxMarketFee}
                        {maxSupply}
                    </tbody>
                </table>

                <br/>
                {this.renderPermissionIndicators(permissionBooleans, bitNames)}
                <br/>

                {/*whiteLists*/}
            </div>
        );
    }


    renderPriceFeedData(asset) {

        var bitAsset = asset.bitasset;
        if (!('feeds' in bitAsset) || bitAsset.feeds.length == 0 || bitAsset.is_prediction_market) {
            return null;
        }

        let now = new Date().getTime();
        let oldestValidDate = new Date(now - asset.bitasset.options.feed_lifetime_sec * 1000);

        // Filter by valid feed lifetime, Sort by published date
        var feeds = bitAsset.feeds;
        feeds = feeds
        .filter(a => {
            return new Date(a[1][0]) > oldestValidDate;
        })
        .sort(function(feed1, feed2){
            return new Date(feed2[1][0]) - new Date(feed1[1][0])
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
                    <th style={{textAlign: "left"}}> <Translate content="explorer.asset.price_feed_data.publisher"/> </th>
                    <th>
                        <Translate content="explorer.asset.price_feed_data.settlement_price"/>
                        <br />
                        ({this.formattedPrice(settlement_price_header, false, true)})
                    </th>
                    <th>
                        <Translate content="explorer.asset.price_feed_data.core_exchange_rate"/>
                        <br />
                        ({this.formattedPrice(core_exchange_rate_header, false, true)})
                    </th>
                    <th> <Translate content="explorer.asset.price_feed_data.maintenance_collateral_ratio"/> </th>
                    <th> <Translate content="explorer.asset.price_feed_data.maximum_short_squeeze_ratio"/> </th>
                    <th> <Translate content="explorer.asset.price_feed_data.published"/> </th>
                </tr>
            </thead>
        )
        for (var i = 0; i < feeds.length; i++) {
            var feed = feeds[i];
            var publisher = feed[0];
            var publishDate = new Date(feed[1][0]);
            var settlement_price = feed[1][1].settlement_price;
            var core_exchange_rate = feed[1][1].core_exchange_rate;
            var maintenance_collateral_ratio = '' + feed[1][1].maintenance_collateral_ratio/10 + '%';
            var maximum_short_squeeze_ratio = '' + feed[1][1].maximum_short_squeeze_ratio/10 + '%';
            rows.push(
                <tr key={publisher}>
                    <td> <LinkToAccountById account={publisher}/> </td>
                    <td style={{textAlign: "right"}}>{this.formattedPrice(settlement_price, true)}</td>
                    <td style={{textAlign: "right"}}> {this.formattedPrice(core_exchange_rate, true)} </td>
                    <td style={{textAlign:"right"}}> {maintenance_collateral_ratio}</td>
                    <td style={{textAlign:"right"}}> {maximum_short_squeeze_ratio}</td>
                    <td style={{textAlign: "right"}}><TimeAgo time={publishDate}/></td>
                </tr>
            );
        }

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
                return (sortDirection ? 1 : -1) * (a.call_price.toReal() - b.call_price.toReal());
            },
            collateral: function(a, b) {
                return (sortDirection ? 1 : -1) * (b.getCollateral().getAmount() - a.getCollateral().getAmount());
            },
            debt: function(a, b) {
                return (sortDirection ? 1 : -1) * (b.amountToReceive().getAmount() - a.amountToReceive().getAmount());
            },
            ratio: function(a, b) {
                return (sortDirection ? 1 : -1) * (a.getRatio() - b.getRatio());
            }
        };

        return (
            <div className="grid block small-12 " style={{ overflow:"visible"}}>
                <div className="grid-content no-padding">
                    <div className="asset-card">
                        <Tabs defaultActiveTab={0} segmented={false} setting="bitassetDataTabs">
                            <Tab title="explorer.asset.price_feed_data.title">
                                <table className=" table order-table table-hover" style={{ padding:"1.2rem"}}>
                                    {header}
                                    <tbody>
                                        {rows}
                                    </tbody>
                                </table>
                            </Tab>

                            <Tab title="explorer.asset.margin_positions.title">
                                <table className=" table order-table table-hover" style={{ padding:"1.2rem"}}>
                                    <thead>
                                        <tr>
                                            <th className="clickable" onClick={this._toggleSortOrder.bind(this, "name")}style={{textAlign: "left"}}>
                                                <Translate content="transaction.borrower" />
                                            </th>
                                            <th className="clickable" onClick={this._toggleSortOrder.bind(this, "collateral")}>
                                                <Translate content="transaction.collateral" />
                                                {this.state.callOrders.length ? <span>&nbsp;(<FormattedAsset
                                                    amount={this.state.callOrders[0].getCollateral().getAmount()}
                                                    asset={this.state.callOrders[0].getCollateral().asset_id}
                                                    hide_amount
                                                /> )</span> : null}
                                            </th>
                                            <th className="clickable" onClick={this._toggleSortOrder.bind(this, "debt")}>
                                                <Translate content="transaction.borrow_amount" />
                                                {this.state.callOrders.length ? <span>&nbsp;(<FormattedAsset
                                                    amount={this.state.callOrders[0].amountToReceive().getAmount()}
                                                    asset={this.state.callOrders[0].amountToReceive().asset_id}
                                                    hide_amount
                                                /> )</span> : null}
                                            </th>
                                            <th style={{paddingRight: 10}} className="clickable">
                                                <span onClick={this._toggleSortOrder.bind(this, "price")}>
                                                    <Translate content="exchange.call" />
                                                </span>
                                                {this.state.callOrders.length ? <span>&nbsp;(<FormattedPrice
                                                    base_amount={this.state.callOrders[0].call_price.base.amount}
                                                    base_asset={this.state.callOrders[0].call_price.base.asset_id}
                                                    quote_amount={this.state.callOrders[0].call_price.quote.amount}
                                                    quote_asset={this.state.callOrders[0].call_price.quote.asset_id}
                                                    hide_value
                                                    noPopOver
                                                />)</span> : null}
                                            </th>
                                            <th className="clickable" onClick={this._toggleSortOrder.bind(this, "ratio")}>
                                                <Translate content="borrow.coll_ratio" />
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.callOrders
                                            .sort(sortFunctions[this.state.marginTableSort])
                                            .map(c => {
                                                return (
                                                    <tr className="margin-row" key={c.id}>
                                                        <td><LinkToAccountById account={c.borrower} /></td>
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
                                            })}
                                    </tbody>
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
        var priceFeed = ('bitasset' in asset) ? this.renderPriceFeed(asset) : null;
        var priceFeedData = ('bitasset' in asset) ? this.renderPriceFeedData(asset) : null;

        //console.log("This: ", this);
        // console.log("Asset: ", asset); //TODO Remove

        return (
            <div className="grid-block page-layout">
                <div className="grid-block main-content vertical" style={{overflow:"visible"}}>
                    <div className="grid-container">
                        <div className="grid-content">
                            <div className="grid-block no-margin small-12 shrink" style={{ overflow:"visible"}}>
                                {this.renderAboutBox(asset)}
                            </div>
                            <div className="grid-block no-margin small-12 shrink vertical medium-horizontal" style={{ overflow:"visible"}}>
                                <div className="small-12 medium-6" style={{overflow:"visible"}}>
                                    {this.renderSummary(asset)}
                                </div>
                                <div className="small-12 medium-6" style={{overflow:"visible"}}>
                                    {priceFeed ? priceFeed : this.renderPermissions(asset)}
                                </div>
                            </div>
                            <div className="grid-block no-margin small-12 shrink vertical medium-horizontal" style={{ overflow:"visible"}}>
                                <div className="small-12 medium-6" style={{overflow:"visible"}}>
                                    {this.renderFeePool(asset)}
                                </div>
                                <div className="small-12 medium-6" style={{overflow:"visible"}}>
                                    {priceFeed ? this.renderPermissions(asset) : null}
                                </div>
                            </div>

                            {priceFeedData}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

Asset = BindToChainState(Asset, {keep_updating: true});
class AssetContainer extends React.Component {
    static propTypes = {
        asset: ChainTypes.ChainAsset.isRequired
    }

    render() {
        let backingAsset = this.props.asset.has("bitasset") ? this.props.asset.getIn(["bitasset", "options", "short_backing_asset"]) : "1.3.0";
        return <Asset {...this.props} backingAsset={backingAsset}/>;
    }
}
AssetContainer = BindToChainState(AssetContainer, {keep_updating: true});

export default class AssetSymbolSplitter extends React.Component {

    render() {
        let symbol = this.props.params.symbol;
        return <AssetContainer {...this.props} asset={symbol}/>;
    }
};
