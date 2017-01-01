import React from "react";
import { connect } from "alt-react";
import AccountStore from "stores/AccountStore";
import Translate from "react-translate-component";
import Icon from "../Icon/Icon";
import {ChainStore} from "graphenejs-lib";
import {debounce} from "lodash";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import Peer from "peerjs";
import utils from "common/utils";
import counterpart from "counterpart";
import LoadingIndicator from "../LoadingIndicator";
import AccountActions from "actions/AccountActions";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import {FetchChainObjects} from "graphenejs-lib";;

const PROD = true;
const hostConfig = PROD ? { // Prod config
    host: "bitshares.openledger.info",
    path: "/trollbox",
    secure: true,
    port: 443
} : { // Dev config
    host: "localhost",
    path: "/trollbox",
    port: 9000
};

class Comment extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            !utils.are_equal_shallow(nextProps, this.props)
        );
    }

    render() {
        let {comment, user, color} = this.props;
        let systemUsers = [counterpart.translate("chat.welcome_user"), "SYSTEM"];
        return (
            <div style={{padding: "3px 1px"}}>
                <span
                    className="clickable"
                    onClick={this.props.onSelectUser.bind(this, user)}
                    style={{
                        fontWeight: "bold",
                        color: color
                    }}>
                        {user}:&nbsp;
                </span>
                <span className="chat-text">{systemUsers.indexOf(user) !== -1 ? comment : comment.substr(0, 140)}</span>
            </div>
        );
    }
}

