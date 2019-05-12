import React from "react";
import ReactDOM from "react-dom";
import {Table} from "bitshares-ui-style-guide";

class CollapsibleTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isCollapsed: props.isCollapsed || false,
            isCollapseAnimationCompleted: props.isCollapsed || false
        };
    }

    componentDidMount() {
        // This quite ugly way of tracking animation is required to add display: none at the end of the animation
        // otherwise collapsed element will take place on the page at the end of the animation
        // There's no possibility to manipulate with display property on animation directly in CSS
        let dom = ReactDOM.findDOMNode(this);
        let tbody = dom.querySelector(".ant-table-tbody");

        let onAnimationEnd = () => {
            this.setState({
                isCollapseAnimationCompleted: this.state.isCollapsed
            });
        };

        tbody.addEventListener("animationend", onAnimationEnd);
        tbody.addEventListener("webkitAnimationEnd", onAnimationEnd);
        tbody.addEventListener("oAnimationEnd", onAnimationEnd);
        tbody.addEventListener("MSAnimationEnd", onAnimationEnd);
    }

    render() {
        // Create a wrapper which allows to call externally passed onClick function after execution of our one, preserving all the other handlers intact
        let onHeaderRow = (column, index) => {
            let handlers = {};

            let innerOnHeaderRow = this.props.onHeaderRow;
            if (innerOnHeaderRow) {
                let innerHandlers = innerOnHeaderRow(column, index);
                handlers = innerHandlers;
            }

            handlers.onClick = event => {
                // Do nothing if selectable column is clicked
                let className = event.target.getAttribute("class");
                if (className && className.includes("ant-checkbox-input")) {
                    return;
                }

                this.setState({
                    isCollapsed: !this.state.isCollapsed
                });

                this.setState({
                    isCollapseAnimationCompleted: false
                });

                if (innerOnHeaderRow) {
                    let innerHandlers = innerOnHeaderRow(column, index);
                    if (innerHandlers.onClick) {
                        innerHandlers.onClick(event);
                    }
                }
            };

            return handlers;
        };

        return (
            <Table
                {...this.props}
                onHeaderRow={onHeaderRow}
                className={`collapsible-table ${
                    this.state.isCollapsed
                        ? "collapsible-table-collapsed"
                        : "collapsible-table-uncollapsed"
                }
                ${
                    this.state.isCollapseAnimationCompleted
                        ? "collapsible-table-collapsed-animation-completed"
                        : null
                }`}
            />
        );
    }
}

export default CollapsibleTable;
