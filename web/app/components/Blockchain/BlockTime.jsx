import React from "react";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import TimeAgo from "../Utility/TimeAgo";
import utils from "common/utils";

/**
 * @brief displays block's date and time based on block number
 *
 * properties: block_number - number
 * Note, it doesn't fetch block, just calculates time based on number alone.
 **/

@BindToChainState({keep_updating:true})
class BlockTime extends React.Component {

    static propTypes = {
        block_number: React.PropTypes.number.isRequired,
        globalObject: ChainTypes.ChainObject.isRequired,
        dynGlobalObject: ChainTypes.ChainObject.isRequired
    };

    static defaultProps = {
        globalObject: "2.0.0",
        dynGlobalObject: "2.1.0"
    };

    constructor(props) {
        super(props);
        this.state = {time: null};
    }

    componentDidMount() {
        this.calcTime(this.props.block_number);
    }

    calcTime(block_number) {
        this.setState({time: utils.calc_block_time(block_number, this.props.globalObject, this.props.dynGlobalObject)});
    }

    componentWillReceiveProps(next_props) {
        if(next_props.block_number !== this.props.block_number) {
            this.calcTime(next_props.block_number);
        }
    }

    /*
    shouldComponentUpdate(next_props, next_state) {
        return next_props.block_number !== this.props.block_number || next_state.time !== this.state.time;
    }
    */

                //{this.state.time ?  <FormattedDate value={this.state.time} format="short"/> : null}
    render() {
        return (
            <span className="time" key={this.props.block_number}>
                {this.state.time ? <TimeAgo time={this.state.time} /> : null }
            </span>
        );
    }
}

export default BlockTime;
