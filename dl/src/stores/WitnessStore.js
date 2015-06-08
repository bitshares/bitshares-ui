var Immutable = require("immutable");
var alt = require("../alt-instance");
var WitnessActions = require("../actions/WitnessActions");
import {
    Account, Witness
}
from "./tcomb_structs";

class WitnessStore {

    constructor() {
        this.witnesses = Immutable.Map();
        this.witnessAccounts = Immutable.Map();
        this.witness_id_to_name = Immutable.Map();
        this.account_id_to_witness_id = {};

        this.bindListeners({
            onGetWitnesses: WitnessActions.getWitnesses,
            onGetWitnessAccounts: WitnessActions.getWitnessAccounts
        });
    }

    onGetWitnesses(witnesses) {
        witnesses.forEach(witness => {
            this.account_id_to_witness_id[witness.witness_account] = witness.id;
            this.witnesses = this.witnesses.set(
                witness.id,
                Witness(witness)
            );
        });
    }

    onGetWitnessAccounts(accounts) {
        accounts.forEach(account => {
            this.witness_id_to_name = this.witness_id_to_name.set(
                this.account_id_to_witness_id[account.id],
                account.name
            );

            account.balances = [];
            this.witnessAccounts = this.witnessAccounts.set(
                account.id,
                Account(account)
            );
        });
    }

}

module.exports = alt.createStore(WitnessStore, "WitnessStore");
