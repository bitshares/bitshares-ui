import React from "react";
import Translate from "react-translate-component";
import PropTypes from "prop-types";
import Immutable from "immutable";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";

class PendingBlock extends React.Component {
    static propTypes = {
        blockNumber: PropTypes.number.isRequired,
        dynGlobalObject: ChainTypes.ChainObject.isRequired
    };

    static defaultProps = {
        dynGlobalObject: "2.1.0"
    };

    shouldComponentUpdate(nextProps) {
        return !Immutable.is(this.props.dynGlobalObject, nextProps.dynGlobalObject);
    }

    render() {
        const { blockNumber, dynGlobalObject } = this.props;
        const lastIrreversibleBlockNum = dynGlobalObject.get(
            "last_irreversible_block_num"
        );

        return blockNumber > lastIrreversibleBlockNum ? (
            <span>
                {" - "}
                (<Translate
                    content="operation.pending"
                    blocks={blockNumber - lastIrreversibleBlockNum}
                />)
            </span>
        ) : null;
    }
}

export default BindToChainState(PendingBlock);
