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
import PropTypes from "prop-types";
import {routerTransitioner} from "../../routerTransition";
import LoadingIndicator from "../LoadingIndicator";
import counterpart from "counterpart";
import ConfirmModal from "../Modal/ConfirmModal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import {ChainStore} from "bitsharesjs";
import ifvisible from "ifvisible";
import {getWalletName} from "branding";

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
            showNodesPopup: false,
            showConnectingPopup: false
        };

        this.confirmOutOfSync = {
            modal: null,
            shownOnce: false
        };
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
            nextProps.dynGlobalObject !== this.props.dynGlobalObject ||
            nextProps.backup_recommended !== this.props.backup_recommended ||
            nextProps.rpc_connection_status !==
                this.props.rpc_connection_status ||
            nextProps.synced !== this.props.synced ||
            nextState.showNodesPopup !== this.state.showNodesPopup
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
                        if (oldVersion !== newVersion) {
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
            window.open(
                "http://docs.bitshares.org/bitshares/user/index.html",
                "_blank"
            );
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

        return {
            name: node.location || "Unknown location",
            url: node.url,
            up: node.url in props.apiLatencies,
            ping: props.apiLatencies[node.url],
            hidden: !!node.hidden
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
        if (
            !!this.confirmOutOfSync.modal &&
            this.confirmOutOfSync.modal.state.show
        ) {
            ZfApi.publish(this.confirmOutOfSync.modal.props.modalId, "close");
        }
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
            this._triggerReconnect();
        } else if (!this.props.synced) {
            // If the blockchain is out of sync the footer will be rerendered one last time and then
            // not receive anymore blocks, meaning no rerender. Thus we need to trigger any and all
            // handling out of sync state within this one call

            let forceReconnectAfterSeconds = 60;
            let askToReconnectAfterSeconds = 5;

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
                    let out_of_sync_seconds = this.getBlockTimeDelta();
                    if (
                        this.getBlockTimeDelta() > 3 &&
                        this.confirmOutOfSync.shownOnce == false
                    ) {
                        this.confirmOutOfSync.shownOnce = true;
                        this.confirmOutOfSync.modal.show(
                            <div>
                                <Translate
                                    content="connection.title_out_of_sync"
                                    out_of_sync_seconds={parseInt(
                                        out_of_sync_seconds
                                    )}
                                    component="h2"
                                />
                                <br />
                                <br />
                                <Translate
                                    content="connection.out_of_sync"
                                    out_of_sync_seconds={parseInt(
                                        out_of_sync_seconds
                                    )}
                                />
                                <br />
                                <br />
                                <Translate content="connection.want_to_reconnect" />
                                {routerTransitioner.isAutoSelection() && (
                                    <Translate
                                        content="connection.automatic_reconnect"
                                        reconnect_in_seconds={parseInt(
                                            forceReconnectAfterSeconds
                                        )}
                                    />
                                )}
                                <br />
                                <br />
                                <br />
                            </div>,
                            <Translate content="connection.manual_reconnect" />,
                            () => {
                                if (!this.props.synced) {
                                    this._triggerReconnect(false);
                                }
                            }
                        );
                    }
                }, askToReconnectAfterSeconds * 1000);
            }
        } else {
            this._closeOutOfSyncModal();
            this.confirmOutOfSync.shownOnce = false;
        }
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

    render() {
        const autoSelectAPI = "wss://fake.automatic-selection.com";
        const {state, props} = this;
        const {synced} = props;
        const connected = !(this.props.rpc_connection_status === "closed");

        // Current Node Details
        let nodes = this.props.defaults.apiServer;
        let getNode = this.getNode.bind(this);
        let currentNodeIndex = this.getCurrentNodeIndex.call(this);

        let activeNode = getNode(nodes[currentNodeIndex] || nodes[0]);

        if (activeNode.url == autoSelectAPI) {
            let nodeUrl = props.activeNode;
            currentNodeIndex = this.getNodeIndexByURL.call(this, nodeUrl);
            activeNode = getNode(nodes[currentNodeIndex]);
        }

        let block_height = this.props.dynGlobalObject.get("head_block_number");
        let version_match = APP_VERSION.match(/2\.0\.(\d\w+)/);
        let version = version_match
            ? `.${version_match[1]}`
            : ` ${APP_VERSION}`;
        let updateStyles = {display: "inline-block", verticalAlign: "top"};
        let logoProps = {};

        this._ensureConnectivity();

        return (
            <div>
                {!!routerTransitioner &&
                    routerTransitioner.isTransitionInProgress() && (
                        <LoadingIndicator
                            loadingText={counterpart.translate(
                                "app_init.connecting",
                                {
                                    server: routerTransitioner.getTransitionTarget()
                                }
                            )}
                        />
                    )}
                <ConfirmModal
                    modalId="footer_out_of_sync"
                    ref={thiz => {
                        this.confirmOutOfSync.modal = thiz;
                    }}
                />
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
                                            className="version"
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
                        {synced ? null : (
                            <div className="grid-block shrink txtlabel cancel">
                                <Translate content="footer.nosync" />&nbsp;
                                &nbsp;
                            </div>
                        )}
                        {!connected ? (
                            <div className="grid-block shrink txtlabel error">
                                <Translate content="footer.connection" />&nbsp;
                                &nbsp;
                            </div>
                        ) : null}
                        {this.props.backup_recommended ? (
                            <span>
                                <div className="grid-block">
                                    <a
                                        className="shrink txtlabel facolor-alert"
                                        data-tip="Please understand that you are responsible for making your own backup&hellip;"
                                        data-type="warning"
                                        onClick={this.onBackup.bind(this)}
                                    >
                                        <Translate content="footer.backup" />
                                    </a>
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
                                <div
                                    onClick={() => {
                                        this.setState({
                                            showNodesPopup: !this.state
                                                .showNodesPopup
                                        });
                                    }}
                                    style={{
                                        position: "relative",
                                        cursor: "pointer"
                                    }}
                                >
                                    <div className="footer-status">
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
                                            &nbsp;{!connected
                                                ? "-"
                                                : !activeNode.ping
                                                    ? "-"
                                                    : activeNode.ping +
                                                      "ms"}&nbsp;/&nbsp;
                                            <span className="footer-block-title">
                                                <Translate content="footer.block" />
                                            </span>
                                            &nbsp;#{block_height}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid-block">
                                    <div
                                        className="introjs-launcher"
                                        onClick={() => {
                                            this.launchIntroJS();
                                        }}
                                    >
                                        <Translate content="global.help" />
                                    </div>
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
                        this.setState({showNodesPopup: false});
                    }}
                    className="node-access-popup"
                    style={{display: this.state.showNodesPopup ? "" : "none"}}
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
            </div>
        );
    }

    onBackup() {
        this.props.history.push("/wallet/backup/create");
    }

    onBackupBrainkey() {
        this.props.history.push("/wallet/backup/brainkey");
    }

    onPopup() {
        this.setState({
            showNodesPopup: !this.state.showNodesPopup
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
