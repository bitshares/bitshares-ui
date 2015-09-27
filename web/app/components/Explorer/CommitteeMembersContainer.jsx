import React from "react";
import CommitteeMembersStore from "stores/CommitteeMembersStore";
import AltContainer from "alt/AltContainer";
import { RouteHandler } from "react-router";

class CommitteeMembersContainer extends React.Component {

    render() {
        return (
              <AltContainer 
                  stores={[CommitteeMembersStore]}
                  inject={{
                    committee_members: () => {
                        return CommitteeMembersStore.getState().committee_members;
                    },
                    committee_member_id_to_name: () => {
                        return CommitteeMembersStore.getState().committee_member_id_to_name;
                    },
                    committee_member_name_to_id: () => {
                        return CommitteeMembersStore.getState().committee_member_name_to_id;
                    },
                    committeeMemberAccounts: () => {
                        return CommitteeMembersStore.getState().committeeMemberAccounts;
                    }
                  }} 
                  >
                <RouteHandler />
              </AltContainer>
        );
    }
}

export default CommitteeMembersContainer;
