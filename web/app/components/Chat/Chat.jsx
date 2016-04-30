import React from "react";
import connectToStores from "alt/utils/connectToStores";
import AccountStore from "stores/AccountStore";
import Translate from "react-translate-component";
import Icon from "../Icon/Icon";
import ChainStore from "api/ChainStore";
import {debounce} from "lodash";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import Peer from "peerjs";
import Immutable from "immutable";
import utils from "common/utils";

class Comment extends React.Component {
    
    shouldComponentUpdate(nextProps) {
        return (
            !utils.are_equal_shallow(nextProps, this.props)
        );
    }

    render() {
        return (
            <div style={{padding: "3px 1px"}}>
                <span
                    className="clickable"
                    onClick={this.props.onSelectUser.bind(this, this.props.user)}
                    style={{
                        fontWeight: "bold",
                        color: this.props.color
                    }}>
                        {this.props.user}:&nbsp;
                </span>
                <span className="chat-text">{this.props.comment}</span>
            </div>
        );
    }
}


@connectToStores
export default class Chat extends React.Component {
    static getStores() {
        return [AccountStore, SettingsStore]
    };

    static getPropsFromStores() {
        return {
            currentAccount: AccountStore.getState().currentAccount,
            linkedAccounts: AccountStore.getState().linkedAccounts,
            viewSettings: SettingsStore.getState().viewSettings
        }
    };

