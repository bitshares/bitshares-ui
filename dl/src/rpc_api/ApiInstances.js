var WebSocketRpc = require("./WebSocketRpc");
var GrapheneApi = require("./GrapheneApi");

class Apis {
    constructor() {
       this.rpc_user = "";
       this.rpc_password = "";
    }

    connect(hostname="localhost", port=8090) {
        console.log( "Connecting..." );
        try {
           let args     = window.location.hash.split("/");
           let parts    = args[2].split(":");
           this.rpc_user = parts[0];
           this.rpc_pass = parts[1];
           this.rpc_ip   = parts[2];
           this.rpc_port = parts[3];
        } catch(e) {}
        if (this.ws_rpc) return; // already connected
        if (this.rpc_ip) hostname = this.rpc_ip;
        else hostname = window.location.hostname ? window.location.hostname : "localhost";
        if (this.rpc_port ) port = this.rpc_port;
        let protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
        //hostname = "graphene.bitshares.org"; protocol = "wss://"; port = "8090";
        console.log(`connecting to ${protocol}${hostname}:${port}`);
        this.ws_rpc = new WebSocketRpc(`${protocol}${hostname}:${port}`);
        this.init_promise = this.ws_rpc.login(this.rpc_user, this.rpc_password).then(() => {
            this._db_api = new GrapheneApi(this.ws_rpc, "database");
            this._network_api = new GrapheneApi(this.ws_rpc, "network_broadcast");
            this._history_api = new GrapheneApi(this.ws_rpc, "history");
            var db_promise = this._db_api.init().then( ()=> {
                //https://github.com/cryptonomex/graphene/wiki/chain-locked-tx
                return this._db_api.exec("get_chain_id",[]).then( _chain_id => {
                    this.chain_id = _chain_id
                    //DEBUG console.log("chain_id1",this.chain_id)
                });
            });
            this.ws_rpc.on_reconnect = () => {
                this.ws_rpc.login("", "").then(() => {
                    this._db_api.init().then(() => {
                        if(this.update_rpc_connection_status_callback)
                            this.update_rpc_connection_status_callback("reconnect");
                    });
                    this._network_api.init();
                    this._history_api.init();
                });
            }
            return Promise.all([db_promise,
                this._network_api.init(),
                this._history_api.init()]);
        });
    }
    
    close() {
        this.ws_rpc.close();
        this.ws_rpc = null
    }
    
    db_api () {
        return this._db_api;
    }
    
    network_api () {
        return this._network_api;
    }
    
    history_api () {
        return this._history_api;
    }

    setRpcConnectionStatusCallback(callback) {
        this.update_rpc_connection_status_callback = callback;
        this.ws_rpc.setRpcConnectionStatusCallback(callback);
    }
    
}

var apis_instance;

module.exports = {
    setRpcConnectionStatusCallback: function(callback) {
        if(apis_instance) apis_instance.setRpcConnectionStatusCallback(callback);
    },
    instance: function ( host="localhost", port=8090) {
        if ( !apis_instance ) {
            apis_instance = new Apis();
            apis_instance.connect(host, port);
        }
        return apis_instance;
    }
};
