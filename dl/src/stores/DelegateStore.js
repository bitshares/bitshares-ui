var Immutable = require("immutable");
var alt = require("../alt-instance");
var DelegateActions = require("../actions/DelegateActions");
import {
    Account, Delegate
}
from "./tcomb_structs";

class DelegateStore {

    constructor() {
        this.delegates = Immutable.Map();
        this.delegateAccounts = Immutable.Map();
        this.delegate_id_to_name = Immutable.Map();
        this.account_id_to_delegate_id = {};

        this.bindListeners({
            onGetDelegates: DelegateActions.getDelegates,
            onGetDelegateAccounts: DelegateActions.getDelegateAccounts
        });
    }

    onGetDelegates(delegates) {
        delegates.forEach(delegate => {
            this.account_id_to_delegate_id[delegate.delegate_account] = delegate.id;
            this.delegates = this.delegates.set(
                delegate.id,
                Delegate(delegate)
            );
        });
    }

    onGetDelegateAccounts(accounts) {
        accounts.forEach(account => {
            this.delegate_id_to_name = this.delegate_id_to_name.set(
                this.account_id_to_delegate_id[account.id],
                account.name
            );

            account.balances = [];
            this.delegateAccounts = this.delegateAccounts.set(
                account.id,
                Account(account)
            );
        });
    }

}

module.exports = alt.createStore(DelegateStore, "DelegateStore");
