ChainTypes = require './chain_types'

lookup = new (require './lookup')()

module.exports = _my = {}

class _my.limit_order_create
    _template = ->
        fee : 
            amount : "0"
            asset_id : 0#1.4.0
        seller : 0      #1.3.0
        amount_to_sell : 
            amount : "0"
            asset_id : 0 #1.4.0
        min_to_receive : 
            amount : "0"
            asset_id : 0 #1.4.0
        expiration : 0
        fill_or_kill : no
    
    constructor:()->
        for key in Object.keys _tmp = _template()
            @[key] = _tmp[key]
    
    get_operations:->
        @fee.asset_id = lookup.asset_id(@fee.asset_id)
        @seller = lookup.account_id(@seller)
        @amount_to_sell.asset_id = lookup.asset_id(@amount_to_sell.asset_id)
        @min_to_receive.asset_id = lookup.asset_id(@min_to_receive.asset_id)
        [[ ChainTypes.operations.limit_order_create, @]]
