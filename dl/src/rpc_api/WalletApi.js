var helper = require('../chain/transaction_helper')
var ops = require('../chain/transaction_operations')
var type = require('../chain/serializer_operation_types')
var v = require('../chain/serializer_validation')
import key from "../common/key_utils"

var PrivateKey = require('../ecc/key_private')
var ApplicationApi = require('./ApplicationApi')
var WalletDb = require('../stores/WalletDb')

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
        return WalletDb.process_transaction(
            tr,
            null, //signer_private_key,
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
        brainkey,
        new_account_name,
        registrar_id,
        referrer_id = 0,
        referrer_percent = 100,
        broadcast = true
    ) {
        var owner_privkey = key.get_owner_private( brainkey, "0" )
        var active_privkey = key.get_active_private( owner_privkey )
        return this.application_api.create_account_with_brain_key(
            owner_privkey.toPublicKey().toBtsPublic(),
            active_privkey.toPublicKey().toBtsPublic(),
            new_account_name,
            registrar_id,
            referrer_id,
            referrer_percent,
            null, //signer_private_key
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
        return this.application_api.transfer(
            from_account_id,
            to_account_id,
            amount,
            asset_id,
            memo,
            expire_minutes,
            null, //signer_private_key,
            broadcast
        )
    }

}
module.exports = WalletApi
