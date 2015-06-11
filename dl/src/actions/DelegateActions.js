var alt = require("../alt-instance");
import Apis from "rpc_api/ApiInstances";

let delegate_in_prog = false;
let account_in_prog = false;

class DelegateActions {
    getDelegates(ids) {
        if (!delegate_in_prog) {
            delegate_in_prog = true;
            if (!Array.isArray(ids)) {
                ids = [ids];
            }
            Apis.instance().db_api().exec("get_objects", [ids])
                .then((result) => {
                    delegate_in_prog = false;
                    this.dispatch(result);
                }).catch((error) => {
                    delegate_in_prog = false;
                    console.log("Error in DelegateActions.getDelegates: ", error);
                });
        }
    }

    getDelegateAccounts(ids) {
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
                    console.log("Error in DelegateActions.getDelegateAccounts: ", error);
                });
        }
    }
}

module.exports = alt.createActions(DelegateActions);
