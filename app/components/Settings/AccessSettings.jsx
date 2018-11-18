import React from "react";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import {settingsAPIs} from "../../api/apiConfig";
import willTransitionTo, {routerTransitioner} from "../../routerTransition";
import {connect} from "alt-react";
import cnames from "classnames";
import Icon from "../Icon/Icon";
import LoadingButton from "../Utility/LoadingButton";
import {Switch} from "bitshares-ui-style-guide";

const autoSelectionUrl = "wss://fake.automatic-selection.com";

function isTestNet(url) {
    return !__TESTNET__ && url.indexOf("testnet") !== -1;
}

/**
 * This class renders the auto-selection node
 */
class AutoSelectionNode extends React.Component {
    constructor(props) {
        super(props);
    }

    /**
     * On activation routerTransitioner selects the best by itself. On deactivation the currently connected, or
     * last connected node is selected again.
     *
     * @param url
     */
    activate(url) {
        SettingsActions.changeSetting({
            setting: "apiServer",
            value: url
        });
        if (
            SettingsStore.getSetting("activeNode") !=
            SettingsStore.getSetting("apiServer")
        ) {
            setTimeout(
                function() {
                    willTransitionTo(false);
                }.bind(this),
                50
            );
        }
    }

    render() {
        const {isActive, connectedNode, totalNodes, popup} = this.props;

        if (popup) {
            return (
                <div>
                    <Switch
                        style={{
                            float: "right",
                            position: "relative",
                            top: "-15px"
                        }}
                        checked={isActive}
                        onChange={this.activate.bind(
                            this,
                            isActive ? connectedNode.url : autoSelectionUrl
                        )}
                    />

                    <p style={{fontSize: "80%"}}>
                        <Translate content="settings.automatic_short" />:
                    </p>
                </div>
            );
        } else {
            return (
                <div className="auto-node">
                    <div>
                        <Switch
                            checked={isActive}
                            onChange={this.activate.bind(
                                this,
                                isActive ? connectedNode.url : autoSelectionUrl
                            )}
                        />
                        <Translate
                            component="div"
                            style={{paddingLeft: "1rem", paddingTop: "0.1rem"}}
                            content="settings.automatic"
                            totalNodes={totalNodes}
                        />
                    </div>
                </div>
            );
        }
    }
}

/**
 * This class renders a a single node within the nodes list in the settings overview.
 *
 * This includes:
 *   - rendering the currently active node
 *   - render all other nodes with or without ping in the three sections:
 *      available, hidden, personal
 */
class ApiNode extends React.Component {
    constructor(props) {
        super(props);
    }

    /**
     * Nodes can only be activated, as switching only works by activating another
     * @param url
     */
    activate(url) {
        SettingsActions.changeSetting({
            setting: "apiServer",
            value: url
        });
        if (
            SettingsStore.getSetting("activeNode") !=
            SettingsStore.getSetting("apiServer")
        ) {
            setTimeout(
                function() {
                    willTransitionTo(false);
                }.bind(this),
                50
            );
        }
    }

    remove(url, name) {
        this.props.showRemoveNodeModal(url, name);
    }

    show(url) {
        SettingsActions.showWS(url);
    }

    hide(url) {
        SettingsActions.hideWS(url);
    }

    /**
     * Construct ping dict containing toString, color and rating.
     * @returns {*}
     * @private
     */
    _getPing() {
        if (isTestNet(this.props.node.url)) {
            return {
                toString: null,
                color: null,
                rating: null
            };
        }
        if (!this.props.node.ping) {
            return {
                toString: null,
                color: "high",
                rating: "node_down"
            };
        }
        if (this.props.node.ping == Infinity) {
            return {
                toString: null,
                color: "high",
                rating: "node_down"
            };
        }
        if (this.props.node.ping == -1) {
            return {
                toString: null,
                color: "high",
                rating: "skipped"
            };
        }
        let color, rating;
        let pingInMs = this.props.node.ping;
        if (pingInMs < 400) {
            color = "low";
            rating = "low_latency";
        } else if (pingInMs >= 400 && pingInMs < 800) {
            color = "medium";
            rating = "medium_latency";
        } else {
            color = "high";
            rating = "high_latency";
        }

        return {
            toString:
                pingInMs >= 1000
                    ? +(pingInMs / 1000).toFixed(2) + "s"
                    : pingInMs + "ms",
            color: color,
            rating: rating
        };
    }

