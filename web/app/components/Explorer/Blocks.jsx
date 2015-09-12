import React from "react";
import {PropTypes} from "react";
import WitnessActions from "actions/WitnessActions";
import {Link} from "react-router";
import intlData from "../Utility/intlData";
import Immutable from "immutable";
import BlockchainActions from "actions/BlockchainActions";
import Translate from "react-translate-component";
import {FormattedDate, FormattedRelative} from "react-intl";
import Operation from "../Blockchain/Operation";
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
            {"success": timePassed <= 6000},
            {"info": timePassed > 6000 && timePassed <= 15000},
            {"warning": timePassed > 15000 && timePassed <= 25000},
            {"error": timePassed > 25000}
        );

        return (
            blockTime ? <h3 className={textClass} ><FormattedRelative value={blockTime} /></h3> : null
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
        if (nextProps.latestBlocks.size >= 20 && nextProps.dynGlobalObject.get("head_block_number") !== nextProps.latestBlocks.get(0).id) {
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

        let {latestBlocks, latestTransactions, witnesses, witness_id_to_name, globalObject, dynGlobalObject} = this.props;
        let blocks = null, transactions = null;
        let headBlock = null;
        let trxCount = 0, blockCount = latestBlocks.size, trxPerSec = 0, blockTimes = [], avgTime = 0;


        if (latestBlocks && latestBlocks.size >= 20) {

            // Fetch missing witnesses
            // TODO: replace with chainstore methods
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

            let lastBlock, firstBlock;

            // Map out the block times for the latest blocks and count the number of transactions
            latestBlocks.sort((a, b) => {
                return a.id - b.id;
            }).forEach((block, index) => {
                trxCount += block.transactions.length;
                if (index > 0) {
                    blockTimes.push([block.id, (block.timestamp - previousTime) / 1000]);
                    lastBlock = block.timestamp;
                } else {
                    firstBlock = block.timestamp;
                }
                previousTime = block.timestamp;
            });

            // Output block rows for the last 20 blocks
            blocks = latestBlocks
            .sort((a, b) => {
                return b.id - a.id;
            })
            .take(20)
            .map((block) => {

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

            let trxIndex = 0;
            transactions = latestTransactions
            .map((trx) => {

                let opIndex = 0;
                return trx.operations.map(op => {
                    return (
                        <Operation
                            key={trxIndex++}
                            op={op}
                            result={trx.operation_results[opIndex++]}
                            block={trx.block_num}
                            current={"1.2.0"}
                            witnesses={witnesses}
                            witness_id_to_name={witness_id_to_name}
                            inverted={this.props.settings.get("inverseMarket")}
                        />
                    );
                })
                
            }).toArray();

            headBlock = latestBlocks.first().timestamp;
            avgTime = blockTimes.reduce((previous, current, idx, array) => {
                // console.log("previous:", previous,"current", current, "idx", idx);
                return previous + current[1] / array.length;
            }, 0);

            trxPerSec = trxCount / ((lastBlock - firstBlock) / 1000);
        }

        return (
            <div className="grid-block vertical page-layout">

                {/* First row of stats */}
                <div className="grid-block shrink" style={{paddingBottom: "1.5rem"}}>
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow">
                            <span className="txtlabel subheader">Current Block:</span>
                            <h3 className="txtlabel success">
                                #{utils.format_number(dynGlobalObject.get("head_block_number"), 0)}
                            </h3>
                        </div>
                    </div>
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow">
                            <span className="txtlabel subheader">Last block:</span>
                            <BlockTimeAgo blockTime={headBlock} />
                        </div>
                    </div>
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow">
                            <span className="txtlabel subheader">Trx/block</span>
                            <h3>{utils.format_number(trxCount / blockCount || 0, 2)}/block</h3>
                        </div>
                    </div>
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow">
                            <span className="txtlabel subheader">Avg block time</span>
                            <h3>{utils.format_number(avgTime, 2)}s</h3>
                        </div>
                    </div>
                </div>

                {/* Second row of stats */ }
                <div className="grid-block shrink" style={{paddingBottom: "1rem"}}>
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow clear-fix">
                            <span className="txtlabel float-left">Active delegates:</span>
                            <span className="txtlabel success float-right">
                                {globalObject.get("active_witnesses").size}
                            </span>
                        </div>
                    </div>
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow clear-fix">
                            <span className="txtlabel float-left">Active committee members:</span>
                            <span className="txtlabel success float-right">
                                {globalObject.get("active_committee_members").size}
                            </span>
                        </div>
                    </div>
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow clear-fix">
                            <span className="txtlabel float-left">Transactions per second:</span>
                            <span className="success float-right">
                                <span className="txtlabel">{utils.format_number(trxPerSec, 2)}</span><span>/s</span>
                            </span>
                        </div>
                    </div>
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow clear-fix">
                            <span className="txtlabel float-left">Recently missed blocks:</span>
                            <span className="txtlabel success float-right">
                                {dynGlobalObject.get("recently_missed_count")}
                            </span>
                        </div>
                    </div>                    
                </div>
            
            {/* Third row: graphs */ }
                <div className="grid-block shrink">
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow">
                        </div>
                    </div>
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow">
                        <div className="text-left txtlabel">Block times</div>
                            <BlocktimeChart blockTimes={blockTimes} />
                        </div>
                    </div>
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow">
                            <div className="text-left txtlabel">Transactions</div>
                            <TransactionChart blocks={latestBlocks} />
                        </div>
                    </div>
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow">
                        </div>
                    </div>                                                        
                </div>
            
            {/* Fourth row: transactions and blocks */ }
                <div className="grid-block">
                    <div className="grid-block small-6 vertical">
                        <h3><Translate content="account.recent" /> </h3>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th><Translate content="explorer.block.date" /></th>
                                    <th><Translate content="explorer.block.op" /></th>
                                    <th><Translate content="account.votes.info" /></th>
                                    <th style={{paddingRight: "1.5rem", textAlign: "right"}}><Translate content="transfer.fee" /></th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions}
                            </tbody>
                        </table>
                    </div>
                    <div className="grid-block small-6 vertical">
                        
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
