import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import intlData from "../Utility/intlData";
import BlockchainActions from "actions/BlockchainActions";
import Translate from "react-translate-component";
import {FormattedDate, FormattedRelative,FormattedTime} from "react-intl";
import Operation from "../Blockchain/Operation";
import LinkToWitnessById from "../Blockchain/LinkToWitnessById";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import TransactionChart from "./TransactionChart";
import BlocktimeChart from "./BlocktimeChart";
import classNames from "classnames";
import utils from "common/utils";
import Immutable from "immutable";
import TimeAgo from "../Utility/TimeAgo";
import FormattedAsset from "../Utility/FormattedAsset";
import Icon from "../Icon/Icon";
import Ps from "perfect-scrollbar";

require("../Blockchain/json-inspector.scss");

class BlockTimeAgo extends React.Component {

    shouldComponentUpdate(nextProps) {
        return nextProps.blockTime !== this.props.blockTime;
    }

    render() {
        let {blockTime} = this.props;

        // let timePassed = Date.now() - blockTime;
        let timePassed = (new Date()).getTime() - (new Date(blockTime)).getTime();

        let textClass = classNames("txtlabel",
            {"success": timePassed <= 6000},
            {"info": timePassed > 6000 && timePassed <= 15000},
            {"warning": timePassed > 15000 && timePassed <= 25000},
            {"error": timePassed > 25000}
        );

        return (
            blockTime ? <h3 className={textClass} ><TimeAgo time={blockTime} /></h3> : null
        );

    }
}

@BindToChainState({keep_updating: true, show_loader: true})
class Blocks extends React.Component {

    static propTypes = {
        globalObject: ChainTypes.ChainObject.isRequired,
        dynGlobalObject: ChainTypes.ChainObject.isRequired,
        coreAsset: ChainTypes.ChainAsset.isRequired
    }

    static defaultProps = {
        globalObject: "2.0.0",
        dynGlobalObject: "2.1.0",
        coreAsset: "1.3.0"
    }

    constructor(props) {
        super(props);
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
        let oc = React.findDOMNode(this.refs.operations);
        Ps.initialize(oc);
        let blocks = React.findDOMNode(this.refs.blocks);
        Ps.initialize(blocks);
    }

