import React from "react";
import {FormattedRelative} from "react-intl";

class TimeAgo extends React.Component {

    static propTypes = {
        time: React.PropTypes.object.isRequired,
        chain_time: React.PropTypes.bool,
        component: React.PropTypes.element,
        className: React.PropTypes.string
    }

    static defaultProps = {
        chain_time: true
    }

    constructor(props) {
        super(props);
        this.timeout = null;
        this._update = this._update.bind(this);
    }

    shouldComponentUpdate(nextProps) {
        if (nextProps.time !== this.props.time) {
            this.forceUpdate();
        }
        return false;
    }

    _update() {
        this._clearTimeout();
        let {time, chain_time} = this.props;
        var offset_mills = chain_time ? ChainStore.getEstimatedChainTimeOffset() : 0
        if (typeof time === "string") {
            time += "+00:00";
        }
        let timePassed = Math.round( ( new Date().getTime() - new Date(time).getTime() + offset_mills ) / 1000 );
        let interval;
        if (timePassed < 60) { // 60s
            interval = 1000; // 1s
        } else if (timePassed < 60 * 60){ // 1 hour
            interval = 60 * 1000; // 1 minute
        } else {
            interval = 60 * 60 * 1000 // 1 hour
        }

        // console.log("now:", now, "propTime:", propTime, "time:", time, "typeof time:", typeof time);

        this.timeout = setTimeout(this._update, interval);

        this.forceUpdate();
    }

    _clearTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }

    componentDidMount() {
        this._update();
    }

    componentWillUnmount() {
        this._clearTimeout();
    }

    render() {
        let {time, component, chain_time} = this.props;
        var offset_mills = chain_time ? ChainStore.getEstimatedChainTimeOffset() : 0
        if (!time) {
            return null;
        }
        
        if (typeof time === "string" && time.indexOf("+") === -1) {
            time += "+00:00";
        }

        component = component ? component : "span";

        let timeAgo = <span ref={"timeago_ttip_" + time} data-tip={new Date(time)} data-place="top" data-type="light"><FormattedRelative value={new Date(time).getTime() + offset_mills}/></span>
        return React.createElement(component, {className: this.props.className}, timeAgo);
    }
}

export default TimeAgo;
