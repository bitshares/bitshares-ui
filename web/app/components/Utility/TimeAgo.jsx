import React from "react";
import {FormattedRelative} from "react-intl";

class TimeAgo extends React.Component {

    static propTypes = {
        time: React.PropTypes.object.isRequired,
        chain_time: React.PropTypes.bool,
        component: React.PropTypes.element,
        className: React.PropTypes.string
    };

    static defaultProps = {
        chain_time: true
    };

    shouldComponentUpdate(nextProps) {
        return (
            nextProps.time !== this.props.time
        );
    }

    render() {
        let {time, chain_time} = this.props;
        var offset_mills = chain_time ? ChainStore.getEstimatedChainTimeOffset() : 0
        if (!time) {
            return null;
        }
        
        if (typeof time === "string" && time.indexOf("+") === -1) {
            time += "+00:00";
        }

        let timePassed = Math.round( ( new Date().getTime() - new Date(time).getTime() + offset_mills ) / 1000 );
        let interval;

        if (timePassed < 60) { // 60s
            interval = 500; // 0.5s
        } else if (timePassed < 60 * 60){ // 1 hour
            interval = 60 * 500; // 30 seconds
        } else {
            interval = 60 * 60 * 500 // 30 minutes
        }

        return (
            <span
                className={this.props.className}
                ref={"timeago_ttip_" + time}
                data-tip={new Date(time)}
                data-place="top"
                data-type="light"
            >
                <FormattedRelative
                    updateInterval={interval}
                    value={new Date(time).getTime() + offset_mills * 0.75}
                    initialNow={Date.now()}
                />
            </span>
        );
        
    }
}

export default TimeAgo;
