import React from "react";
import counterpart from "counterpart";
import {Table} from "bitshares-ui-style-guide";
import "./paginated-list.scss";
export default class PaginatedList extends React.Component {
    static defaultProps = {
        rows: [],
        pageSize: 20,

        className: "table",
        extraRow: null,
        style: {paddingBottom: "1rem"},
        loading: false,

        // can be a string (assumes the translation has one argument, total count),
        // or an object, which allows a custom label
        totalLabel: "utility.total_x_items",

        // @deprecated, use totalLabel
        label: null
    };

    constructor(props) {
        super(props);

        this.state = {
            pageSize: props.pageSize
        };
    }

    render() {
        const {pageSize} = this.state;
        const {header, rows, extraRow, loading} = this.props;

        const pageSizeOptions = [10, 20, 30, 40, 50, 100].filter(
            item => item < Math.max(this.props.pageSize, rows.length)
        );
        pageSizeOptions.push(Math.max(this.props.pageSize, rows.length));

        let totalColumnsLabel = null;
        if (this.props.label !== null) {
            totalColumnsLabel = total => {
                return counterpart.translate(this.props.label, {
                    count: total
                });
            };
        } else if (typeof this.props.totalLabel === "string") {
            totalColumnsLabel = total => {
                return counterpart.translate(this.props.totalLabel, {
                    count: total
                });
            };
        } else if (typeof this.props.totalLabel === "object") {
            totalColumnsLabel = total => {
                return counterpart.translate(this.props.totalLabel.key, {
                    count: total,
                    ...this.props.totalLabel.args
                });
            };
        }

        return (
            <div className="paginated-list" style={this.props.style}>
                <Table
                    loading={loading}
                    dataSource={rows}
                    uns
                    columns={Array.isArray(header) ? header : []}
                    footer={() => (extraRow ? extraRow : <span>&nbsp;</span>)}
                    onChange={this.props.toggleSortOrder}
                    pagination={{
                        showSizeChanger: true,
                        hideOnSinglePage: false,
                        defaultPageSize: pageSize,
                        pageSizeOptions: pageSizeOptions.map(o => o.toString()),
                        showTotal: (total, range) => totalColumnsLabel(total)
                    }}
                    rowClassName={
                        this.props.rowClassName == null
                            ? undefined
                            : (record, index) =>
                                  this.props.rowClassName(record, index)
                    }
                    rowSelection={this.props.rowSelection}
                />
                {this.props.children}
            </div>
        );
    }
}
