import React from "react";
import {PropTypes} from "react";
import AssetActions from "actions/AssetActions";
import SettingsActions from "actions/SettingsActions";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import utils from "common/utils";
import counterpart from "counterpart";
import FormattedAsset from "../Utility/FormattedAsset";

class Assets extends React.Component {

    constructor(props) {
        super();
        this.state = {
            foundLast: false,
            lastAsset: "", 
            assetsFetched: 0,
            filterUIA: props.filterUIA || "",
            filterMPA: props.filterMPA || ""
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.assets, this.props.assets) ||
            nextState.filterMPA !== this.state.filterMPA ||
            nextState.filterUIA !== this.state.filterUIA
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
       
        if (assets.size === 0 || force) {
            AssetActions.getAssetList("A", 100);
            this.setState({assetsFetched: 100});  
        } else if (assets.size >= this.state.assetsFetched) {
            AssetActions.getAssetList(lastAsset.symbol, 100);           
            this.setState({assetsFetched: this.state.assetsFetched + 99}); 
        }
    }

    componentWillReceiveProps(nextProps) {
        this._checkAssets(nextProps.assets);
    }

    linkToAccount(name_or_id) {
        if(!name_or_id) {
            return <span>-</span>;
        }
        
        return <LinkToAccountById account={name_or_id}/>         
    }

    _onFilter(type, e) {
        this.setState({[type]: e.target.value.toUpperCase()});
        SettingsActions.changeViewSetting({
            [type]: e.target.value.toUpperCase()
        });
    }

    render() {
        let {assets} = this.props;

        let placeholder = counterpart.translate("markets.filter").toUpperCase();

        let uia = assets.filter(a => {
            return !a.market_asset  && a.symbol.indexOf(this.state.filterUIA) !== -1;
        }).map((asset) => {
            return (
                <tr key={asset.symbol}>
                    <td><Link to={`/asset/${asset.symbol}`}>{asset.symbol}</Link></td>
                    <td>{this.linkToAccount(asset.issuer)}</td>
                    <td><FormattedAsset amount={asset.dynamic_data.current_supply} asset={asset.id} hide_asset={true}/></td>
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
            return a.market_asset && a.symbol.indexOf(this.state.filterMPA) !== -1;
        }).map((asset) => {
            return (
                <tr key={asset.symbol}>
                    <td><Link to={`/asset/${asset.symbol}`}>{asset.symbol}</Link></td>
                    <td>{this.linkToAccount(asset.issuer)}</td>
                    <td><FormattedAsset amount={asset.dynamic_data.current_supply} asset={asset.id} hide_asset={true}/></td>
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
                    <div className="grid-block medium-6 main-content vertical">
                            <div className="grid-content shrink no-overflow" style={{paddingBottom: 0}}>
                                <h3><Translate component="span" content="explorer.assets.market" /></h3>
                                <input style={{maxWidth: "400px"}} placeholder={placeholder} type="text" value={this.state.filterMPA} onChange={this._onFilter.bind(this, "filterMPA")}></input>
                                <table className="table">
                                    <thead>
                                    <tr>
                                        <th><Translate component="span" content="explorer.assets.symbol" /></th>
                                        <th><Translate component="span" content="explorer.assets.issuer" /></th>
                                        <th><Translate component="span" content="markets.supply" /></th>
                                    </tr>
                                    </thead>
                                </table>                        
                            </div>
                            <div className="grid-content">
                                <table className="table">
                                    <tbody>
                                        {mia}
                                    </tbody>
                                </table>
                            </div>
                    </div>
                    <div className="grid-block medium-6 right-column vertical">
                        <div className="grid-content shrink no-overflow" style={{paddingBottom: 0}}>
                            <h3><Translate component="span" content="explorer.assets.user" /></h3>
                            <input style={{maxWidth: "400px"}} placeholder={placeholder} type="text" value={this.state.filterUIA} onChange={this._onFilter.bind(this, "filterUIA")}></input>
                            <table className="table">
                                <thead>
                                <tr>
                                    <th><Translate component="span" content="explorer.assets.symbol" /></th>
                                    <th><Translate component="span" content="explorer.assets.issuer" /></th>
                                    <th><Translate component="span" content="markets.supply" /></th>
                                </tr>
                                </thead>
                            </table>
                        </div>
                        <div className="grid-content">
                            <table className="table">
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
    assets: {}
};

Assets.propTypes = {
    assets: PropTypes.object.isRequired
};

export default Assets;
