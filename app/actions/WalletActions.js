import WalletDb from "stores/WalletDb";
import WalletUnlockActions from "actions/WalletUnlockActions";
import CachedPropertyActions from "actions/CachedPropertyActions";
import ApplicationApi from "api/ApplicationApi";
import {TransactionBuilder, FetchChain} from "bitsharesjs";
import {Apis} from "bitsharesjs-ws";
import alt from "alt-instance";
import SettingsStore from "stores/SettingsStore";

class WalletActions {
    /** Restore and make active a new wallet_object. */
    restore(wallet_name = "default", wallet_object) {
        wallet_name = wallet_name.toLowerCase();
        return {wallet_name, wallet_object};
    }

    /** Make an existing wallet active or create a wallet (and make it active).
        If <b>wallet_name</b> does not exist, provide a <b>create_wallet_password</b>.
    */
    setWallet(wallet_name, create_wallet_password, brnkey) {
        WalletUnlockActions.lock();
        if (!wallet_name) wallet_name = "default";
        return dispatch => {
            return new Promise(resolve => {
                dispatch({
                    wallet_name,
                    create_wallet_password,
                    brnkey,
                    resolve
                });
            });
        };
    }

    setBackupDate() {
        CachedPropertyActions.set("backup_recommended", false);
        return true;
    }

    setBrainkeyBackupDate() {
        return true;
    }

    deleteWallet(name) {
        return name;
    }

    createAccountWithPassword(
        account_name,
        password,
        registrar,
        referrer,
        referrer_percent,
        refcode
    ) {
        let {privKey: owner_private} = WalletDb.generateKeyFromPassword(
            account_name,
            "owner",
            password
        );
        let {privKey: active_private} = WalletDb.generateKeyFromPassword(
            account_name,
            "active",
            password
        );
        let {privKey: memo_private} = WalletDb.generateKeyFromPassword(
            account_name,
            "memo",
            password
        );
        console.log("create account:", account_name);
        console.log(
            "new active pubkey",
            active_private.toPublicKey().toPublicKeyString()
        );
        console.log(
            "new owner pubkey",
            owner_private.toPublicKey().toPublicKeyString()
        );
        console.log(
            "new memo pubkey",
            memo_private.toPublicKey().toPublicKeyString()
        );

        return new Promise((resolve, reject) => {
            let create_account = () => {
                return ApplicationApi.create_account(
                    owner_private.toPublicKey().toPublicKeyString(),
                    active_private.toPublicKey().toPublicKeyString(),
                    memo_private.toPublicKey().toPublicKeyString(),
                    account_name,
                    registrar, //registrar_id,
                    referrer, //referrer_id,
                    referrer_percent, //referrer_percent,
                    true //broadcast
                )
                    .then(resolve)
                    .catch(reject);
            };

            if (registrar) {
                // using another user's account as registrar
                return create_account();
            } else {
                // using faucet

                let faucetAddress = SettingsStore.getSetting("faucet_address");
                if (
                    window &&
                    window.location &&
                    window.location.protocol === "https:"
                ) {
                    faucetAddress = faucetAddress.replace(
                        /http:\/\//,
                        "https://"
                    );
                }

                let create_account_promise = fetch(
                    faucetAddress + "/api/v1/accounts",
                    {
                        method: "post",
                        mode: "cors",
                        headers: {
                            Accept: "application/json",
                            "Content-type": "application/json"
                        },
                        body: JSON.stringify({
                            account: {
                                name: account_name,
                                owner_key: owner_private
                                    .toPublicKey()
                                    .toPublicKeyString(),
                                active_key: active_private
                                    .toPublicKey()
                                    .toPublicKeyString(),
                                memo_key: memo_private
                                    .toPublicKey()
                                    .toPublicKeyString(),
                                refcode: refcode,
                                referrer: referrer
                            }
                        })
                    }
                )
                    .then(r =>
                        r.json().then(res => {
                            if (!res || (res && res.error)) {
                                reject(res.error);
                            } else {
                                resolve(res);
                            }
                        })
                    )
                    .catch(reject);

                return create_account_promise
                    .then(result => {
                        if (result && result.error) {
                            reject(result.error);
                        } else {
                            resolve(result);
                        }
                    })
                    .catch(error => {
                        reject(error);
                    });
            }
        });
    }

