import React from "react";
import {PropTypes} from "react";
import BaseComponent from "../BaseComponent";
import {FormattedDate} from "react-intl";
import WitnessActions from "actions/WitnessActions";
import {Link} from "react-router";
import intlData from "../Utility/intlData";
import Immutable from "immutable";
import AssetActions from "actions/AssetActions";
import BlockchainActions from "actions/BlockchainActions";
import Transaction from "./Transaction";
import Translate from "react-translate-component";

class Block extends BaseComponent {
    constructor(props) {
        super(props);
        this._bind("_previousBlock", "_nextBlock");
    }

    shouldComponentUpdate(nextProps) {
        // console.log("blocks:", !Immutable.is(nextProps.blocks, this.props.blocks));
        // console.log("witnesses:", !Immutable.is(nextProps.witnesses, this.props.witnesses));
        // console.log("witness_id_to_name:", !Immutable.is(nextProps.witness_id_to_name, this.props.witness_id_to_name));
        // console.log("height:", nextProps.height !== this.props.height);
        // console.log("assets:", !Immutable.is(nextProps.assets, this.props.assets));
        return (
            !Immutable.is(nextProps.blocks, this.props.blocks) ||
            nextProps.height !== this.props.height ||
            !Immutable.is(nextProps.witnesses, this.props.witnesses) ||
            !Immutable.is(nextProps.witness_id_to_name, this.props.witness_id_to_name) ||
            !Immutable.is(nextProps.assets, this.props.assets) ||
            nextProps.accounts !== this.props.accounts ||
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
        let nextBlock = Math.min(this.props.dynGlobalObject.head_block_number, parseInt(height, 10) + 1);
        this.context.router.transitionTo("block", {height: nextBlock});
    }

    _previousBlock() {
        let height = this.context.router.getCurrentParams().height;
        let previousBlock = Math.max(1, parseInt(height, 10) - 1);
        this.context.router.transitionTo("block", {height: previousBlock});
    }

    componentDidMount() {
        if (!this.props.assets.get("1.4.0")) {
            AssetActions.getAsset("1.4.0");
        }
        this._getBlock(this.props.height);
        this._bindKey("right", this._nextBlock);
        this._bindKey("left", this._previousBlock);
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
        // }
    }

    render() {

        let {blocks, assets, accounts, witnesses, witness_id_to_name} = this.props;
        let height = parseInt(this.props.height, 10);
        let block = blocks.get(height);
        let transactions = null;

        if (block) {
            // console.log("block:", block);
            if (!witness_id_to_name.get(block.witness)) {
                this._fetchWitnesses(block.witness, witnesses, witness_id_to_name);
            }
            
            if (block.transactions.length > 0) {
                transactions = [];

                block.transactions.forEach((trx, index) => {
                    transactions.push(<Transaction key={index} trx={trx} assets={assets} accounts={accounts} index={index}/>);
                });

            }
        }


        return (
            <div className="grid-block small-offset-2">
                <div className="grid-content">
                    <h4><Translate style={{textTransform: "uppercase"}} component="span" content="explorer.block.title" /> #{height}</h4>
                    {block ? (
                    <ul>
                        <li><Translate component="span" content="explorer.block.date" />: <FormattedDate
                            value={block.timestamp}
                            formats={intlData.formats}
                            format="full"
                            />
                        </li>
                        <li><Translate component="span" content="explorer.block.witness" />: {witness_id_to_name.get(block.witness) ?
                            <Link to="account" params={{name: witness_id_to_name.get(block.witness)}}>{witness_id_to_name.get(block.witness)}</Link> :
                            null}</li>
                        <li><Translate component="span" content="explorer.block.previous" />: {block.previous}</li>
                        <li><Translate component="span" content="explorer.block.previous_secret" />: {block.previous_secret}</li>
                        <li><Translate component="span" content="explorer.block.next_secret" />: {block.next_secret_hash}</li>
                    </ul>
                    ) : null}

                    {transactions ? transactions : null}
                </div>
            </div>
        );
    }
}

Block.defaultProps = {
    block: {},
    assets: {},
    accounts: {},
    height: 1
};

Block.propTypes = {
    block: PropTypes.object.isRequired,
    assets: PropTypes.object.isRequired,
    accounts: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired
};

Block.contextTypes = { router: React.PropTypes.func.isRequired };

export default Block;
