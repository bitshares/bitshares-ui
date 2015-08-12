import React from "react";
import {FormattedDate} from "react-intl";
import intlData from "../Utility/intlData";
import chain from "api/chain.js";

/**
 * @brief displays block's date and time based on block number
 *
 * properties: block_number - number
 * Note, it doesn't fetch block, just calculates time based on number alone.
 **/

class BlockTime extends React.Component {

    constructor(props) {
        super(props);
        this.state = {time: null};
        this.calcTime(this.props.block_number);
    }

    calcTime(block_number) {
        Promise.all([chain.fetchGlobalProperties(), chain.fetchDynamicGlobalProperties()]).then( results => {
            let block_interval = results[0].get("parameters").get("block_interval");
            let head_block = results[1].get("head_block_number");
            let head_block_time = new Date(results[1].get("time"));
            let seconds_below = (head_block - block_number) * block_interval;
            let time = new Date(head_block_time - seconds_below * 1000);
            this.setState({time});
        });
    }

    componentWillReceiveProps(next_props) {
        if(next_props.block_number !== this.props.block_number) {
            this.calcTime(next_props.block_number);
        }
    }

    shouldComponentUpdate(next_props, next_state) {
        return next_props.block_number !== this.props.block_number || next_state.time !== this.state.time;
    }

    render() {
        return (
            <span className="time">
                {this.state.time ?  <FormattedDate value={this.state.time} formats={intlData.formats} format="short"/> : null}
            </span>
        );
    }
}

BlockTime.propTypes = {
    block_number: React.PropTypes.number.isRequired
};

export default BlockTime;
