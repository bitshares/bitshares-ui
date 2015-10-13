import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import AssetActions from "actions/AssetActions";
import Translate from "react-translate-component";
import Inspector from "react-json-inspector";
import LinkToAccountById from "./LinkToAccountById";
import LoadingIndicator from "../LoadingIndicator";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import TimeAgo from "../Utility/TimeAgo";
import Box from "../Utility/Box";
import HelpContent from "../Utility/HelpContent";
import Icon from "../Icon/Icon";
require("./json-inspector.scss");


//-------------------------------------------------------------
// TODO: Capitalize?
var chargeMarketFeeBit =      0x01;
var allowWhiteListBit =       0x02;
var allowIssuerOverrideBit =  0x04;
var restrictTransfersBit =    0x08;
var allowForceSettleBit =     0x10;
var allowGlobalSettleBit =    0x20;
var allowStealthTransferBit = 0x40;


function permissionName(bit) {
    /* enum asset_issuer_permission_flags
     {
     charge_market_fee    = 0x01, //< an issuer-specified percentage of all market trades in this asset is paid to the issuer
     white_list           = 0x02, //< accounts must be whitelisted in order to hold this asset
     override_authority   = 0x04, //< issuer may transfer asset back to himself
     transfer_restricted  = 0x08, //< require the issuer to be one party to every transfer
     disable_force_settle = 0x10, //< disable force settling
     global_settle        = 0x20, //< allow the bitasset issuer to force a global settling -- this may be set in permissions, but not flags
     disable_confidential = 0x40  //< allow the asset to be used with confidential transactions
     };
     */
    var name = {
        0x01 : "chargeMarketFee",
        0x02 : "allowWhiteList",
        0x04 : "allowIssuerOverride",
        0x08 : "restrictTransfers",
        0x10 : "allowForceSettle",
        0x20 : "allowGlobalSettle",
        0x40 : "allowStealthTransfer",
    };
    //FIXME if bit not in name
    return (<Translate content={"explorer.asset.permissions." + name[bit]}/>);
}


function permissionSet(asset, bit) {
    var inverted = [allowForceSettleBit, allowGlobalSettleBit]; // 'disable' settings that values are inverted
    var mask = asset.options.flags;
    var value = mask & bit > 0;
    if ([chargeMarketFeeBit, allowWhiteListBit].indexOf(bit) > -1) return true; // FIXME: Remove hardcoded
    if (inverted.indexOf(bit) > -1)
        return  !value;
    return value;
}


function permissionAllowed(asset, bit) {
    var mask = asset.options.issuer_permissions;
    return mask & bit > 0;
}


class AssetFlag extends React.Component {
    render()
    {
        if (!permissionSet(this.props.asset, this.props.bit)) {
            return ( <span></span> );
        }

        return (
            <span>
                <span className="label success asset-label">
                    {permissionName(this.props.bit)}
                </span>
                {' '}
            </span>
        );
    }
}


//-------------------------------------------------------------
class AssetPermission extends React.Component {
    render()
    {
        if (!permissionAllowed(this.props.asset, this.props.bit)) {
            return ( <span></span> );
        }

        return (
            <span>
                <span className="label info asset-label">
                    {permissionName(this.props.bit)}
                </span>
                {' '}
            </span>
        );
    }
}


@BindToChainState({keep_updating: true})
class Asset extends React.Component {

    static propTypes = {
        asset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        asset: "props.symbol"
    };

    constructor( props ) {
        super(props);
    }


/*
    onCheckbox(name, e)
    {
        alert('set ' + name + ' to ' + e.target.checked);
    }


    setting(permission)
    {
        // TODO: on/off slider grey if no permission
        return (
            <span >
                <input type="checkbox"
                       checked={permission.value}
                       disabled={permission.disabled ? "disabled" : false}
                       onChange={this.onCheckbox.bind(this, permission.name)}
                    />
                {' ' + permission.name}
                <br/>
            </span>
        );
    }
*/


/*
    assetHeader() {
     //this.header_image = "http://theeconomiccollapseblog.com/wp-content/uploads/2012/03/10-Reasons-Why-The-Reign-Of-The-Dollar-As-The-World-Reserve-Currency-Is-About-To-Come-To-An-End.jpg";
        // TODO: use images from the bundle
        return (
            <div className="grid-block small-12 medium-10 medium-offset-2" style={{overflow:"visible"}}>
                <img src={this.header_image} style={{maxWidth:"1000px", width:"100%", height:"auto"}}/>
            </div>
        );
    }
*/

