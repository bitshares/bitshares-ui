import alt from "../alt-instance";
import utils from "../common/utils";
import AccountApi from "../api/accountApi";

import ApplicationApi from "../rpc_api/ApplicationApi";
import WalletDb from "../stores/WalletDb";
import WalletActions from "../actions/WalletActions";
import { TransactionBuilder } from "@graphene/chain"

let accountSubs = {};
let accountLookup = {};
let accountSearch = {};
let application_api = new ApplicationApi()
let inProgress = {};

/**
 *  @brief  Actions that modify linked accounts 
 *
 *  @note this class also includes accountSearch actions which keep track of search result state.  The presumption 
 *  is that there is only ever one active "search result" at a time.  
 */
class AccountActions {

    /**
     *  Account search results are not managed by the ChainStore cache so are
     *  tracked as part of the AccountStore. 
     */
    accountSearch(start_symbol, limit = 50) {
        let uid = `${start_symbol}_${limit}}`;
        if (!accountSearch[uid]) {
            accountSearch[uid] = true;
            return AccountApi.lookupAccounts(start_symbol, limit)
                .then(result => {
                    accountSearch[uid] = false;
                    this.dispatch({accounts: result, searchTerm: start_symbol});
                });
        }
    }

    /**
     *  TODO:  The concept of current accounts is deprecated and needs to be removed
     */
    setCurrentAccount(name) {
        this.dispatch(name);
    }

    transfer(from_account, to_account, amount, asset, memo, propose_account, fee_asset_id = "1.3.0") {
        try {
            return application_api.transfer({
                from_account, to_account, amount, asset, memo, propose_account, fee_asset_id
            }).then(result => {
                // console.log( "transfer result: ", result )
                this.dispatch(result);
            });
        } catch (error) {
            console.log("[AccountActions.js:90] ----- transfer error ----->", error);
            return new Promise((resolve, reject) => {
                reject(error);
            });
        }
    }
    
    /**
     *  This method exists on the AccountActions because after creating the account via the wallet, the account needs
     *  to be linked and added to the local database.
     */
    createAccount(
        account_name,
        registrar,
        referrer,
        referrer_percent,
        refcode
    ) {
        return WalletActions.createAccount(
            account_name,
            registrar,
            referrer,
            referrer_percent,
            refcode
        ).then( () => {
            this.dispatch(account_name);
            return account_name;
        });
    }

    /**
     *  TODO:  This is a function of the wallet_api and has no business being part of AccountActions, the account should already
     *  be linked.  
     */
    upgradeAccount(account_id, lifetime) {
        var tr = new TransactionBuilder();
        tr.add_type_operation("account_upgrade", {
            "fee": {
                amount: 0,
                asset_id: 0
            },
            "account_to_upgrade": account_id,
            "upgrade_to_lifetime_member": lifetime
        });
        return WalletDb.process_transaction(tr, null, true);
    }

    linkAccount(name) {
        this.dispatch(name);
    }

    unlinkAccount(name) {
        this.dispatch(name);
    }

    addPrivateAccount(name) {
        const cwallet = WalletDb.getState().cwallet;
        cwallet.createBlindAccount(name, WalletDb.getBrainKey() + name);
        this.dispatch(name);
    }

    addPrivateContact(label, public_key) {
        const cwallet = WalletDb.getState().cwallet;
        cwallet.setKeyLabel(public_key, label);
        this.dispatch(label);
    }

    removePrivateContact(name) {
        const cwallet = WalletDb.getState().cwallet;
        // TODO: cwallet.deleteKeyLabel(public_key, label);
        this.dispatch(name);
    }
}

export default alt.createActions(AccountActions);