    render() {
        const {node, isActive, popup} = this.props;

        let ping = this._getPing();

        let url = node.url;

        let canBeHidden = !isActive;
        let canBeRemoved = !node.default && !isActive;

        let hidden = !!node.hidden;

        let location =
            !!node.location &&
            typeof node.location === "object" &&
            "translate" in node.location ? (
                <Translate component="span" content={node.location.translate} />
            ) : (
                node.location
            );

        let title = !!location ? location : "";
        if (!!node.country) {
            title = node.country + (!!title ? " - " + title : "");
        }
        if (!!node.region) {
            title = node.region + (!!title ? " - " + title : "");
        }

        if (popup) {
            return (
                <div className="api-status">
                    <a>
                        <Icon
                            className={ping.color + " default-icon"}
                            name={isActive ? "connected" : "disconnected"}
                            title={
                                isActive
                                    ? "icons.connected"
                                    : "icons.disconnected"
                            }
                            size="1_5x"
                            onClick={this.activate.bind(this, url)}
                        />
                        <Icon
                            className={ping.color + " hover-icon"}
                            name={"connect"}
                            title="icons.connect"
                            size="1_5x"
                            onClick={this.activate.bind(this, url)}
                        />
                    </a>
                    {title}
                </div>
            );
        } else {
            return (
                <div className="api-node">
                    <div className="api-node-left">
                        <p className="api-node-title">{title}</p>
                        {!!node.operator && (
                            <p className="api-node-operator">
                                {node.operator}
                                &nbsp;&nbsp;&nbsp;
                            </p>
                        )}
                        <p
                            className="api-node-url"
                            id={isActive ? "active_node" : null}
                        >
                            {url}
                        </p>
                    </div>
                    <div>
                        <div className="api-status">
                            <span className={ping.color}>
                                {!!ping.rating && (
                                    <Translate
                                        content={`settings.${ping.rating}`}
                                    />
                                )}
                                {!!ping.toString && <p>{ping.toString}</p>}
                            </span>
                        </div>
                    </div>
                    <div style={{marginTop: "-5px"}}>
                        {canBeHidden && (
                            <a
                                onClick={
                                    hidden
                                        ? this.show.bind(this, url)
                                        : this.hide.bind(this, url)
                                }
                            >
                                <Icon
                                    className={"shuffle"}
                                    name={hidden ? "eye-striked" : "eye"}
                                    title={
                                        hidden
                                            ? "icons.eye_striked"
                                            : "icons.eye"
                                    }
                                    size="1_5x"
                                />
                            </a>
                        )}
                        {canBeRemoved && (
                            <a onClick={this.remove.bind(this, url, title)}>
                                <Icon
                                    name={"times"}
                                    title="icons.times"
                                    size="1_5x"
                                />
                            </a>
                        )}
                        <div className="api-status">
                            {!isActive ? (
                                <a
                                    id={url}
                                    onClick={this.activate.bind(this, url)}
                                >
                                    <Icon
                                        className={ping.color + " default-icon"}
                                        name={"disconnected"}
                                        title="icons.connect"
                                        size="1_5x"
                                    />
                                    <Icon
                                        className={ping.color + " hover-icon"}
                                        name={"connect"}
                                        title="icons.connect"
                                        size="1_5x"
                                    />
                                </a>
                            ) : (
                                <Icon
                                    className={ping.color}
                                    name={"connected"}
                                    title="icons.connected"
                                    size="2x"
                                />
                            )}
                        </div>
                    </div>
                </div>
            );
        }
    }
}

ApiNode.defaultProps = {
    node: {}
};

