import alt from "alt-instance";
import {Apis} from "tuscjs-ws";
import utils from "common/utils";
import WalletApi from "api/WalletApi";
import WalletDb from "stores/WalletDb";
import {ChainStore, hash, FetchChainObjects} from "tuscjs";
import big from "bignumber.js";
import {gatewayPrefixes} from "common/gateways";
let inProgress = {};

const calculateHash = (cipher, preimage) => {
    let preimage_hash_calculated = null;
    switch (cipher) {
        case "sha256":
            preimage_hash_calculated = hash.sha256(preimage);
            break;
        case "ripemd160":
            preimage_hash_calculated = hash.ripemd160(preimage);
            break;
        case "sha1":
            throw new Error(
                "sha1 is not considered a secure hashing algorithm, plaase use sha256"
            );
            break;
        default:
            throw new Error("Wrong cipher name provided when creating htlc op");
    }
    return preimage_hash_calculated;
};
const getCipherInt = cipher => {
    let preimage_hash_cipher = null;
    switch (cipher) {
        case "sha256":
            preimage_hash_cipher = 2;
            break;
        case "ripemd160":
            preimage_hash_cipher = 0;
            break;
        case "sha1":
            throw new Error(
                "sha1 is not considered a secure hashing algorithm, plaase use sha256"
            );
            break;
        default:
            throw new Error("Wrong cipher name provided when creating htlc op");
    }
    return preimage_hash_cipher;
};
class HtlcActions {
    create({
        from_account_id,
        to_account_id,
        asset_id,
        amount,
        lock_time,
        preimage_cipher,
        preimage = null,
        preimage_hash = null,
        preimage_size = null
    }) {
        const tr = WalletApi.new_transaction();

        let preimage_hash_cipher = getCipherInt(preimage_cipher);
        if (preimage && !preimage_hash) {
            preimage_hash = calculateHash(preimage_cipher, preimage);
        }
        if (!preimage_size) {
            if (preimage) {
                preimage_size = preimage.length;
            } else {
                throw Error("Preimage must be given if size is empty");
            }
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
            preimage_hash: [preimage_hash_cipher, preimage_hash],
            preimage_size: preimage_size,
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
            preimage: new Buffer(preimage).toString("hex"),
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

    calculateHash(preimage, cipher) {
        const preimage_hash_calculated = calculateHash(cipher, preimage);
        const size = preimage_hash_calculated.length;
        let hash = new Buffer(preimage_hash_calculated).toString("hex");
        return {hash, size};
    }

    async getHTLCs(accountId) {
        let htlcs = [];
        for (let i = 1; i < 300; i = i + 10) {
            let ids = [];
            for (let j = i; j < i + 10; j++) {
                ids.push("1.16." + j);
            }
            let map = {};
            let objects = await FetchChainObjects(
                ChainStore.getObject,
                ids,
                undefined,
                map
            );
            objects.forEach(item => {
                if (item) {
                    item = item.toJS();
                    if (
                        item.transfer.to == accountId ||
                        item.transfer.from == accountId
                    ) {
                        htlcs.push(item);
                    }
                }
            });
        }
        return htlcs;
    }
}

export default alt.createActions(HtlcActions);
