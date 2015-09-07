var Immutable = require("immutable");

var NODE_DEBUG = process.env.NODE_DEBUG

class WebSocketRpc {

    constructor(ws_server) {
        var WebSocketClient = typeof(WebSocket) !== "undefined" ? require("ReconnectingWebSocket") : require("websocket").w3cwebsocket;
        this.web_socket = new WebSocketClient(ws_server);
        this.current_reject = null;
        this.on_reconnect = null;
        this.connect_promise = new Promise((resolve, reject) => {
            this.current_reject = reject;
            this.web_socket.onopen = () => {
                if(this.update_rpc_connection_status_callback) this.update_rpc_connection_status_callback("open");
                if(this.on_reconnect) this.on_reconnect();
                resolve();
            }
            this.web_socket.onerror = (error) => {
                console.log("!!! WebSocket Error ", ws_server);
                if (this.current_reject) {
                    this.current_reject(error);
                }
            };
            this.web_socket.onmessage = (message) => this.listener(JSON.parse(message.data));
            this.web_socket.onclose = () => {
                if(this.update_rpc_connection_status_callback) this.update_rpc_connection_status_callback("closed");
            };
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

           
        if (params[1] === "set_subscribe_callback" || params[1] === "subscribe_to_market" ||
            params[1] === "broadcast_transaction_with_callback" || params[1] === "set_pending_transaction_callback" 
            ) 
        {
            this.subscriptions[this.current_callback_id] = {
                callback: params[2][0],
                params: Immutable.fromJS(params[2][1])
            };
            params[2][0] = this.current_callback_id;
        }

        if( params[1] === "unsubscribe_from_market" || params[1] === "unsubscribe_from_accounts") {
            let unSubParams = Immutable.fromJS(params[2][0]);
            for (let id in this.subscriptions) {
                if (Immutable.is(this.subscriptions[id].params, unSubParams)) {
                    this.unsub[this.current_callback_id] = id;
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
            this.callbacks[this.current_callback_id] = {
                time: new Date(),
                resolve: resolve,
                reject: reject
            };
            this.web_socket.onerror = (error) => {
                console.log("!!! WebSocket Error ", error);
                reject(error);
            };
            this.web_socket.send(JSON.stringify(request));
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
        return this.connect_promise.then(() => {
            return this.call([1, "login", [user, password]]);
        });
    }

    close() {
        this.web_socket.close();
    }

    setRpcConnectionStatusCallback(callback) {
        this.update_rpc_connection_status_callback = callback;
    }

}

module.exports = WebSocketRpc;