    shouldComponentUpdate(nextProps) {
        return !Immutable.is(nextProps.latestBlocks, this.props.latestBlocks);
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

    render() {

        let {latestBlocks, latestTransactions, globalObject, dynGlobalObject, coreAsset} = this.props;
        let blocks = null, transactions = null;
        let headBlock = null;
        let trxCount = 0, blockCount = latestBlocks.size, trxPerSec = 0, blockTimes = [], avgTime = 0;

        if (latestBlocks && latestBlocks.size >= 20) {

            let previousTime;

            let lastBlock, firstBlock;

            // Map out the block times for the latest blocks and count the number of transactions
            latestBlocks.filter((a, index) => {
                // Only use consecutive blocks counting back from head block
                return a.id === (dynGlobalObject.get("head_block_number") - index)})
            .sort((a, b) => {
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
                            <td><Link to="block" params={{height: block.id}}>#{utils.format_number(block.id, 0)}</Link></td>
                            <td><FormattedDate
                                value={block.timestamp}
                                formats={intlData.formats}
                                format="time"
                            /></td>
                            <td><LinkToWitnessById witness={block.witness} /></td>
                            <td>{utils.format_number(block.transactions.length, 0)}</td>
                        </tr>
                    );
            }).toArray();
            let trxIndex = 0;
            transactions = latestTransactions.take(20)
            .map((trx) => {

                let opIndex = 0;
                return trx.operations.map(op => {
                    return (
                     <Operation
                            key={trxIndex++}
                            op={op}
                            result={trx.operation_results[opIndex++]}
                            block={trx.block_num}
                            hideFee={true}
                            hideOpLabel={true}
                            current={"1.2.0"}
                        />
                    );
                })

            }).toArray();

            headBlock = latestBlocks.first().timestamp;
            avgTime = blockTimes.reduce((previous, current, idx, array) => {
                return previous + current[1] / array.length;
            }, 0);

            trxPerSec = trxCount / ((lastBlock - firstBlock) / 1000);
        }

        return (
            <div className="grid-block vertical page-layout">

                {/* First row of stats */}
                <div className="align-center grid-block shrink small-horizontal blocks-row">
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow">
                            <span className="txtlabel subheader"><Translate component="span" content="explorer.blocks.current_block" /></span>
                            <h2>#{utils.format_number(dynGlobalObject.get("head_block_number"), 0)}</h2>
                        </div>
                    </div>
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow">

                            <span className="txtlabel subheader"><Translate component="span" content="explorer.blocks.last_block" /></span>
                              <BlockTimeAgo blockTime={headBlock} />
                        </div>
                    </div>
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow">

                            <span className="txtlabel subheader"><Translate component="span" content="explorer.blocks.trx_per_sec" /></span>
                            <h2>{utils.format_number(trxPerSec, 2)}</h2>
                        </div>
                    </div>
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow">

                            <span className="txtlabel subheader"><Translate component="span" content="explorer.blocks.avg_conf_time" /></span>
                            <h2>{utils.format_number(avgTime / 2, 2)}s</h2>
                        </div>
                    </div>
                </div>

                {/* Second row of stats */ }
                <div className="align-center grid-block shrink small-horizontal  blocks-row">
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow clear-fix">
                            <span className="txtlabel subheader"><Translate component="span" content="explorer.blocks.active_witnesses" /></span>
                            <h2 className="txtlabel success">
                                {globalObject.get("active_witnesses").size}
                            </h2>
                        </div>
                    </div>

                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow clear-fix">
                            <span className="txtlabel subheader"><Translate component="span" content="explorer.blocks.active_committee_members" /></span>
                            <h2 className="txtlabel success">
                                {globalObject.get("active_committee_members").size}
                            </h2>
                        </div>
                    </div>

                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow clear-fix">
                            <span className="txtlabel subheader"><Translate component="span" content="explorer.blocks.trx_per_block" /></span>
                            <h2>{utils.format_number(trxCount / blockCount || 0, 2)}</h2>
                        </div>
                    </div>
                    <div className="grid-block text-center small-6 medium-3">
                        <div className="grid-content no-overflow clear-fix">
                            <span className="txtlabel subheader"><Translate component="span" content="explorer.blocks.recently_missed_blocks" /></span>
                            <h2 className="txtlabel warning" style={{fontWeight: "100"}}>
                                {dynGlobalObject.get("recently_missed_count")}
                            </h2>
                        </div>
                    </div>
                </div>

            {/* Third row: graphs */ }
                <div className="align-center grid-block shrink small-vertical medium-horizontal blocks-row">
                    <div className="grid-block text-center small-12 medium-3">
                        <div className="grid-content no-overflow clear-fix">
                            <span className="txtlabel subheader"><Translate component="span" content="explorer.asset.summary.current_supply" /></span>
                            <h3 className="txtlabel">
                                <FormattedAsset
                                    amount={coreAsset.getIn(["dynamic", "current_supply"])}
                                    asset={coreAsset.get("id")}
                                    decimalOffset={5}
                                />
                            </h3>
                        </div>
                    </div>
                    <div className="grid-block text-center small-12 medium-3">
                        <div className="grid-content no-overflow">
                            <div className="text-left txtlabel"><Translate component="span" content="explorer.blocks.block_times" /></div>
                                <BlocktimeChart blockTimes={blockTimes} head_block_number={dynGlobalObject.get("head_block_number")} />
                            </div>
                        </div>
                    <div className="grid-block text-center small-12 medium-3">
                        <div className="grid-content no-overflow">
                            <div className="text-left txtlabel"><Translate component="span" content="explorer.blocks.trx_per_block" /></div>
                            <TransactionChart blocks={latestBlocks} head_block={dynGlobalObject.get("head_block_number")}/>
                        </div>
                    </div>
                    <div className="grid-block text-center small-12 medium-3">
                        <div className="grid-content no-overflow clear-fix">
                            <span className="txtlabel subheader"><Translate component="span" content="explorer.asset.summary.stealth_supply" /></span>
                            <h3 className="txtlabel">
                                <FormattedAsset
                                    amount={coreAsset.getIn(["dynamic", "confidential_supply"])}
                                    asset={coreAsset.get("id")}
                                    decimalOffset={5}
                                />
                            </h3>
                        </div>
                    </div>

                </div>

            {/* Fourth row: transactions and blocks */ }
                <div className="grid-block no-overflow" style={{minHeight: "400px"}}>
                    <div className="grid-block small-12 medium-6 vertical no-overflow">
                        <div className="grid-content" ref="operations">
                            <h3><Translate content="account.recent" /> </h3>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th><Translate content="account.votes.info" /></th>
                                        <th><Translate content="explorer.block.time" /></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="grid-block medium-6 show-for-medium vertical no-overflow">
                        <div className="grid-content" ref="blocks">
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

export default Blocks;