    constructor(props) {
        super(props);

        this.state = {
            messages: [],
            connected: false,
            showChat: props.viewSettings.get("chatShow", false),
            myColor: props.viewSettings.get("chatColor", "#ffffff"),
            userName: props.viewSettings.get("chatUsername", null),
            shouldScroll: true
        }

        this._peer = null;

        this.connections = Immutable.Map();
        this._myID = null;

        this.onChangeColor = debounce(this.onChangeColor, 150);

        this._handleMessage = this._handleMessage.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !utils.are_equal_shallow(nextProps, this.props) ||
            !utils.are_equal_shallow(nextState, this.state)
        );
    }

    componentWillMount() {
        this._connectToServer();
    }

    _connectToServer() {
        this._peer = new Peer({
            host: 'bitshares.openledger.info',
            port: 9000,
            path: '/trollbox'
        });

        this._peer.on('open', id => {
            console.log("open, my ID is:", id);
            this._myID = id;
            this.setState({
                connected: true
            });

            this._peer.listAllPeers(this._connectToPeers.bind(this));
        });

        this._peer.on('connection', this.onConnection.bind(this));
        // this._peer.on('disconnect', this.onDisconnect.bind(this));

        this._peer.on('error', function(err) {
            console.log(err);
        });
    }

    _connectToPeers(peers) {
        if (!Array.isArray(peers)) {
            peers = [peers];
        }
        console.log("peers:", peers);
        // this._peers = Immutable.List(peers);
        peers.forEach(peer => {

            if (peer !== this._myID) {
                let conn = this._peer.connect(peer);
                conn.on('data', this._handleMessage);
                conn.on('close', this.onDisconnect.bind(this, peer));
                this.connections = this.connections.set(peer, conn);
            }
        });
        this.forceUpdate();
    }

    _handleMessage(data) {
        console.log("data:", data);
        this.state.messages.push(data);
        this.forceUpdate(this._scrollToBottom.bind(this));
    }

    _scrollToBottom() {
        if (this.refs.chatbox && this.state.shouldScroll) {
            this.refs.chatbox.scrollTop = this.refs.chatbox.scrollHeight;
        }
    }

    _onScroll(e) {
        let {scrollTop, scrollHeight, clientHeight} = this.refs.chatbox;
        let shouldScroll = scrollHeight - scrollTop <= clientHeight;
        if (shouldScroll !== this.state.shouldScroll) {
            this.setState({
                shouldScroll: shouldScroll
            });
        }

    }

    onConnection(c) {
        console.log("connection:", c);
        this.connections = this.connections.set(c.id, c);
        c.on('data', this._handleMessage);
        c.on('close', this.onDisconnect.bind(this, c.id));
        this.forceUpdate();
    }

    onDisconnect(id) {
        console.log("disconnected:", id);
        this.connections = this.connections.delete(id);
        this.forceUpdate();
    }

    submitMessage(e) {
        e.preventDefault();
        if (!this.refs.input.value.length) {
            return;
        }

        let message = {
            user: this.state.userName || this._myID,
            message: this.refs.input.value,
            color: this.state.myColor || "#ffffff"
        };

        if (this.connections.size) {
            this.connections.forEach(c => {
                c.send(message);
            })
            
        }
        this.refs.input.value = "";
        this._handleMessage(message);
    }

    onToggleChat(e) {
        e.preventDefault();
        this.setState({
            showChat: !this.state.showChat
        });
    }

    onToggleSettings(e) {
        let newValue = !this.state.showSettings;
        this.setState({
            showSettings: newValue
        });

        SettingsActions.changeViewSetting({
            chatShow: newValue
        });
    }

    onPickAccount(e) {
        console.log("onPickAccount:", e);
        this.setState({
            userName: e.target.value
        }, this._resetServer.bind(this));

        SettingsActions.changeViewSetting({
            chatUsername: e.target.value
        });
    }

    _resetServer() {
        console.log("_resetServer", this.state.userName);
        this._peer.destroy();
        this._connectToServer();
    }

    onChangeColor(e) {

        if (this.refs.colorInput) {
            console.log("change color:", this.refs.colorInput.value);
            this.setState({
                myColor: this.refs.colorInput.value
            });

            SettingsActions.changeViewSetting({
                chatColor: this.refs.colorInput.value
            });
        }
    }

    _onSelectUser(userName) {
        this.refs.input.value += userName + ", ";
    }

    render() {

        let {userName} = this.state;

        let messages = this.state.messages.map((msg, index) => {
            let isMine = msg.user === userName || msg.user === this._myID;

            return (
                <Comment
                    onSelectUser={this._onSelectUser.bind(this)}
                    key={index}
                    user={msg.user}
                    comment={msg.message}
                    color={msg.color}
                    isMine={isMine}
                />
            );
        });

        let {showChat, showSettings, connected} = this.state;

        let chatStyle = {
            display: showChat ? "block" : "none",
            float: "right",
            height: "35px",
            margin: "0 .5em",
            width: "300px",
            marginRight: "1em"
        };

        let accountOptions = this.props.linkedAccounts
        .filter(a => {
            let account = ChainStore.getAccount(a);
            if (!account) {
                return false;
            }
            return AccountStore.isMyAccount(account);
        })
        .map(account => {
            return <option key={account} value={account}>{account}</option>;
        }).toArray();

        accountOptions.push(<option key="default" value={"anonymous"}>anonymous</option>)


        let settings = (
            <div style={{padding: 10}}>
                {/* Username */}
                <div className="settings-title"><Translate content="chat.user" />: </div>
                <select
                    value={userName}
                    className="form-control"
                    onChange={this.onPickAccount.bind(this)}
                >
                    {accountOptions}
                </select>
                {/* Color */}
                <div className="settings-title">
                    <Translate content="chat.color" />:
                </div>
                <input
                    style={{maxWidth: 50, padding: 0}}
                    ref="colorInput"
                    defaultValue={this.state.myColor}
                    onChange={this.onChangeColor.bind(this)}
                    type="color"
                />
                
                {/* Done button */}
                <div style={{paddingTop: 20 }}>
                    <div onClick={this.onToggleSettings.bind(this)} className="button">
                        <Translate content="chat.done" />
                    </div>
                </div>
            </div>
        );

        return (
            <div id="chatbox" style={{bottom: this.props.footerVisible ? 36 : 0}}>
                {!showChat ? 
                <a className="toggle-controlbox" onClick={this.onToggleChat.bind(this)}>
                    <span className="chat-toggle"><Translate content="chat.button" /></span>
                </a> : null}
                
                <div style={chatStyle} className="chatbox">
                    <div className="flyout grid-block main-content vertical">
                        <div className="chatbox-title grid-block shrink">
                            <Translate content="chat.title" />
                            <span>&nbsp;- {this.connections.size + 1} users online</span>
                            <div className="chatbox-settings" onClick={this.onToggleSettings.bind(this)}>
                                <Icon name="cog"/>
                            </div>
                            <a onClick={this.onToggleChat.bind(this)} className="chatbox-close">&times;</a>
                        </div>

                        {!connected ? <div style={{fontSize: "1.2rem", padding: 20}}><Translate content="chat.disconnected" /></div> : (
                        <div className="grid-block vertical chatbox-content" ref="chatbox" onScroll={this._onScroll.bind(this)}>
                            {!showSettings ? <div>{messages}</div> : settings}
                        </div>)}
                         {!showSettings && connected ? <div className="grid-block shrink">
                            <div >
                                <form onSubmit={this.submitMessage.bind(this)}  className="button-group" style={{marginBottom: 0}}>
                                <input style={{marginBottom: 0, width: 300, paddingTop: 5, paddingBottom: 5, backgroundColor: "white", fontSize: 12}} ref="input" type="text" />
                                </form>
                            </div>
                        </div> : null}

                    </div>
                </div>
            </div>
        );
    }
}