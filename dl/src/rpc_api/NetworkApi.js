class NetworkApi {

    constructor(api) {
        this.api = api;
    }

    broadcast_transaction(signed_transaction) {
        return this.api.exec("broadcast_transaction", [signed_transaction]).then(response => {
            return response;
        });
    }
    
    add_node(ip_endpoint) {
        return this.api.exec("add_node", [ip_endpoint]).then(response => {
            return response;
        });
    }
    
    get_connected_peers() {
        return this.api.exec("get_connected_peers", []).then(response => {
            return response;
        });
    }
}
module.exports = NetworkApi