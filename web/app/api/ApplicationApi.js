import WalletUnlockActions from "actions/WalletUnlockActions";
import WalletDb from "stores/WalletDb";
import {Aes, ChainValidation, TransactionBuilder, TransactionHelper, FetchChain} from "graphenejs-lib";

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

        ChainValidation.required(registrar, "registrar_id");
        ChainValidation.required(referrer, "referrer_id");

        return Promise.all([
            FetchChain("getAccount", registrar),
            FetchChain("getAccount", referrer)
        ]).then((res)=> {
            let [ chain_registrar, chain_referrer ] = res;

            let tr = new TransactionBuilder();
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
                    "voting_account": "1.2.5",
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
        propose_account = null,
        fee_asset_id = "1.3.0"
    }) {
        let memo_sender = propose_account || from_account;

        let unlock_promise = WalletUnlockActions.unlock();

        return Promise.all([
            FetchChain("getAccount", from_account),
            FetchChain("getAccount", to_account),
            FetchChain("getAccount", memo_sender),
            FetchChain("getAccount", propose_account),
            FetchChain("getAsset", asset),
            FetchChain("getAsset", fee_asset_id),
            unlock_promise
        ]).then((res)=> {

            let [
                chain_from, chain_to, chain_memo_sender, chain_propose_account,
                chain_asset, chain_fee_asset
            ] = res;

            let memo_from_public, memo_to_public;
            if( memo && encrypt_memo  ) {

                memo_from_public = chain_memo_sender.getIn(["options","memo_key"]);

                // The 1s are base58 for all zeros (null)
                if( /111111111111111111111/.test(memo_from_public)) {
                    memo_from_public = null;
                }

                memo_to_public = chain_to.getIn(["options","memo_key"])
                if( /111111111111111111111/.test(memo_to_public)) {
                    memo_to_public = null
                }
            }

            let propose_acount_id = propose_account ? chain_propose_account.get("id") : null

            let memo_from_privkey;
            if(encrypt_memo && memo ) {
                memo_from_privkey = WalletDb.getPrivateKey(memo_from_public);

                if(! memo_from_privkey) {
                    throw new Error("Missing private memo key for sender: " + memo_sender)
                }
            }

            let memo_object;
            if(memo && memo_to_public && memo_from_public) {
                let nonce = optional_nonce == null ?
                            TransactionHelper.unique_nonce_uint64() :
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

            // Default to CORE in case of faulty core_exchange_rate
            if( fee_asset.options.core_exchange_rate.base.asset_id === "1.3.0" &&
                fee_asset.options.core_exchange_rate.quote.asset_id === "1.3.0" ) {
               fee_asset_id = "1.3.0";
            }

            let tr = new TransactionBuilder()
            let transfer_op = tr.get_type_operation("transfer", {
                fee: {
                    amount: 0,
                    asset_id: fee_asset_id
                },
                from: chain_from.get("id"),
                to: chain_to.get("id"),
                amount: { amount, asset_id: chain_asset.get("id") },
                memo: memo_object
            });

            if( propose_account ) {
                tr.add_type_operation("proposal_create", {
                    proposed_ops: [{ op: transfer_op }],
                    fee_paying_account: propose_acount_id
                });
            } else {
                tr.add_operation( transfer_op )
            }

            return WalletDb.process_transaction(
                tr,
                null, //signer_private_keys,
                broadcast
            )
        })
    }

    issue_asset(
        to_account,
        from_account,
        asset_id,
        amount,
        memo,
        encrypt_memo = true,
        optional_nonce = null
        ) {

        let unlock_promise = WalletUnlockActions.unlock();

        return Promise.all([
            FetchChain("getAccount", from_account),
            FetchChain("getAccount", to_account),
            unlock_promise
        ]).then((res)=> {
            let [chain_memo_sender, chain_to] = res;

            let memo_from_public, memo_to_public;
            if( memo && encrypt_memo  ) {

                memo_from_public = chain_memo_sender.getIn(["options","memo_key"]);

                // The 1s are base58 for all zeros (null)
                if( /111111111111111111111/.test(memo_from_public)) {
                    memo_from_public = null;
                }

                memo_to_public = chain_to.getIn(["options","memo_key"])
                if( /111111111111111111111/.test(memo_to_public)) {
                    memo_to_public = null
                }
            }

            let memo_from_privkey;
            if(encrypt_memo && memo ) {
                memo_from_privkey = WalletDb.getPrivateKey(memo_from_public);

                if(! memo_from_privkey) {
                    throw new Error("Missing private memo key for sender: " + from_account)
                }
            }

            let memo_object;
            if(memo && memo_to_public && memo_from_public) {
                let nonce = optional_nonce == null ?
                    TransactionHelper.unique_nonce_uint64() :
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

            let tr = new TransactionBuilder();
            tr.add_type_operation("asset_issue", {
                fee: {
                    amount: 0,
                    asset_id: 0
                },
                issuer: from_account,
                asset_to_issue: {
                    amount: amount,
                    asset_id: asset_id
                },
                issue_to_account: to_account,
                memo: memo_object
            });

            return WalletDb.process_transaction(tr, null, true)
        })
    }
}

export default ApplicationApi;
