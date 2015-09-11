import React from "react";
import {PropTypes} from "react";
import WitnessActions from "actions/WitnessActions";
import {Link} from "react-router";
import intlData from "../Utility/intlData";
import Immutable from "immutable";
import BlockchainActions from "actions/BlockchainActions";
import Translate from "react-translate-component";
import {FormattedDate, FormattedRelative} from "react-intl";

import Inspector from "react-json-inspector";
require("../Blockchain/json-inspector.scss");
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import TransactionChart from "./TransactionChart";
import BlocktimeChart from "./BlocktimeChart";
import classNames from "classnames";
import utils from "common/utils";

class BlockTimeAgo extends React.Component {
    
    constructor(props) {
        super(props);

        this.interval = null;
    }

    shouldComponentUpdate(nextProps) {
        return nextProps.blockTime !== this.props.blockTime;
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.blockTime !== this.props.blockTime) {
            this._setInterval();
        }
    }

    _setInterval() {
        this._clearInterval();
        this.interval = setInterval(() => {this.forceUpdate(); }, 1000);
    }

    _clearInterval() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    componentWillUnmount() {
        this._clearInterval();
    }

    render() {
        let {blockTime} = this.props;

        let timePassed = Date.now() - blockTime;

        let textClass = classNames("txtlabel",
            {"success":timePassed <= 6000},
            {"info":timePassed > 6000 && timePassed <= 15000},
            {"warning":timePassed > 15000 && timePassed <= 25000},
            {"error":timePassed > 25000}
        );

        return (
            blockTime ? <div className={textClass} ><FormattedRelative value={blockTime} /></div>: null
        );

    }
}

@BindToChainState({keep_updating: true})
class Blocks extends React.Component {

    static propTypes = {
        globalObject: ChainTypes.ChainObject.isRequired,
        dynGlobalObject: ChainTypes.ChainObject.isRequired
    }

    static defaultProps = {
        globalObject: "2.0.0",
        dynGlobalObject: "2.1.0"
    }

    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.latestBlocks, this.props.latestBlocks) ||
            !Immutable.is(nextProps.witnesses, this.props.witnesses) ||
            !Immutable.is(nextProps.witness_id_to_name, this.props.witness_id_to_name) ||
            !Immutable.is(nextProps.dynGlobalObject, this.props.dynGlobalObject)
            );
    }

    _getBlock(height, maxBlock) {
        if (height) {
            height = parseInt(height, 10);
            BlockchainActions.getLatest(height, maxBlock);
        }
    }

    componentWillReceiveProps(nextProps) {

        if (nextProps.latestBlocks.size === 0) {
            return this._getInitialBlocks();
        }

        let maxBlock = nextProps.dynGlobalObject.get("head_block_number");
        if (nextProps.latestBlocks.size === 20 && nextProps.dynGlobalObject.get("head_block_number") !== nextProps.latestBlocks.get(0).id) {
            return this._getBlock(maxBlock, maxBlock);
        }
    }

    componentDidMount() {
        this._getInitialBlocks();
    }

    _getInitialBlocks() {
        let maxBlock = parseInt(this.props.dynGlobalObject.get("head_block_number"), 10);
        if (maxBlock) {
            for (let i = 19; i >= 0; i--) {
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
                    this._getBlock(maxBlock - i, maxBlock);    
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

        let {latestBlocks, witnesses, witness_id_to_name, globalObject, dynGlobalObject} = this.props;
        let blocks = null;
        let headBlock = null;
        let trxCount = 0, blockCount = 0, timeDelta = 0, blockTimes = [], avgTime = 0;

        if (latestBlocks && latestBlocks.size >= 20) {

            let missingWitnesses = [];
            latestBlocks.forEach(block => {
                if (!witness_id_to_name.get(block.witness)) {
                    missingWitnesses.push(block.witness);
                }
            });
            if (missingWitnesses.length > 0) {
                this._fetchWitnesses(missingWitnesses, witnesses, witness_id_to_name);
            }

            let previousTime;

            blocks = latestBlocks
            .sort((a, b) => {
                return b.id > a.id;
            })
            .map((block) => {
                trxCount += block.transactions.length;
                blockCount += 1;
                if (blockCount > 1) {
                    blockTimes.unshift([block.id, (previousTime - block.timestamp) / 1000]);
                }

                previousTime = block.timestamp;

                return (
                        <tr key={block.id}>
                            <td><Link to="block" params={{height: block.id}}>#{block.id}</Link></td>
                            <td><FormattedDate
                                value={block.timestamp}
                                formats={intlData.formats}
                                format="short"
                            /></td>
                            <td>{witness_id_to_name.get(block.witness) ? <Link to="witness" params={{name: witness_id_to_name.get(block.witness)}}>{witness_id_to_name.get(block.witness)}</Link> : null}</td>
                            <td>{block.transactions.length}</td>
                        </tr>
                    );
            }).toArray();
            headBlock = latestBlocks.first().timestamp;
            avgTime = blockTimes.reduce((previous, current, idx, array) => {
                // console.log("previous:", previous,"current", current, "idx", idx);
                return previous + current[1] / array.length;
            }, 0)
        }

        return (
            <div className="grid-block vertical">
                <div className="grid-block page-layout">
                    <div className="grid-block text-center small-3">
                        <div className="grid-content no-overflow">
                            Current Block: <div className="txtlabel success">#{utils.format_number(dynGlobalObject.get("head_block_number"), 0)}</div>
                        </div>
                    </div>
                    <div className="grid-block text-center small-3">
                        <div className="grid-content no-overflow">
                            Last block: <BlockTimeAgo blockTime={headBlock} />
                        </div>
                    </div>
                    <div className="grid-block text-center small-3">
                        <div className="grid-content no-overflow">
                            Avg # of transactions <div>{trxCount / blockCount}/block</div>
                        </div>
                    </div>
                    <div className="grid-block text-center small-3">
                        <div className="grid-content no-overflow">
                            Avg block time <div>{utils.format_number(avgTime, 2)}s</div>
                        </div>
                    </div>
                </div>
                <div className="grid-block page-layout">
                    <div className="grid-block text-center small-3">
                        <div className="grid-content no-overflow">
                        </div>
                    </div>
                    <div className="grid-block text-center small-3">
                        <div className="grid-content no-overflow">
                            <BlocktimeChart blockTimes={blockTimes} />
                        </div>
                    </div>
                    <div className="grid-block text-center small-3">
                        <div className="grid-content no-overflow">
                            {<TransactionChart blocks={latestBlocks} />}
                        </div>
                    </div>
                    <div className="grid-block text-center small-3">
                        <div className="grid-content no-overflow">
                        </div>
                    </div>                                                        
                </div>
                <div className="grid-block page-layout">
                    <div className="grid-block small-4">
                        <ul>
                            <li><Translate component="span" content="explorer.blocks.globals" />: <Inspector data={ globalObject.get("parameters").toJS() } search={false}/></li>
                        </ul>
                    </div>
                    <div className="grid-block small-8 vertical">
                        
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
