import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import AssetActions from "actions/AssetActions";
import Translate from "react-translate-component";
import Inspector from "react-json-inspector";
import LinkToAccountById from "./LinkToAccountById";
import LoadingIndicator from "../LoadingIndicator";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import Box from "./../Utility/Box";
import HelpContent from "./../Utility/HelpContent";
import Icon from "../Icon/Icon";
require("./json-inspector.scss");


//-------------------------------------------------------------
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
                <span className="label success">
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
                <span className="label info">
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

        var maxMarketFee = (permissionSet(asset, chargeMarketFeeBit)) ? (
            <tr>
                <td> <Translate content="explorer.asset.summary.max_market_fee"/> </td>
                <td> <FormattedAsset amount={options.max_market_fee} asset={asset.id} /> </td>
            </tr>
        ) : '';

        return (
            <Box header= {asset.symbol}>
                {options.description}

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


    renderMarkets(asset) {
        var USD = '1.3.626';
        var EUR = '1.3.424';
        var GOLD = '1.3.460';

        return (
            <Box header='Markets'>
                <ul>
                    <li> <FormattedPrice base_amount={1.1} base_asset={asset.id} quote_amount={1.0} quote_asset={USD} /> </li>
                    <li> <FormattedPrice base_amount={1.2} base_asset={asset.id} quote_amount={1.0} quote_asset={EUR} /> </li>
                    <li> <FormattedPrice base_amount={1.3} base_asset={asset.id} quote_amount={1.0} quote_asset={GOLD} /> </li>
                </ul>
            </Box>
        );
    }


    formattedPrice(price) {
        var base = price.base;
        var quote = price.quote;
        return (
            <FormattedPrice
                base_asset={base.asset_id}
                base_amount={base.amount}
                quote_asset={quote.asset_id}
                quote_amount={quote.amount}
            />
        );
    }


    renderFeePool(asset) {
        var dynamic = asset.dynamic;
        var options = asset.options;
        return (
            <Box header= {(<Translate content="explorer.asset.fee_pool.fee_pool"/>)} >
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

        var maxMarketFee = (permissionSet(asset, chargeMarketFeeBit)) ? (
            <tr>
                <td> <Translate content="explorer.asset.permissions.max_market_fee"/> </td>
                <td> <FormattedAsset amount={options.max_market_fee} asset={asset.id} /> </td>
            </tr>
        ) : '';

        var maxSupply = (
            <tr>
                <td> <Translate content="explorer.asset.permissions.max_supply"/> </td>
                <td> <FormattedAsset amount={options.max_supply} asset={asset.id} /> </td>
            </tr>
        );

        var whiteLists = (permissionSet(asset, allowWhiteListBit)) ? (
            <span>
                <br/> <Translate content="explorer.asset.permissions.blacklist_authorities"/>: {options.blacklist_authorities}
                <br/> <Translate content="explorer.asset.permissions.blacklist_markets"/>:     {options.blacklist_markets}
                <br/> <Translate content="explorer.asset.permissions.whitelist_authorities"/>: {options.whitelist_authorities}
                <br/> <Translate content="explorer.asset.permissions.whitelist_markets"/>:     {options.whitelist_markets}
            </span>
        ) : '';

        return (
            <Box header= {(<Translate content="explorer.asset.permissions.permissions"/>)} >
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


    renderPriceFeed(asset) {
        var bitAsset = asset.bitasset;
        if (!('current_feed' in bitAsset)) return (<span>NO CURRENT_FEED</span>);
        var currentFeed = bitAsset.current_feed;
        return (
            <Box header= {(<Translate content="explorer.asset.price_feed.price_feed"/>)} >
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


    renderAboutBox(asset) {
        return (
            <Box>
                <Icon name="piggy" size="5x" fillClass="fill-black"/>
                <HelpContent
                    path="assets/Asset"
                    section="summary"
                    symbol= {asset.symbol}
                    description={asset.options.description}
                    issuer= {asset.issuer}
                />
            </Box>
        );
    }


    render()
    {
        //console.log("This: ", this);
        console.log("Asset: ", asset); //TODO Remove

        var asset = this.props.asset.toJS();
        var priceFeed = ('bitasset' in asset) ? this.renderPriceFeed(asset) : '';
        var markets = false ? this.renderMarkets(asset) : '';

        return (
            <div>
                <div className="grid-block page-layout vertical medium-horizontal">
                    <div className="grid-block vertical" style={{overflow:"visible"}}>

                        {this.renderAboutBox(asset)}

                        {/*<div className="grid-block small-10 small-offset-1" style={{overflow:"visible"}}>*/}
                        <div className="grid-block" style={{overflow:"visible"}}>
                            <div className="grid-block vertical" style={{overflow:"visible"}}>
                                {this.renderSummary(asset)}
                                {markets}
                                {priceFeed}
                            </div>

                            <div className="grid-block vertical" style={{overflow:"visible"}}>
                                {this.renderFeePool(asset)}
                                {this.renderPermissions(asset)}
                             </div>
                        </div>
                    </div>
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
