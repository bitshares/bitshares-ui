import React from "react";
import {findDOMNode} from "react-dom";
import cnames from "classnames";

class Pulsate extends React.Component {
    constructor() {
        super();
        this.state = {
            value: null,
            pulse: ""
        };
    }

    componentWillReceiveProps(nextProps) {
        this.update(nextProps);
    }

    componentWillMount() {
        this.update(this.props);
    }

    compare(value, nextValue) {
        if (value === nextValue) {
            return null; // stay unchanged
        } else {
            return nextValue > value ? "green" : "red";
        }
    }

    update(props) {
        let value = this.state.value;
        let nextValue = props.value;
        let compareFunction = props.compareFunction || this.compare;

        if (value === null || nextValue === null) {
            this.setState({value: nextValue, pulse: ""});
            return;
        }

        let pulse = compareFunction(value, nextValue);
        if (pulse === null) {
            this.setState({value: nextValue});
        } else {
            this.setState({value: nextValue, pulse: ""}, () => {
                findDOMNode(this).offsetHeight;
                this.setState({pulse});
            });
        }
    }

    render() {
        let {pulse, value} = this.state;
        let {children, reverse, fill} = this.props;

        if (!children) {
            children = value;
        }

        if (!pulse) {
            return <span>{children}</span>;
        }

        fill = fill || "none";
        return (
            <span
                className={cnames("pulsate", pulse, {reverse})}
                style={{animationFillMode: fill}}
            >
                {children}
            </span>
        );
    }
}

export default Pulsate;
