var helper = require('../chain/transaction_helper')
var ops = require('../chain/signed_transaction')
var type = require('../chain/serializer_operation_types')
var v = require('../chain/serializer_validation')
import key from "../common/key_utils"
import lookup from "chain/lookup"
import chain_types from "chain/chain_types"

var PrivateKey = require('../ecc/key_private')
var ApplicationApi = require('./ApplicationApi')
var WalletDb = require('../stores/WalletDb')

import PrivateKeyStore from "stores/PrivateKeyStore"
import Aes from "ecc/aes"

class WalletApi {

    constructor() {
        this.application_api = new ApplicationApi()
    }
    
    new_transaction() {
        return new ops.signed_transaction()
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

    transfer(
        from_account_id,
        to_account_id,
        amount, 
        asset, 
        memo_message,
        broadcast = true,
        encrypt_memo = true,
        optional_nonce = null
    ) {
        console.error("deprecated, call application_api.transfer instead")
        return this.application_api.transfer({
            from_account_id,
            to_account_id,
            amount, 
            asset, 
            memo_message,
            broadcast,
            encrypt_memo,
            optional_nonce
        })
    }

}
module.exports = WalletApi
