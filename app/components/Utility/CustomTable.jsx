import React from "react";
import counterpart from "counterpart";
import {Checkbox, Icon, Select} from "bitshares-ui-style-guide";
import SettingsActions from "actions/SettingsActions";
import PaginatedList from "./PaginatedList";
import "./paginated-list.scss";
import {connect} from "alt-react";
import SettingsStore from "../../stores/SettingsStore";
import PropTypes from "prop-types";

const {Option} = Select;
class CustomTable extends React.Component {
    static propTypes = {
        viewSettingsKey: PropTypes.string,
        viewSettings: PropTypes.object,
        allowCustomization: PropTypes.bool
    };

    static defaultProps = {
        viewSettingsKey: null,
        viewSettings: null,
        allowCustomization: false
    };

    constructor(props) {
        super(props);

        this.state = {
            columnSelector: "default",
            isDropDownOpen: false
        };

        this._columnSelectorChange = this._columnSelectorChange.bind(this);
        this.isColumnChecked = this.isColumnChecked.bind(this);
    }

    _getViewSettingsKey() {
        // add a prefix for all column customizations
        return "columns_" + this.props.viewSettingsKey;
    }

    _getEnabledColumns() {
        let settings = this.props.viewSettings.get(this._getViewSettingsKey());
        return settings || {};
    }

    _getCustomizableColumns(header) {
        return header.filter(item => {
            // default is that customization is allowed
            return this._isColumnCustomizable(item).customizable;
        });
    }

    modHeader(header) {
        if (!this.props.allowCustomization) {
            return header;
        }
        return header.filter(item => {
            // per default show all, only hide if specifically set to false
            return (
                !this._isColumnCustomizable(item) || this.isColumnChecked(item)
            );
        });
    }

    _columnCheckboxChange(item) {
        // copy and modify for state
        let enabledColumns = this._getEnabledColumns();
        enabledColumns[item] = !this.isColumnChecked(item);

        // reflect change in Store
        SettingsActions.changeViewSetting({
            [this._getViewSettingsKey()]: enabledColumns
        });
    }

    _isColumnCustomizable(column) {
        // filter out empty columns
        if (!column.dataIndex) {
            return {
                customizable: false,
                default: false
            };
        }

        let customizable =
            column.customizable == undefined ? true : column.customizable;

        // customizable can be bool or object
        let defaultVisibility =
            column.customizable == undefined ||
            typeof column.customizable == "boolean"
                ? true
                : column.customizable.default;

        return {
            customizable: customizable,
            default: defaultVisibility
        };
    }

    isColumnChecked(column) {
        if (typeof column == "string") {
            column = {dataIndex: column, customizable: true};
        }
        return this._getEnabledColumns()[column.dataIndex] == undefined
            ? this._isColumnCustomizable(column).default
            : this._getEnabledColumns()[column.dataIndex];
    }

    _renderEnabledColumnsSelector() {
        let {header} = this.props;

        return (
            <div className="customizable-column--selector">
                <Select
                    defaultValue={this.state.columnSelector}
                    value={this.state.columnSelector}
                    onChange={this._columnSelectorChange}
                    dropdownClassName="customizable-column--selector--dropdown"
                    onDropdownVisibleChange={open => {
                        this.setState({
                            isDropDownOpen: open
                        });
                    }}
                >
                    <Option
                        className="customizable-column--selector--option"
                        value="default"
                    >
                        {!this.state.isDropDownOpen && <Icon type="setting" />}
                        {this.state.isDropDownOpen &&
                            counterpart.translate(
                                "customizable_table.customize_the_columns"
                            )}
                    </Option>
                    {this._getCustomizableColumns(header).map((item, key) => {
                        return (
                            <Option
                                key={key}
                                className="customizable-column--selector--option"
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
                                    {item.title}
                                </Checkbox>
                            </Option>
                        );
                    })}
                </Select>
            </div>
        );
    }

    _columnSelectorChange() {
        // Never let an option, other than default be selected
        this.setState({
            columnSelector: "default"
        });
    }

    render() {
        let {header, ...other} = this.props;

        // modify the header according to which columns the user would like to see
        header = this.modHeader(header);

        return (
            <div>
                {this.props.allowCustomization && (
                    <div style={{position: "relative"}}>
                        {this._renderEnabledColumnsSelector()}
                    </div>
                )}
                <PaginatedList {...other} header={header} />
                {this.props.children}
            </div>
        );
    }
}

export default (CustomTable = connect(
    CustomTable,
    {
        listenTo() {
            return [SettingsStore];
        },
        getProps(nextProps) {
            if (!nextProps.viewSettings) {
                return {
                    viewSettings: SettingsStore.getState().viewSettings
                };
            } else {
                return {};
            }
        }
    }
));