class Chat extends React.Component {
    constructor(props) {
        super(props);

        let anonName = "anonymous" + Math.round(10000 * Math.random());
        this.state = {
            messages: [{
                user: counterpart.translate("chat.welcome_user"),
                message: counterpart.translate("chat.welcome"),
                color: "black"
            }],
            connected: false,
            showChat: props.viewSettings.get("showChat", true),
            myColor: props.viewSettings.get("chatColor", "#904E4E"),
            userName: props.viewSettings.get("chatUsername", anonName),
            shouldScroll: true,
            loading: true,
            anonName: anonName,
            docked: props.viewSettings.get("dockedChat", false),
            hasFetchedHistory: false
        };

        this._peer = null;

        this.connections = new Map();
        this._myID = null;

        this.onChangeColor = debounce(this.onChangeColor, 150);

        this._handleMessage = this._handleMessage.bind(this);
        this.onTrxIncluded = this.onTrxIncluded.bind(this);

        this.lastMessage = null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !utils.are_equal_shallow(nextProps, this.props) ||
            !utils.are_equal_shallow(nextState, this.state)
        );
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.footerVisible !== prevProps.footerVisible) {
            this._scrollToBottom();
        }
    }

    componentWillMount() {
        this._connectToServer();
    }

    componentWillUnmount() {
        if (this._peer) {
            this._peer.destroy();
        }
    }

    _connectToServer() {
        this._peer = new Peer(hostConfig);

        this._peer.on("open", id => {
            // console.log("open, my ID is:", id);
            this._myID = id;
            this.setState({
                connected: true,
                loading: false,
                open: true
            });

            this._peer.listAllPeers(this._connectToPeers.bind(this, true));
        });

        this._peer.on("connection", this.onConnection.bind(this));
        // this._peer.on('disconnect', this.onDisconnect.bind(this));

        this._peer.on("error", err => {
            console.log(err);
            if (err.message.indexOf("Lost connection to server") !== -1) {
                this.setState({
                    open: false
                });
            }

            if (err.message.indexOf("Could not get an ID from the server") !== -1) {
                this.setState({
                    open: false,
                    loading: false,
                    connected: false
                });
            }

            // this._peer.reconnect();
            // this._connectToServer();
        });
    }

    _broadCastPeers() {
        let peersArray = this.connections.map((conn, peer) => {
            return peer;
        }).toArray();

        this._broadCastMessage({
            peers: peersArray
        }, false);
    }

    _connectToPeers(broadcast = false, peers) {
        let shouldUpdate = false;
        if (!Array.isArray(peers)) {
            peers = [peers];
        }

        // this._peers = Immutable.List(peers);
        peers.forEach(peer => {
            if (peer !== this._myID && !this.connections.has(peer)) {
                shouldUpdate = true;
                let conn = this._peer.connect(peer);

                conn.on("data", this._handleMessage);
                conn.on("close", this.onDisconnect.bind(this, peer));
                this.connections.set(peer, conn);
            }
        });
        if (shouldUpdate) {
            this.forceUpdate();
        }
        // if (broadcast) {
        //     setTimeout(this._broadCastPeers.bind(this), 2000);
        // }

        // console.log("this.connections:", this.connections);
    }



    _handleMessage(data) {
        if ("peers" in data && data.peers.length) {
            return this._connectToPeers(false, data.peers);
        }

        if ("requestHistory" in data) {
            return this.sendHistory(this.connections.get(data.requestHistory));
        }

        if (!this.state.fetchingHistory && data.historyCount && !this.state.hasFetchedHistory) {
            this.setState({
                fetchingHistory: true
            });
            let c = this.connections.get(data.id);
            return c ? c.send({requestHistory: this._myID}) : null;
        }

        if ("history" in data && data.history.length) {
            this.setState({
                fetchingHistory: false,
                hasFetchedHistory: true
            });

            data.history.filter(a => {
                return (
                    a.user !== "Welcome to Bitshares" &&
                    a.user !== "Welcome to Openledger"
                );
            }).forEach(msg => {
                this.state.messages.push(msg);
            });
            this.forceUpdate();
            this._scrollToBottom();
        }

        if ("message" in data && data.user && data.color) {
            this.state.messages.push(data);
            if (this.state.messages.length >= 100) {
                this.state.messages.shift();
            }

            this.forceUpdate(this._scrollToBottom.bind(this));
        }

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

    sendHistory(c) {
        c.send({history: this.state.messages.filter((msg) => {return msg.user !== "SYSTEM" && msg.user !== "Welcome to Bitshares";})});
    }

    onConnection(c) {
        this.connections.set(c.peer, c);
        c.on("data", this._handleMessage);
        c.on("close", this.onDisconnect.bind(this, c.peer));
        setTimeout(() => {c.send({
            id: this._myID,
            historyCount: this.state.messages.reduce((value, msg) => {return value + (msg.user !== "SYSTEM" ? 1 : 0);}, 0)});
        }, 200);
        this.forceUpdate();
    }

    onDisconnect(peer) {
        this.connections.get(peer).close();
        this.connections.delete(peer);
        this.forceUpdate();

        if (!this.connections.size && !this.state.open) {
            this.setState({
                connected: false
            });
        }

        this.forceUpdate();
    }

    onTip(input) {
        Promise.all([
            FetchChainObjects(ChainStore.getAsset, [input.asset]),
            FetchChainObjects(ChainStore.getAccount, [this.props.currentAccount]),
            FetchChainObjects(ChainStore.getAccount, [input.to])
        ])
        .then(objects => {
            let asset = objects[0][0];
            let fromAccount = objects[1][0];
            let toAccount = objects[2][0];
            let precision = utils.get_asset_precision(asset.get("precision"));

            AccountActions.transfer(
                fromAccount.get("id"),
                toAccount.get("id"),
                parseInt(input.amount * precision, 10),
                asset.get("id"),
                input.memo ? new Buffer(input.memo, "utf-8") : input.memo,
                null,
                asset.get("id")
            ).then( () => {
                TransactionConfirmStore.unlisten(this.onTrxIncluded);
                TransactionConfirmStore.listen(this.onTrxIncluded);
            }).catch( e => {
                let msg = e.message ? e.message.split( "\n" )[1] : null;
                console.log( "error: ", e, msg);
                this.setState({error: msg});
            });
        });
    }

    onTrxIncluded(confirm_store_state) {
        if(confirm_store_state.included && confirm_store_state.broadcast) {
            // this.setState(Transfer.getInitialState());
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
            this._onTipSuccess();
        } else if (confirm_store_state.closed) {
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
        }
    }

    _onTipSuccess() {
        let tip = this._parseTip();
        let message = {
            user: "SYSTEM",
            message: this.props.currentAccount + " tipped " + tip.to + " " + tip.amount + " " + tip.asset,
            color: "#B71A00"
        };

        // Public and local broadcast
        this._broadCastMessage(message);

        this.refs.input.value = "";
    }

    _parseTip() {
        let parsed = this.refs.input.value.split(" ");

        let memo;
        if (parsed.length > 4) {
            memo = "";
            for (let i = 4; i < parsed.length; i++) {
                memo += parsed[i] + " ";
            }
        }

        return {
            to: parsed[1].toLowerCase(),
            amount: parseFloat(parsed[2]),
            asset: parsed[3].toUpperCase(),
            memo: memo ? memo.trim() : null
        };
    }

    submitMessage(e) {
        if (e) {
            e.preventDefault();
        }

        if (this.refs.input.value.indexOf("/tip") === 0) {
            let tip = this._parseTip();
            return this.onTip(tip);
        } else if (this.refs.input.value.indexOf("/help") === 0) {
            let commands = [
                "Some useful commands:",
                "Tipping: /tip username 100 BTS Memo goes here",
                "This help: /help"
            ];

            // Only local broadcast
            commands.forEach(command => {
                this._handleMessage({
                    user: "SYSTEM",
                    message: command,
                    color: "#B71A00"
                });
            });

            return this.refs.input.value = "";
        }

        let now = new Date().getTime();

        if (!this.refs.input.value.length) {
            return;
        }

        if (now - this.lastMessage <= 2000) {
            console.log("time delta:", now - this.lastMessage, "ms");
            return this._handleMessage({
                user: "SYSTEM",
                message: counterpart.translate("chat.rate"),
                color: "#B71A00"
            });
        }

        let message = {
            user: this.state.userName,
            message: this.refs.input.value.substr(0, 140),
            color: this.state.myColor || "#ffffff"
        };

        // Public and local broadcast
        this._broadCastMessage(message);

        // Reset input and message timestamp
        this.refs.input.value = "";
        this.lastMessage = new Date().getTime();
    }

    _broadCastMessage(message, local = true) {
        // Local broadcast
        if (local) {
            this._handleMessage(message);
        }
        // Public broadcast
        if (this.connections.size) {
            this.connections.forEach(c => {
                c.send(message);
            });
        }
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

    onPickAccount(e) {
        this.setState({
            userName: e.target.value
        });

        SettingsActions.changeViewSetting({
            chatUsername: e.target.value
        });
    }

    _resetServer() {
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

        let {userName, loading, docked} = this.state;


        let messages = this.state.messages.map((msg, index) => {
            if (!msg.user || !msg.color || !msg.message) {
                return null;
            }
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
        }).filter((a) => {
            return a !== null;
        });

        let {showChat, showSettings, connected} = this.state;

        let chatStyle = {
            display: !showChat ? "none" : !docked ?"block" : "inherit",
            float: !docked ? "right" : null,
            height: !docked ? 35 : null,
            margin: !docked ? "0 .5em" : null,
            width: !docked ? 350 : 300,
            marginRight: !docked ? "1rem" : null
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

        accountOptions.push(<option key="default" value={this.state.anonName}>{this.state.anonName}</option>);


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

                <div onClick={this.disableChat.bind(this)} className="button">
                    <Translate content="settings.disableChat" />
                </div>

                {/* Done button */}
                <div style={{position: "absolute", bottom: 5, right: 0}}>
                    <div onClick={this.onToggleSettings.bind(this)} className="button">
                        <Translate content="chat.done" />
                    </div>
                </div>
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
                <a className="toggle-controlbox" onClick={this.onToggleChat.bind(this)}>
                    <span className="chat-toggle"><Translate content="chat.button" /></span>
                </a> : null}

                <div style={chatStyle} className={"chatbox"}>
                    <div className={"grid-block main-content vertical " + (docked ? "docked" : "flyout")} >
                        <div className="chatbox-title grid-block shrink">
                            <Translate content="chat.title" />
                            <span>&nbsp;- <Translate content="chat.users" count={this.connections.size + 1} /></span>
                            <div className="chatbox-pin" onClick={this._onToggleDock.bind(this)}>
                                {docked ? <Icon className="icon-14px rotate" name="thumb-tack"/> : <Icon className="icon-14px" name="thumb-tack"/>}
                            </div>
                            <div className="chatbox-settings" onClick={this.onToggleSettings.bind(this)}>
                                <Icon className="icon-14px" name="cog"/>
                            </div>
                            <a onClick={this.onToggleChat.bind(this)} className="chatbox-close">&times;</a>
                        </div>

                        {loading ? <div><LoadingIndicator /></div> : !connected ? (
                        <div className="grid-block vertical chatbox">
                            <div style={{padding: 20}}>
                                <Translate content="chat.disconnected" />
                                <div style={{paddingTop: 30}}>
                                    <div onClick={this._resetServer.bind(this)} className="button"><Translate content="chat.reconnect" /></div>
                                </div>
                            </div>
                        </div>) : (
                        <div className="grid-block vertical no-overflow chatbox-content"  onScroll={this._onScroll.bind(this)}>
                            <div className="grid-content" ref="chatbox">
                                {!showSettings ? <div>{messages}</div> : settings}
                            </div>
                        </div>)}

                        {!showSettings && connected && !loading ? (
                        <div className="grid-block shrink">
                            <div >
                                <form onSubmit={this.submitMessage.bind(this)}  className="button-group" style={{marginBottom: 0}}>
                                    <input style={{marginBottom: 0, width: !docked ? 350 : 300, paddingTop: 5, paddingBottom: 5, backgroundColor: "white", fontSize: 12}} ref="input" type="text" />
                                </form>
                            </div>
                        </div>) : null}

                    </div>
                </div>
            </div>
        );
    }
}

export default connect(Chat, {
    listenTo() {
        return [AccountStore, SettingsStore];
    },
    getProps() {
        return {
            currentAccount: AccountStore.getState().currentAccount,
            linkedAccounts: AccountStore.getState().linkedAccounts,
            viewSettings: SettingsStore.getState().viewSettings
        };
    }
});
