var tr_helper = require('../chain/transaction_helper'),
    get_owner_private = tr_helper.get_owner_private,
    get_active_private = tr_helper.get_active_private

var tr_op = require('../chain/transaction_operations'),
    signed_transaction = tr_op.signed_transaction,
    key_create = tr_op.key_create,
    account_create = tr_op.account_create

var so_type = require('../chain/serializer_operation_types'),
    signed_transaction_type = so_type.signed_transaction

var vt = require('../chain/serializer_validation'),
    get_protocol_instance = vt.get_protocol_instance

var PrivateKey = require('../ecc/key_private')
var ApplicationApi = require('./ApplicationApi')

class WalletApi {

    constructor() {
        this.application_api = new ApplicationApi()
    }
    
    new_transaction() {
        var expire_minutes = 10
        var tr = new tr_op.signed_transaction()
        tr.set_expire_minutes(expire_minutes)
        return tr
    }
    
    sign_and_broadcast( tr ) {
        var signer_private_key_id = 1
        var signer_private_key = PrivateKey.fromSeed("nathan")
        var broadcast = true
        return tr.finalize(
            signer_private_key_id,
            signer_private_key,
            broadcast
        )
    }
    
    /** Console print any transaction object with zero default values. */
    template(transaction_object_name, indent) {
        tr_helper.template(transaction_object_name, indent)
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
        var signer_private_key_id = 1
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
        var signer_private_key_id = 1
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