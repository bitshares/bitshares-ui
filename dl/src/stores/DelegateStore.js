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
        this.delegate_name_to_id = Immutable.Map();
        this.account_id_to_delegate_id = {};

        this.bindListeners({
            onGetDelegates: DelegateActions.getDelegates,
            onGetDelegateAccounts: DelegateActions.getDelegateAccounts,
            onGetDelegate: DelegateActions.getDelegate
        });
    }

    onGetDelegates(delegates) {
        delegates.forEach(delegate => {
            this.account_id_to_delegate_id[delegate.committee_member_account] = delegate.id;
            this.delegates = this.delegates.set(
                delegate.id,
                Delegate(delegate)
            );
        });
    }

    onGetDelegateAccounts(accounts) {
        accounts.forEach(account => {
            let delegateID = this.account_id_to_delegate_id[account.id];
            this.delegate_id_to_name = this.delegate_id_to_name.set(
                delegateID,
                account.name
            );

            this.delegate_name_to_id = this.delegate_name_to_id.set(
                account.name,
                delegateID
            );

            account.balances = [];
            this.delegateAccounts = this.delegateAccounts.set(
                delegateID,
                Account(account)
            );
        });
    }

    onGetDelegate(payload) {
        this.account_id_to_delegate_id[payload.delegate.committee_member_account] = payload.delegate.id;

        this.delegate_name_to_id = this.delegate_name_to_id.set(
            payload.account.name,
            payload.delegate.id
        );

        this.delegates = this.delegates.set(
                payload.delegate.id,
                Witness(payload.delegate)
        );

        this.delegate_id_to_name = this.delegate_id_to_name.set(
            this.account_id_to_delegate_id[payload.account.id],
            payload.account.name
        );

        payload.account.balances = [];
        
        this.delegateAccounts = this.delegateAccounts.set(
            payload.delegate.id,
            Account(payload.account)
        );
    }

}

module.exports = alt.createStore(DelegateStore, "DelegateStore");
