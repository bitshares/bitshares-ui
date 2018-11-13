import React from "react";
import Translate from "react-translate-component";
import LoadingIndicator from "../LoadingIndicator";
import LogsActions from "actions/LogsActions";
import CopyButton from "../Utility/CopyButton";
import html2canvas from "html2canvas";
import {Modal} from "bitshares-ui-style-guide";
import counterpart from "counterpart";

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
            html2canvas(content)
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

    onMemoChanged(e) {
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

        return (
            <Modal
                title={counterpart.translate("modal.report.title")}
                visible={this.props.visible}
                onCancel={this.props.hideModal}
                onOk={this.props.hideModal}
            >
                <div className="grid-block vertical no-overflow">
                    <Translate content="modal.report.title" component="h1" />
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
            </Modal>
        );
    }
}

export default ReportModal;
