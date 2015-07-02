var alt = require("../alt-instance");
import Apis from "rpc_api/ApiInstances";
import witnessApi from "api/witnessApi";
import accountApi from "api/accountApi";
import utils from "common/utils";

let witness_in_prog = {};
let account_in_prog = {};

class WitnessActions {

    getWitness(id_or_name) {
        let id;
        let idPromise = !utils.is_object_id(id_or_name) ? witnessApi.lookupWitnesses(id_or_name, 1) : null;
        if (!witness_in_prog[id_or_name]) {
            witness_in_prog[id_or_name] = true;
            Promise.all([
                idPromise
            ]).then(result => { 
                if (result.length === 1) {
                    id = result[0][0][1];
                } else {
                    id = id_or_name;
                }

                witnessApi.getWitnesses(id).then(witness => {

                    accountApi.getObjects(witness[0].witness_account).then(account => {
                        witness_in_prog[id_or_name] = false;
                        this.dispatch({
                            witness: witness[0],
                            account: account[0]
                        })
                    }).catch(err => {
                        witness_in_prog[id_or_name] = false;
                    })
                }).catch(err => {
                        witness_in_prog[id_or_name] = false;
                })
            }) 
        }
    }
    

    getWitnesses(ids) {
        let uid = ids.toString();
        if (!witness_in_prog[uid]) {
            witness_in_prog[uid] = true;

            accountApi.getObjects(ids)
                .then((result) => {
                    witness_in_prog[uid] = false;
                    this.dispatch(result);
                }).catch((error) => {
                    witness_in_prog[uid] = false;
                    console.log("Error in WitnessActions.getWitnesses: ", error);
                });
        }
    }

    getWitnessAccounts(ids) {
        let uid = ids.toString();
        if (!account_in_prog[uid]) {
            account_in_prog[uid] = true;
            
            accountApi.getObjects(ids)
                .then((result) => {
                    account_in_prog[uid] = false;
                    this.dispatch(result);
                }).catch((error) => {
                    account_in_prog[uid] = false;
                    console.log("Error in WitnessActions.getWitnessAccounts: ", error);
                });
        }
    }
}

module.exports = alt.createActions(WitnessActions);
