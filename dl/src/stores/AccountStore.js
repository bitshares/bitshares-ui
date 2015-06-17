import BaseStore from "./BaseStore";
import Immutable from "immutable";
import alt from "../alt-instance";
import AccountActions from "../actions/AccountActions";
import {Account} from "./tcomb_structs";

function json_to_account(json) {
    return Account({
        id: json.id,
        name: json.name,
        balances: []
    });
}

class AccountStore extends BaseStore {
    constructor() {
        super();
        this.currentAccount = null;
        this.browseAccounts = Immutable.Map();
        this.accounts = Immutable.Map();
        this.balances = Immutable.Map();
        this.accountHistories = Immutable.Map();
        this.account_name_to_id = {};
        this.account_id_to_name = {};
        this.bindListeners({
            onGetAllAccounts: AccountActions.getAllAccounts,
            onGetAccount: AccountActions.getAccount,
            onSetCurrentAccount: AccountActions.setCurrentAccount,
            onTransfer: AccountActions.transfer,
            onCreateAccount: AccountActions.createAccount,
            onUpgradeAccount: AccountActions.upgradeAccount
        });

        // this._export("getAccount", "getCurrent");
    }

    onGetAllAccounts(accounts) {
        accounts.forEach((account, index) => {
            this.account_id_to_name[account[1]] = account[0];
            this.account_name_to_id[account[0]] = account[1];
            if (index === 0) {
                this.currentAccount = {
                    name: account[0],
                    id: account[1]
                };
            }
        });
    }

    onGetAccount(result) {
        console.log("[AccountStore.js:51] ----- onGetAccount ----->", result);
        if (result.sub) {
            this.accountHistories = this.accountHistories.set(
                result.account,
                result.history
            );

            this.balances = this.balances.set(
                result.account,
                result.balances
            );
        } else {
            let account = result[0][0];

            if (account.id) {
                let balances = result[1].length > 0 ? result[1] : [{
                    amount: 0,
                    asset_id: "1.4.0"
                }];

                this.balances = this.balances.set(
                    account.id,
                    balances
                );

                this.account_name_to_id[account.name] = account.id;

                let newAccount = Account(account);

                this.browseAccounts = this.browseAccounts.set(
                    account.id,
                    newAccount
                );

                this.accounts = this.accounts.set(
                    account.id,
                    newAccount
                );

                this.accountHistories = this.accountHistories.set(
                    account.id,
                    result[2]
                );
            }
        }
    }

    getCurrent() {
        this.getAccount(this.currentAccount.name);
    }

    onSetCurrentAccount(name) {
        // let account_id = json.id;
        // this.accounts = this.accounts.set(account_id, json_to_account(json));
        this.currentAccount = {
            name: name,
            id: this.account_name_to_id[name]
        };
    }

    onTransfer(result) {
        console.log("[AccountStore.js:111] ----- onTransfer ----->", result);
    }

    onCreateAccount(name) {
        console.log("[AccountStore.js:115] ----- onCreateAccount ----->", name);
    }

    onUpgradeAccount(account_id) {
        console.log("[AccountStore.js:119] ----- onUpgradeAccount ----->", account_id);
    }

}

module.exports = alt.createStore(AccountStore, "AccountStore");