class AccessSettings extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            activeTab: "available_nodes"
        };
    }

    /**
     * Copies all keys in the default apiServer and adds the ping
     *
     * @param node
     * @returns {{ping: *}}
     */
    getNode(node) {
        const {props} = this;
        let nodeWrapper = {
            ping: props.apiLatencies[node.url]
        };
        Object.keys(node).forEach(key => {
            nodeWrapper[key] = node[key];
        });
        return nodeWrapper;
    }

    _getConnectedNode() {
        return this.getNode(
            this.props.nodes.find(node => node.url == this.props.connectedNode)
        );
    }

    _connectedNodeIsPersonal() {
        let cn = this.props.nodes.find(
            node => node.url == this.props.connectedNode
        );
        return cn && this._nodeIsPersonal(cn);
    }

    _nodeIsPersonal(node) {
        return !node.default && !node.hidden && !isTestNet(node.url);
    }

    _getMainNetNodes() {
        return this.props.nodes.filter(a => {
            return !isTestNet(a.url);
        });
    }

    /**
     * @param node either a string (and then au
     * @param connectedNode
     * @returns {XML}
     */
    renderNode(node, connectedNode) {
        const {props} = this;

        return (
            <ApiNode
                node={node}
                key={node.url}
                showRemoveNodeModal={props.showRemoveNodeModal}
                isActive={node.url == connectedNode.url}
                popup={props.popup}
            />
        );
    }

    renderAutoSelection(connectedNode) {
        const {props} = this;

        return (
            <AutoSelectionNode
                key={autoSelectionUrl}
                isActive={props.selectedNode === autoSelectionUrl}
                connectedNode={connectedNode}
                totalNodes={this._getMainNetNodes().length}
                popup={props.popup}
            />
        );
    }

    _changeTab(tab) {
        this.setState({
            activeTab: tab
        });
    }

    _recalculateLatency(event, feedback) {
        routerTransitioner.doLatencyUpdate(true, false, 1).finally(() => {
            this.forceUpdate();
            feedback();
        });
    }

    render() {
        const {props} = this;

        // placeholder to avoid this mismatch
        let getNode = this.getNode.bind(this);
        let renderNode = this.renderNode.bind(this);

        // currently selected and active node
        let connectedNode = this._getConnectedNode();

        let allNodesExceptConnected = props.nodes
            .map(node => {
                return getNode(node);
            })
            .filter(node => {
                return (
                    node.url !== connectedNode.url &&
                    node.url !== autoSelectionUrl
                );
            })
            .sort(function(a, b) {
                let isTestnet = isTestNet(a.url);
                if (!!a.ping && !!b.ping) {
                    return a.ping - b.ping;
                } else if (!a.ping && !b.ping) {
                    if (isTestnet) return -1;
                    return 1;
                } else if (!!a.ping && !b.ping) {
                    return -1;
                } else if (!!b.ping && !a.ping) {
                    return 1;
                }
                return 0;
            });

        let nodesToShow = null;
        let onlyPersonalNodeActive = false;
        if (this.state.activeTab === "my_nodes") {
            nodesToShow = allNodesExceptConnected.filter(node => {
                return this._nodeIsPersonal(node);
            });
            onlyPersonalNodeActive =
                this._connectedNodeIsPersonal() && nodesToShow.length === 0;
        } else if (this.state.activeTab === "available_nodes") {
            nodesToShow = allNodesExceptConnected.filter(node => {
                return node.default && !node.hidden && !isTestNet(node.url);
            });
        } else if (this.state.activeTab === "testnet_nodes") {
            nodesToShow = allNodesExceptConnected.filter(node => {
                return isTestNet(node.url);
            });
        } else {
            nodesToShow = allNodesExceptConnected.filter(node => {
                return node.hidden && !isTestNet(node.url);
            });
        }

        let popupCount = 0;

        let backgroundPinging =
            !!routerTransitioner &&
            routerTransitioner.isBackgroundPingingInProgress();

        return this.props.popup ? (
            <div>
                <div style={{fontWeight: "bold", height: 40}}>
                    <Translate content="settings.switch" />
                    {this.renderAutoSelection(connectedNode)}
                </div>
                <div
                    className="nodes-list"
                    style={{
                        display:
                            props.selectedNode === autoSelectionUrl
                                ? "none"
                                : ""
                    }}
                >
                    {nodesToShow.map(node => {
                        popupCount++;
                        if (popupCount <= 5) {
                            return renderNode(node, connectedNode);
                        }
                    })}
                </div>
            </div>
        ) : (
            <div style={{paddingTop: "1em"}}>
                {this.renderAutoSelection(connectedNode)}

                <div className="active-node">
                    <LoadingButton
                        style={{float: "right"}}
                        isLoading={backgroundPinging}
                        caption="settings.ping"
                        loadingType="inside-feedback-resize"
                        loadingMessage="settings.pinging"
                        onClick={this._recalculateLatency.bind(this)}
                    />
                    <Translate
                        component="h4"
                        style={{marginLeft: "1rem"}}
                        content="settings.active_node"
                    />
                    {renderNode(connectedNode, connectedNode)}
                </div>
                <div
                    className="nodes"
                    style={{
                        position: "relative",
                        marginBottom: "2em"
                    }}
                >
                    <div className="grid-block shrink" style={{marginLeft: 0}}>
                        {[
                            "available_nodes",
                            "my_nodes",
                            "hidden_nodes",
                            "testnet_nodes"
                        ].map(key => {
                            return (
                                <div
                                    key={key}
                                    className={cnames(
                                        "nodes-header clickable",
                                        {
                                            inactive:
                                                this.state.activeTab !== key
                                        }
                                    )}
                                    onClick={this._changeTab.bind(this, key)}
                                >
                                    <Translate content={"settings." + key} />
                                </div>
                            );
                        })}
                    </div>
                    {this.state.activeTab === "my_nodes" && (
                        <div
                            style={{paddingLeft: "1rem", paddingBottom: "1rem"}}
                        >
                            <div
                                className="button"
                                onClick={props.showAddNodeModal}
                            >
                                <Translate
                                    id="add"
                                    component="span"
                                    content="settings.add_api"
                                />
                            </div>
                        </div>
                    )}
                    {this.state.activeTab === "testnet_nodes" && (
                        <Translate
                            component="p"
                            content={"settings.testnet_nodes_disclaimer"}
                        />
                    )}
                    {nodesToShow.map(node => {
                        return renderNode(node, connectedNode);
                    })}
                    {onlyPersonalNodeActive ? (
                        <div className="api-node">
                            <p
                                className="api-node-title"
                                style={{padding: "1rem"}}
                            >
                                <Translate content="settings.personal_active" />
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }
}

AccessSettings = connect(
    AccessSettings,
    {
        listenTo() {
            return [SettingsStore];
        },
        getProps() {
            return {
                // apiServer and activeNode are ambiguous definition when dealing with isActive, autoSelectionActive etc..
                // using distinct names
                selectedNode: SettingsStore.getState().settings.get(
                    "apiServer"
                ),
                connectedNode: SettingsStore.getState().settings.get(
                    "activeNode"
                ),
                apiLatencies: SettingsStore.getState().apiLatencies
            };
        }
    }
);

export default AccessSettings;