    _assetType(asset) {
        return ('bitasset' in asset) ?
               (asset.bitasset.is_prediction_market ? 'Prediction' : 'Smart') :
               'Simple';
    }


    renderFlagIndicators(asset)
    {
        return (
            <div>
                <AssetFlag asset={asset} bit={chargeMarketFeeBit}/>
                <AssetFlag asset={asset} bit={allowWhiteListBit}/>
                <AssetFlag asset={asset} bit={allowIssuerOverrideBit}/>
                <AssetFlag asset={asset} bit={restrictTransfersBit}/>
                <AssetFlag asset={asset} bit={allowForceSettleBit}/>
                <AssetFlag asset={asset} bit={allowGlobalSettleBit}/>
                <AssetFlag asset={asset} bit={allowStealthTransferBit}/>
            </div>
        );
    }


    renderPermissionIndicators(asset)
    {
        return (
            <div>
                <AssetPermission asset={asset} bit={chargeMarketFeeBit}/>
                <AssetPermission asset={asset} bit={allowWhiteListBit}/>
                <AssetPermission asset={asset} bit={allowIssuerOverrideBit}/>
                <AssetPermission asset={asset} bit={restrictTransfersBit}/>
                <AssetPermission asset={asset} bit={allowForceSettleBit}/>
                <AssetPermission asset={asset} bit={allowGlobalSettleBit}/>
                <AssetPermission asset={asset} bit={allowStealthTransferBit}/>
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
                    return '';
                var marketID = market + '_' + symbol;
                var marketName = market + '/' + symbol;
                return (
                    <span>
                        <Link to="exchange" params={{marketID:marketID}}>{marketName}</Link>
                        {' '}
                    </span>
                );
            }.bind(this)
        );
    }


    renderAboutBox(asset) {
        var issuer = ChainStore.getObject(asset.issuer);
        var issuerName = issuer ? issuer.get('name') : '';

        var icon = (<Icon name="assets" className="asset" size="3x"/>);
        var help = (

            <HelpContent
                path = {"assets/" + asset.symbol}
                alt_path = "assets/Asset"
                section="summary"
                symbol= {asset.symbol}
                description={asset.options.description}
                issuer= {issuerName}
            />
        );

        return (
            <Box>
                <div className="grid-block" style={{overflow:"visible"}}>

                    <div className="grid-block small-11" style={{overflow:"visible"}}>
                        <span style={{marginLeft:"24px"}}>{help}</span>
                    </div>
                    <div className="grid-block small-1" style={{overflow:"visible"}}>
                        {icon}
                    </div>
                </div>
            </Box>
        );
    }


    renderSummary(asset) {
        // TODO: confidential_supply: 0 USD   [IF NOT ZERO OR NOT DISABLE CONFIDENTIAL]
        var dynamic = asset.dynamic;
        var options = asset.options;

        var currentSupply = (dynamic) ? (
            <tr>
                <td> <Translate content="explorer.asset.summary.current_supply"/> </td>
                <td> <FormattedAsset amount={dynamic.current_supply} asset={asset.id}/> </td>
            </tr>
        ) : '';

        var stealthSupply = (dynamic) ? (
            <tr>
                <td> <Translate content="explorer.asset.summary.stealth_supply"/> </td>
                <td> <FormattedAsset amount={dynamic.confidential_supply} asset={asset.id}/> </td>
            </tr>
        ) : '';


        var marketFee = (permissionSet(asset, chargeMarketFeeBit)) ? (
            <tr>
                <td> <Translate content="explorer.asset.summary.market_fee"/> </td>
                <td> {options.market_fee_percent / 100.0} % </td>
            </tr>
        ) : '';

        // options.max_market_fee initially a string
        var maxMarketFee = (permissionSet(asset, chargeMarketFeeBit)) ? (
            <tr>
                <td> <Translate content="explorer.asset.summary.max_market_fee"/> </td>
                <td> <FormattedAsset amount={+options.max_market_fee} asset={asset.id} /> </td>
            </tr>
        ) : '';

        return (
            <Box header= {asset.symbol}>
                {options.description}
                <br/>
                <br/>

                <table className="table key-value-table">
                    <tr>
                        <td> <Translate content="explorer.asset.summary.asset_type"/> </td>
                        <td> {this._assetType(asset)} </td>
                    </tr>
                    <tr>
                        <td> <Translate content="explorer.asset.summary.issuer"/> </td>
                        <td> <LinkToAccountById account={asset.issuer}/> </td>
                    </tr>
                    {currentSupply}
                    {stealthSupply}
                    {marketFee}
                    {maxMarketFee}
                </table>

                <br/>
                {this.renderFlagIndicators(asset)}
            </Box>
        );
    }


    renderPriceFeed(asset) {
        var title = (<Translate content="explorer.asset.price_feed.title"/>);
        var bitAsset = asset.bitasset;

        if (!('current_feed' in bitAsset))
            return ( <Box header= {title} /> );
        var currentFeed = bitAsset.current_feed;

        return (
            <Box accordian="true" header= {title} >
                <table className="table key-value-table">
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
                </table>
            </Box>
        );
    }


    renderFeePool(asset) {
        var dynamic = asset.dynamic;
        var options = asset.options;
        return (
            <Box accordian="true" header= {(<Translate content="explorer.asset.fee_pool.title"/>)} >
                <table className="table key-value-table">
                    <tr>
                        <td> <Translate content="explorer.asset.fee_pool.core_exchange_rate"/> </td>
                        <td> {this.formattedPrice(options.core_exchange_rate)} </td>
                    </tr>
                    <tr>
                        <td> <Translate content="explorer.asset.fee_pool.pool_balance"/> </td>
                        <td> {dynamic ? dynamic.fee_pool : ''} </td>
                    </tr>
                    <tr>
                        <td> <Translate content="explorer.asset.fee_pool.unclaimed_issuer_income"/> </td>
                        <td> {dynamic ? dynamic.accumulated_fees : ''} </td>
                    </tr>
                </table>
            </Box>
        );
    }


    // TODO: Blacklist Authorities: <Account list like Voting>
     // TODO: Blacklist Market: Base/Market, Base/Market
    renderPermissions(asset) {
        //var dynamic = asset.dynamic;

        var options = asset.options;

        options.blacklist_authorities = ["1.2.3", "1.2.4"];
        options.whitelist_authorities = ["1.2.1", "1.2.2"];
        options.blacklist_markets = ["JPY", "RUB"];
        options.whitelist_markets = ["USD", "EUR", "GOLD"];

        // options.max_market_fee initially a string
        var maxMarketFee = (permissionSet(asset, chargeMarketFeeBit)) ? (
            <tr>
                <td> <Translate content="explorer.asset.permissions.max_market_fee"/> </td>
                <td> <FormattedAsset amount={+options.max_market_fee} asset={asset.id} /> </td>
            </tr>
        ) : '';

        // options.max_supply initially a string
        var maxSupply = (
            <tr>
                <td> <Translate content="explorer.asset.permissions.max_supply"/> </td>
                <td> <FormattedAsset amount={+options.max_supply} asset={asset.id} /> </td>
            </tr>
        );

        var whiteLists = (permissionSet(asset, allowWhiteListBit)) ? (
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
        ) : '';

        return (
            <Box accordian="true" header= {(<Translate content="explorer.asset.permissions.title"/>)} >
                <table className="table key-value-table">
                    {maxMarketFee}
                    {maxSupply}
                </table>

                <br/>
                {this.renderPermissionIndicators(asset)}
                <br/>

                {whiteLists}
            </Box>
        );
    }


    renderPriceFeedData(asset) {

        var bitAsset = asset.bitasset;
        if (!('feeds' in bitAsset) || bitAsset.feeds.length == 0) {
            return '';
        }

        // Sort by published date
        var feeds = bitAsset.feeds;
        feeds.sort(function(feed1, feed2){
            if (feed1[1][0] < feed2[1][0]) {
                return 1;
            }
            if (feed1[1][0] > feed2[1][0]) {
                return -1;
            }
            return 0;
        })

        var rows = [];
        var settlement_price_header = feeds[0][1][1].settlement_price;
        var core_exchange_rate_header = feeds[0][1][1].core_exchange_rate;
        rows.push(
            <tr>
                <th> <Translate content="explorer.asset.price_feed_data.settlement_price"/> <br/>
                      {this.formattedPrice(settlement_price_header, false, true)}</th>
                <th> <Translate content="explorer.asset.price_feed_data.core_exchange_rate"/> <br/>
                     {this.formattedPrice(core_exchange_rate_header, false, true)} </th>
                <th> <Translate content="explorer.asset.price_feed_data.maintenance_collateral_ratio"/> </th>
                <th> <Translate content="explorer.asset.price_feed_data.maximum_short_squeeze_ratio"/> </th>
                <th> <Translate content="explorer.asset.price_feed_data.publisher"/> </th>
                <th> <Translate content="explorer.asset.price_feed_data.published"/> </th>
            </tr>
        )
        for (var i = 0; i < feeds.length; i++) {
            var feed = feeds[i];
            var publisher = feed[0];
            var publishDate = feed[1][0];
            var settlement_price = feed[1][1].settlement_price;
            var core_exchange_rate = feed[1][1].core_exchange_rate;
            var maintenance_collateral_ratio = '' + feed[1][1].maintenance_collateral_ratio/10 + '%';
            var maximum_short_squeeze_ratio = '' + feed[1][1].maximum_short_squeeze_ratio/10 + '%';
            rows.push(
                <tr>
                    <td>{this.formattedPrice(settlement_price, true)}</td>
                    <td> {this.formattedPrice(core_exchange_rate, true)} </td>
                    <td style={{textAlign:"center"}}> {maintenance_collateral_ratio}</td>
                    <td style={{textAlign:"center"}}> {maximum_short_squeeze_ratio}</td>
                    <td> <LinkToAccountById account={publisher}/> </td>
                    <td><TimeAgo time={publishDate}/></td>
                </tr>
            );
        }

        return (
            <Box accordian="true" header= {(<Translate content="explorer.asset.price_feed_data.title"/>)}>
                <table className="table">
                    {rows}
                </table>
            </Box>
        );
    }


    render()
    {
        var asset = this.props.asset.toJS();
        var priceFeed = ('bitasset' in asset) ? this.renderPriceFeed(asset) : '';
        var priceFeedData = ('bitasset' in asset) ? this.renderPriceFeedData(asset) : '';

        //console.log("This: ", this);
        console.log("Asset: ", asset); //TODO Remove

        // <div className="grid-block small-10 small-offset-1" style={{overflow:"visible"}}>
        return (
            <div className="grid-block page-layout vertical medium-horizontal">
                <div className="grid-block vertical" style={{overflow:"visible"}}>

                    {this.renderAboutBox(asset)}

                    <div className="grid-block" style={{padding:0, overflow:"visible"}}>
                        <div className="grid-block vertical" style={{overflow:"visible"}}>
                            {this.renderSummary(asset)}
                            {priceFeed}
                        </div>

                        <div className="grid-block vertical" style={{overflow:"visible"}}>
                            {this.renderFeePool(asset)}
                            {this.renderPermissions(asset)}
                         </div>
                    </div>

                    {priceFeedData}

                </div>
            </div>
        );
    }
}

/*
Asset.defaultProps = {
    assets: {},
    accounts: {},
    asset_symbol_to_id: {}
};

Asset.propTypes = {
    assets: PropTypes.object.isRequired,
    accounts: PropTypes.object.isRequired,
    asset_symbol_to_id: PropTypes.object.isRequired
};
Asset.contextTypes = { router: React.PropTypes.func.isRequired };
*/

export default Asset;
