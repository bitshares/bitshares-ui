import React from "react";
import {PropTypes} from "react";
import WitnessActions from "actions/WitnessActions";
import {Link} from "react-router";
import intlData from "../Utility/intlData";
import Immutable from "immutable";
import BlockchainActions from "actions/BlockchainActions";
import Translate from "react-translate-component";
import {FormattedDate} from "react-intl";

class Discover extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.latestBlocks, this.props.latestBlocks) ||
            !Immutable.is(nextProps.witnesses, this.props.witnesses) ||
            !Immutable.is(nextProps.witness_id_to_name, this.props.witness_id_to_name) ||
            !Immutable.is(nextProps.assets, this.props.assets)
            );
    }

    _getLatestBlocks(height) {
        if (height) {
            height = parseInt(height, 10);
            BlockchainActions.getLatest(height);
        }
    }

    componentWillReceiveProps(nextProps) {

        if (nextProps.latestBlocks.size === 0) {
            this._getInitialBlocks();
        }

        if (nextProps.latestBlocks.size === 10 && nextProps.dynGlobalObject.head_block_number !== nextProps.latestBlocks.get(0).id) {
            this._getLatestBlocks(nextProps.dynGlobalObject.head_block_number);
        }
    }

    componentDidMount() {
        this._getInitialBlocks();
    }

    _getInitialBlocks() {
        let maxBlock = this.props.dynGlobalObject.head_block_number;
        if (maxBlock) {
            for (let i = 9; i >= 0; i--) {
                let exists = false;
                if (this.props.latestBlocks.size > 0) {
                    for (let j = 0; j < this.props.latestBlocks.size; j++) {
                        if (this.props.latestBlocks.get(j).id === maxBlock - i) {
                            exists = true;
                            break;
                        }
                    }
                }
                if (!exists) {
                    this._getLatestBlocks(maxBlock - i);    
                }
            }
        }
    }

    _fetchWitnesses(witnessIds, witnesses, witness_id_to_name) {
        if (!Array.isArray(witnessIds)) {
            witnessIds = [witnessIds];
        }

        let missing = [];
        let missingAccounts = [];
        witnessIds.forEach(id => {
            // Check for missing witness data
            if (!witnesses.get(id)) {
                missing.push(id);
            // Check for missing witness account data
            } else if (!witness_id_to_name.get(id)) {
                missingAccounts.push(witnesses.get(id).witness_account);
            }
        });

        if (missing.length > 0) {
            WitnessActions.getWitnesses(missing);
        } 

        if (missingAccounts.length > 0) {
            WitnessActions.getWitnessAccounts(missingAccounts);
        }
    }

    render() {

        let {latestBlocks, accounts, witnesses, witness_id_to_name} = this.props;
        let blocks = null;
        // console.log("latestBlocks:", latestBlocks, this.props);

        if (latestBlocks && latestBlocks.size === 10) {
            // console.log("witness_id_to_name:", witness_id_to_name);


            let missingWitnesses = [];
            latestBlocks.forEach(block => {
                if (!witness_id_to_name.get(block.witness)) {
                    missingWitnesses.push(block.witness);
                }
            });
            if (missingWitnesses.length > 0) {
                this._fetchWitnesses(missingWitnesses, witnesses, witness_id_to_name);
            }

            blocks = latestBlocks
            .sort((a, b) => {
                return b.id > a.id;
            })
            .map((block) => {
                return (
                        <tr key={block.id}>
                            <td><Link to="block" params={{height: block.id}}>#{block.id}</Link></td>
                            <td><FormattedDate
                                value={block.timestamp}
                                formats={intlData.formats}
                                format="short"
                            /></td>
                            <td>{witness_id_to_name.get(block.witness) ? <Link to="account" params={{name: witness_id_to_name.get(block.witness)}}>{witness_id_to_name.get(block.witness)}</Link> : null}</td>
                            <td>{block.transactions.length}</td>
                        </tr>
                    );
            }).toArray();
        }

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
                    <div className="grid-block medium-3 left-column">
                        <div className="grid-content">
                            <h3><Translate component="span" content="explorer.accounts" /></h3>
                         </div>
                    </div>
                    <div className="grid-block medium-6 main-content">
                        <div className="grid-content">
                            <h3><Translate component="span" content="explorer.blocks" /></h3>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th><Translate component="span" content="explorer.block.id" /></th>
                                        <th><Translate component="span" content="explorer.block.date" /></th>
                                        <th><Translate component="span" content="explorer.block.witness" /></th>
                                        <th><Translate component="span" content="explorer.block.count" /></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {blocks}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="grid-block medium-3 right-column">
                        <div className="grid-content">
                            <h3><Translate component="span" content="explorer.assets.title" /></h3>
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

Discover.defaultProps = {
    latestBlocks: {},
    assets: {},
    accounts: {},
    height: 1
};

Discover.propTypes = {
    latestBlocks: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired,
    accounts: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired
};

Discover.contextTypes = { router: React.PropTypes.func.isRequired };

export default Discover;
