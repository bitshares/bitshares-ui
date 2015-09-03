var alt = require("../alt-instance");
import api from "../api/accountApi";
import Apis from "rpc_api/ApiInstances";
import witnessApi from "api/witnessApi";
import utils from "common/utils";

let delegate_in_prog = {};
let account_in_prog = {};

let subs = {};

class DelegateActions {

    getDelegate(id_or_name) {
        let id;
        let idPromise = !utils.is_object_id(id_or_name) ? witnessApi.lookupDelegates(id_or_name, 1) : null;
        if (!delegate_in_prog[id_or_name]) {
            delegate_in_prog[id_or_name] = true;
            Promise.all([
                idPromise
            ]).then(result => { 
                if (result.length === 1) {
                    id = result[0][0][1];
                } else {
                    id = id_or_name;
                }
                witnessApi.getDelegates(id).then(delegate => {
                    api.getObjects(delegate[0].committee_member_account).then(account => {
                        delegate_in_prog[id_or_name] = false;
                        this.dispatch({
                            delegate: delegate[0],
                            account: account[0]
                        })
                    }).catch(err => {
                        delegate_in_prog[id_or_name] = false;
                    })
                }).catch(err => {
                        delegate_in_prog[id_or_name] = false;
                })
            }) 
        }
    }

    getDelegates(ids) {
        let uid = ids.toString();
        if (!delegate_in_prog[uid]) {
            console.log("fetching delegates:", ids);
            delegate_in_prog[uid] = true;
            if (!Array.isArray(ids)) {
                ids = [ids];
            }
            Apis.instance().db_api().exec("get_objects", [ids])
                .then((result) => {
                    delegate_in_prog[uid] = false;
                    this.dispatch(result);
                }).catch((error) => {
                    delegate_in_prog[uid] = false;
                    console.log("Error in DelegateActions.getDelegates: ", error);
                });
        }
    }

    getDelegateAccounts(ids) {
        let uid = ids.toString();
        if (!account_in_prog[uid]) {
            console.log("fetching delegate accounts:", ids);
            account_in_prog[uid] = true;
            if (!Array.isArray(ids)) {
                ids = [ids];
            }
            Apis.instance().db_api().exec("get_objects", [ids])
                .then((result) => {
                    account_in_prog[uid] = false;
                    this.dispatch(result);
                }).catch((error) => {
                    account_in_prog[uid] = false;
                    console.log("Error in DelegateActions.getDelegateAccounts: ", error);
                });
        }
    }

    subscribe(id, statObject) {

        let subscription = (result) => {
            console.log("delegate sub result:", result);
        };

        if (!subs[id]) {
            subs[id] = statObject;
            api.subscribeAccount(subscription, statObject)
                .then(subResult => {
                    if (subResult) {
                        console.log("subscribed to delegate", id, ":", subResult);
                    }
                })
                .catch(error => {
                    console.log("delegate sub error:", error);
                    delete subs[id];
                });
        }
    }

    unSubscribe(id) {
        api.unSubscribeAccount(subs[id]).then(unSubResult => {
            if (unSubResult) {
                console.log("unSubscribe from delegate:", id);
                delete subs[id];
            }
        });
    }
}

module.exports = alt.createActions(DelegateActions);
