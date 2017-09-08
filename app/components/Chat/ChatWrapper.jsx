// Issue #219 trollbox removed Aug 2017; 
// wrapper left for possible re-purposed use  

import React from "react";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";

export default class ChatWrapper extends React.Component {

    constructor() {
        super();
 
    }

    onToggleChat(e) {
        e.preventDefault();
        let showChat = !this.props.showChat;
        SettingsActions.changeViewSetting({
            showChat: showChat
        });
    }

    render() {
        let {showChat, dockedChat} = this.props;
        let content;
        let chatStyle = {
            display: !showChat ? "none" : "block",
            float: "right",
            height: 35,
            margin: "0 .5em",
            width: 350,
            marginRight: "1rem"
        };

            content = showChat ?
                (<div className="chatbox">
                    <div className="grid-block main-content vertical flyout" >
                        <div className="chatbox-title grid-block shrink">
                            <Translate content="chat.disabled" />
                            <a onClick={this.onToggleChat.bind(this)} className="chatbox-close">&times;</a>
                        </div>

                        <div className="grid-block vertical no-overflow chatbox-content">
                            <div className="grid-content v-align" ref="chatbox">
                                <div className="text-center align-center">
                                    <Translate component="p" unsafe content="chat.telegram_link" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>) : (
                <a className="toggle-controlbox" onClick={this.onToggleChat.bind(this)}>
                    <span className="chat-toggle"><Translate content="chat.button" /></span>
                </a>
            );

        return (
            <div id="chatbox" className={"chat-floating"}
                style={{
                    bottom: this.props.footerVisible ? 36 : null,
                    height: 35
                }}
            >
                {content}
            </div>
        );
    }
}
