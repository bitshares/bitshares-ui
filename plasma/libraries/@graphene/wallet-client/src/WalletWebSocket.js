var Immutable = require("immutable")

const SOCKET_DEBUG = true //JSON.parse( process.env.npm_config__graphene_wallet_client_socket_debug || false )
let instance = 0


export default class WalletWebSocket {

    /**
        @arg {string} ws_server_url - WebSocket URL
        @arg {boolean} [sendEvents = false] - events are global, just use this on the main websocket
    */
    constructor(ws_server_url, sendEvents = false) {
        
        this.instance = ++instance
        this.is_ws_local = /localhost/.test(ws_server_url)
        this.is_ws_secure = /^wss:\/\//.test(ws_server_url)
        this.update_stocket_status = status => {
            if(sendEvents === true)
                WalletWebSocket.socket_status.forEach(cb=>Promise.resolve().then(()=>cb(status)))
        }
        
        // var WebSocketClient = typeof(WebSocket) !== "undefined" ? require("ReconnectingWebSocket") : require("ws");
        var WebSocketClient = typeof(WebSocket) !== "undefined" ? require("ReconnectingWebSocket") : require("websocket").w3cwebsocket;
        
        this.web_socket = new WebSocketClient(ws_server_url);
        this.current_reject = null;
        this.on_reconnect = null;
        this.status = null;//re-connecting websocket can be noisy
        
        this.connect_promise = new Promise((resolve, reject) => {
            this.current_reject = reject;
            this.web_socket.onopen = () => {
                this.status = "open";
                this.update_stocket_status("open");
                if(this.on_reconnect) this.on_reconnect();
                resolve();
            }
            // Warning, onerror callback is over-written on each request.  Be cautious to dulicate some logic here.
            this.web_socket.onerror = evt => {
                if( this.status != "error" ) {
                    console.error("ERROR\tWalletWebSocket\tconstructor onerror\t", evt)
                }
                this.status = "error";
                this.update_stocket_status("error");
                
                if (this.current_reject) {
                    this.current_reject(evt);
                }
            };
            this.web_socket.onmessage = (message) =>{
                this.status = "open";
                return this.listener(JSON.parse(message.data));
            }
            this.web_socket.onclose = () => {
                // this.status = null;
                this.update_stocket_status("closed");
            };
        });
        this.current_callback_id = 0;
        this.callbacks = {};
        this.subscriptions = {};
        this.unsub = {};
    }
    
    close() {
        let unsubs = []
        for (let id in this.subscriptions) {
            try {
                let { method, params, key } = this.subscriptions[id]
                let unsub = this.unsubscribe.bind(this, method, params, key)
                unsubs.push(unsub)
            } catch( error ) {
                console.error("WARN\tWalletWebSocket\tclose\t",this.instance,"unsubscribe",error, "stack", error.stack)
            }
        }
        let unsub = Promise.all(unsubs)
        return unsub.then(()=> new Promise( resolve => {
            this.web_socket.onclose = closeEvent => {
                // if(global.INFO) console.log("INFO\tWalletWebSocket\tclose") // closeEvent.reason === connection failed
                if( Object.keys(this.subscriptions).length !== 0 )
                    console.error("WARN\tWalletWebSocket\tclose\t",this.instance,"active subscriptions",
                        Object.keys(this.subscriptions).length)
                
                this.update_stocket_status("closed");
                
                resolve()
            }
            this.web_socket.close()
        }))
    }
    
    /**
        @arg {string} method - API method name
        @arg {object} params - JSON serilizable parameters
        @return {Promise}
    */
    call(method, params) {
        return this.request( ++ this.current_callback_id, method, params)
    }
    
    /**
        Invoke a method and subscribe to multiple replies..  The server must support this feature; the server-side subscribe call will see the parameters here wrapped in a array that includes a client-side subscription ID (like this: [1, params] ).  This ID is internal and is  to map a notifications from the server back to the callback function.
        
        @arg {string} method - API method name (server will provide a subscribe_xxx method)
        @arg {object} params - JSON serilizable parameters
        @arg {object} [subscribe_key = { method, params }] - client-side unique key for each subscription
        @arg {function} callback - required, called with a wallet_object initially and for every wallet update
        @return {Promise}
    */
    subscribe(method, params, subscribe_key = { method, params }, callback = null) {
        
        let callback_id = ++ this.current_callback_id
        let subscribe_id = this.getSubscriptionId(method, subscribe_key) || ++ this.current_callback_id
        this.subscriptions[subscribe_id] = {
            callback,
            method, params: Immutable.fromJS(params),
            key: Immutable.fromJS(subscribe_key)
        }
        
        params = { subscribe_id: subscribe_id, subscribe_key, params }
        return this.request(callback_id, method, params)
    }
    
