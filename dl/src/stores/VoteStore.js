var BaseStore = require("./BaseStore");
var Immutable = require("immutable");
var alt = require("../alt-instance");
var VoteActions = require("../actions/VoteActions");

class VoteStore extends BaseStore {

    constructor() {
        super();
        this.bindActions(VoteActions);
    }

    onAddDelegate(account_name, delegate) {
        console.log("[VoteStore.js:14] ----- onAddDelegate ----->");
    }

    onAddWitness(account_name, witness) {
        console.log("[VoteStore.js:18] ----- onAddWitness ----->");
    }

    onAddBudgetItem(account_name, budget_item) {
        console.log("[VoteStore.js:22] ----- onAddBudgetItem ----->");
    }

    onSetProxyAccount(account_name) {
        console.log("[VoteStore.js:26] ----- onSetProxyAccount ----->");
    }

    onPublishChanges(account_name) {
        console.log("[VoteStore.js:30] ----- onPublishChanges ----->");
    }

    onCancelChanges(account_name) {
        console.log("[VoteStore.js:34] ----- onCancelChanges ----->");
    }

}

module.exports = alt.createStore(VoteStore, "VoteStore");
