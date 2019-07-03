import React from "react";
import counterpart from "counterpart";
import {Table, Checkbox, Select} from "bitshares-ui-style-guide";
import lodash from "lodash-es";
import SettingsActions from "actions/SettingsActions";
import "./paginated-list.scss";

const {Option} = Select;
export default class PaginatedList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            pageSize: props.pageSize,
            enabledColumns: props.viewSettings.get(props.viewSettingsKey),
            columnSelector: "default"
        };

        this._columnSelectorChange = this._columnSelectorChange.bind(this);
        this.isColumnChecked = this.isColumnChecked.bind(this);
    }

    static defaultProps = {
        rows: [],
        pageSize: 15,
        label: "utility.total_x_items",
        className: "table",
        extraRow: null,
        style: {paddingBottom: "1rem"},
        viewSettingsKey: null
    };

    modHeader() {
        // Only modify the header if there was a viewSettingsKey provided
        return this.props.viewSettingsKey === null
            ? this.props.header
            : lodash.filter(this.props.header, item => {
                  // If no customization is allowed on the column, always show the column
                  if (item.allowCustomization === false) {
                      return true;
                  } else {
                      // Otherwise, check the enabledColumns array to see what the current status of the display is
                      return (
                          this.state.enabledColumns[item.dataIndex] === true ||
                          this.state.enabledColumns[item.dataIndex] ===
                              undefined
                      );
                  }
              });
    }

    _columnCheckboxChange(item) {
        // Copy and modify for state
        let enabledColumns = Object.assign({}, this.state.enabledColumns);
        if (enabledColumns[item] === true || enabledColumns[item] === false) {
            enabledColumns[item] = !enabledColumns[item];
        } else {
            enabledColumns[item] = false;
        }

        // Reflect change in Store
        SettingsActions.changeViewSettingsByKey(
            this.props.viewSettingsKey,
            enabledColumns
        );

        this.setState({
            enabledColumns
        });
    }

    // Checks to see whether or not the column provided is checked within the enabledColumns (provided by SettingsStore)
    isColumnChecked(column) {
        return (
            this.state.enabledColumns[column.dataIndex] === undefined ||
            this.state.enabledColumns[column.dataIndex] === true
        );
    }

    _renderEnabledColumnsSelector() {
        let {header, viewSettingsKey} = this.props;

        // Only render the dropdown configuration menu, if there is a viewSettingsKey
        return (
            viewSettingsKey !== null && (
                <div className="inline-block columnSelector">
                    <Select
                        defaultValue={this.state.columnSelector}
                        value={this.state.columnSelector}
                        onChange={this._columnSelectorChange}
                    >
                        <Option
                            className="columnSelector-option"
                            value="default"
                        >
                            {counterpart.translate(
                                "account.table_columns.default"
                            )}
                        </Option>
                        {header.map((item, key) => {
                            return (
                                (item.allowCustomization === undefined ||
                                    item.allowCustomization === true) && (
                                    <Option
                                        key={key}
                                        className="columnSelector-option"
                                        value={item.dataIndex}
                                        disabled
                                    >
                                        <Checkbox
                                            checked={this.isColumnChecked(item)}
                                            onChange={this._columnCheckboxChange.bind(
                                                this,
                                                item.dataIndex
                                            )}
                                        >
                                            {counterpart.translate(
                                                `account.table_columns.${
                                                    item.dataIndex
                                                }`
                                            )}
                                        </Checkbox>
                                    </Option>
                                )
                            );
                        })}
                    </Select>
                </div>
            )
        );
    }

    _columnSelectorChange() {
        // Never let an option, other than default be selected
        this.setState({
            columnSelector: "default"
        });
    }

    render() {
        const {pageSize} = this.state;
        const {rows, extraRow} = this.props;

        // Modify the header according to which columns the user would like to see
        const header = this.modHeader();

        return (
            <div className="paginated-list" style={this.props.style}>
                {this._renderEnabledColumnsSelector()}
                <Table
                    dataSource={rows}
                    uns
                    columns={Array.isArray(header) ? header : []}
                    footer={() => (extraRow ? extraRow : <span>&nbsp;</span>)}
                    onChange={this.props.toggleSortOrder}
                    pagination={{
                        hideOnSinglePage: true,
                        pageSize: pageSize,
                        showTotal: (total, range) =>
                            counterpart.translate(this.props.label, {
                                count: total
                            })
                    }}
                    rowClassName={
                        this.props.rowClassName == null
                            ? undefined
                            : (record, index) =>
                                  this.props.rowClassName(record, index)
                    }
                />
                {this.props.children}
            </div>
        );
    }
}
