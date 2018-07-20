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

const autoSelectAPI = "wss://fake.automatic-selection.com";

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
        const {autoActive, activeNode, totalNodes, popup} = this.props;

        if (popup) {
            return (
                <div>
                    <span
                        className="switch"
                        style={{
                            float: "right",
                            position: "relative",
                            top: "-15px"
                        }}
                        onClick={this.activate.bind(
                            this,
                            autoActive ? activeNode.url : autoSelectAPI
                        )}
                    >
                        <input
                            id="automatic_node_switcher"
                            type="checkbox"
                            checked={autoActive}
                            onChange={() => {}}
                        />
                        <label />
                    </span>

                    <p style={{fontSize: "80%"}}>
                        <Translate content="settings.automatic_short" />:
                    </p>
                </div>
            );
        } else {
            return (
                <div className="auto-node">
                    <div>
                        <span
                            className="switch"
                            onClick={this.activate.bind(
                                this,
                                autoActive ? activeNode.url : autoSelectAPI
                            )}
                        >
                            <input
                                id="automatic_node_switcher"
                                type="checkbox"
                                checked={autoActive}
                                onChange={() => {}}
                            />
                            <label />
                        </span>
                        <Translate
                            component="div"
                            style={{paddingLeft: "1rem", paddingTop: "0.5rem"}}
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

    remove(url, name, e) {
        e.target.id = "remove"; // Override target.id to allow Removal Node Modal
        this.props.triggerModal(e, url, name);
    }

    show(url) {
        SettingsActions.showWS(url);
    }

    hide(url) {
        SettingsActions.hideWS(url);
    }

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
        const {node, activeNode, popup} = this.props;

        let ping = this._getPing();

        let url = node.url;

        let isActive = activeNode.url == url;
        let canBeHidden = !isActive;
        let canBeRemoved = !node.default;

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
                    {name}
                </div>
            );
        } else {
            return (
                <div className="api-node">
                    <div className="api-node-left">
                        <p className="api-node-title">{title}</p>
                        {!!node.operator && (
                            <p className="api-node-operator">
                                {node.operator}&nbsp;&nbsp;&nbsp;
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
                            <a onClick={this.remove.bind(this, url, name)}>
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
            activeTab: "available-nodes"
        };
    }

    getNodeIndexByURL(url) {
        const {nodes} = this.props;

        let index = nodes.findIndex(node => node.url === url);
        if (index === -1) {
            return null;
        }
        return index;
    }

    getCurrentNodeIndex() {
        const {props} = this;
        let currentNode = this.getNodeIndexByURL.call(this, props.currentNode);

        return currentNode;
    }

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

    _getMainNetNodes() {
        return this.props.nodes.filter(a => {
            return !isTestNet(a.url);
        });
    }

    renderNode(node, activeNode) {
        const {props} = this;

        let automatic = node.url === autoSelectAPI;

        if (automatic) {
            return (
                <AutoSelectionNode
                    key={node.url}
                    autoActive={props.currentNode === autoSelectAPI}
                    activeNode={activeNode}
                    totalNodes={this._getMainNetNodes().length}
                    popup={props.popup}
                />
            );
        } else {
            return (
                <ApiNode
                    node={node}
                    key={node.url}
                    triggerModal={props.triggerModal}
                    activeNode={activeNode}
                    popup={props.popup}
                />
            );
        }
    }

    _changeTab(tab) {
        this.setState({
            activeTab: tab
        });
    }

    _recalculateLatency(event, feedback) {
        feedback("settings.pinging");
        routerTransitioner.doLatencyUpdate(true, null).finally(() => {
            feedback();
        });
    }

    render() {
        const {props} = this;
        let getNode = this.getNode.bind(this);
        let renderNode = this.renderNode.bind(this);
        let currentNodeIndex = this.getCurrentNodeIndex.call(this);
        let hc = "nodes-header clickable";
        let showAvailableNodes = this.state.activeTab !== "hidden-nodes";
        let availableClass = cnames(hc, {
            inactive: this.state.activeTab !== "available-nodes"
        });
        let hiddenClass = cnames(hc, {
            inactive: this.state.activeTab !== "hidden-nodes"
        });
        let myClass = cnames(hc, {
            inactive: this.state.activeTab !== "my-nodes"
        });

        let activeNode = getNode(
            props.nodes[currentNodeIndex] || props.nodes[0]
        );

        if (activeNode.url == autoSelectAPI) {
            let nodeUrl = props.activeNode;
            currentNodeIndex = this.getNodeIndexByURL.call(this, nodeUrl);
            activeNode = getNode(props.nodes[currentNodeIndex]);
        }

        let nodes = props.nodes
            .map(node => {
                return getNode(node);
            })
            .filter(node => {
                return node.url !== activeNode.url;
            });

        nodes = nodes.sort(function(a, b) {
            let isTestnet = isTestNet(a.url);
            if (a.url == autoSelectAPI) {
                return -1;
            } else if (!!a.ping && !!b.ping) {
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

        if (this.state.activeTab === "my-nodes") {
            nodes = nodes.filter(node => {
                return !node.default;
            });
        } else {
            nodes = nodes.filter(node => {
                return node.hidden !== showAvailableNodes && node.default;
            });
        }

        let autoNode = getNode(props.nodes[0]);
        let popupCount = 0;

        let uniqueNodes = nodes.reduce((a, node) => {
            let exists =
                a.findIndex(n => {
                    return n.url === node.url;
                }) !== -1;

            if (!exists) a.push(node);
            return a;
        }, []);
        return this.props.popup ? (
            <div>
                <div style={{fontWeight: "bold", height: 40}}>
                    <Translate content="settings.switch" />
                    {renderNode(autoNode, activeNode)}
                </div>
                <div
                    className="nodes-list"
                    style={{
                        display:
                            props.currentNode === autoSelectAPI ? "none" : ""
                    }}
                >
                    {uniqueNodes.map(node => {
                        if (node.url !== autoSelectAPI) {
                            popupCount++;
                            if (popupCount <= 5) {
                                return renderNode(node, activeNode);
                            }
                        }
                    })}
                </div>
            </div>
        ) : (
            <div style={{paddingTop: "1em"}}>
                {renderNode(autoNode, activeNode)}
                <div className="active-node">
                    <LoadingButton
                        style={{float: "right"}}
                        caption="settings.ping"
                        loadingType="inside-feedback-resize"
                        onClick={this._recalculateLatency.bind(this)}
                    />
                    <Translate
                        component="h4"
                        style={{marginLeft: "1rem"}}
                        content="settings.active_node"
                    />
                    {renderNode(activeNode, activeNode)}
                </div>
                <div
                    className="nodes"
                    style={{
                        display:
                            props.currentNode === autoSelectAPI ? "none" : "",
                        position: "relative",
                        marginBottom: "2em"
                    }}
                >
                    <div className="grid-block shrink" style={{marginLeft: 0}}>
                        <div
                            className={availableClass}
                            onClick={this._changeTab.bind(
                                this,
                                "available-nodes"
                            )}
                        >
                            <Translate content="settings.available_nodes" />
                        </div>
                        <div
                            className={hiddenClass}
                            onClick={this._changeTab.bind(this, "hidden-nodes")}
                        >
                            <Translate content="settings.hidden_nodes" />
                        </div>
                        <div
                            className={myClass}
                            onClick={this._changeTab.bind(this, "my-nodes")}
                        >
                            <Translate content="settings.my_nodes" />
                        </div>
                    </div>
                    {this.state.activeTab !== "my-nodes" ? null : (
                        <div
                            style={{paddingLeft: "1rem", paddingBottom: "1rem"}}
                        >
                            <div
                                className="button"
                                onClick={props.triggerModal.bind(this)}
                            >
                                <Translate
                                    id="add"
                                    component="span"
                                    content="settings.add_api"
                                />
                            </div>
                        </div>
                    )}
                    {uniqueNodes.map(node => {
                        if (node.url !== autoSelectAPI)
                            return renderNode(node, activeNode);
                    })}
                </div>
            </div>
        );
    }
}

AccessSettings = connect(AccessSettings, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            currentNode: SettingsStore.getState().settings.get("apiServer"),
            activeNode: SettingsStore.getState().settings.get("activeNode"),
            apiLatencies: SettingsStore.getState().apiLatencies,
            selectedNode: SettingsStore.getState().settings.get("apiServer"),
            activeNode: SettingsStore.getState().settings.get("activeNode")
        };
    }
});

export default AccessSettings;
