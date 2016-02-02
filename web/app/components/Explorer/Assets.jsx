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
import Tabs, {Tab} from "../Utility/Tabs";
import MarketLink from "../Utility/MarketLink";

class Assets extends React.Component {

    constructor(props) {
        super();
        this.state = {
            foundLast: false,
            lastAsset: "", 
            assetsFetched: 0,
            filterUIA: props.filterUIA || "",
            filterMPA: props.filterMPA || "",
            filterPM: props.filterPM || ""
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.assets, this.props.assets) ||
            nextState.filterMPA !== this.state.filterMPA ||
            nextState.filterUIA !== this.state.filterUIA ||
            nextState.filterPM !== this.state.filterPM
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
            return a.bitasset_data && !a.bitasset_data.is_prediction_market && a.symbol.indexOf(this.state.filterMPA) !== -1;
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

        let coreAsset = ChainStore.getAsset("1.3.0");

        let pm = assets.filter(a => {
            return (
                a.bitasset_data &&
                a.bitasset_data.is_prediction_market &&
                (a.symbol.toLowerCase().indexOf(this.state.filterPM.toLowerCase()) !== -1 || a.options.description.toLowerCase().indexOf(this.state.filterPM.toLowerCase()) !== -1)
            );
        }).map((asset) => {

            let marketID = asset.symbol + "_" + (coreAsset ? coreAsset.get("symbol") : "BTS");
            
            return (
                <tr key={asset.id.split(".")[2]}>
                    <td style={{width: "80%"}}>
                        <div style={{paddingTop: 10, fontWeight: "bold"}}>
                            <Link to={`/asset/${asset.symbol}`}>{asset.symbol}</Link>
                        </div>
                        {asset.options.description ? 
                        <div style={{padding: "10px 20px 5px 0", lineHeight: "18px"}}>
                            {asset.options.description}
                        </div> : null}
                        <div style={{padding: "0 20px 5px 0", lineHeight: "18px"}}>
                            <LinkToAccountById account={asset.issuer} />
                            <span> - <FormattedAsset amount={asset.dynamic_data.current_supply} asset={asset.id} /></span>
                        </div>
                    </td>
                    <td style={{width: "20%"}}>
                        <Link className="button outline" to={`/market/${marketID}`}><Translate content="header.exchange" /></Link>
                    </td>
                </tr>
            );
        }).sort((a, b) => {
            if (a.key > b.key) {
                return -1;
            } else if (a.key < b.key) {
                return 1;
            } else {
                return 0;
            }
        }).toArray();

        return (
            <div className="grid-block vertical">
                <div className="grid-block page-layout">
                    <div className="grid-block small-12 medium-10 medium-offset-1 main-content vertical">
                        <Tabs
                            setting="updateAssetTab"
                            style={{maxWidth: "800px"}}
                            className="grid-block vertical no-overflow no-padding"
                            contentClass="grid-block vertical"
                        >
                            <Tab title="explorer.assets.market">
                                <div className="grid-block shrink">
                                    <input style={{maxWidth: "500px"}} placeholder={placeholder} type="text" value={this.state.filterMPA} onChange={this._onFilter.bind(this, "filterMPA")}></input>
                                </div>
                                <div className="grid-block" style={{paddingBottom: 20}}>
                                    <table className="table">
                                        <thead>
                                        <tr>
                                            <th><Translate component="span" content="explorer.assets.symbol" /></th>
                                            <th><Translate component="span" content="explorer.assets.issuer" /></th>
                                            <th><Translate component="span" content="markets.supply" /></th>
                                        </tr>
                                        </thead>
                                            <tbody>
                                                {mia}
                                            </tbody>
                                    </table> 
                                </div>  
                            </Tab>

                            <Tab title="explorer.assets.user">
                                <div className="grid-block shrink">
                                    <input style={{maxWidth: "500px"}} placeholder={placeholder} type="text" value={this.state.filterUIA} onChange={this._onFilter.bind(this, "filterUIA")}></input>
                                </div>
                                <div className="grid-block" style={{paddingBottom: 20}}>
                                    <table className="table">
                                        <thead>
                                        <tr>
                                            <th><Translate component="span" content="explorer.assets.symbol" /></th>
                                            <th><Translate component="span" content="explorer.assets.issuer" /></th>
                                            <th><Translate component="span" content="markets.supply" /></th>
                                        </tr>
                                        </thead>

                                        <tbody>
                                            {uia}
                                        </tbody>
                                    </table>
                                </div>
                            </Tab>

                            <Tab title="explorer.assets.prediction">
                                <div className="grid-block shrink">
                                    <input style={{maxWidth: "500px"}} placeholder={counterpart.translate("markets.search").toUpperCase()} type="text" value={this.state.filterPM} onChange={this._onFilter.bind(this, "filterPM")}></input>
                                </div>
                                <div className="grid-block" style={{paddingBottom: 20}}>
                                    <table className="table">
                                        <tbody>
                                            {pm}
                                        </tbody>
                                    </table>
                                </div>
                            </Tab>
                        </Tabs>                     
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
