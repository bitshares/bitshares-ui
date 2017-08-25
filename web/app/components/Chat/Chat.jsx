import React from "react";
import { connect } from "alt-react";
import Translate from "react-translate-component";
import Icon from "../Icon/Icon";
import SettingsActions from "actions/SettingsActions";
import counterpart from "counterpart";

class Chat extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            messages: [{
                user: "chat.welcome_user",
                message: counterpart.translate("chat.welcome"),
                color: "black"
            },{
                user: "SYSTEM",
                message: "chat.telegram_link",
                color: "black"
            }],
            //connected: false,
            showChat: props.viewSettings.get("showChat", true),
            myColor: props.viewSettings.get("chatColor", "#904E4E"),
            shouldScroll: true,
            loading: true,
            docked: props.viewSettings.get("dockedChat", false)
        };
    }

    onToggleChat(e) {
        e.preventDefault();
        let showChat = !this.state.showChat;
        this.setState({
            showChat: showChat,
            docked: (!showChat && this.state.docked) ? false : this.state.docked
        });

        SettingsActions.changeViewSetting({
            showChat: showChat,
            dockedChat: (!showChat && this.state.docked) ? false : this.state.docked
        });
    }

    onToggleSettings(e) {
        let newValue = !this.state.showSettings;
        this.setState({
            showSettings: newValue
        }, () => {
            if (!newValue) {
                this._scrollToBottom();
            }
        });
    }

    _onToggleDock() {
        this.setState({
            docked: !this.state.docked
        });

        SettingsActions.changeViewSetting({
            dockedChat: !this.state.docked
        });
    }

    disableChat(e) {
        e.preventDefault();
        SettingsActions.changeViewSetting({
            showChat: false
        });
        SettingsActions.changeSetting({
            setting: "disableChat",
            value: true
        });
    }

    render() {

        let {loading, docked} = this.state;

        let {showChat, showSettings} = this.state;

        let chatStyle = {
            display: !showChat ? "none" : !docked ?"block" : "inherit",
            float: !docked ? "right" : null,
            height: !docked ? 35 : null,
            margin: !docked ? "0 .5em" : null,
            width: !docked ? 350 : 300,
            marginRight: !docked ? "1rem" : null
        };

        let settings = (
            <div style={{padding: 10}}>

            </div>
        );
        return (
            <div
                id="chatbox"
                className={docked ? "chat-docked grid-block" : "chat-floating"}
                style={{
                    bottom: this.props.footerVisible && !docked ? 36 : null,
                    height: !docked ? 35 : null
                }}
            >
                {!showChat ?
                <div>Chat is disabled</div> : null}

                <div style={chatStyle} className={"chatbox"}>
                    <div className={"grid-block main-content vertical " + (docked ? "docked" : "flyout")} >
                        <div className="chatbox-title grid-block shrink">
                            <Translate content="chat.title" />
                            <span>&nbsp;- <Translate content="chat.users" /></span>
                            <div className="chatbox-pin" onClick={this._onToggleDock.bind(this)}>
                                {docked ? <Icon className="icon-14px rotate" name="thumb-tack"/> : <Icon className="icon-14px" name="thumb-tack"/>}
                            </div>
                            <div className="chatbox-settings" onClick={this.onToggleSettings.bind(this)}>
                                <Icon className="icon-14px" name="cog"/>
                            </div>
                            <a onClick={this.onToggleChat.bind(this)} className="chatbox-close">&times;</a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class SettingsContainer extends React.Component {

    render() {
        //if (!this.props.accountsReady) return null;
        return <Chat {...this.props} />;
    }
}

export default connect(SettingsContainer, {

    getProps() {

    }
});
