var helper = require('../chain/transaction_helper')
var ops = require('../chain/transaction_operations')
var type = require('../chain/serializer_operation_types')
var v = require('../chain/serializer_validation')

var PrivateKey = require('../ecc/key_private')
var ApplicationApi = require('./ApplicationApi')

class WalletApi {

    constructor() {
        this.application_api = new ApplicationApi()
    }
    
    new_transaction(expire_minutes = 10) {
        //var expire_minutes = 10
        var tr = new ops.signed_transaction()
        tr.set_expire_minutes(expire_minutes)
        return tr
    }
    
    sign_and_broadcast( tr, broadcast = true ) {
        v.required(tr, "transaction")
        var signer_private_key_id = 11
        var signer_private_key = PrivateKey.fromSeed("nathan")
        return tr.finalize(
            signer_private_key_id,
            signer_private_key,
            broadcast
        )
    }
    
    /** Console print any transaction object with zero default values. */
    template(transaction_object_name) {
        var object = helper.template(
            transaction_object_name, 
            {use_default: true, annotate: true}
        )
        // visual
        console.error(JSON.stringify(object,null,4))
        
        // usable
        object = helper.template(
            transaction_object_name, 
            {use_default: true, annotate: false}
        )
        // visual
        console.error(JSON.stringify(object))
        return object
    }

    create_account_with_brain_key(
        brain_key,
        new_account_name,
        registrar_id,
        referrer_id = 0,
        referrer_percent = 100,
        broadcast = true
    ) {
        var expire_minutes = 10
        var signer_private_key_id = 11
        var signer_private_key = PrivateKey.fromSeed("nathan")
        return this.application_api.create_account_with_brain_key(
            brain_key,
            new_account_name,
            registrar_id,
            referrer_id,
            referrer_percent,
            expire_minutes,
            signer_private_key_id,
            signer_private_key,
            broadcast
        )
    }
    
    transfer(
        from_account_id,
        to_account_id,
        amount, 
        asset_id, 
        memo,
        broadcast = true
    ) {
        var expire_minutes = 10
        var signer_private_key_id = 11
        var signer_private_key = PrivateKey.fromSeed("nathan")
        return this.application_api.transfer(
            from_account_id,
            to_account_id,
            amount,
            asset_id,
            memo,
            expire_minutes,
            signer_private_key_id,
            signer_private_key,
            broadcast
        )
    }

}
module.exports = WalletApi
