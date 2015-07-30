import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import AssetActions from "actions/AssetActions";
import Translate from "react-translate-component";
import LoadingIndicator from "../LoadingIndicator";
import Inspector from "react-json-inspector";
require("./json-inspector.scss");

class Asset extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.assets, this.props.assets) ||
            nextProps.accounts !== this.props.accounts
            );
    }

    componentDidMount() {
        if (!this.props.asset_symbol_to_id[this.props.symbol]) {
            AssetActions.getAsset(this.props.symbol);
        }
    }

    render() {

        let {assets, accounts, asset_symbol_to_id, symbol} = this.props;
        let assetID = asset_symbol_to_id[symbol];
        let asset = assets.get(assetID);

        let assetExists = true;
        if (!asset) {
            asset = assets.get(symbol);
            if (!asset) {
                return <LoadingIndicator type="circle"/>;
            } else if (asset.notFound) {
                assetExists = false;
            } 
        } else if (asset.notFound) {
            assetExists = false;
        } 
        if (!assetExists) {
            return <div className="grid-container"><h5><Translate component="h5" content="explorer.asset.not_found" name={symbol} /></h5></div>;
        }


        return (
            <div className="grid-block small-offset-2">
                <div className="grid-content">
                    <h4>Asset: {this.props.symbol}</h4>
                    {asset ? (
                    <ul>
                        <li><Translate component="span" content="explorer.assets.id" />: {asset.id}</li>
                        <li><Translate component="span" content="explorer.assets.issuer" />: {accounts[asset.issuer] ?
                            <Link to="account" params={{account_name: accounts[asset.issuer]}}>{accounts[asset.issuer]}</Link> :
                            null}</li>
                        <li><Translate component="span" content="explorer.assets.precision" />: {asset.precision}</li>
                        <li><Translate component="span" content="explorer.block.common_options" />: <Inspector data={ asset.options } search={false}/></li>
                    </ul>
                    ) : null}
                </div>
            </div>
        );
    }
}

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

export default Asset;
