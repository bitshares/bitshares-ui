import { ops } from "@graphene/serializer"
import { Aes, PrivateKey, PublicKey, key } from "@graphene/ecc"
import { TransactionBuilder, fetchChain, transaction_helper } from "@graphene/chain"
import { ChainStore } from "@graphene/chain";

import assert from "assert"
import WalletUnlockActions from "../actions/WalletUnlockActions"
import WalletDb from "stores/WalletDb"

var Long = require('bytebuffer').Long;

class ApplicationApi {
    
    create_account(
        owner_pubkey,
        active_pubkey,
        new_account_name,
        registrar,
        referrer,
        referrer_percent,
        broadcast = false
    ) {
        
        assert(registrar, "registrar")
        assert(referrer, "referrer")
        
        return Promise.all([
            fetchChain("getAccount", registrar),
            fetchChain("getAccount", referrer),
        ])
        .then( res => {
            let [ chain_registrar, chain_referrer ] = res
            
            assert(chain_registrar, "missing registrar: " + registrar)
            assert(chain_referrer, "missing referrer: " + referrer)
            
            var tr = new TransactionBuilder();
            tr.add_type_operation("account_create", {
                fee: {
                    amount: 0,
                    asset_id: 0
                },
                "registrar": chain_registrar.get("id"),
                "referrer": chain_referrer.get("id"),
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
            return WalletDb.process_transaction( tr, null /*signer_private_keys*/, broadcast )
        })
    }
    
    /**
        @param propose_account (or null) pays the fee to create the proposal, also used as memo from
    */
    transfer({ // OBJECT: { ... }
        from_account,
        to_account,
        amount, 
        asset, 
        memo,
        broadcast = true,
        encrypt_memo = true,
        optional_nonce = null,
        // sign = true,
        propose_account = null,
        fee_asset_id = "1.3.0"
    }) {
        
        var memo_sender = propose_account || from_account
        
        // var unlock_promise = WalletUnlockActions.unlock()
        
        return Promise.all([
            fetchChain("getAccount", from_account),
            fetchChain("getAccount", to_account),
            fetchChain("getAccount", memo_sender),
            fetchChain("getAccount", propose_account),
            fetchChain("getAsset", asset),
            fetchChain("getAsset", fee_asset_id)
        ])
        .then( res => {
            
            let [
                chain_from, chain_to, chain_memo_sender, chain_propose_account,
                chain_asset, chain_fee_asset
            ] = res
            
            assert(chain_from, "missing from_account: " + from_account)
            assert(chain_to, "missing to_account: " + to_account)
            assert(chain_asset, "missing asset: " + chain_asset)
            
            assert( !propose_account || chain_propose_account, "missing propose_account: " + propose_account)
            var propose_acount_id = propose_account ? chain_propose_account.get("id") : null
            
            var memo_from_public, memo_to_public
            if( memo && encrypt_memo  ) {
                
                memo_from_public = chain_memo_sender.getIn(["options","memo_key"])
                
                // The 1s are base58 for all zeros (null)
                if( /111111111111111111111/.test(memo_from_public))
                    memo_from_public = null
                    
                memo_to_public = chain_to.getIn(["options","memo_key"])
                if( /111111111111111111111/.test(memo_to_public))
                    memo_to_public = null
            }
            
            var memo_from_privkey
            if(encrypt_memo && memo ) {
                memo_from_privkey =
                    WalletDb.getPrivateKey(memo_from_public)
                
                if(! memo_from_privkey)
                    throw new Error("Missing private memo key for sender: " + memo_sender)
            }
            
            var memo_object
            if(memo && memo_to_public && memo_from_public) {
                
                var nonce = optional_nonce == null ?
                    transaction_helper.unique_nonce_uint64() :
                    optional_nonce
                
                memo_object = {
                    from: memo_from_public,
                    to: memo_to_public,
                    nonce,
                    message: (encrypt_memo) ?
                        Aes.encrypt_with_checksum(
                            memo_from_privkey,
                            memo_to_public,
                            nonce,
                            memo
                        ) :
                        Buffer.isBuffer(memo) ? memo.toString("utf-8") : memo
                }
            }
            
            // Allow user to choose asset with which to pay fees #356
            let fee_asset = chain_fee_asset.toJS();
            if( fee_asset.options.core_exchange_rate.base.asset_id == "1.3.0" &&
                fee_asset.options.core_exchange_rate.quote.asset_id == "1.3.0" )
               fee_asset_id = "1.3.0";

            var tr = new TransactionBuilder();
            var transfer_op = tr.get_type_operation("transfer", {
                fee: {
                    amount: 0,
                    asset_id: fee_asset_id
                },
                from: chain_from.get("id"),
                to: chain_to.get("id"),
                amount: { amount, asset_id: chain_asset.get("id") },
                memo: memo_object
            })
            
            if( propose_account )
                tr.add_type_operation("proposal_create", {
                    proposed_ops: [{ op: transfer_op }],
                    fee_paying_account: propose_acount_id
                })
            else
                tr.add_operation( transfer_op )
            
            return WalletDb.process_transaction( tr, null /*signer_private_keys*/, broadcast )
            
        })
        
        
    }

}
export default ApplicationApi;
