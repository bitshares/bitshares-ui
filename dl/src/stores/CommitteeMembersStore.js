var Immutable = require("immutable");
var alt = require("../alt-instance");
var CommitteeMembersActions = require("../actions/CommitteeMembersActions");
import {
    Account, CommitteeMember
}
from "./tcomb_structs";

class CommitteeMembersStore {

    constructor() {
        this.committee_members = Immutable.Map();
        this.committeeMemberAccounts = Immutable.Map();
        this.committee_member_id_to_name = Immutable.Map();
        this.committee_member_name_to_id = Immutable.Map();
        this.account_id_to_committee_member_id = {};

        this.bindListeners({
            onGetCommitteeMembers: CommitteeMembersActions.getCommitteeMembers,
            onGetCommitteeMemberAccounts: CommitteeMembersActions.getCommitteeMemberAccounts,
            onGetCommitteeMember: CommitteeMembersActions.getCommitteeMember
        });
    }

    onGetCommitteeMembers(committee_members) {
        committee_members.forEach(committee_member => {
            this.account_id_to_committee_member_id[committee_member.committee_member_account] = committee_member.id;
            committee_member.total_votes = parseInt(committee_member.total_votes, 10);
            this.committee_members = this.committee_members.set(
                committee_member.id,
                CommitteeMember(committee_member)
            );
        });
    }

    onGetCommitteeMemberAccounts(accounts) {
        accounts.forEach(account => {
            let committeeMemberID = this.account_id_to_committee_member_id[account.id];
            this.committee_member_id_to_name = this.committee_member_id_to_name.set(
                committeeMemberID,
                account.name
            );

            this.committee_member_name_to_id = this.committee_member_name_to_id.set(
                account.name,
                committeeMemberID
            );

            account.balances = [];
            this.committeeMemberAccounts = this.committeeMemberAccounts.set(
                committeeMemberID,
                Account(account)
            );
        });
    }

    onGetCommitteeMember(payload) {
        this.account_id_to_committee_member_id[payload.committee_member.committee_member_account] = payload.committee_member.id;

        this.committee_member_name_to_id = this.committee_member_name_to_id.set(
            payload.account.name,
            payload.committee_member.id
        );

        this.committee_members = this.committee_members.set(
                payload.committee_member.id,
                CommitteeMember(payload.committee_member)
        );

        this.committee_member_id_to_name = this.committee_member_id_to_name.set(
            this.account_id_to_committee_member_id[payload.account.id],
            payload.account.name
        );

        payload.account.balances = [];
        
        this.committeeMemberAccounts = this.committeeMemberAccounts.set(
            payload.committee_member.id,
            Account(payload.account)
        );
    }

}

module.exports = alt.createStore(CommitteeMembersStore, "CommitteeMembersStore");
