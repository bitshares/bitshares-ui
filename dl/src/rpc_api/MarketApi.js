
var Long = require('../common/bytebuffer').Long

var Lookup = require('../chain/lookup')
var helper = require('../chain/transaction_helper')
var tr_op = require('../chain/transaction_operations')
var mr_op = require('../chain/market_operations')

class MarketApi {
    
    sell_asset(
        seller_account,
        amount_to_sell,
        symbol_to_sell,
        min_amount_to_receive,
        symbol_to_receive,
        timeout_sec = 0,
        fill_or_kill = false,
        transaction_expire_min = 10,
        signer_private_key_id,
        signer_private_key,
        broadcast = false
    ) {
        var lookup = new Lookup();
        var tr = new tr_op.signed_transaction()
        tr.set_expire_minutes(transaction_expire_min)
        {
            var op = new mr_op.limit_order_create()
            op.seller = seller_account
            op.amount_to_sell.amount = amount_to_sell
            op.amount_to_sell.asset_id = symbol_to_sell
            op.min_to_receive.amount = min_amount_to_receive
            op.min_to_receive.asset_id = symbol_to_receive
            op.expiration = timeout_sec ? helper.seconds_from_now(timeout_sec) : 0
            op.fill_or_kill = fill_or_kill
            tr.add_operation(op)
        }
        return tr.finalize(
            signer_private_key_id,
            signer_private_key,
            broadcast
        )
    }
}

module.exports = MarketApi
