import React from "react";
import Chat from "./Chat";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";

export default class ChatWrapper extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            docked: false
        };
    }

    onToggleChat(e) {
        e.preventDefault();
        let showChat = !this.state.showChat;

        SettingsActions.changeViewSetting({
            showChat: showChat
        });
    }

    _onEnableChat(e) {
        e.preventDefault();
        SettingsActions.changeSetting({
            setting: "disableChat",
            value: false
        });
    }

    render() {
        let {docked} = this.state;
        let {showChat} = this.props;
        let content;

        let chatStyle = {
            display: !showChat ? "none" : !docked ?"block" : "inherit",
            float: !docked ? "right" : null,
            height: !docked ? 35 : null,
            margin: !docked ? "0 .5em" : null,
            width: !docked ? 350 : 300,
            marginRight: !docked ? "1rem" : null
        };

        if (this.props.disable) {
            content = showChat ?
                (<div className="chatbox">
                    <div className="grid-block main-content vertical flyout" >
                        <div className="chatbox-title grid-block shrink">
                            <Translate content="chat.disabled" />
                            <a onClick={this.onToggleChat.bind(this)} className="chatbox-close">&times;</a>
                        </div>

                        <div className="grid-block vertical no-overflow chatbox-content">
                            <div
                                className="grid-content"
                                ref="chatbox"
                                style={{
                                    textAlign: "center",
                                    paddingTop: 120
                                }}>
                                <div onClick={this._onEnableChat.bind(this)} className="button">
                                    <Translate content="chat.enable" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>) : (
                <a className="toggle-controlbox" onClick={this.onToggleChat.bind(this)}>
                    <span className="chat-toggle"><Translate content="chat.button" /></span>
                </a>
            );

        } else {
            content = <Chat {...this.props} />;
        }

        return (
            <div
                id="chatbox"
                className={docked ? "chat-docked grid-block" : "chat-floating"}
                style={{
                    bottom: this.props.footerVisible && !docked ? 36 : null,
                    height: !docked ? 35 : null
                }}
            >
                {content}
            </div>
        );
    }
}
