import React from "react";
import SocketIO from 'socket.io-client';
import connectToStores from "alt/utils/connectToStores";
import AccountStore from "stores/AccountStore";
import Translate from "react-translate-component";
import Icon from "../Icon/Icon";
import ChainStore from "api/ChainStore";
import {debounce} from "lodash";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";

let local = false;
let server = local ? "localhost" : "http://api.bitsharesblocks.com";
let port = local ? 8081 : 80;

class Comment extends React.Component {
    
    shouldComponentUpdate(nextProps) {
        return (
            nextProps.user !== this.props.user ||
            nextProps.comment !== this.props.comment ||
            nextProps.color !== this.props.color
        )
    }

    render() {
        return (
            <div style={{padding: "2px 1px"}}>
                <span style={{fontWeight: "bold", color: this.props.color}}>{this.props.user}:</span>
                <span> {this.props.comment}</span>
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
            showChat: false,
            myColor: props.viewSettings.get("chatColor") || "#FFF",
            userName: props.viewSettings.get("chatUsername") || "anonymous"
        }

        this._socket = null;

        this.onChangeColor = debounce(this.onChangeColor, 150);
    }

    componentDidMount() {
        console.log("props:", this.props);
        this._socket = SocketIO.connect(`${server}:${port}`, {secure: false});

        this._socket.on('connect', () => {
            this.setState({
                connected: true
            });
            this._socket.emit('add user',  this.state.userName);
            this._socket.emit('change color',  this.state.myColor);
        });

        this._socket.on('disconnect', () => {
            this.setState({
                connected: false
            });
            console.log('disconnected');
        });

        this._socket.on('new message', (msg) => {
            console.log("new message:", msg);
            this.state.messages.unshift(msg);
            this.forceUpdate();
        });

        this._socket.on('user join', (msg) => {
            console.log("add user:", msg);
            this.state.messages.unshift(msg);
            this.forceUpdate();
        });

        this._socket.on('user left', (msg) => {
            console.log("add user:", msg);
            this.state.messages.unshift(msg);
            this.forceUpdate();
        });        
    }

    submitMessage(e) {
        e.preventDefault();
        if (this._socket && this.refs.input.value.length) {
            this._socket.emit('new message', this.refs.input.value);
            this.refs.input.value = "";
        }
    }

    onToggleChat(e) {
        e.preventDefault();
        this.setState({
            showChat: !this.state.showChat
        });
    }

    onToggleSettings(e) {
        this.setState({
            showSettings: !this.state.showSettings
        });
    }

    onPickAccount(e) {
        console.log("onPickAccount:", e);
        this.setState({
            userName: e.target.value
        });

        this._socket.emit('change username',  e.target.value);

        SettingsActions.changeViewSetting({
            chatUsername: e.target.value
        });
    }

    onChangeColor(e) {
        console.log("change color:", e.target.value);
        if (this._socket) {
            this._socket.emit('change color', e.target.value);
        }

        this.setState({
            myColor: e.target.value
        });

        SettingsActions.changeViewSetting({
            chatColor: e.target.value
        });
    }

    render() {
        let messages = this.state.messages.map((msg, index) => {
            return <Comment key={index} user={msg.userName} comment={msg.message} color={msg.color} />;
        });

        let {showChat, showSettings, connected} = this.state;

        let chatStyle = {
            display: showChat ? "block" : "none",
            float: "right",
            height: "35px",
            margin: "0 .5em",
            width: "250px",
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
                    value={this.state.userName}
                    className="form-control"
                    onChange={this.onPickAccount.bind(this)}
                >
                    {accountOptions}
                </select>
                {/* Color */}
                <div className="settings-title"><Translate content="chat.color" />:</div>
                <input defaultValue={this.state.myColor} onChange={this.onChangeColor.bind(this)} type="color" />
                
                {/* Done button */}
                <div style={{paddingTop: 20 }}>
                    <div onClick={this.onToggleSettings.bind(this)} className="button"><Translate content="chat.done" /></div>
                </div>
            </div>
        );

        return (
            <div id="chatbox">
                {!showChat ? 
                <a className="toggle-controlbox" onClick={this.onToggleChat.bind(this)}>
                    <span className="chat-toggle"><Translate content="chat.button" /></span>
                </a> : null}
                
                <div style={chatStyle} className="chatbox">
                    <div className="flyout grid-block main-content vertical">
                        <div className="chatbox-title grid-block shrink">
                            <Translate content="chat.title" />

                            <div className="chatbox-settings" onClick={this.onToggleSettings.bind(this)}>
                                <Icon name="cog"/>
                            </div>
                            <a onClick={this.onToggleChat.bind(this)} className="chatbox-close">&times;</a>
                        </div>

                        {!connected ? <div style={{fontSize: "1.2rem", padding: 20}}><Translate content="chat.disconnected" /></div> : (
                        <div className="grid-block vertical chatbox-content">
                            {!showSettings ? <div>{messages}</div> : settings}
                        </div>)}
                         {!showSettings && connected ? <div className="grid-block shrink">
                            <div >
                                <form onSubmit={this.submitMessage.bind(this)}  className="button-group" style={{marginBottom: 0}}>
                                <input style={{marginBottom: 0}} ref="input" type="text" />
                                <div
                                    style={{marginRight: 0, marginBottom: 0}}
                                    className="button"
                                    onClick={this.submitMessage.bind(this)}
                                >
                                    <Translate content="chat.send" /></div>
                                </form>
                            </div>
                        </div> : null}

                    </div>
                </div>
            </div>
        );
    }
}