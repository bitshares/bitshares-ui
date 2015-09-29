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

        this.header_image = "http://theeconomiccollapseblog.com/wp-content/uploads/2012/03/10-Reasons-Why-The-Reign-Of-The-Dollar-As-The-World-Reserve-Currency-Is-About-To-Come-To-An-End.jpg";
    }

    flag(value, permission) {
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
        return (
            <div>
                <br/>
                                       (Set          Permission)        <br/>
                charge_market_fee      ({value&0x01>0} {permission&0x01>0}) <br/>
                white_list             ({value&0x02>0} {permission&0x02>0}) <br/>
                override_authority     ({value&0x04>0} {permission&0x04>0}) <br/>
                transfer_restricted    ({value&0x08>0} {permission&0x08>0}) <br/>
                disable_force_settle   ({value&0x10>0} {permission&0x10>0}) <br/>
                global_settle          ({value&0x20>0} {permission&0x20>0}) <br/>
                disable_confidential   ({value&0x40>0} {permission&0x40>0}) <br/>
            </div>
        );
    }

    display(label, value) {
        return (<span>{label}: {value} <br/></span>);
    }

    assetHeader() {
        return (
            <div className="grid-block small-10 small-offset-1" style={{overflow:"visible"}}>
                <div className="grid-content">
                     <img src={this.header_image} style={{maxWidth:"1000px", width:"100%", height:"auto"}}/>
                </div>
                {/*
                <div className="grid-content"
                     style={{
                               backgroundImage: 'url(' + this.header_image + ')',
                               backgroundSize: 'cover'
                             }}
                    >
                    <div style={{ overflow:"visible" }}> <br/> <br/> <br/> </div>
                </div>
                 */}
            </div>
        );
    }

    assetSummary(asset) {
        var dynamic = asset.dynamic;
        var options = asset.options;
        return (
            <Box header= {asset.symbol}>
                {/*this.display('symbol', asset.symbol)*/}
                      description: {options.description}
                <br/> current_supply: {dynamic ? <FormattedAsset amount={dynamic.current_supply} asset={asset.id} /> : ''}
                <br/> confidential_supply: {dynamic ? <FormattedAsset amount={dynamic.confidential_supply} asset={asset.id} /> : ''}
                <br/> market_fee_percent: {options.market_fee_percent}
                <br/> issuer: <LinkToAccountById account={asset.issuer}/>
                {this.flag(options.flags, options.issuer_permissions)}
            </Box>
        );
    }

    assetMarkets(asset) {
        return (
            <Box header='Markets'>
                <ul>
                    <li>BTS / USD</li>
                    <li>Gold / USD</li>
                </ul>
            </Box>
        );
    }

    assetFeePool(asset) {
        var dynamic = asset.dynamic;
        var options = asset.options;
        var base = options.core_exchange_rate.base;
        var quote = options.core_exchange_rate.quote;
        return (
            <Box header='Fee Pool'>
                      blacklist_authorities: {options.blacklist_authorities}
                <br/> blacklist_markets:     {options.blacklist_markets}
                <br/> whitelist_authorities: {options.whitelist_authorities}
                <br/> whitelist_markets:     {options.whitelist_markets}
                <br/>
                <br/> acummulated_fees: {dynamic ? dynamic.accumulated_fees : ''}
                <br/> fee_pool: {dynamic ? dynamic.fee_pool : ''}
                <br/> Formatted Price: <FormattedPrice
                        base_asset={base.asset_id}
                        base_amount={base.amount}
                        quote_asset={quote.asset_id}
                        quote_amount={quote.amount} />
            </Box>
        );
    }

    assetPermissions(asset) {
        //var dynamic = asset.dynamic;
        var options = asset.options;
        return (
            <Box header='Permissions'>
                      max_market_fee: {options.max_market_fee}
                <br/> max_supply: <FormattedAsset amount={options.max_supply} asset={asset.id} />
            </Box>
        );
    }

    render() {
        var asset = this.props.asset.toJS();
        console.log("This: ", this);
        console.log("Asset: ", asset);

        return (
            <div>
                <div className="grid-block page-layout">
                    <div className="grid-block vertical" style={{overflow:"visible"}}>

                        {this.assetHeader()}

                        <div className="grid-block small-10 small-offset-1" style={{overflow:"visible"}}>

                            <div className="grid-block vertical" style={{overflow:"visible"}}>
                                {this.assetSummary(asset)}
                                {this.assetMarkets(asset)}
                            </div>

                            <div className="grid-block vertical" style={{overflow:"visible"}}>
                                {this.assetFeePool(asset)}
                                {this.assetPermissions(asset)}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

//Asset.defaultProps = {
//    assets: {},
//    accounts: {},
//    asset_symbol_to_id: {}
//};
//
//Asset.propTypes = {
//    assets: PropTypes.object.isRequired,
//    accounts: PropTypes.object.isRequired,
//    asset_symbol_to_id: PropTypes.object.isRequired
//};
//
//Asset.contextTypes = { router: React.PropTypes.func.isRequired };

export default Asset;
