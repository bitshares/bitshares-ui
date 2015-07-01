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
                !Immutable.is(nextProps.accounts, this.props.accounts)
            );
    }

    _getAccount(id) {

        if (this.props.accounts.get(id)) {
            return this.props.accounts.get(id);
        } else {
            AccountActions.getAccount(id);
            return false;
        }
    }

    render() {
        let {assets, accounts} = this.props;

        let uia = assets.filter(a => {
            return !a.market_asset;
        }).map((asset) => {
            let account = this._getAccount(asset.issuer);

            return (
                <tr key={asset.symbol}>
                    <td><Link to="asset" params={{symbol: asset.symbol}}>{asset.symbol}</Link></td>
                    <td>{asset.id}</td>
                    <td>{account ? <Link to="account" params={{name: account.name}}>{account.name} </Link> : asset.issuer}</td>
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
                    <td>{account ? <Link to="account" params={{name: account.name}}>{account.name} </Link> : asset.issuer}</td>
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
    accounts: {}
};

Assets.propTypes = {
    assets: PropTypes.object.isRequired,
    accounts: PropTypes.object.isRequired
};

export default Assets;
