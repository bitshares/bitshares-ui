var alt = require("../alt-instance");
import api from "../api/accountApi";
import Apis from "rpc_api/ApiInstances";
import witnessApi from "api/witnessApi";
import utils from "common/utils";

let committee_member_in_prog = {};
let account_in_prog = {};

let subs = {};

class CommitteeMembersActions {

    getCommitteeMember(id_or_name) {
        let id;
        let idPromise = !utils.is_object_id(id_or_name) ? witnessApi.lookupCommitteeMembers(id_or_name, 1) : null;
        if (!committee_member_in_prog[id_or_name]) {
            committee_member_in_prog[id_or_name] = true;
            Promise.all([
                idPromise
            ]).then(result => { 
                if (result.length === 1) {
                    id = result[0][0][1];
                } else {
                    id = id_or_name;
                }
                witnessApi.getCommitteeMembers(id).then(committee_member => {
                    api.getObjects(committee_member[0].committee_member_account).then(account => {
                        committee_member_in_prog[id_or_name] = false;
                        this.dispatch({
                            committee_member: committee_member[0],
                            account: account[0]
                        })
                    }).catch(err => {
                        committee_member_in_prog[id_or_name] = false;
                    })
                }).catch(err => {
                        committee_member_in_prog[id_or_name] = false;
                })
            }) 
        }
    }

    getCommitteeMembers(ids) {
        let uid = ids.toString();
        if (!committee_member_in_prog[uid]) {
            console.log("fetching committee members:", ids);
            committee_member_in_prog[uid] = true;
            if (!Array.isArray(ids)) {
                ids = [ids];
            }
            Apis.instance().db_api().exec("get_objects", [ids])
                .then((result) => {
                    console.log("cm results:", result);
                    committee_member_in_prog[uid] = false;
                    this.dispatch(result);
                }).catch((error) => {
                    committee_member_in_prog[uid] = false;
                    console.log("Error in CommitteeMembersActions.getCommitteeMembers: ", error);
                });
        }
    }

    getCommitteeMemberAccounts(ids) {
        let uid = ids.toString();
        if (!account_in_prog[uid]) {
            console.log("fetching committee member accounts:", ids);
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
                    console.log("Error in CommitteeMembersActions.getCommitteeMemberAccounts: ", error);
                });
        }
    }

    subscribe(id, statObject) {

        let subscription = (result) => {
            console.log("committee member sub result:", result);
        };

        if (!subs[id]) {
            subs[id] = statObject;
            api.subscribeAccount(subscription, statObject)
                .then(subResult => {
                    if (subResult) {
                        console.log("subscribed to committee member", id, ":", subResult);
                    }
                })
                .catch(error => {
                    console.log("committee member sub error:", error);
                    delete subs[id];
                });
        }
    }

    unSubscribe(id) {
        api.unSubscribeAccount(subs[id]).then(unSubResult => {
            if (unSubResult) {
                console.log("unSubscribe from committee member:", id);
                delete subs[id];
            }
        });
    }
}

module.exports = alt.createActions(CommitteeMembersActions);
