import { key } from "@graphene/ecc"
import { lookup } from "@graphene/chain"
import { chain_types } from "@graphene/chain"
import { TransactionBuilder } from "@graphene/chain"
import { transaction_helper } from "@graphene/chain"
import { Aes, PrivateKey } from "@graphene/ecc"
import assert from "assert"

var ApplicationApi = require('./ApplicationApi')
var WalletDb = require('../stores/WalletDb')

import PrivateKeyStore from "stores/PrivateKeyStore"

class WalletApi {

    constructor() {
        this.application_api = new ApplicationApi()
    }
    
    new_transaction() {
        return new TransactionBuilder();
    }
    
    sign_and_broadcast( tr, broadcast = true ) {
        assert(tr, "transaction")
        return WalletDb.process_transaction(
            tr,
            null, //signer_private_key,
            broadcast
        )
    }
    
    /** Console print any transaction object with zero default values. */
    template(transaction_object_name) {
        var object = transaction_helper.template(
            transaction_object_name, 
            {use_default: true, annotate: true}
        )
        // visual
        console.error(JSON.stringify(object,null,4))
        
        // usable
        object = transaction_helper.template(
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
export default WalletApi
