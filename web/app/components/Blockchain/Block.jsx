import React from "react";
import {PropTypes} from "react";
import BaseComponent from "../BaseComponent";
import {FormattedDate} from "react-intl";
import intlData from "../Utility/intlData";
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
    }

    static contextTypes = {
        router: React.PropTypes.func.isRequired 
    }

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
        let height = this.context.router.getCurrentParams().height;
        let nextBlock = Math.min(this.props.dynGlobalObject.get("head_block_number"), parseInt(height, 10) + 1);
        this.context.router.transitionTo("block", {height: nextBlock});
    }

    _previousBlock() {
        let height = this.context.router.getCurrentParams().height;
        let previousBlock = Math.max(1, parseInt(height, 10) - 1);
        this.context.router.transitionTo("block", {height: previousBlock});
    }

    componentDidMount() {
        this._getBlock(this.props.height);
        this._bindKey("right", this._nextBlock);
        this._bindKey("left", this._previousBlock);
    }

    render() {

        let {blocks} = this.props;
        let height = parseInt(this.props.height, 10);
        let block = blocks.get(height);

        if (!block) {
            return null;
        }

        return (
            <div className="grid-block">
                <div className="grid-container">
                    <div className="grid-content">
                        
                        <h4><Translate style={{textTransform: "uppercase"}} component="span" content="explorer.block.title" /> #{height}</h4>
                        <ul>
                            <li><Translate component="span" content="explorer.block.date" />: <FormattedDate
                                value={block.timestamp}
                                formats={intlData.formats}
                                format="full"
                                />
                            </li>
                            <li><Translate component="span" content="explorer.block.witness" />: <LinkToWitnessById witness={block.witness} /></li>
                            <li><Translate component="span" content="explorer.block.previous" />: {block.previous}</li>
                            <li><Translate component="span" content="explorer.block.transactions" />: {block.transactions.length}</li>
                        </ul>
                        <TransactionList
                            block={block} 
                        /> 
                    </div>
                </div>
            </div>
        );
    }
}

export default Block;
