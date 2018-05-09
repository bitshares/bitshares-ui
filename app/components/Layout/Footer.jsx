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
import counterpart from "counterpart";
import "intro.js/introjs.css";
import guide from "intro.js";

class Footer extends React.Component {
    static propTypes = {
        dynGlobalObject: ChainTypes.ChainObject.isRequired,
        synced: React.PropTypes.bool.isRequired
    };

    static defaultProps = {
        dynGlobalObject: "2.1.0"
    };

    static contextTypes = {
        router: React.PropTypes.object
    };

    constructor(props) {
        super(props);

        this.state = {
            showNodesPopup: false
        };
    }

    componentDidMount() {
        this.checkNewVersionAvailable.call(this);

        this.downloadLink = "https://bitshares.org/download";
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

        return (
            <div>
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
                                        style={{
                                            marginRight: "20px",
                                            marginTop: "10px",
                                            fontSize: "1.35em",
                                            display: "inline-block"
                                        }}
                                    />
                                )}
                                <span style={updateStyles}>
                                    <Translate content="footer.title" />
                                    <span className="version">{version}</span>
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
                                    onMouseEnter={() => {
                                        this.setState({showNodesPopup: true});
                                    }}
                                    onMouseLeave={() => {
                                        this.setState({showNodesPopup: false});
                                    }}
                                    style={{position: "relative"}}
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
                    onMouseEnter={() => {
                        this.setState({showNodesPopup: true});
                    }}
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
        this.context.router.push("/wallet/backup/create");
    }

    onBackupBrainkey() {
        this.context.router.push("/wallet/backup/brainkey");
    }

    onPopup() {
        this.setState({
            showNodesPopup: !this.state.showNodesPopup
        });
    }

    onAccess() {
        SettingsActions.changeViewSetting({activeSetting: 6});
        this.context.router.push("/settings/access");
    }
}
Footer = BindToChainState(Footer, {keep_updating: true});

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
