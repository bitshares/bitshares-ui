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

        console.log(asset);

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

        let authorityWhitelist = asset.options.whitelist_authorities.map(authority => {
            return (
                <li>{authority} <button className="button">Remove</button></li>
            );
        });

        let marketWhitelist = asset.options.whitelist_markets.map(market => {
            return (
                <li>{market} <button className="button">Remove</button></li>
            );
        });


        return (
           <div className="grid-block page-layout">
                <div className="grid-block vertical medium-6 medium-offset-3">
                    <div className="grid-content shrink">
                        <h3>{this.props.symbol}</h3>
                    </div>
                    <div className="grid-content">
                        {asset ? (
                        <div>
                            <p>{asset.options.description}</p>
                            <div>
                                <h3>Feed Producers</h3>
                                <p>TODO: list of authorized feed producer accounts.</p>
                                <p>TODO: account picker. <button className="button">Authorize as Feed Producer</button></p>
                            </div>

                            <div>
                                <h3>Fee pool</h3>
                                <p>
                                    Transaction fees can be paid at a rate of {asset.options.core_exchange_rate.quote.amount} {this.props.symbol} per {asset.options.core_exchange_rate.base.amount} CORE.
                                    <button className="button">Adjust Exchange Rate</button>
                                </p>
                                <p>
                                    This asset has X CORE available to pay fees.
                                    <button className="button">Add to Fee Pool</button>
                                </p>
                            </div>
                            <div>
                                <h3>Whitelisted Accounts</h3>
                                <ul>
                                    {asset.options.whitelist_authorities.length > 0 ? authorityWhitelist : "Account whitelist not in use."}

                                </ul>
                                <form>
                                    <input type="text" style={{width: '100px'}} /> {/* TODO: use an account picker instead of an <input>. */}
                                    <button className="button">Add to Account Whitelist</button>
                                </form>
                            </div>
                            <div>
                                <h3>Whitelisted Markets</h3>
                                <ul>
                                    {asset.options.marketWhitelist.length > 0 ? marketWhitelist : "Market whitelist not in use."}
                                </ul>
                                <form>
                                    <input type="text" style={{width: '100px'}} />{/*TODO: use an asset picker instead of an <input>. Exchange/Markets.jsx contains one that could be its own reusable component*/}
                                    <button className="button">Add to Market Whitelist</button>
                                </form>
                            </div>
                            <div>
                                {/*TODO: show actual permissions from server, and make them editable */}
                                <h3>Permissions</h3>
                                <ul>
                                    <li><input type="checkbox" disabled />Permission #1</li>
                                    <li><input type="checkbox" disabled />Permission #2</li>
                                    <li><input type="checkbox" disabled />Permission #3</li>
                                    <li><input type="checkbox" disabled />Permission #4</li>
                                </ul>
                                <button className="button">Edit Permissions</button>
                            </div>
                            <div>
                                <ul>
                                    <li><Translate component="span" content="explorer.assets.id" />: {asset.id}</li>
                                    <li><Translate component="span" content="explorer.assets.issuer" />: {accounts[asset.issuer] ?
                                        <Link to="account" params={{account_name: accounts[asset.issuer]}}>{accounts[asset.issuer]}</Link> :
                                        null}</li>
                                    <li><Translate component="span" content="explorer.assets.precision" />: {asset.precision}</li>
                                    <li><Translate component="span" content="explorer.block.common_options" />:
                                    <Inspector data={ asset.options } search={false}/></li>
                                </ul>
                            </div>
                        </div>
                        ) : <p>Asset {assetID} not found.</p>}
                    </div>
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
