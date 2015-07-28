import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import AssetActions from "actions/AssetActions";
import Trigger from "react-foundation-apps/src/trigger";
import Modal from "react-foundation-apps/src/modal";
import FormattedAsset from "../Utility/FormattedAsset";

class AccountUserIssuedAssets extends React.Component {
    constructor() {
        super();

        this.state = {
            symbol: "",
            name: "",
            description: "",
            max_supply: 1000000000000000,
            precision: 4
        };
    }

    _onFormInput(type, e) {
        let state = this.state;
        state[type] = e.target.value;
        this.setState(state);
    }

    _createAsset(account_id, e) {
        e.preventDefault();
        console.log("_createAsset:", account_id);
        AssetActions.createAsset({
            "issuer": account_id,
            "symbol": this.state.symbol,
            "precision": parseInt(this.state.precision, 10),
            "common_options": {
                "max_supply": this.state.max_supply,
                "market_fee_percent": 0,
                "max_market_fee": "0",
                "issuer_permissions": 1,
                "flags": 0,
                "core_exchange_rate": {
                    "base": {
                        "amount": "1",
                        "asset_id": "1.3.0"
                    },
                    "quote": {
                        "amount": "1",
                        "asset_id": "1.3.1"
                    }
                },
                "whitelist_authorities": [
                    "1.2.0"
                ],
                "blacklist_authorities": [
                    "1.2.0"
                ],
                "whitelist_markets": [
                    "1.3.0"
                ],
                "blacklist_markets": [
                    "1.3.0"
                ],
                "description": "",
                "extensions": null
            },
            "is_prediction_market": false,
            "extensions": null
        });
    }

    render() {
        let {account_name, cachedAccounts, assets} = this.props;
        let account = cachedAccounts.get(account_name);

        if (!account) {
            return <div className="grid-content"></div>;
        }
        let myAssets = assets.filter(asset => {
            return asset.issuer === account.id;
        }).map(asset => {            
            return (
                    <tr>
                        <td>{asset.id}</td>
                        <td><Link to="asset" params={{symbol: asset.symbol}}>{asset.symbol}</Link></td>
                        <td>{asset.options.description}</td>
                        <td><FormattedAsset amount={asset.options.max_supply} asset={asset} /></td>
                        <td>{asset.precision}</td>
                        <td>                        
                            <Trigger open="issue_asset">
                                <button className="button">Issue Asset</button>
                            </Trigger>
                        </td>
                    </tr>
                );
        }).toArray();

        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3>Issued Assets</h3>
                    
                    <div>
                        <table className="table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Symbol</th>
                                <th>Description</th>
                                {/* <th>Public Data</th> FIXME: this column is hidden because its purpose overlaps with Description */}
                                <th>Max Supply</th>
                                <th>Precision</th>
                                <th>{/* Issue asset button */}</th>
                            </tr>
                            </thead>
                            <tbody>
                                {myAssets}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="content-block">
                    <div className="actions clearfix">
                        <Trigger open="create_asset">
                            <button className="button">Create New Asset</button>
                        </Trigger>
                    </div>
                </div>

				<Modal id="create_asset" overlay={true}>
                    <Trigger close="create_asset">
                        <a href="#" className="close-button">&times;</a>
                    </Trigger>
                    <div className="grid-block vertical">
                        <form onSubmit={this._createAsset.bind(this, account.id)} noValidate>
                            <div className="shrink grid-content">
                                <label><Translate content="account.user_issued_assets.symbol" />
                                    <input type="text" value={this.state.symbol} onChange={this._onFormInput.bind(this, "symbol")}/>
                                </label>

                                <label><Translate content="account.user_issued_assets.name" />
                                <input type="text" value={this.state.name} onChange={this._onFormInput.bind(this, "name")} /></label>
                                
                                <label><Translate content="account.user_issued_assets.description" />
                                <input type="text" value={this.state.description} onChange={this._onFormInput.bind(this, "description")} /></label>

                                <label><Translate content="account.user_issued_assets.max_supply" />
                                <input type="number" value={this.state.max_supply} onChange={this._onFormInput.bind(this, "max_supply")} /></label>

                                <label><Translate content="account.user_issued_assets.precision" />
                                <input type="number" value={this.state.precision} onChange={this._onFormInput.bind(this, "precision")} /></label>
                            </div>
                            <div className="grid-content button-group">
                                <input type="submit" className="button" onClick={this._createAsset.bind(this, account.id)} value="Create Asset" />
                                <Trigger close="create_asset">
                                    <a href className="secondary button">Cancel</a>
                                </Trigger>
                            </div>
                        </form>
                    </div>
                </Modal>
            </div>
        );
    }
}

AccountUserIssuedAssets.defaultProps = {
    assets: [],
    symbol: "",
    name: "",
    description: "",
    max_supply: 0,
    precision: 0,
    onSymbolChanged: function() {}
};

AccountUserIssuedAssets.propTypes = {
    assets: PropTypes.object.isRequired,
    symbol: PropTypes.string.isRequired,
    onSymbolChanged: PropTypes.func.isRequired
};

export default AccountUserIssuedAssets;
