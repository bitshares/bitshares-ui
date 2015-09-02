import React from "react";
import {PropTypes} from "react";
import AssetActions from "actions/AssetActions";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import utils from "common/utils";

class Assets extends React.Component {

    constructor() {
        super();
        this.state = {
            foundLast: false,
            lastAsset: "", 
            assetsFetched: 0
        }
    }

    shouldComponentUpdate(nextProps) {
        return (
                !Immutable.is(nextProps.assets, this.props.assets) ||
                // Object.keys(nextProps.account_id_to_name).equals(Object.keys(this.props.account_id_to_name))
                // returning true here until issue #93 has been resolved
                true
            );
    }

    componentWillMount() {
        this._checkAssets(this.props.assets, true);
    }

    _checkAssets(assets, force) {

        let lastAsset = assets.sort((a, b) => {
            if (a.symbol > b.symbol) {
                return 1;
            } else if (a.symbol < b.symbol) {
                return -1;
            } else {
                return 0;
            }
        }).last();

        // console.log("assets.size:", assets.size, "assetsFetched:", this.state.assetsFetched);
        
        if (assets.size === 0 || force) {
            AssetActions.getAssetList("A", 100);
            this.setState({assetsFetched: 100});  
        } else if (assets.size >= this.state.assetsFetched) {
            // console.log("assets.last():", lastAsset.symbol);
            AssetActions.getAssetList(lastAsset.symbol, 100);           
            this.setState({assetsFetched: this.state.assetsFetched + 99}); 
        }
    }

    componentWillReceiveProps(nextProps) {
        // console.log("nextProps.assets:", nextProps.assets.toJS());
        this._checkAssets(nextProps.assets);
    }

    // _getAccount(id) {

    //     if (this.props.account_id_to_name[id]) {
    //         return this.props.account_id_to_name[id];
    //     } else {
    //         AccountActions.getAccounts(id, 1);
    //         return false;
    //     }
    // }

    linkToAccount(name_or_id) {
        if(!name_or_id) {
            return <span>-</span>;
        }
        // return utils.is_object_id(name_or_id) ?
        //     <LinkToAccountById account={name_or_id}/> :
        //     <Link to="account-overview" params={{account_name: name_or_id}}>{name_or_id}</Link>;
        return <span>{name_or_id}</span>;
    }

    render() {
        let {assets} = this.props;

        let uia = assets.filter(a => {
            return !a.market_asset;
        }).map((asset) => {
            // let account = this._getAccount(asset.issuer);

            return (
                <tr key={asset.symbol}>
                    <td><Link to="asset" params={{symbol: asset.symbol}}>{asset.symbol}</Link></td>
                    <td>{asset.id}</td>
                    <td>{this.linkToAccount(asset.issuer)}</td>
                </tr>
            );
        }).sort((a, b) => {
            if (a.key > b.key) {
                return 1;
            } else if (a.key < b.key) {
                return -1;
            } else {
                return 0;
            }
        }).toArray();

        let mia = assets.filter(a => {
            return a.market_asset;
        }).map((asset) => {
            // let account = this._getAccount(asset.issuer);

            return (
                <tr key={asset.symbol}>
                    <td><Link to="asset" params={{symbol: asset.symbol}}>{asset.symbol}</Link></td>
                    <td>{asset.id}</td>
                    <td>{this.linkToAccount(asset.issuer)}</td>
                </tr>
            );
        }).sort((a, b) => {
            if (a.key > b.key) {
                return 1;
            } else if (a.key < b.key) {
                return -1;
            } else {
                return 0;
            }
        }).toArray();

        return (
            <div className="grid-block vertical">
                <div className="grid-block page-layout">
                    <div className="grid-block medium-6 main-content">
                            <div className="grid-content">
                            <h3><Translate component="span" content="explorer.assets.market" /></h3>
                            <table className="table">
                                <thead>
                                <tr>
                                    <th><Translate component="span" content="explorer.assets.symbol" /></th>
                                    <th><Translate component="span" content="explorer.assets.id" /></th>
                                    <th><Translate component="span" content="explorer.assets.issuer" /></th>
                                </tr>
                                </thead>
                                <tbody>
                                    {mia}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="grid-block medium-6 right-column">
                        <div className="grid-content">
                            <h3><Translate component="span" content="explorer.assets.user" /></h3>
                            <table className="table">
                                <thead>
                                <tr>
                                    <th><Translate component="span" content="explorer.assets.symbol" /></th>
                                    <th><Translate component="span" content="explorer.assets.id" /></th>
                                    <th><Translate component="span" content="explorer.assets.issuer" /></th>
                                </tr>
                                </thead>
                                <tbody>
                                    {uia}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

Assets.defaultProps = {
    assets: {},
    account_id_to_name: {}
};

Assets.propTypes = {
    assets: PropTypes.object.isRequired,
    account_id_to_name: PropTypes.object.isRequired
};

export default Assets;
