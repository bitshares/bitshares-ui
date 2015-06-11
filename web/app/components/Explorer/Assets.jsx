import React from "react";
import {PropTypes} from "react";
import WitnessActions from "actions/WitnessActions";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import {FormattedDate} from "react-intl";

class Assets extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
                !Immutable.is(nextProps.assets, this.props.assets)
            );
    }

    render() {

        let assets = this.props.assets.map((asset) => {
            return (
                <tr key={asset.symbol}>
                    <td><Link to="asset" params={{symbol: asset.symbol}}>{asset.symbol}</Link></td>
                    <td>{asset.id}</td>
                    <td>{asset.issuer}</td>
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
                                {assets}
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
                                {assets}
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
    latestBlocks: {},
    assets: {},
    accounts: {},
    height: 1
};

Assets.propTypes = {
    latestBlocks: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired,
    accounts: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired
};

Assets.contextTypes = { router: React.PropTypes.func.isRequired };

export default Assets;
