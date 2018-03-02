import React from "react";
import counterpart from "counterpart";
import {connect} from "alt-react";
import BlockchainStore from "stores/BlockchainStore";
import BlockchainActions from "actions/BlockchainActions";
import ReactTooltip from "react-tooltip";
import getLocale from "browser-locale";

/**
 * @brief displays block's date and time based on block number
 *
 * properties: block - number
 * Note, it doesn't fetch block, just calculates time based on number alone.
 **/

class BlockDate extends React.Component {
    static defaultProps = {
        format:
            getLocale()
                .toLowerCase()
                .indexOf("en-us") !== -1
                ? "market_history_us"
                : "market_history",
        tooltip: false,
        component: "span"
    };

    componentWillMount() {
        if (!this.props.block)
            BlockchainActions.getBlock(this.props.block_number);
    }

    shouldComponentUpdate(np) {
        if (np.block && !this.props.block)
            setTimeout(ReactTooltip.rebuild, 1000);
        return np.block !== this.props.block;
    }

    render() {
        const {block, tooltip, component, format} = this.props;
        if (!block) return React.createElement(component);
        return React.createElement(
            component,
            {
                className: tooltip ? "tooltip" : "",
                "data-tip": tooltip ? block.timestamp : ""
            },
            <span>
                {counterpart.localize(block.timestamp, {type: "date", format})}
            </span>
        );
    }
}

BlockDate = connect(BlockDate, {
    listenTo() {
        return [BlockchainStore];
    },
    getProps(props) {
        return {
            block: BlockchainStore.getState().blocks.get(props.block_number)
        };
    }
});

export default BlockDate;
