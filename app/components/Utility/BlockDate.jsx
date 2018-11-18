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
        if (!this.props.blockHeader)
            BlockchainActions.getHeader.defer(this.props.block_number);
    }

    shouldComponentUpdate(np) {
        if (np.blockHeader && !this.props.blockHeader)
            setTimeout(ReactTooltip.rebuild, 1000);
        return np.blockHeader !== this.props.blockHeader;
    }

    render() {
        const {blockHeader, tooltip, component, format} = this.props;
        if (!blockHeader) return React.createElement(component);
        return React.createElement(
            component,
            {
                className: tooltip ? "tooltip" : "",
                "data-tip": tooltip ? blockHeader.timestamp : ""
            },
            <span>
                {counterpart.localize(blockHeader.timestamp, {
                    type: "date",
                    format
                })}
            </span>
        );
    }
}

BlockDate = connect(
    BlockDate,
    {
        listenTo() {
            return [BlockchainStore];
        },
        getProps(props) {
            return {
                blockHeader: BlockchainStore.getState().blockHeaders.get(
                    props.block_number
                )
            };
        }
    }
);

export default BlockDate;
