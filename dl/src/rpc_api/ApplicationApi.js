var Aes = require('../ecc/aes');
var PrivateKey = require('../ecc/key_private');
var PublicKey = require('../ecc/key_public');
var Long = require('../common/bytebuffer').Long;

var chain_types = require('../chain/chain_types');
var chain_config = require('../chain/config');
var helper = require('../chain/transaction_helper')
var ops = require('../chain/signed_transaction');
var type = require('../chain/serializer_operation_types')
var api = require('./ApiInstances').instance();
var key = require('../common/key_utils');
var v = require('common/validation')

import WalletUnlockActions from "../actions/WalletUnlockActions"
import WalletDb from "stores/WalletDb"
import lookup from "chain/lookup"

class ApplicationApi {
    
    create_account_with_brain_key(
        owner_pubkey,
        active_pubkey,
        new_account_name,
        registrar_id,
        referrer_id,
        referrer_percent,
        broadcast = false
    ) {
        var tr = new ops.signed_transaction();
        v.required(registrar_id, "registrar_id")
        v.required(referrer_id, "referrer_id")
        var _registrar = lookup.account_id(registrar_id)
        var _referrer = lookup.account_id(referrer_id)
        return lookup.resolve().then(()=> {
            tr.add_type_operation("account_create", {
                fee: {
                    amount: 0,
                    asset_id: 0
                },
                "registrar": _registrar.resolve,
                "referrer": _referrer.resolve,
                "referrer_percent": referrer_percent,
                "name": new_account_name,
                "owner": {
                    "weight_threshold": 1,
                    "account_auths": [],
                    "key_auths": [[ owner_pubkey, 1 ]],
                    "address_auths": []
                },
                "active": {
                    "weight_threshold": 1,
                    "account_auths": [ ],
                    "key_auths": [[ active_pubkey, 1 ]],
                    "address_auths": []
                },
                "options": {
                    "memo_key": active_pubkey,
                    "voting_account": "1.2.0",
                    "num_witness": 0,
                    "num_committee": 0,
                    "votes": [ ]
                }
            })
            return WalletDb.process_transaction(
                tr,
                null, //signer_private_keys,
                broadcast
            )
        })
    }
    
    /**
        Note, an empty or null memo will still be encypted if  encrypt_memo
        is true.
    */
    transfer(
        from_account_id,
        to_account_id,
        amount, 
        asset, 
        memo_message,
        broadcast = true,
        encrypt_memo = true,
        optional_nonce = null,
        sign = true
    ) {
        var memo_from_public, memo_to_public
        if(encrypt_memo || memo_message) {
            memo_from_public = lookup.memo_public_key(from_account_id)
            memo_to_public = lookup.memo_public_key(to_account_id)
        }
        var asset_id_lookup = lookup.asset_id(asset)
        var lookup_promise = lookup.resolve()
        var unlock_promise = WalletUnlockActions.unlock()
        return Promise.all([lookup_promise, unlock_promise]).then(()=> {
            var asset_id = asset_id_lookup.resolve
            
            var memo_from_privkey
            if(encrypt_memo) {
                var from_public = memo_from_public.resolve
                memo_from_privkey =
                    WalletDb.getPrivateKey(from_public)
                
                if(! memo_from_privkey)
                    throw new Error("Missing private memo key for sender: " +
                        from_account_id)
            }
            var memo
            if(memo_message) {
                var nonce = optional_nonce == null ?
                    helper.unique_nonce_uint64() :
                    optional_nonce
                
                memo = {
                    from: memo_from_public.resolve,
                    to: memo_to_public.resolve,
                    nonce,
                    message: encrypt_memo ?
                        Aes.encrypt_with_checksum(
                            memo_from_privkey,
                            memo_to_public.resolve,
                            nonce,
                            memo_message
                        ) :
                        memo_message
                }
            }
            var tr = new ops.signed_transaction()
            tr.add_type_operation("transfer", {
                fee: {
                    amount: 0,
                    asset_id
                },
                from: lookup.account_id(from_account_id),
                to: lookup.account_id(to_account_id),
                amount: { amount, asset_id}, //lookup.asset_id(
                memo
            })
            return WalletDb.process_transaction(
                tr,
                null, //signer_private_keys,
                broadcast,
                sign
            )
        })
    }

}
module.exports = ApplicationApi;