    /**
        Remove your subscription.  Provide the same unique key from {@link this.subscribe}.
        
        @arg {string} method - API method name (server will provide a unsubscribe_xxx method)
        @arg {object} params - JSON serilizable parameters
        @arg {object} [subscribe_key = { method, params }] - client-side unique key for each subscription
        @return {Promise}
    */
    unsubscribe(method, params, subscribe_key = { method, params }) {
        return new Promise( (resolve, reject) => {
            this.current_callback_id ++
            let subscription_id = this.getSubscriptionId(method, subscribe_key)
            
            if( ! subscription_id ) {
                let msg = ("WARN: unsubscribe did not find subscribe_key",this.instance,
                    "subscribe_key", subscribe_key, " for method", method).join(' ')
                console.error(msg)
                return Promise.reject(msg)
            }
            
            this.unsub[this.current_callback_id] = { subscription_id, resolve }
            // Wrap parameters, send the subscription ID to the server
            params = { unsubscribe_id: subscription_id, subscribe_key, params }
            this.request(this.current_callback_id, method, params).catch( error => reject(error))
        })
    }
    
    /**
        Transmit's JSON.stringify(request) to the server
        @arg {number} id = current_callback_id, see this.callbacks
        @private
    */
    request(id, method, params) {
        if(SOCKET_DEBUG) {
            if(this.last_instance != this.instance){
                this.last_instance = this.instance
                console.log()
            }
            console.log("WalletWebSocket("+this.instance+") ----- call "+id+" ---- >", method, "\t", JSON.stringify(params));
        }
        return this.connect_promise.then(()=> {
            return new Promise( (resolve, reject) => {
                let time = new Date()
                this.callbacks[id] = { time, resolve, reject }
                
                this.web_socket.onerror = (evt) => {
                    
                    this.update_stocket_status("error")
                    
                    console.log("ERROR\tWalletWebSocket\trequest",this.instance, evt.data ? evt.data : "")
                    reject(evt);
                };
                
                this.web_socket.send(JSON.stringify({ id, method, params }));
            })
        })
    }

    /** @private */
    listener(response) {
        if(SOCKET_DEBUG) {
            if(this.last_instance != this.instance){
                this.last_instance = this.instance
                console.log()
            }
            console.log("WalletWebSocket("+this.instance+") <--- reply "+(response.id||" ")+" ---- <", JSON.stringify(response));
        }
        let sub = false,
            callback = null;

        if (response.method === "notice") {
            sub = true;
            response.id = response.params[0];
        }

        if ( sub ) {
            let subscription = this.subscriptions[response.id]
            if( ! subscription) {
                console.log("ERROR\tWalletWebSocket:"+this.instance+"\tlistener\tUnknown subscription", response.id)
                return
            }
            callback = subscription.callback;
        } else {
            callback = this.callbacks[response.id];
            if( ! callback) {
                console.log("ERROR\tWalletWebSocket:"+this.instance+"\tlistener\tUnknown callback", response.id, response)
                return
            }
        }

        if (callback && sub) {
            
            callback(response.params[1]);
        
        } else if (callback && ! sub) {
            
            if (response.error) {
                callback.reject(response.error);
                WalletWebSocket.api_status.forEach(cb=>Promise.resolve().then(()=>cb(response.error)))
            } else {
                callback.resolve(response.result);
                WalletWebSocket.api_status.forEach(cb=>Promise.resolve().then(()=>cb(null)))
            }
            delete this.callbacks[response.id]
            if (this.unsub[response.id]) {
                let { subscription_id, resolve } = this.unsub[response.id]
                delete this.subscriptions[subscription_id];
                delete this.unsub[response.id];
                resolve()
            }
            
        }
    }
    
    getSubscriptionId(method, subscribe_key) {
        let subscription_id
        let unSubParams = Immutable.fromJS(subscribe_key)
        
        for (let id in this.subscriptions) {
            let s = this.subscriptions[id]
            if (Immutable.is(s.key, unSubParams)) {
                subscription_id = id
                break
            }
        }
        return subscription_id
    }

}
// mocha babel does not support class { static ... 
// {Set<function>} update_stocket_status called with ("open"|"error"|"closed")
WalletWebSocket.socket_status = new Set()
WalletWebSocket.api_status = new Set() // rename to api_error ?