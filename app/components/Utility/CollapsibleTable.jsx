import React from "react";
import {Table} from "bitshares-ui-style-guide";

class CollapsibleTable extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isCollapsed: props.isCollapsed || false
        };
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
                this.setState({
                    isCollapsed: !this.state.isCollapsed
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
                }`}
            />
        );
    }
}

export default CollapsibleTable;
