var alt = require("../alt-instance");

class VoteActions {

    addDelegate(account_name, delegate) {
        this.dispatch(account_name, delegate);
    }

    addWitness(account_name, witness) {
        this.dispatch(account_name, witness);
    }

    addBudgetItem(account_name, budget_item) {
        this.dispatch(account_name, budget_item);
    }

    setProxyAccount(account_name) {
        this.dispatch(account_name);
    }

    publishChanges(account_name) {
        this.dispatch(account_name);
    }

    cancelChanges(account_name) {
        this.dispatch(account_name);
    }

}

module.exports = alt.createActions(VoteActions);
