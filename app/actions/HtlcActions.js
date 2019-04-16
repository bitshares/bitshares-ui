import alt from "alt-instance";
import {Apis} from "bitsharesjs-ws";
import utils from "common/utils";
import WalletApi from "api/WalletApi";
import WalletDb from "stores/WalletDb";
import {ChainStore, hash} from "bitsharesjs";
import big from "bignumber.js";
import {gatewayPrefixes} from "common/gateways";
let inProgress = {};

class HtlcActions {
    create({
        from_account_id,
        to_account_id,
        asset_id,
        amount,
        lock_time,
        preimage,
        cipher
    }) {
        let tr = WalletApi.new_transaction();

        let preimage_hash_cipher = -1;
        var preimage_hash_calculated = "";

        switch (cipher) {
            case "sha256":
                preimage_hash_cipher = 2;
                preimage_hash_calculated = hash.sha256(preimage);

                break;
            case "ripemd160":
                preimage_hash_cipher = 0;
                preimage_hash_calculated = hash.ripemd160(preimage);

                break;
            case "sha1":
                preimage_hash_cipher = 1;
                preimage_hash_calculated = hash.sha1(preimage);

                break;
            default:
                throw new Error(
                    "Wrong cipher name provided when creating htlc op"
                );
        }

        tr.add_type_operation("htlc_create", {
            from: from_account_id,
            to: to_account_id,
            fee: {
                amount: 0,
                asset_id: "1.3.0"
            },
            amount: {
                amount: amount,
                asset_id: asset_id
            },
            preimage_hash: [preimage_hash_cipher, preimage_hash_calculated],
            preimage_size: preimage.length,
            claim_period_seconds: lock_time
        });

        return dispatch => {
            return WalletDb.process_transaction(tr, null, true)
                .then(() => {
                    dispatch(true);
                })
                .catch(error => {
                    console.log(
                        "[HtlcActions.js:69] ----- htlc create error ----->",
                        error
                    );
                    dispatch(false);
                });
        };
    }

    redeem({htlc_id, user_id, preimage}) {
        let tr = WalletApi.new_transaction();

        tr.add_type_operation("htlc_redeem", {
            preimage: preimage,
            fee: {
                amount: 0,
                asset_id: "1.3.0"
            },
            htlc_id: htlc_id,
            redeemer: user_id
        });

        return dispatch => {
            return WalletDb.process_transaction(tr, null, true)
                .then(() => {
                    dispatch(true);
                })
                .catch(error => {
                    console.log(
                        "[HtlcActions.js:98] ----- htlc redeem error ----->",
                        error
                    );
                    dispatch(false);
                });
        };
    }

    extend({htlc_id, user_id, seconds_to_add}) {
        let tr = WalletApi.new_transaction();

        tr.add_type_operation("htlc_extend", {
            fee: {
                amount: 0,
                asset_id: "1.3.0"
            },
            htlc_id: htlc_id,
            update_issuer: user_id,
            seconds_to_add: seconds_to_add
        });

        return dispatch => {
            return WalletDb.process_transaction(tr, null, true)
                .then(() => {
                    dispatch(true);
                })
                .catch(error => {
                    console.log(
                        "[HtlcActions.js:127] ----- htlc extend error ----->",
                        error
                    );
                    dispatch(false);
                });
        };
    }
}

export default alt.createActions(HtlcActions);
