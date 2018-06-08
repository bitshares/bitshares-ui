import React from "react";
import PropTypes from "prop-types";
import {FormattedDate} from "react-intl";
import Immutable from "immutable";
import BlockchainActions from "actions/BlockchainActions";
import Transaction from "./Transaction";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import LinkToWitnessById from "../Utility/LinkToWitnessById";
import {Element, Events, animateScroll as scroll, scroller} from "react-scroll";

class TransactionList extends React.Component {
    shouldComponentUpdate(nextProps) {
        return nextProps.block.id !== this.props.block.id;
    }

    render() {
        let {block} = this.props;
        let transactions = null;

        transactions = [];

        if (block.transactions.length > 0) {
            transactions = [];

            block.transactions.forEach((trx, index) => {
                transactions.push(
                    <Element
                        key={index}
                        id={`tx_${index}`}
                        name={`tx_${index}`}
                    >
                        <Transaction key={index} trx={trx} index={index} />
                    </Element>
                );
            });
        }

        return <div>{transactions}</div>;
    }
}

class Block extends React.Component {
    static propTypes = {
        dynGlobalObject: ChainTypes.ChainObject.isRequired,
        blocks: PropTypes.object.isRequired,
        height: PropTypes.number.isRequired
    };

    static defaultProps = {
        dynGlobalObject: "2.1.0",
        blocks: {},
        height: 1
    };

    constructor(props) {
        super(props);

        this.state = {
            showInput: false
        };

        this.scrollToTop = this.scrollToTop.bind(this);
    }

    componentDidMount() {
        this._getBlock(this.props.height);

        Events.scrollEvent.register("begin", () => {
            //console.log("begin", arguments);
        });

        Events.scrollEvent.register("end", () => {
            //console.log("end", arguments);
            this.setState({scrollEnded: true});
        });
    }

    componentWillReceiveProps(np) {
        if (np.height !== this.props.height) {
            this._getBlock(np.height);
        }
    }

    shouldComponentUpdate(np, ns) {
        return (
            !Immutable.is(np.blocks, this.props.blocks) ||
            np.height !== this.props.height ||
            np.dynGlobalObject !== this.props.dynGlobalObject ||
            ns.showInput !== this.state.showInput
        );
    }

    scrollToTop() {
        scroll.scrollToTop({
            duration: 1500,
            delay: 100,
            smooth: true,
            containerId: "blockContainer"
        });
    }

    _getBlock(height) {
        if (height) {
            height = parseInt(height, 10);
            if (!this.props.blocks.get(height)) {
                BlockchainActions.getBlock(height);
            }
        }
    }

    _nextBlock() {
        let height = this.props.match.params.height;
        let nextBlock = Math.min(
            this.props.dynGlobalObject.get("head_block_number"),
            parseInt(height, 10) + 1
        );
        this.props.history.push(`/block/${nextBlock}`);
    }

    _previousBlock() {
        let height = this.props.match.params.height;
        let previousBlock = Math.max(1, parseInt(height, 10) - 1);
        this.props.history.push(`/block/${previousBlock}`);
    }

    toggleInput(e) {
        e.preventDefault();
        this.setState({showInput: true});
    }

    _onKeyDown(e) {
        if (e && e.keyCode === 13) {
            this.props.history.push(`/block/${e.target.value}`);
            this.setState({showInput: false});
        }
    }

    _onSubmit() {
        const value = this.refs.blockInput.value;
        if (value) {
            this._onKeyDown({keyCode: 13, target: {value}});
        }
    }

    componentDidUpdate() {
        let {blocks} = this.props;
        let height = parseInt(this.props.height, 10);
        let block = blocks.get(height);

        if (this.props.scrollToIndex && !this.state.scrollEnded && block) {
            scroller.scrollTo(`tx_${this.props.scrollToIndex}`, {
                duration: 1500,
                delay: 100,
                smooth: true,
                offset: -100,
                containerId: "blockContainer"
            });
        }
    }

    render() {
        const {showInput} = this.state;
        let {blocks} = this.props;
        let height = parseInt(this.props.height, 10);
        let block = blocks.get(height);

        let blockHeight = showInput ? (
            <span className="inline-label">
                <input
                    ref="blockInput"
                    type="number"
                    onKeyDown={this._onKeyDown.bind(this)}
                />
                <button onClick={this._onSubmit.bind(this)} className="button">
                    <Translate content="explorer.block.go_to" />
                </button>
            </span>
        ) : (
            <span>
                <Translate
                    style={{textTransform: "uppercase"}}
                    component="span"
                    content="explorer.block.title"
                />
                <a onClick={this.toggleInput.bind(this)}>&nbsp;#{height}</a>
            </span>
        );

        return (
            <div className="grid-block page-layout">
                <div className="grid-block main-content">
                    <div className="grid-content" id="blockContainer">
                        <div className="grid-content no-overflow medium-offset-2 medium-8 large-offset-3 large-6 small-12">
                            <h4 className="text-center">{blockHeight}</h4>
                            <ul>
                                <li>
                                    <Translate
                                        component="span"
                                        content="explorer.block.date"
                                    />:{" "}
                                    {block ? (
                                        <FormattedDate
                                            value={block.timestamp}
                                            format="full"
                                        />
                                    ) : null}
                                </li>
                                <li>
                                    <Translate
                                        component="span"
                                        content="explorer.block.witness"
                                    />:{" "}
                                    {block ? (
                                        <LinkToWitnessById
                                            witness={block.witness}
                                        />
                                    ) : null}
                                </li>
                                <li>
                                    <Translate
                                        component="span"
                                        content="explorer.block.previous"
                                    />: {block ? block.previous : null}
                                </li>
                                <li>
                                    <Translate
                                        component="span"
                                        content="explorer.block.transactions"
                                    />:{" "}
                                    {block ? block.transactions.length : null}
                                </li>
                            </ul>
                            <div
                                className="clearfix"
                                style={{marginBottom: "1rem"}}
                            >
                                <div
                                    className="button float-left outline"
                                    onClick={this._previousBlock.bind(this)}
                                >
                                    &#8592;
                                </div>
                                <div
                                    className="button float-right outline"
                                    onClick={this._nextBlock.bind(this)}
                                >
                                    &#8594;
                                </div>
                            </div>
                            {block ? <TransactionList block={block} /> : null}
                            <div
                                style={{textAlign: "center", marginBottom: 20}}
                            >
                                <a onClick={this.scrollToTop}>
                                    <Translate content="global.return_to_top" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default BindToChainState(Block);
