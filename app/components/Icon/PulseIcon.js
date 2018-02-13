import React, {Component} from "react";
import {PropTypes} from "react";

import Icon from "./Icon";

export default class PulseIcon extends Component {

    static propTypes = {
        duration: PropTypes.number.isRequired,
        offIcon: PropTypes.string.isRequired,
        onIcon: PropTypes.string.isRequired,
    };

    componentDidMount() {
        const { duration } = this.props;
        this.interval = setInterval(this.tick,duration);
    }

    componentWillUnmount() {
        this.interval && clearInterval(this.interval);
    }

    tick = () => {
        const { onIcon, offIcon } = this.props;
        const { name = onIcon } = this.state || {};
        this.setState({
            name: name === onIcon ? offIcon : onIcon
        });
    };

    render() {
        const { onIcon, rest } = this.props;
        const { name = onIcon } = this.state || {};
        return (
            <Icon name={name} {...rest} />
        );
    }
}
