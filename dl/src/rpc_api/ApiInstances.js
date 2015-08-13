var WebSocketRpc = require("./WebSocketRpc");
var GrapheneApi = require("./GrapheneApi");

class Apis {
    
    constructor() {
        this.connect()
    }
    
    connect() {
        let hostname = "localhost";
        let protocol = "ws:";
        try {
            hostname = window.location.hostname;
            protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
        } catch(e) {}
        if(this.ws_rpc) return
        this.ws_rpc = new WebSocketRpc(protocol + hostname + ":8090");
        this.init_promise = this.ws_rpc.login("", "").then(() => {
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
                console.log("[ApiInstances.js:26] ----- connection to rpc server was restored ----->");
                this.ws_rpc.login("", "").then(() => {
                    this._db_api.init();
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
    
}

var apis_instance

module.exports = {
    instance: function () {
        if ( !apis_instance ) {
            apis_instance = new Apis();
        }
        apis_instance.connect()
        return apis_instance;
    }
};
