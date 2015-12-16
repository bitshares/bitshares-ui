import React from "react";
import {PropTypes} from "react";
import BaseComponent from "../BaseComponent";
import {FormattedDate} from "react-intl";
import Immutable from "immutable";
import BlockchainActions from "actions/BlockchainActions";
import Transaction from "./Transaction";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import LinkToWitnessById from "./LinkToWitnessById";

class TransactionList extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
                nextProps.block.id !== this.props.block.id
            );
    }

    render() {
        let {block} = this.props;
        let transactions = null;
        
        transactions = [];
        
        if (block.transactions.length > 0) {
            transactions = [];

            block.transactions.forEach((trx, index) => {
                transactions.push(
                    <Transaction
                        key={index}
                        trx={trx}
                        index={index}
                    />);
            });
        }

        return (
                <div>
                    {transactions}
                </div>
            );
    }
}


@BindToChainState({keep_updating: true})
class Block extends BaseComponent {
    static propTypes = {
        dynGlobalObject: ChainTypes.ChainObject.isRequired,
        blocks: PropTypes.object.isRequired,
        height: PropTypes.number.isRequired
    }

    static defaultProps = {
        dynGlobalObject: "2.1.0",
        blocks: {},
        height: 1
    };

    constructor(props) {
        super(props);
        this._bind("_previousBlock", "_nextBlock");
    }

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.blocks, this.props.blocks) ||
            nextProps.height !== this.props.height ||
            nextProps.dynGlobalObject !== this.props.dynGlobalObject
        );
    }

    _getBlock(height) {
        if (height) {
            height = parseInt(height, 10);
            if (!this.props.blocks.get(height)) {
                BlockchainActions.getBlock(height);
            } 
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.height !== this.props.height) {
            this._getBlock(nextProps.height);
        }
    }

    _nextBlock() {
        let height = this.props.params.height;
        let nextBlock = Math.min(this.props.dynGlobalObject.get("head_block_number"), parseInt(height, 10) + 1);
        this.props.history.pushState(null, `/block/${nextBlock}`);
    }

    _previousBlock() {
        let height = this.props.params.height;
        let previousBlock = Math.max(1, parseInt(height, 10) - 1);
        this.props.history.pushState(null, `/block/${previousBlock}`);
    }

    componentDidMount() {
        this._getBlock(this.props.height);
    }

    render() {

        let {blocks} = this.props;
        let height = parseInt(this.props.height, 10);
        let block = blocks.get(height);

        return (
            <div className="grid-block">
                <div className="grid-content">
                        <div className="grid-content no-overflow medium-offset-2 medium-8 large-offset-3 large-6 small-12">
                        <h4 className="text-center"><Translate style={{textTransform: "uppercase"}} component="span" content="explorer.block.title" /> #{height}</h4>
                        <ul>
                           <li><Translate component="span" content="explorer.block.date" />:  {block ? <FormattedDate
                                value={block.timestamp}
                                format="full"
                                /> : null}
                            </li>
                            <li><Translate component="span" content="explorer.block.witness" />:  {block ? <LinkToWitnessById witness={block.witness} /> : null}</li>
                            <li><Translate component="span" content="explorer.block.previous" />: {block ? block.previous : null}</li>
                            <li><Translate component="span" content="explorer.block.transactions" />: {block ? block.transactions.length : null}</li>
                        </ul>
                        <div className="clearfix" style={{marginBottom: "1rem"}}>
                            <div className="button float-left outline" onClick={this._previousBlock.bind(this)}>&#8592;</div>
                            <div className="button float-right outline" onClick={this._nextBlock.bind(this)}>&#8594;</div>
                        </div> 
                        {block ? <TransactionList
                            block={block} 
                        /> : null}
                    </div>
                </div>
            </div>
        );
    }
}

export default Block;
