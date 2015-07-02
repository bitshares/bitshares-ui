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
        this.witness_name_to_id = Immutable.Map();
        this.account_id_to_witness_id = {};

        this.bindListeners({
            onGetWitnesses: WitnessActions.getWitnesses,
            onGetWitnessAccounts: WitnessActions.getWitnessAccounts,
            onGetWitness: WitnessActions.getWitness
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

    onGetWitness(payload) {
        this.account_id_to_witness_id[payload.witness.witness_account] = payload.witness.id;

        this.witness_name_to_id = this.witness_name_to_id.set(
            payload.account.name,
            payload.witness.id
        );

        this.witnesses = this.witnesses.set(
                payload.witness.id,
                Witness(payload.witness)
        );

        this.witness_id_to_name = this.witness_id_to_name.set(
            this.account_id_to_witness_id[payload.account.id],
            payload.account.name
        );

        payload.account.balances = [];
        
        this.witnessAccounts = this.witnessAccounts.set(
            payload.account.id,
            Account(payload.account)
        );
    }

}

module.exports = alt.createStore(WitnessStore, "WitnessStore");
