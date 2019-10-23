import React from "react";
import {TreeSelect} from "antd";
import {settingsAPIs, nodeRegions} from "api/apiConfig";
import PropTypes from "prop-types";
import {connect} from "alt-react";
import SettingsStore from "../../stores/SettingsStore";
import SettingsActions from "../../actions/SettingsActions";
import counterpart from "counterpart";
import {Icon as AntIcon, Icon, Tooltip} from "bitshares-ui-style-guide";

const {SHOW_PARENT} = TreeSelect;

class NodeSelector extends React.Component {
    static propTypes = {
        onChange: PropTypes.func,
        size: PropTypes.string
    };

    static defaultProps = {
        onChange: null,
        size: undefined
    };

    state = {
        treeData: this._getTreeData()
    };

    _getTreeData() {
        const nodesPerRegion = {};
        settingsAPIs.WS_NODE_LIST.forEach(item => {
            if (item.url.indexOf("fake.automatic-selection") !== -1) {
                return;
            }
            let region = item.region || "Unknown";
            if (item.url.indexOf("127.0.0.1") !== -1) {
                region = " Localhost";
            }
            if (item.url.indexOf("testnet") !== -1) {
                region = " " + region;
            }
            if (!nodesPerRegion[region]) {
                nodesPerRegion[region] = {
                    title: region,
                    key: region,
                    value: region,
                    children: []
                };
            }
            nodesPerRegion[region].children.push({
                title: item.url,
                key: item.url,
                value: item.url,
                item: item
            });
        });
        const sortedList = Object.values(nodesPerRegion).sort((a, b) => {
            let aIdx = nodeRegions.indexOf(a.title);
            let bIdx = nodeRegions.indexOf(b.title);
            if (aIdx !== -1 && bIdx !== -1) {
                return aIdx > bIdx ? 1 : bIdx > aIdx ? -1 : 0;
            }
            if (aIdx !== -1) {
                return -1;
            }
            if (bIdx !== -1) {
                return 1;
            }
            return a.title > b.title ? -1 : b.title > a.title ? 1 : 0;
        });
        sortedList.forEach(region => {
            region.title = region.title + " (" + region.children.length + ")";
        });
        return sortedList;
    }

    onChange = value => {
        SettingsActions.changeSetting({
            setting: "filteredApiServers",
            value: value
        });
        if (!!this.props.onChange) {
            this.props.onChange(value);
        }
    };

    constructor(props) {
        super(props);
    }

    componentDidMount() {}

    render() {
        const tProps = {
            treeData: this.state.treeData,
            value: this.props.filteredApiServers,
            onChange: this.onChange,
            treeCheckable: true,
            showCheckedStrategy: SHOW_PARENT,
            searchPlaceholder: counterpart.translate(
                "connection.narrow_down_nodes"
            ), // narrow_down_nodes_tooltip
            size: this.props.size,
            style: {
                width: "88%"
            },
            key: "nodeSelector",
            getPopupContainer: node => {
                return document.getElementById("node-selector--drop-down");
            }
        };
        return (
            <React.Fragment>
                <div
                    style={{
                        width: "100%",
                        minWidth: "250px"
                    }}
                >
                    <TreeSelect
                        {...tProps}
                        dropdownPopupAlign={{
                            points: ["tl", "bl"],
                            offset: [0, 4],
                            overflow: false
                        }}
                    />
                    <Tooltip
                        title={counterpart.translate(
                            "connection.narrow_down_nodes_tooltip"
                        )}
                    >
                        <Icon
                            style={{
                                fontSize: "1.3rem",
                                marginLeft: "0.5rem",
                                marginTop: "0.3rem"
                            }}
                            type={"question-circle"}
                        />
                    </Tooltip>
                    <div
                        id="node-selector--drop-down"
                        className="node-selector--drop-down"
                    />
                </div>
            </React.Fragment>
        );
    }
}
NodeSelector = connect(
    NodeSelector,
    {
        listenTo() {
            return [SettingsStore];
        },
        getProps() {
            return {
                filteredApiServers: SettingsStore.getState().settings.get(
                    "filteredApiServers",
                    []
                )
            };
        }
    }
);
export default NodeSelector;
