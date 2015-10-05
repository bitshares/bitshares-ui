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


    //-------------------------------------------------------------
    pfactory(name, bit, valueMask, permissionMask) {
        return {
            name: name,
            value: valueMask & bit > 0,
            disable: permissionMask & bit > 0,
        };
    }


    flagIndicator(permission) {
        if (!permission.value) {
            return ( <span></span> );
        }

        return (
            <span>
                <span className="label success">
                    {permission.name}
                </span>
                {' '}
            </span>
        );
    }


    permissionIndicator(permission) {
        if (permission.disabled) {
            return ( <span></span> );
        }

        return (
            <span>
                <span className="label info">
                    {permission.name}
                </span>
                {' '}
            </span>
        );
    }


    assetPermissions(asset)
    {
        var valueMask = asset.options.flags;
        var permissionMask = asset.options.issuer_permissions;
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
        var perms = {
            // TODO Refactor out asset.permisions
            chargeMarketFee:      this.pfactory(<Translate content="explorer.asset.permissions.chargeMarketFee"/> ,      0x01, valueMask, permissionMask),
            allowWhiteList:       this.pfactory(<Translate content="explorer.asset.permissions.allowWhiteList"/> ,       0x02, valueMask, permissionMask),
            allowIssuerOverride:  this.pfactory(<Translate content="explorer.asset.permissions.allowIssuerOverride"/> ,  0x04, valueMask, permissionMask),
            restrictTransfers:    this.pfactory(<Translate content="explorer.asset.permissions.restrictTransfers"/> ,    0x08, valueMask, permissionMask),
            allowForceSettle:     this.pfactory(<Translate content="explorer.asset.permissions.allowForceSettle"/> ,     0x10, ~valueMask, permissionMask),
            allowGlobalSettle:    this.pfactory(<Translate content="explorer.asset.permissions.allowGlobalSettle"/> ,    0x20, valueMask, permissionMask),
            allowStealthTransfer: this.pfactory(<Translate content="explorer.asset.permissions.allowStealthTransfer"/> , 0x40, ~valueMask, permissionMask),
        }

        // FIXME: Remove
        perms.chargeMarketFee.value = true;
        perms.allowWhiteList.value = true;

        return perms;
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


    renderPermissionSettings(perms)
    {
        return (
            <div>
                <table className="table key-value-table">
                  <thead>
                  <tr>
                      <th><h4>Set Permission</h4></th>
                      <th></th>
                  </tr>
                  </thead>
                <tr>
                  <td><Translate content="explorer.asset.charge_market_fee"/></td>
                  <td>({value&0x01>0} {permission&0x01>0})</td>
                </tr>
                <tr>
                  <td><Translate content="explorer.asset.white_list"/></td>
                  <td>({value&0x02>0} {permission&0x02>0})</td>
                </tr>
                <tr>
                  <td><Translate content="explorer.asset.override_authority"/></td>
                  <td>({value&0x04>0} {permission&0x04>0})</td>
                </tr>
                <tr>
                  <td><Translate content="explorer.asset.transfer_restricted"/></td>
                  <td>({value&0x08>0} {permission&0x08>0})</td>
                </tr>
                <tr>
                  <td><Translate content="explorer.asset.disable_force_settle"/></td>
                  <td>({value&0x10>0} {permission&0x10>0})</td>
                </tr>
                <tr>
                  <td><Translate content="explorer.asset.global_settle"/></td>
                  <td>({value&0x20>0} {permission&0x20>0})</td>
                </tr>
                <tr>
                  <td><Translate content="explorer.asset.disable_confidential"/></td>
                  <td>({value&0x40>0} {permission&0x40>0})</td>
                </tr>

                {this.setting(perms.chargeMarketFee)}
                {this.setting(perms.allowWhiteList)}
                {this.setting(perms.allowIssuerOverride)}
                {this.setting(perms.restrictTransfers)}
                {this.setting(perms.allowForceSettle)}
                {this.setting(perms.allowGlobalSettle)}
                {this.setting(perms.allowStealthTransfer)}
            </table>
            </div>
        );
    }
*/


    renderFlagIndicators(perms)
    {
        return (
            <div>
                {this.flagIndicator(perms.chargeMarketFee)}
                {this.flagIndicator(perms.allowWhiteList)}
                {this.flagIndicator(perms.allowIssuerOverride)}
                {this.flagIndicator(perms.restrictTransfers)}
                {this.flagIndicator(perms.allowForceSettle)}
                {this.flagIndicator(perms.allowGlobalSettle)}
                {this.flagIndicator(perms.allowStealthTransfer)}
            </div>
        );
    }


    renderPermissionIndicators(perms)
    {
        return (
            <div>
                {this.permissionIndicator(perms.chargeMarketFee)}
                {this.permissionIndicator(perms.allowWhiteList)}
                {this.permissionIndicator(perms.allowIssuerOverride)}
                {this.permissionIndicator(perms.restrictTransfers)}
                {this.permissionIndicator(perms.allowForceSettle)}
                {this.permissionIndicator(perms.allowGlobalSettle)}
                {this.permissionIndicator(perms.allowStealthTransfer)}
            </div>
        );
    }
    //-------------------------------------------------------------


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


    renderSummary(asset, perms) {
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


        var marketFee = (perms.chargeMarketFee.value) ? (
            <tr>
                <td> <Translate content="explorer.asset.summary.market_fee"/> </td>
                <td> {options.market_fee_percent / 100.0} % </td>
            </tr>
        ) : '';

        var maxMarketFee = (perms.chargeMarketFee.value) ? (
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
                {this.renderFlagIndicators(perms)}
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
    renderPermissions(asset, perms) {
        //var dynamic = asset.dynamic;



        var options = asset.options;

        var maxMarketFee = (perms.chargeMarketFee.value) ? (
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

        var whiteLists = perms.allowWhiteList.value ? (
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
                {this.renderPermissionIndicators(perms)}
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


    assetAboutBox(asset) {
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
        var asset = this.props.asset.toJS();
        var perms = this.assetPermissions(asset);
        console.log("This: ", this);
        console.log("Asset: ", asset);

        var priceFeed = ('bitasset' in asset) ? this.renderPriceFeed(asset) : '';
        var markets = false ? this.renderMarkets(asset) : '';

        return (
            <div>
                <div className="grid-block page-layout vertical medium-horizontal">
                    <div className="grid-block vertical" style={{overflow:"visible"}}>

                        {this.assetAboutBox(asset)}

                        {/*<div className="grid-block small-10 small-offset-1" style={{overflow:"visible"}}>*/}
                        <div className="grid-block" style={{overflow:"visible"}}>
                            <div className="grid-block vertical" style={{overflow:"visible"}}>
                                {this.renderSummary(asset, perms)}
                                {markets}
                                {priceFeed}
                            </div>

                            <div className="grid-block vertical" style={{overflow:"visible"}}>
                                {this.renderFeePool(asset)}
                                {this.renderPermissions(asset, perms)}
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
