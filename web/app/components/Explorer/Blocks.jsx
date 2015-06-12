import React from "react";
import {PropTypes} from "react";
import WitnessActions from "actions/WitnessActions";
import {Link} from "react-router";
import intlData from "../Utility/intlData";
import Immutable from "immutable";
import BlockchainActions from "actions/BlockchainActions";
import Translate from "react-translate-component";
import {FormattedDate} from "react-intl";
import Inspector from "react-json-inspector";
require("../Blockchain/json-inspector.scss");

class Blocks extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.latestBlocks, this.props.latestBlocks) ||
            !Immutable.is(nextProps.witnesses, this.props.witnesses) ||
            !Immutable.is(nextProps.witness_id_to_name, this.props.witness_id_to_name)
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

        let {latestBlocks, accounts, witnesses, witness_id_to_name, globalObject} = this.props;
        let blocks = null;

        if (latestBlocks && latestBlocks.size === 10) {

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

        // console.log("globalObject:", globalObject);
        // let params = [];
        // let index = 0;
        // for (let key in globalObject.parameters) {
        //     if (globalObject.parameters.hasOwnProperty(key)) {
        //         params.push(<li key={index}>{key} : {globalObject.parameters[key]} </li>);
        //         index++;
        //     }
        // }

        return (
            <div className="grid-block vertical">
                <div className="grid-block page-layout">
                    <div className="grid-block shrink">
                        <ul>
                            <li><Translate component="span" content="explorer.blocks.globals" />: <Inspector data={ globalObject.parameters } search={false}/></li>
                        </ul>
                    </div>
                    <div className="grid-block">
                        <div className="grid-content">
                            <h3><Translate component="span" content="explorer.blocks.recent" /></h3>
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
                </div>
            </div>
        );
    }
}

Blocks.defaultProps = {
    latestBlocks: {},
    assets: {},
    accounts: {},
    height: 1
};

Blocks.propTypes = {
    latestBlocks: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired,
    accounts: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired
};

Blocks.contextTypes = { router: React.PropTypes.func.isRequired };

export default Blocks;
