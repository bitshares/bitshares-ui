import React from "react";
import Translate from "react-translate-component";
import LoadingIndicator from "../LoadingIndicator";
import LogsActions from "actions/LogsActions";
import CopyButton from "../Utility/CopyButton";
import html2canvas from "html2canvas";
import {Modal, Button, Tooltip} from "bitshares-ui-style-guide";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";

class ReportModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
        this.showLog = this.showLog.bind(this);
    }

    getInitialState() {
        return {
            loadingImage: false,
            logEntries: [],
            logsCopySuccess: false,
            showLog: false,
            imageURI: null,
            showScreen: false
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        let should =
            this.props.visible !== nextProps.visible ||
            this.state.imageURI !== nextState.imageURI ||
            this.state.showLog !== nextState.showLog ||
            this.state.showScreen !== nextState.showScreen;
        if (nextProps.visible && this.props.visible !== nextProps.visible) {
            this.getLogs();
            html2canvas(document.getElementById("content"))
                .then(canvas => {
                    return canvas.toDataURL("image/png");
                })
                .then(
                    uri => this.setState({imageURI: uri}),
                    error => {
                        console.error(
                            "Screenshot could not be captured",
                            error
                        );
                        this.setState({
                            imageURI: "Screenshot could not be captured"
                        });
                    }
                );
        }
        return should;
    }

    onLogEntryChanged(e) {
        this.setState({logEntries: [e.target.value]});
    }

    showScreenshot = () => {
        // Take screenshot
        this.setState({
            showScreen: !this.state.showScreen
        });
    };

    getLogs = () => {
        LogsActions.getLogs().then(data => {
            if (__DEV__) {
                data.unshift(
                    "Running in DEV mode, persistant capturing of logs deactivated!"
                );
            }
            this.setState({
                logEntries: data.join("\n")
            });
        });
    };

    showLog() {
        this.setState({
            showLog: !this.state.showLog
        });
    }

    render() {
        let {
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
                        &nbsp;&nbsp;
                        <a
                            href="https://github.com/bitshares/bitshares-ui/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{textAlign: "center", width: "100%"}}
                            className="external-link"
                        >
                            https://github.com/bitshares/bitshares-ui/issues
                        </a>
                        <br />
                        <Translate content="modal.report.explanatory_text_3" />
                        <br />
                        <br />
                        <Translate content="modal.report.explanatory_text_4" />
                        <br />
                        &nbsp;&nbsp;
                        <a
                            href="https://hackthedex.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{textAlign: "center", width: "100%"}}
                            className="external-link"
                        >
                            https://hackthedex.io
                        </a>
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
                        onChange={this.onLogEntryChanged.bind(this)}
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

        return (
            <Modal
                title={counterpart.translate("modal.report.title")}
                visible={this.props.visible}
                onCancel={this.props.hideModal}
                footer={[
                    <Button key={"submit"} onClick={this.props.hideModal}>
                        {counterpart.translate("modal.ok")}
                    </Button>
                ]}
            >
                <div className="grid-block vertical no-overflow">
                    <p>
                        <Translate content="modal.report.explanatory_text_1" />
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

                        <Tooltip
                            title={
                                this.state.showLog
                                    ? counterpart.translate(
                                          "modal.report.hideLog"
                                      )
                                    : counterpart.translate(
                                          "modal.report.showLog"
                                      )
                            }
                        >
                            <div
                                onClick={this.showLog}
                                style={{cursor: "pointer"}}
                            >
                                <label
                                    className="left-label"
                                    style={{
                                        paddingTop: "1em",
                                        paddingLeft: "0.5em",
                                        cursor: "pointer"
                                    }}
                                >
                                    {this.state.showLog ? "-" : "+"}
                                    &nbsp;
                                    <Translate content="modal.report.lastLogEntries" />
                                </label>
                            </div>
                        </Tooltip>

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
                            style={{
                                paddingBottom: "0em",
                                paddingTop: "1em",
                                paddingRight: "0.5em"
                            }}
                        >
                            <Translate content="modal.report.copyScreenshot" />
                        </div>

                        <Tooltip
                            title={
                                this.state.showScreen
                                    ? counterpart.translate(
                                          "modal.report.hideScreenshot"
                                      )
                                    : counterpart.translate(
                                          "modal.report.takeScreenshot"
                                      )
                            }
                        >
                            <div
                                onClick={this.showScreenshot}
                                style={{cursor: "pointer"}}
                            >
                                <label
                                    className="left-label"
                                    style={{
                                        paddingTop: "1em",
                                        paddingLeft: "0.5em",
                                        cursor: "pointer"
                                    }}
                                >
                                    {this.state.showScreen ? "-" : "+"}
                                    &nbsp;
                                    <Translate content="modal.report.screenshot" />
                                </label>
                            </div>
                        </Tooltip>

                        {screenshotArea()}
                    </span>
                    <br />
                    {decriptionArea()}
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
            </Modal>
        );
    }
}

export default ReportModal;
