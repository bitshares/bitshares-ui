import alt from "../alt-instance";
import utils from "../common/utils";
import api from "../api/accountApi";

import WalletApi from "../rpc_api/WalletApi";
import WalletDb from "../stores/WalletDb";
import WalletActions from "../actions/WalletActions";

let accountSubs = {};
let accountLookup = {};
let accountSearch = {};
let wallet_api = new WalletApi();
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
            return api.lookupAccounts(start_symbol, limit)
                .then(result => {
                    accountSearch[uid] = false;
                    this.dispatch(result);
                });
        }
    }

    /**
     *  TODO:  The concept of current accounts is deprecated and needs to be removed
     */
    setCurrentAccount(name) {
        this.dispatch(name);
    }

    /**
     *  TODO:  This is a function of teh wallet_api and has no business being part of AccountActions
     */
    transfer(from_account_name_or_id, to_account_name_or_id, amount, asset_name_or_id, memo) {
        //console.log("[AccountActions.js:68] ----- transfer ----->", from_account_name_or_id, to_account_name_or_id, amount, asset_name_or_id, memo);
        var from_account_id = from_account_name_or_id;
        var to_account_id = to_account_name_or_id;
        var asset_id = asset_name_or_id;

        try {
            return  wallet_api.transfer(
                from_account_id, to_account_id,
                amount, asset_id, memo
            ).then(result => {
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
     *  This method exists ont he AccountActions because after creating the account via the wallet, the account needs
     *  to be linked and added to the local database.
     */
    createAccount(
        account_name,
        registrar,
        referrer,
        referrer_percent = 100
    ) {
        return WalletActions.createAccount(
            account_name,
            registrar,
            referrer,
            referrer_percent
        ).then( () => {
            this.dispatch(account_name);
            return account_name;
        });
    }

    /**
     *  TODO:  This is a function of teh wallet_api and has no business being part of AccountActions, the account should already
     *  be linked.  
     */
    upgradeAccount(account_id, lifetime) {
        var tr = wallet_api.new_transaction();
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
}

module.exports = alt.createActions(AccountActions);
