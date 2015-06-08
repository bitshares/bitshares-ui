var alt = require("../alt-instance");
import Apis from "rpc_api/ApiInstances";

let witness_in_prog = false;
let account_in_prog = false;

class WitnessActions {
    getWitnesses(ids) {
        if (!witness_in_prog) {
            witness_in_prog = true;
            if (!Array.isArray(ids)) {
                ids = [ids];
            }
            Apis.instance().db_api().exec("get_objects", [ids])
                .then((result) => {
                    witness_in_prog = false;
                    this.dispatch(result);
                }).catch((error) => {
                    witness_in_prog = false;
                    console.log("Error in WitnessActions.getWitnesses: ", error);
                });
        }
    }

    getWitnessAccounts(ids) {
        if (!account_in_prog) {
            account_in_prog = true;
            if (!Array.isArray(ids)) {
                ids = [ids];
            }
            Apis.instance().db_api().exec("get_objects", [ids])
                .then((result) => {
                    account_in_prog = false;
                    this.dispatch(result);
                }).catch((error) => {
                    account_in_prog = false;
                    console.log("Error in WitnessActions.getWitnessAccounts: ", error);
                });
        }
    }
}

module.exports = alt.createActions(WitnessActions);
