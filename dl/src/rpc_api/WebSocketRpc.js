var Immutable = require("immutable");
var ReconnectingWebSocket = require("ReconnectingWebSocket");

var NODE_DEBUG = process.env.NODE_DEBUG

class WebSocketRpc {

    constructor(ws_server) {
        var WebSocketClient = typeof(WebSocket) !== "undefined" ? ReconnectingWebSocket : require("websocket").w3cwebsocket;
        this.web_socket = new WebSocketClient(ws_server);
        this.current_reject = null;
        this.on_reconnect = null;
        var self = this;
        this.connect_promise = new Promise((resolve, reject) => {
            if(NODE_DEBUG)
                console.log("[WebSocketRpc.js:9] ----- connect_promise ----->", this);
            self.current_reject = reject;
            self.web_socket.onopen = () => {
                if(self.on_reconnect) self.on_reconnect();
                resolve();
            }
            self.web_socket.onerror = (error) => {
                console.log("!!! WebSocket Error ", ws_server);
                if (self.current_reject) {
                    self.current_reject(error);
                }
            };
            self.web_socket.onmessage = (message) => self.listener(JSON.parse(message.data));
        });
        this.current_callback_id = 0;
        this.callbacks = {};
        this.subscriptions = {};
        this.unsub = {};
    }

    call(params) {
        if(NODE_DEBUG)
            console.log("[websocketrpc] ----- call -----> id:",this.current_callback_id+1, params);
        this.current_callback_id += 1;
        var self = this;

           
        if (params[1] === "subscribe_to_objects" || params[1] === "subscribe_to_market" ||
            params[1] === "broadcast_transaction_with_callback"
            ) 
           /*
        if( params.length > 2 && 
            typeof params[2] == 'object'  &&
            typeof params[2][0] == 'function' ) */
        {
            self.subscriptions[self.current_callback_id] = {
                callback: params[2][0],
                params: Immutable.fromJS(params[2][1])
            };
            params[2][0] = this.current_callback_id;
        }

        if (params[1] === "get_full_accounts") {
            let account = params[2][1][0];
            let exists = false;
            // Look for existing sub to that account and reuse if it exists
            for (let key in self.subscriptions) {
                if (self.subscriptions[key].account && self.subscriptions[key].account === account) {
                    exists = true;
                    // self.subscriptions[key].callback = params[2][0].bind(account);
                    //DEBUG console.log("reusing subscription:", key, account);
                    params[2][0] = key;
                    break;
                }
            }
            if (!exists) {
                self.subscriptions[self.current_callback_id] = {
                    callback: params[2][0].bind(account),
                    account: account,
                    params: Immutable.fromJS(params[2][1])
                };
                params[2][0] = self.current_callback_id;
            }
        }

        if (params[1] === "unsubscribe_from_objects" || params[1] === "unsubscribe_from_market" || params[1] === "unsubscribe_from_accounts") {
            let unSubParams = Immutable.fromJS(params[2][0]);
            for (let id in self.subscriptions) {
                if (Immutable.is(self.subscriptions[id].params, unSubParams)) {
                    self.unsub[this.current_callback_id] = id;
                    break;
                }
            }
        }

        var request = {
            method: "call",
            params: params
        };
        request.id = this.current_callback_id;


        return new Promise((resolve, reject) => {
            self.callbacks[self.current_callback_id] = {
                time: new Date(),
                resolve: resolve,
                reject: reject
            };
            self.web_socket.onerror = (error) => {
                console.log("!!! WebSocket Error ", error);
                reject(error);
            };
            self.web_socket.send(JSON.stringify(request));
        });

    }

    listener(response) {
        if(NODE_DEBUG)
            console.log("[websocketrpc] <--- reply ----", response);
        
        let sub = false,
            callback = null;

        if (response.method === "notice") {
            sub = true;
            response.id = response.params[0];
        }

        if (!sub) {
            callback = this.callbacks[response.id];
        } else {
            callback = this.subscriptions[response.id].callback;
        }

        if (callback && !sub) {
            if (response.error) {
                callback.reject(response.error);
            } else {
                callback.resolve(response.result);
            }
            delete this.callbacks[response.id];

            if (this.unsub[response.id]) {
                delete this.subscriptions[this.unsub[response.id]];
                delete this.unsub[response.id];
            }

        } else if (callback && sub) {
            callback(response.params[1]);
        } else {
            console.log("Warning: unknown websocket response: ", response);
        }
    }

    login(user, password) {
        var self = this;
        return this.connect_promise.then(() => {
            return self.call([1, "login", [user, password]]);
        });
    }

    close() {
        this.web_socket.close();
    }

}

module.exports = WebSocketRpc;
