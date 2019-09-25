import React, {Component} from "react";
import AltContainer from "alt-container";
import Translate from "react-translate-component";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import CachedPropertyStore from "stores/CachedPropertyStore";
import BlockchainStore from "stores/BlockchainStore";
import WalletDb from "stores/WalletDb";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import AccessSettings from "../Settings/AccessSettings";
import Icon from "../Icon/Icon";
import "intro.js/introjs.css";
import guide from "intro.js";
import ReportModal from "../Modal/ReportModal";
import PropTypes from "prop-types";
import {routerTransitioner} from "../../routerTransition";
import LoadingIndicator from "../LoadingIndicator";
import counterpart from "counterpart";
import ChoiceModal from "../Modal/ChoiceModal";
import {ChainStore} from "tuscjs";
import ifvisible from "ifvisible";
import {getWalletName} from "branding";
import {Tooltip} from "bitshares-ui-style-guide";

class Footer extends React.Component {
    static propTypes = {
        dynGlobalObject: ChainTypes.ChainObject.isRequired,
        synced: PropTypes.bool.isRequired
    };

    static defaultProps = {
        dynGlobalObject: "2.1.0"
    };

    constructor(props) {
        super(props);

        this.state = {
            hasOutOfSyncModalBeenShownOnce: false,
            isOutOfSyncModalVisible: false,
            isReportModalVisible: false,
            isAccessSettingsPopoverVisible: false,
            showConnectingPopup: false,
            showAccessSettingsTooltip: false
        };

        this.getNode = this.getNode.bind(this);
        this._showOutOfSyncModal = this._showOutOfSyncModal.bind(this);
        this._hideOutOfSyncModal = this._hideOutOfSyncModal.bind(this);
        this._showReportModal = this._showReportModal.bind(this);
        this._hideReportModal = this._hideReportModal.bind(this);
        this._showAccessSettingsTooltip = this._showAccessSettingsTooltip.bind(
            this
        );
    }

    _showOutOfSyncModal() {
        this.setState({
            isOutOfSyncModalVisible: true
        });
    }

    _hideOutOfSyncModal() {
        this.setState({
            isOutOfSyncModalVisible: false
        });
    }

    _showReportModal() {
        this.setState({
            isReportModalVisible: true
        });
    }

    _hideReportModal() {
        this.setState({
            isReportModalVisible: false
        });
    }

