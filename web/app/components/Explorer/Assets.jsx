import React from "react";
import {PropTypes} from "react";
import AccountActions from "actions/AccountActions";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";

class Assets extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
                !Immutable.is(nextProps.assets, this.props.assets) ||
                Object.keys(nextProps.account_id_to_name).length !== Object.keys(this.props.account_id_to_name).length
            );
    }

    _getAccount(id) {

        if (this.props.account_id_to_name[id]) {
            return this.props.account_id_to_name[id];
        } else {
            AccountActions.getAccounts(id, 1);
            return false;
        }
    }

    render() {
        let {assets, account_id_to_name} = this.props;

        let uia = assets.filter(a => {
            return !a.market_asset;
        }).map((asset) => {
            let account = this._getAccount(asset.issuer);

            return (
                <tr key={asset.symbol}>
                    <td><Link to="asset" params={{symbol: asset.symbol}}>{asset.symbol}</Link></td>
                    <td>{asset.id}</td>
                    <td>{account ? <Link to="account" params={{account_name: account}}>{account} </Link> : asset.issuer}</td>
                </tr>
            );
        }).toArray();

        let mia = assets.filter(a => {
            return a.market_asset;
        }).map((asset) => {
            let account = this._getAccount(asset.issuer);

            return (
                <tr key={asset.symbol}>
                    <td><Link to="asset" params={{symbol: asset.symbol}}>{asset.symbol}</Link></td>
                    <td>{asset.id}</td>
                    <td>{account ? <Link to="account" params={{account_name: account}}>{account} </Link> : asset.issuer}</td>
                </tr>
            );
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
