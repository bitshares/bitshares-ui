import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";

class DisableCopyText extends React.Component {
    static propTypes = {
        disableCopy: PropTypes.bool,
        replaceCopyText: PropTypes.string
    };

    constructor(props) {
        super(props);

        this._handleCopy = this._handleCopy.bind(this);
    }

    componentDidMount() {
        if (this.childRef) this.node = ReactDOM.findDOMNode(this.childRef);

        if (this.node && this.node.addEventListener) {
            this.node.addEventListener("copy", this._handleCopy);
        }
    }

    componentWillUnmount() {
        if (this.node && this.node.removeEventListener)
            this.node.removeEventListener("copy", this._handleCopy);
    }

    _handleCopy(evt) {
        if (this.props.disableCopy !== false) {
            if (this.props.replaceCopyText) {
                evt.clipboardData.setData(
                    "text/plain",
                    this.props.replaceCopyText
                );
            }

            evt.preventDefault();
        }
    }

    render() {
        return (
            <span ref={ref => (this.childRef = ref)}>
                {this.props.children}
            </span>
        );
    }
}

export default DisableCopyText;