    componentDidMount() {
        this.checkNewVersionAvailable.call(this);

        this.downloadLink = "https://bitshares.org/download";

        let ensure = this._ensureConnectivity.bind(this);
        ifvisible.on("wakeup", function() {
            ensure();
        });
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextState.isOutOfSyncModalVisible !==
                this.state.isOutOfSyncModalVisible ||
            nextState.isReportModalVisible !==
                this.state.isReportModalVisible ||
            nextProps.dynGlobalObject !== this.props.dynGlobalObject ||
            nextProps.backup_recommended !== this.props.backup_recommended ||
            nextProps.rpc_connection_status !==
                this.props.rpc_connection_status ||
            nextProps.synced !== this.props.synced ||
            nextState.isAccessSettingsPopoverVisible !==
                this.state.isAccessSettingsPopoverVisible ||
            nextState.showAccessSettingsTooltip !==
                this.state.showAccessSettingsTooltip
        );
    }

    checkNewVersionAvailable() {
        if (__ELECTRON__) {
            fetch(
                "https://api.github.com/repos/bitshares/bitshares-ui/releases/latest"
            )
                .then(res => {
                    return res.json();
                })
                .then(
                    function(json) {
                        let oldVersion = String(json.tag_name);
                        let newVersion = String(APP_VERSION);
                        let isReleaseCandidate =
                            APP_VERSION.indexOf("rc") !== -1;
                        if (!isReleaseCandidate && oldVersion !== newVersion) {
                            this.setState({newVersion});
                        }
                    }.bind(this)
                );
        }
    }

    downloadVersion() {
        var a = document.createElement("a");
        a.href = this.downloadLink;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.style = "display: none;";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    launchIntroJS() {
        const translator = require("counterpart");

        var hintData = document.querySelectorAll("[data-intro]");
        var theme = SettingsStore.getState().settings.get("themes");

        if (hintData.length == 0) {
            this.props.history.push("/help");
        } else {
            guide
                .introJs()
                .setOptions({
                    tooltipClass: theme,
                    highlightClass: theme,
                    showBullets: false,
                    hideNext: true,
                    hidePrev: true,
                    nextLabel: translator.translate("walkthrough.next_label"),
                    prevLabel: translator.translate("walkthrough.prev_label"),
                    skipLabel: translator.translate("walkthrough.skip_label"),
                    doneLabel: translator.translate("walkthrough.done_label")
                })
                .start();
        }
    }

    getNodeIndexByURL(url) {
        let nodes = this.props.defaults.apiServer;
        let index = nodes.findIndex(
            node => !!node && !!node.url && node.url === url
        );
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

    getNode(node = {url: "", operator: ""}) {
        if (!node || !node.url) {
            throw "Node is undefined of has no url";
        }

        const {props} = this;

        const testNet = node.url.indexOf("testnet") !== -1;

        let title = node.operator + " " + !!node.location ? node.location : "";
        if ("country" in node) {
            title = node.country + (!!title ? " - " + title : "");
        }

        return {
            name: title,
            url: node.url,
            ping:
                node.url in props.apiLatencies
                    ? props.apiLatencies[node.url]
                    : -1,
            testNet
        };
    }

    /**
     * Returns the current blocktime, or exception if not yet available
     * @returns {Date}
     */
    getBlockTime() {
        let dynGlobalObject = ChainStore.getObject("2.1.0");
        if (dynGlobalObject) {
            let block_time = dynGlobalObject.get("time");
            if (!/Z$/.test(block_time)) {
                block_time += "Z";
            }
            return new Date(block_time);
        } else {
            throw new Error("Blocktime not available right now");
        }
    }

    /**
     * Returns the delta between the current time and the block time in seconds, or -1 if block time not available yet
     *
     * Note: Could be integrating properly with BlockchainStore to send out updates, but not necessary atp
     */
    getBlockTimeDelta() {
        try {
            let bt =
                (this.getBlockTime().getTime() +
                    ChainStore.getEstimatedChainTimeOffset()) /
                1000;
            let now = new Date().getTime() / 1000;
            return Math.abs(now - bt);
        } catch (err) {
            console.log(err);
            return -1;
        }
    }

    /**
     * Closes the out of sync modal if closed
     *
     * @private
     */
    _closeOutOfSyncModal() {
        this._hideOutOfSyncModal();
    }

    /**
     * This method can be called whenever it is assumed that the connection is stale.
     * It will check synced/connected state and notify the user or do automatic reconnect.
     * In general the connection state can be "out of sync" and "disconnected".
     *
     * disconnected:
     *      - dependent on rpc_connection_status of BlockchainStore
     *
     * out of sync:
     *      - reported block time is more than X sec in the past, as reported in
     *        App -> _syncStatus
     *
     * @private
     */
    _ensureConnectivity() {
        // user is not looking at the app, no reconnection effort necessary
        if (!ifvisible.now("active")) return;

        let connected = !(this.props.rpc_connection_status === "closed");

        if (!connected) {
            console.log("Your connection was lost");
            setTimeout(() => {
                this._triggerReconnect();
            }, 50);
        } else if (!this.props.synced) {
            // If the blockchain is out of sync the footer will be rerendered one last time and then
            // not receive anymore blocks, meaning no rerender. Thus we need to trigger any and all
            // handling out of sync state within this one call

            let forceReconnectAfterSeconds = this._getForceReconnectAfterSeconds();
            let askToReconnectAfterSeconds = 10;

            // Trigger automatic reconnect after X seconds
            setTimeout(() => {
                if (!this.props.synced) {
                    this._triggerReconnect();
                }
            }, forceReconnectAfterSeconds * 1000);

            // Still out of sync?
            if (this.getBlockTimeDelta() > 3) {
                console.log(
                    "Your node is out of sync since " +
                        this.getBlockTimeDelta() +
                        " seconds, waiting " +
                        askToReconnectAfterSeconds +
                        " seconds, then we notify you"
                );
                setTimeout(() => {
                    // Only ask the user once, and only continue if still out of sync
                    if (
                        this.getBlockTimeDelta() > 3 &&
                        this.state.hasOutOfSyncModalBeenShownOnce === false
                    ) {
                        this.setState({
                            hasOutOfSyncModalBeenShownOnce: true
                        });
                        this._showOutOfSyncModal();
                    }
                }, askToReconnectAfterSeconds * 1000);
            }
        } else {
            setTimeout(() => {
                this._closeOutOfSyncModal();
                this.setState({
                    hasOutOfSyncModalBeenShownOnce: false
                });
            }, 50);
        }
    }

    _getForceReconnectAfterSeconds() {
        return 60;
    }

    _triggerReconnect(honorManualSelection = true) {
        if (honorManualSelection && !routerTransitioner.isAutoSelection()) {
            return;
        }
        if (!routerTransitioner.isTransitionInProgress()) {
            this._closeOutOfSyncModal();
            console.log("Trying to reconnect ...");

            // reconnect to anythin
            let promise = routerTransitioner.willTransitionTo(false);
            if (!!promise)
                setTimeout(() => {
                    this.forceUpdate();
                }, 10);
            promise.then(() => {
                console.log("... done trying to reconnect");
            });
        }
    }

    _showAccessSettingsTooltip(showAccessNodeTooltip) {
        if (!this.state.isAccessSettingsPopoverVisible) {
            this.setState({showAccessSettingsTooltip: showAccessNodeTooltip});
        } else {
            this.setState({showAccessSettingsTooltip: false});
        }
    }

    render() {
        const autoSelectAPI = "wss://fake.automatic-selection.com";
        const {state, props} = this;
        const {synced} = props;
        const connected = !(this.props.rpc_connection_status === "closed");

        // Current Node Details
        let nodes = this.props.defaults.apiServer;

        let currentNodeIndex = this.getCurrentNodeIndex.call(this);
        let activeNode = this.getNode(nodes[currentNodeIndex] || nodes[0]);
        if (activeNode.url == autoSelectAPI) {
            let nodeUrl = props.activeNode;
            currentNodeIndex = this.getNodeIndexByURL.call(this, nodeUrl);
            if (!!currentNodeIndex) {
                activeNode = this.getNode(nodes[currentNodeIndex]);
            } else {
                activeNode = this.getNode(nodes[0]);
            }
        }

        let block_height = this.props.dynGlobalObject.get("head_block_number");
        let version_match = APP_VERSION.match(/2\.0\.(\d\w+)/);
        let version = version_match
            ? `.${version_match[1]}`
            : ` ${APP_VERSION}`;
        let rc_match = APP_VERSION.match(/-rc[0-9]$/);
        if (rc_match) version += rc_match[0];
        let updateStyles = {display: "inline-block", verticalAlign: "top"};
        let logoProps = {};

        this._ensureConnectivity();

        return (
            <div>
                {!!routerTransitioner &&
                    routerTransitioner.isTransitionInProgress() && (
                        <LoadingIndicator
                            loadingText={routerTransitioner.getTransitionTarget()}
                        />
                    )}
                <ChoiceModal
                    showModal={this._showOutOfSyncModal}
                    hideModal={this._hideOutOfSyncModal}
                    visible={this.state.isOutOfSyncModalVisible}
                    choices={[
                        {
                            translationKey: "connection.manual_reconnect",
                            callback: () => {
                                if (!this.props.synced) {
                                    this._triggerReconnect(false);
                                }
                            }
                        },
                        {
                            translationKey: "connection.manual_ping",
                            callback: () => {
                                if (!this.props.synced) {
                                    this.onAccess();
                                }
                            }
                        }
                    ]}
                >
                    <div>
                        <Translate
                            content="connection.out_of_sync"
                            out_of_sync_seconds={parseInt(
                                this.getBlockTimeDelta()
                            )}
                        />
                        <br />
                        <br />
                        <Translate content="connection.want_to_reconnect" />
                        {routerTransitioner.isAutoSelection() && (
                            <Translate
                                content="connection.automatic_reconnect"
                                reconnect_in_seconds={parseInt(
                                    this._getForceReconnectAfterSeconds()
                                )}
                            />
                        )}
                    </div>
                </ChoiceModal>
                <div className="show-for-medium grid-block shrink footer">
                    <div className="align-justify grid-block">
                        <div className="grid-block">
                            <div
                                className="logo"
                                style={{
                                    fontSize: state.newVersion
                                        ? "0.9em"
                                        : "1em",
                                    cursor: state.newVersion
                                        ? "pointer"
                                        : "normal",
                                    marginTop: state.newVersion
                                        ? "-5px"
                                        : "0px",
                                    overflow: "hidden"
                                }}
                                onClick={
                                    state.newVersion
                                        ? this.downloadVersion.bind(this)
                                        : null
                                }
                                {...logoProps}
                            >
                                {state.newVersion && (
                                    <Icon
                                        name="download"
                                        title={counterpart.translate(
                                            "icons.download",
                                            {wallet_name: getWalletName()}
                                        )}
                                        style={{
                                            marginRight: "20px",
                                            marginTop: "10px",
                                            fontSize: "1.35em",
                                            display: "inline-block"
                                        }}
                                    />
                                )}
                                <span style={updateStyles}>
                                    <Translate
                                        content="footer.title"
                                        wallet_name={getWalletName()}
                                    />
                                    {__GIT_BRANCH__ === "staging" ? (
                                        <a
                                            href={`https://github.com/bitshares/bitshares-ui/commit/${version.trim()}`}
                                            className="version external-link"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {version}
                                        </a>
                                    ) : (
                                        <span className="version">
                                            {version}
                                        </span>
                                    )}
                                </span>

                                {state.newVersion && (
                                    <Translate
                                        content="footer.update_available"
                                        style={{
                                            color: "#FCAB53",
                                            position: "absolute",
                                            top: "8px",
                                            left: "36px"
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                        {!!routerTransitioner &&
                            routerTransitioner.isBackgroundPingingInProgress() && (
                                <div
                                    onClick={() => {
                                        this._showNodesPopover();
                                    }}
                                    style={{
                                        cursor: "pointer"
                                    }}
                                    className="grid-block shrink txtlabel"
                                >
                                    {routerTransitioner.getBackgroundPingingTarget()}
                                    <div
                                        style={{
                                            marginTop: "0.4rem",
                                            marginLeft: "0.5rem"
                                        }}
                                    >
                                        <LoadingIndicator type="circle" />
                                    </div>
                                    &nbsp; &nbsp;
                                </div>
                            )}
                        {synced ? null : (
                            <div className="grid-block shrink txtlabel cancel">
                                <Translate content="footer.nosync" />
                                &nbsp; &nbsp;
                            </div>
                        )}
                        {!connected ? (
                            <div className="grid-block shrink txtlabel error">
                                <Translate content="footer.connection" />
                                &nbsp; &nbsp;
                            </div>
                        ) : null}
                        {this.props.backup_recommended ? (
                            <span>
                                <div className="grid-block">
                                    <Tooltip
                                        overlay={
                                            <div>
                                                Please understand that you are
                                                responsible for making your own
                                                backup&hellip;
                                            </div>
                                        }
                                    >
                                        <a
                                            className="shrink txtlabel facolor-alert"
                                            onClick={this.onBackup.bind(this)}
                                        >
                                            <Translate content="footer.backup" />
                                        </a>
                                    </Tooltip>
                                    &nbsp;&nbsp;
                                </div>
                            </span>
                        ) : null}
                        {this.props.backup_brainkey_recommended ? (
                            <span>
                                <div className="grid-block">
                                    <a
                                        className="grid-block shrink txtlabel facolor-alert"
                                        onClick={this.onBackupBrainkey.bind(
                                            this
                                        )}
                                    >
                                        <Translate content="footer.brainkey" />
                                    </a>
                                    &nbsp;&nbsp;
                                </div>
                            </span>
                        ) : null}
                        {block_height ? (
                            <div className="grid-block shrink">
                                <Tooltip
                                    title={counterpart.translate(
                                        "tooltip.nodes_popup"
                                    )}
                                    mouseEnterDelay={0.5}
                                    onVisibleChange={
                                        this._showAccessSettingsTooltip
                                    }
                                    visible={
                                        this.state.showAccessSettingsTooltip
                                    }
                                >
                                    <div
                                        onClick={() => {
                                            this._showNodesPopover();
                                        }}
                                        style={{
                                            position: "relative",
                                            cursor: "pointer"
                                        }}
                                    >
                                        <div className="footer-status">
                                            {connected && activeNode.testNet && (
                                                <span className="testnet">
                                                    <Translate content="settings.testnet_nodes" />{" "}
                                                </span>
                                            )}
                                            {!connected ? (
                                                <span className="warning">
                                                    <Translate content="footer.disconnected" />
                                                </span>
                                            ) : (
                                                <span className="success">
                                                    {activeNode.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="footer-block">
                                            <span>
                                                <span className="footer-block-title">
                                                    <Translate content="footer.latency" />
                                                </span>
                                                &nbsp;
                                                {!connected
                                                    ? "-"
                                                    : !activeNode.ping
                                                    ? "-"
                                                    : parseInt(
                                                          activeNode.ping
                                                      ) + "ms"}
                                                &nbsp;/&nbsp;
                                                <span className="footer-block-title">
                                                    <Translate content="footer.block" />
                                                </span>
                                                &nbsp;#
                                                {block_height}
                                            </span>
                                        </div>
                                    </div>
                                </Tooltip>

                                <div className="grid-block">
                                    <Tooltip
                                        title={counterpart.translate(
                                            "tooltip.debug_report"
                                        )}
                                        placement="topRight"
                                        mouseEnterDelay={0.5}
                                    >
                                        <div
                                            className="introjs-launcher"
                                            onClick={e => {
                                                this._showReportModal(e);
                                            }}
                                        >
                                            <Translate content="modal.report.button" />
                                        </div>
                                    </Tooltip>
                                    <Tooltip
                                        title={counterpart.translate(
                                            "tooltip.self_help"
                                        )}
                                        placement="topRight"
                                        mouseEnterDelay={0.5}
                                    >
                                        <div
                                            className="introjs-launcher"
                                            onClick={() => {
                                                this.launchIntroJS();
                                            }}
                                        >
                                            <Translate content="global.help" />
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>
                        ) : (
                            <div className="grid-block shrink">
                                <Translate content="footer.loading" />
                            </div>
                        )}
                    </div>
                </div>
                <div
                    onMouseLeave={() => {
                        this.setState({isAccessSettingsPopoverVisible: false});
                    }}
                    className="node-access-popup"
                    style={{
                        display: this.state.isAccessSettingsPopoverVisible
                            ? ""
                            : "none"
                    }}
                >
                    <AccessSettings
                        nodes={this.props.defaults.apiServer}
                        popup={true}
                    />
                    <div style={{paddingTop: 15}}>
                        <a onClick={this.onAccess.bind(this)}>
                            <Translate content="footer.advanced_settings" />
                        </a>
                    </div>
                </div>
                <div
                    className="introjs-launcher show-for-small-only"
                    onClick={() => {
                        this.launchIntroJS();
                    }}
                >
                    <Translate content="global.help" />
                </div>
                <ReportModal
                    showModal={this._showReportModal}
                    hideModal={this._hideReportModal}
                    visible={this.state.isReportModalVisible}
                    refCallback={e => {
                        if (e) this.reportModal = e;
                    }}
                />
            </div>
        );
    }

    _showNodesPopover() {
        if (
            this.state.showAccessSettingsTooltip &&
            !this.state.isAccessSettingsPopoverVisible
        ) {
            this.setState({
                isAccessSettingsPopoverVisible: !this.state
                    .isAccessSettingsPopoverVisible,
                showAccessSettingsTooltip: false
            });
        } else {
            this.setState({
                isAccessSettingsPopoverVisible: !this.state
                    .isAccessSettingsPopoverVisible,
                showAccessSettingsTooltip: false
            });
        }
    }

    onBackup() {
        this.props.history.push("/wallet/backup/create");
    }

    onBackupBrainkey() {
        this.props.history.push("/wallet/backup/brainkey");
    }

    onPopup() {
        this.setState({
            isAccessSettingsPopoverVisible: !this.state
                .isAccessSettingsPopoverVisible
        });
    }

    onAccess() {
        SettingsActions.changeViewSetting({activeSetting: 6});
        this.props.history.push("/settings/access");
    }
}
Footer = BindToChainState(Footer);

class AltFooter extends Component {
    render() {
        var wallet = WalletDb.getWallet();
        return (
            <AltContainer
                stores={[
                    CachedPropertyStore,
                    BlockchainStore,
                    WalletDb,
                    SettingsStore
                ]}
                inject={{
                    defaults: () => {
                        return SettingsStore.getState().defaults;
                    },
                    apiLatencies: () => {
                        return SettingsStore.getState().apiLatencies;
                    },
                    currentNode: () => {
                        return SettingsStore.getState().settings.get(
                            "apiServer"
                        );
                    },
                    activeNode: () => {
                        return SettingsStore.getState().settings.get(
                            "activeNode"
                        );
                    },
                    backup_recommended: () =>
                        wallet &&
                        (!wallet.backup_date ||
                            CachedPropertyStore.get("backup_recommended")),
                    rpc_connection_status: () =>
                        BlockchainStore.getState().rpc_connection_status
                }}
            >
                <Footer {...this.props} />
            </AltContainer>
        );
    }
}

export default AltFooter;
