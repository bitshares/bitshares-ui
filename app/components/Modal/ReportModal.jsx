import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Translate from "react-translate-component";
import BaseModal from "./BaseModal";
import AccountStore from "stores/AccountStore";
import LoadingIndicator from "../LoadingIndicator";
import LogsActions from "actions/LogsActions";
import Screenshot from "lib/common/Screenshot";
import CopyButton from "../Utility/CopyButton";
import html2canvas from "html2canvas";

import {connect} from "alt-react";

class ReportModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
        this.nestedRef = null;

        ZfApi.subscribe("transaction_confirm_actions", (name, msg) => {
            if (msg == "close") {
                this.setState({hidden: false});
            }
        });
        this.showLog = this.showLog.bind(this);
    }

    getInitialState() {
        return {
            open: false,
            loadingImage: false,
            logEntries: [],
            hidden: false,
            logsCopySuccess: false,
            showLog: false,
            imageURI: null,
            showScreen: false
        };
    }

    show() {
        this.getLogs();
        this.setState({open: true, hidden: false}, () => {
            ZfApi.publish(this.props.id, "open");
        });
        html2canvas(content)
            .then(canvas => {
                return canvas.toDataURL("image/png");
            })
            .then(
                uri => this.setState({imageURI: uri}),
                error => {
                    console.error("Screenshot could not be captured", error);
                    this.setState({
                        imageURI: "Screenshot could not be captured"
                    });
                }
            );
    }

    onMemoChanged(e) {
        this.setState({logEntries: [e.target.value]});
    }

    onClose = (publishClose = true) => {
        ZfApi.unsubscribe("transaction_confirm_actions");
        this.setState(
            {
                open: false,
                loadingImage: false,
                logEntries: [],
                hidden: false,
                logsCopySuccess: false,
                showLog: false,
                showScreen: false
            },
            () => {
                if (publishClose) ZfApi.publish(this.props.id, "close");
            }
        );
    };

    showScreenshot = () => {
        // Take screenshot
        this.setState({
            showScreen: !this.state.showScreen
        });
    };

    getLogs = () => {
        LogsActions.getLogs().then(data => {
            this.setState({
                logEntries: data.join("\n")
            });
        });
    };

    copyLogs = () => {
        const copyText = document.getElementById("logsText");
        copyText.select();
        document.execCommand("copy");

        this.setState({
            logsCopySuccess: true
        });
    };

    showLog() {
        this.setState({
            showLog: !this.state.showLog
        });
    }

    render() {
        let {
            open,
            hidden,
            logEntries,
            loadingImage,
            logsCopySuccess,
            showLog,
            showScreen
        } = this.state;

        const decriptionArea = () => {
            if (true) {
                // !showLog && !showScreen
                return (
                    <p>
                        <Translate content="modal.report.explanatory_text_2" />
                        <br />
                        <a
                            href="https://github.com/bitshares/bitshares-ui/issues"
                            target="_blank"
                            style={{textAlign: "center", width: "100%"}}
                        >
                            https://github.com/bitshares/bitshares-ui/issues
                        </a>
                        <br />
                        <Translate content="modal.report.explanatory_text_3" />
                    </p>
                );
            }
        };

        const logsArea = () => {
            if (showLog) {
                return (
                    <textarea
                        id="logsText"
                        style={{}}
                        rows="20"
                        value={logEntries}
                        onChange={this.onMemoChanged.bind(this)}
                    />
                );
            }
        };

        const screenshotArea = () => {
            if (this.state.imageURI != null) {
                if (showScreen) {
                    if (this.state.imageURI.length > 100) {
                        return <img src={this.state.imageURI} />;
                    } else {
                        return <text>this.state.imageURI</text>;
                    }
                }
            }
        };

        return !open ? null : (
            <div id="report_modal" className={hidden || !open ? "hide" : ""}>
                <BaseModal
                    id={this.props.id}
                    overlay={true}
                    onClose={() => this.onClose(this, false)}
                >
                    <div className="grid-block vertical no-overflow">
                        <Translate
                            content="modal.report.title"
                            component="h1"
                        />
                        <p>
                            <Translate
                                content="modal.report.explanatory_text_1"
                                component="label"
                            />
                        </p>
                        <span
                            className="raw"
                            style={{
                                border: "1px solid darkgray",
                                marginBottom: "1em"
                            }}
                        >
                            <div
                                className="right-label"
                                style={{paddingBottom: "0em"}}
                            >
                                <CopyButton text={this.state.logEntries} />
                            </div>

                            <Translate
                                className="left-label"
                                component="label"
                                content="modal.report.lastLogEntries"
                                style={{
                                    paddingTop: "1em",
                                    paddingLeft: "0.5em"
                                }}
                            />

                            {logsArea()}
                        </span>
                        <span
                            className="raw"
                            style={{
                                border: "1px solid darkgray",
                                marginBottom: "1em"
                            }}
                        >
                            <div
                                className="right-label"
                                style={{paddingBottom: "0em"}}
                            >
                                {this.state.imageURI != null ? (
                                    <img
                                        style={{
                                            height: "2.8em",
                                            marginTop: "0em",
                                            marginRight: "0em"
                                        }}
                                        src={this.state.imageURI}
                                    />
                                ) : (
                                    "Failed"
                                )}
                            </div>
                            <div
                                className="right-label"
                                style={{paddingBottom: "0em"}}
                            >
                                <Translate
                                    component="label"
                                    content="modal.report.copyScreenshot"
                                    style={{
                                        paddingTop: "1em",
                                        paddingRight: "0.5em"
                                    }}
                                />
                            </div>
                            <Translate
                                className="left-label"
                                component="label"
                                content="modal.report.screenshot"
                                style={{
                                    paddingTop: "1em",
                                    paddingLeft: "0.5em"
                                }}
                            />

                            {screenshotArea()}
                        </span>
                        <br />
                        {decriptionArea()}
                        <div className="content-block transfer-input">
                            <div className="no-margin no-padding">
                                <div
                                    className="small-6"
                                    style={{
                                        display: "inline-block",
                                        paddingRight: "10px"
                                    }}
                                >
                                    <div
                                        className="button primary"
                                        onClick={this.showLog}
                                    >
                                        {this.state.showLog ? (
                                            <Translate content="modal.report.hideLog" />
                                        ) : (
                                            <Translate content="modal.report.showLog" />
                                        )}
                                    </div>
                                </div>
                                <div
                                    className="small-6"
                                    style={{
                                        display: "inline-block",
                                        paddingRight: "10px"
                                    }}
                                >
                                    <div
                                        className="button primary"
                                        onClick={this.showScreenshot}
                                    >
                                        {this.state.showScreen ? (
                                            <Translate content="modal.report.hideScreenshot" />
                                        ) : (
                                            <Translate content="modal.report.takeScreenshot" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {loadingImage && (
                            <div style={{textAlign: "center"}}>
                                <LoadingIndicator type="three-bounce" />
                            </div>
                        )}
                        {logsCopySuccess && (
                            <p>
                                <Translate content="modal.report.copySuccess" />
                            </p>
                        )}
                    </div>
                </BaseModal>
            </div>
        );
    }
}

class ReportModalConnectWrapper extends React.Component {
    render() {
        return <ReportModal {...this.props} ref={this.props.refCallback} />;
    }
}

ReportModalConnectWrapper = connect(
    ReportModalConnectWrapper,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps(props) {
            return {
                currentAccount: AccountStore.getState().currentAccount,
                passwordAccount: AccountStore.getState().passwordAccount,
                tabIndex: props.tabIndex || 0
            };
        }
    }
);

export default ReportModalConnectWrapper;