    createAccount(
        account_name,
        registrar,
        referrer,
        referrer_percent,
        refcode
    ) {
        if (WalletDb.isLocked()) {
            let error = "wallet locked";
            //this.actions.brainKeyAccountCreateError( error )
            return Promise.reject(error);
        }
        let owner_private = WalletDb.generateNextKey();
        let active_private = WalletDb.generateNextKey();
        let memo_private = WalletDb.generateNextKey();

        let updateWallet = () => {
            let transaction = WalletDb.transaction_update_keys();
            let p = WalletDb.saveKeys(
                [owner_private, active_private, memo_private],
                transaction
            );
            return p.catch(() => transaction.abort());
        };

        let create_account = () => {
            return ApplicationApi.create_account(
                owner_private.private_key.toPublicKey().toPublicKeyString(),
                active_private.private_key.toPublicKey().toPublicKeyString(),
                memo_private.private_key.toPublicKey().toPublicKeyString(),
                account_name,
                registrar, //registrar_id,
                referrer, //referrer_id,
                referrer_percent, //referrer_percent,
                true //broadcast
            ).then(() => updateWallet());
        };

        if (registrar) {
            // using another user's account as registrar
            return create_account();
        } else {
            // using faucet

            let faucetAddress = SettingsStore.getSetting("faucet_address");
            if (
                window &&
                window.location &&
                window.location.protocol === "https:"
            ) {
                faucetAddress = faucetAddress.replace(/http:\/\//, "https://");
            }

            let create_account_promise = fetch(
                faucetAddress + "/api/v1/accounts",
                {
                    method: "post",
                    mode: "cors",
                    headers: {
                        Accept: "application/json",
                        "Content-type": "application/json"
                    },
                    body: JSON.stringify({
                        account: {
                            name: account_name,
                            owner_key: owner_private.private_key
                                .toPublicKey()
                                .toPublicKeyString(),
                            active_key: active_private.private_key
                                .toPublicKey()
                                .toPublicKeyString(),
                            memo_key: active_private.private_key
                                .toPublicKey()
                                .toPublicKeyString(),
                            //"memo_key": memo_private.private_key.toPublicKey().toPublicKeyString(),
                            refcode: refcode,
                            referrer: referrer
                        }
                    })
                }
            ).then(r => r.json());

            return create_account_promise
                .then(result => {
                    if (result.error) {
                        throw result.error;
                    }
                    return updateWallet();
                })
                .catch(error => {
                    /*
                * Since the account creation failed, we need to decrement the
                * sequence used to generate private keys from the brainkey. Three
                * keys were generated, so we decrement three times.
                */
                    WalletDb.decrementBrainKeySequence();
                    WalletDb.decrementBrainKeySequence();
                    WalletDb.decrementBrainKeySequence();
                    throw error;
                });
        }
    }

    claimVestingBalance(account, vb, forceAll = false) {
        let tr = new TransactionBuilder();

        let balance;
        let available_percentage;

        if (vb) {
            balance = vb.balance.amount;

            // Vesting is 100% available if:
            // - policy[0] is set to 2
            // - vesting_seconds is 0
            // - foreAll is set to true
            available_percentage =
                vb.policy[0] === 2 ||
                vb.policy[1].vesting_seconds === 0 ||
                forceAll
                    ? 1
                    : 0;

            // Vesting percentage needs to be checked further
            if (!available_percentage && vb.policy && vb.policy[0] !== 2) {
                let start = Math.floor(
                    new Date(vb.policy[1].start_claim + "Z").getTime() / 1000
                );
                let now = Math.floor(new Date().getTime() / 1000);

                if (start > 0) {
                    // Vesting has a specific start date.
                    // Vesting with locked value required to mautre fully before claiming
                    // Full vesting period must pass before it can be claimed.
                    // Calculate days left before a claim is possible
                    // Example asset is BRIDGE.BCO - 1.3.1564

                    let seconds_earned = now - start;
                    let seconds_period = vb.policy[1].vesting_seconds;

                    if (seconds_earned >= seconds_period) {
                        available_percentage = 1;
                    }
                } else {
                    // Vesting has no start time.
                    // Vesting balances has a vesting with maturing value
                    // If period is 0 we expect a 100% claimable balance
                    // otherwise we expect to be allowed to claim the matured percentage.

                    // Core is lazy calculating the vesting balance object, so we
                    // need to account for the time passed since it was last updated
                    let seconds_last_updated = Math.floor(
                        new Date(
                            vb.policy[1].coin_seconds_earned_last_update + "Z"
                        ).getTime() / 1000
                    );
                    let seconds_earned =
                        parseFloat(vb.policy[1].coin_seconds_earned) +
                        balance * (now - seconds_last_updated);
                    let seconds_period = vb.policy[1].vesting_seconds;

                    available_percentage =
                        seconds_earned / (seconds_period * balance);

                    // Make sure we don't go over 1
                    available_percentage =
                        available_percentage > 1 ? 1 : available_percentage;
                }
            }
        }

        tr.add_type_operation("vesting_balance_withdraw", {
            fee: {amount: "0", asset_id: "1.3.0"},
            owner: account,
            vesting_balance: vb.id,
            amount: {
                amount: Math.floor(balance * available_percentage),
                asset_id: vb.balance.asset_id
            }
        });

        return WalletDb.process_transaction(tr, null, true)
            .then(result => {})
            .catch(err => {
                console.log("vesting_balance_withdraw err:", err);
            });
    }

    /** @parm balances is an array of balance objects with two
        additional values: {vested_balance, public_key_string}
    */
    importBalance(account_name_or_id, balances, broadcast) {
        return dispatch => {
            return new Promise((resolve, reject) => {
                let db = Apis.instance().db_api();
                let address_publickey_map = {};

                let account_lookup = FetchChain(
                    "getAccount",
                    account_name_or_id
                );
                let unlock = WalletUnlockActions.unlock();

                let p = Promise.all([unlock, account_lookup])
                    .then(results => {
                        let account = results[1];
                        //DEBUG console.log('... account',account)
                        if (account == void 0)
                            return Promise.reject(
                                "Unknown account " + account_name_or_id
                            );

                        let balance_claims = [];
                        let signer_pubkeys = {};
                        for (let balance of balances) {
                            let {vested_balance, public_key_string} = balance;

                            //DEBUG console.log('... balance',b)
                            let total_claimed;
                            if (vested_balance) {
                                if (vested_balance.amount == 0)
                                    // recently claimed
                                    continue;

                                total_claimed = vested_balance.amount;
                            } else total_claimed = balance.balance.amount;

                            //assert
                            if (
                                vested_balance &&
                                vested_balance.asset_id !=
                                    balance.balance.asset_id
                            )
                                throw new Error(
                                    "Vested balance record and balance record asset_id missmatch",
                                    vested_balance.asset_id,
                                    balance.balance.asset_id
                                );

                            signer_pubkeys[public_key_string] = true;
                            balance_claims.push({
                                fee: {amount: "0", asset_id: "1.3.0"},
                                deposit_to_account: account.get("id"),
                                balance_to_claim: balance.id,
                                balance_owner_key: public_key_string,
                                total_claimed: {
                                    amount: total_claimed,
                                    asset_id: balance.balance.asset_id
                                }
                            });
                        }
                        //  if( ! balance_claims.length) {
                        //      throw new Error("No balances to claim");
                        //  }

                        //DEBUG console.log('... balance_claims',balance_claims)
                        let tr = new TransactionBuilder();

                        for (let balance_claim of balance_claims) {
                            tr.add_type_operation(
                                "balance_claim",
                                balance_claim
                            );
                        }
                        // With a lot of balance claims the signing can take so Long
                        // the transaction will expire.  This will increase the timeout...
                        tr.set_expire_seconds(15 * 60 + balance_claims.length);
                        return WalletDb.process_transaction(
                            tr,
                            Object.keys(signer_pubkeys),
                            broadcast
                        ).then(result => {
                            dispatch(true);
                            return result;
                        });
                    })
                    .catch(() => {});
                resolve(p);
            });
        };
    }
}

export default alt.createActions(WalletActions);
