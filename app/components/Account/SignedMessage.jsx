import React from "react";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import SignedMessageAction from "../../actions/SignedMessageAction";

/** This component allows to display and verify a signed message
 *
 *  See SignedMessageAction for details on message format.
 *
 *    @author Stefan Schiessl <stefan.schiessl@blockchainprojectsbv.com>
 */
class SignedMessage extends React.Component {
    // static propTypes = {
    //     signedMessage: PropTypes.string.isRequired
    //    noVerification
    // };

    static defaultProps = {
        noVerification: false
    };

    constructor(props) {
        super(props);
        this.state = {
            message: this.props.message,
            messageParsed: null,
            showRawMessage: false,
            //
            noVerification: this.props.noVerification,
            //
            verified: null,
            //
            notification: null
        };
    }

    _verifyMessage(signedMessage) {
        this.setState({
            message: signedMessage,
            messageParsed: null,
            verified: null
        });
        let messageParsed = null;
        try {
            messageParsed = SignedMessageAction.parseMessage(signedMessage);
            this.setState({
                verified: null,
                messageParsed: messageParsed
            });

            if (!this.state.noVerification) {
                this.setState({
                    verified: null,
                    notification: counterpart.translate(
                        "account.signedmessages.verifying"
                    )
                });
                setTimeout(() => {
                    // do not block gui
                    try {
                        SignedMessageAction.verifyMemo(messageParsed);
                        this.setState({
                            verified: true,
                            notification: "" // clear popup
                        });
                    } catch (err) {
                        this._warning(err.message);
                        this.setState({
                            verified: false
                        });
                    }
                }, 0);
            }
        } catch (err) {
            this._warning(err.message);
        }
    }

    componentWillMount() {
        this._verifyMessage(this.state.message);
    }

    componentWillReceiveProps(nextProps) {
        let signedMessage = nextProps.message;
        if (
            signedMessage != undefined &&
            signedMessage != null &&
            signedMessage == this.state.message
        ) {
            // already done
            return;
        }
        this._verifyMessage(signedMessage);
    }

    _warning(message) {
        this.setState({
            notification: message
        });
    }

    _toggleRawMessage() {
        this.setState({
            showRawMessage: !this.state.showRawMessage
        });
    }

    render() {
        let legendMessage;
        let borderColor;
        if (this.state.messageParsed != null) {
            if (this.state.verified == null) {
                borderColor = "#FFF";
                legendMessage =
                    "Unverified message from " +
                    this.state.messageParsed.meta.account;
            } else if (this.state.verified) {
                borderColor = "#FFF";
                legendMessage =
                    "Verified message from " +
                    this.state.messageParsed.meta.account;
            } else {
                borderColor = "#F00";
                legendMessage =
                    "Refuted message, indicated sender " +
                    this.state.messageParsed.meta.account;
            }
        }
        let messageGiven =
            this.props.message != null && this.props.message != "";
        let notificationGiven =
            this.state.notification && this.state.notification != "";
        return (
            <div style={{color: "gray", margin: "10px 10px"}}>
                {this.state.messageParsed != null && (
                    <fieldset style={{borderColor: borderColor}}>
                        <legend style={{color: "white", weight: "bold"}}>
                            {legendMessage}
                        </legend>
                        <pre
                            style={{
                                position: "relative",
                                width: "100%",
                                display: "table"
                            }}
                        >
                            {this.state.messageParsed.content}
                            {notificationGiven && (
                                <div
                                    style={{
                                        textAlign: "center",
                                        display: "table-cell",
                                        verticalAlign: "middle",
                                        position: "absolute",
                                        width: "calc(100% - 30px)",
                                        height: "calc(100% + 15px)",
                                        top: "0px",
                                        right: "30px",
                                        backgroundColor: "rgba(50,50,50,0.5)"
                                    }}
                                    id="overlay"
                                >
                                    {this.state.notification}
                                </div>
                            )}
                        </pre>
                        <span
                            style={{
                                fontSize: "small",
                                float: "right"
                            }}
                        >
                            Signed on {this.state.messageParsed.meta.timestamp}{" "}
                            &nbsp;
                            <button
                                className="button"
                                type="button"
                                style={{
                                    fontSize: "small",
                                    float: "right",
                                    padding: "0px 0px",
                                    background: "#777"
                                }}
                                onClick={this._toggleRawMessage.bind(this)}
                            >
                                &#x1f50d;
                            </button>
                        </span>
                        {this.state.showRawMessage && <br />}
                        {this.state.showRawMessage && <br />}
                        {this.state.showRawMessage && (
                            <div
                                style={{
                                    overflow: "auto",
                                    width: "calc(100%)",
                                    maxWidth: "1000px"
                                }}
                            >
                                <pre>{this.state.message}</pre>
                            </div>
                        )}
                    </fieldset>
                )}
                {messageGiven &&
                    this.state.messageParsed == null && (
                        <fieldset style={{borderColor: "#F00"}}>
                            <legend
                                style={{color: "red", weight: "bold"}}
                                className="error"
                            >
                                Error while parsing message, please check syntax
                                from message below
                            </legend>
                            <pre>{this.props.message}</pre>
                        </fieldset>
                    )}
            </div>
        );
    }
}

export default SignedMessage;
