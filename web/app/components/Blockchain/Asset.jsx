import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import AssetActions from "actions/AssetActions";
import Translate from "react-translate-component";
import LinkToAccountById from "./LinkToAccountById";
import LoadingIndicator from "../LoadingIndicator";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import Inspector from "react-json-inspector";
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

        //this.state = Asset.exampleData;
        this.header_image = "http://theeconomiccollapseblog.com/wp-content/uploads/2012/03/10-Reasons-Why-The-Reign-Of-The-Dollar-As-The-World-Reserve-Currency-Is-About-To-Come-To-An-End.jpg";
    }

    renderHeader() {
        return (
            <div className="grid-block small-10 small-offset-1">
                <div className="grid-content"
                     style={{
                           opacity: '0.5',
                               backgroundColor: '#FFF',
                               backgroundImage: 'url(' + this.header_image + ')',
                               backgroundSize: 'cover'
                             }}
                    >
                    <div style={{ overflow:"visible" }}>
                        <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/> <br/>
                    </div>
                </div>
            </div>
        );
    }

    assetSummary() {
        //var asset = this.props.asset.toJS();
        var asset = this.props.asset;
        var core_exchange = asset.getIn(["options", "core_exchange_rate"]);
        console.log("core_exchange: ", core_exchange);
        return (
            <div>
            <ul>
                <li>
                    Symbol: {asset.get('symbol')}
                </li>

                <li>
                    Issuer: <LinkToAccountById account={asset.get('issuer')}/>
                </li>

                <li>
                    Formatted Asset: <FormattedAsset
                        amount={asset.getIn(["options", "max_supply"])}
                        asset={asset.get('id')}
                    />
                </li>

                <li>
                    Formatted Price: <FormattedPrice
                        base_asset={core_exchange.getIn(["base","asset_id"])}
                        base_amount={core_exchange.getIn(["base","amount"])}
                        quote_asset={core_exchange.getIn(["quote","asset_id"])}
                        quote_amount={core_exchange.getIn(["quote","amount"])}
                    />
                </li>

            </ul>
            </div>
        );
    }

    dynamicData(dynamic) {
        return (
            <p>
                      acummulated_fees: {dynamic.accumulated_fees}
                <br/> confidential_supply: {dynamic.confidential_supply}
                <br/> current_supply: {dynamic.confidential_supply}
                <br/> fee_pool: {dynamic.fee_pool}
            </p>
        );
    }

    optionsData(options) {
        return (
            <p>
                      blacklist_authorities: {options.blacklist_authorities}
                <br/> blacklist_markets: {options.blacklist_markets}
                <br/> whitelist_authorities: {options.whitelist_authorities}
                <br/> whitelist_markets: {options.whitelist_markets}
                <br/> description: {options.description}
                <br/> flags: {options.flags}
                <br/> issuer_permissions: {options.issuer_permissions}
                <br/> market_fee_percent: {options.market_fee_percent}
                <br/> max_market_fee: {options.max_market_fee}
                <br/> - core_exchange_rate: {options.core_exchange_rate}
                <br/> - max_supply: {options.max_supply}
            </p>
        );
    }

    /*   enum asset_issuer_permission_flags
     {
     charge_market_fee    = 0x01, //< an issuer-specified percentage of all market trades in this asset is paid to the issuer
    white_list           = 0x02, //< accounts must be whitelisted in order to hold this asset
    override_authority   = 0x04, //< issuer may transfer asset back to himself
    transfer_restricted  = 0x08, //< require the issuer to be one party to every transfer
    disable_force_settle = 0x10, //< disable force settling
    global_settle        = 0x20, //< allow the bitasset issuer to force a global settling -- this may be set in permissions, but not flags
    disable_confidential = 0x40  //< allow the asset to be used with confidential transactions
    };*/

    render() {
        console.log("This: ", this);
        console.log("Asset: ", this.props.asset.toJS());

        var asset = this.props.asset.toJS();
        var dynamic = asset.dynamic;
        var options = asset.options;

        return (
        <div>
            <div className="grid-block page-layout">
                <div className="grid-block vertical">

                    {this.renderHeader()}

                    <div className="grid-block small-10 small-offset-1">

                        <div className="grid-block vertical" style={{overflow:"visible"}}>
                            <Box>
                                {this.assetSummary()}
                            </Box>
                            <Box header='Markets'>
                                <ul>
                                    <li>BTS / USD</li>
                                    <li>Gold / USD</li>
                                </ul>
                            </Box>
                        </div>

                        <div className="grid-block vertical" style={{overflow:"visible"}}>
                            <Box header='Fee Pool'>
                                {dynamic ? this.dynamicData(dynamic) : ''}
                            </Box>
                            <Box footer='Permissions'>
                                {options ? this.optionsData(options) : ''}
                            </Box>
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
