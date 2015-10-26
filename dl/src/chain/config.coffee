module.exports = _this =
    address_prefix: "GPH"
    expire_in_secs: 15
    networks:
        BitShares:
            address_prefix: "BTS"
            chain_id: "4018d7844c78f6a6c41c6a552b898022310fc5dec06da467ee7905a8dad512c8"
        Muse:
            address_prefix: "MUSE"
            chain_id: "45ad2d3f9ef92a49b55c2227eb06123f613bb35dd08bd876f2aea21925a67a67"
    
    # Auto-configure if a matching chain ID is found
    setChainId: (chain_id) ->
        for network_name in Object.keys(_this.networks)
            network = _this.networks[network_name]
            if( network.chain_id == chain_id )
                _this.network_name = network_name
                _this.address_prefix = network.address_prefix if(network.address_prefix)
                console.log "Configured for", network_name, network
                break
        unless _this.network_name
            console.log "Unknown chain id", chain_id
        return