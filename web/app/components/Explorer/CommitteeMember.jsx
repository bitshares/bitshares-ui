import React from "react";
import CommitteeMembersActions from "actions/CommitteeMembersActions";
import Immutable from "immutable";
import Inspector from "react-json-inspector";
import AccountImage from "../Account/AccountImage";
require("../Blockchain/json-inspector.scss");

class CommitteeMember extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.committee_members, this.props.committee_members) ||
            !Immutable.is(nextProps.committee_member_id_to_name, this.props.committee_member_id_to_name)
            );
    }

    _getCommitteeMember(id) {
        if (id) {
            if (!this.props.committee_members.get(id)) {
                CommitteeMembersActions.getCommitteeMember(id);
            } 
        } else {
            CommitteeMembersActions.getCommitteeMember(this.props.params.name);
        }
    }

    render() {
        let name = this.context.router.getCurrentParams().name;
        let {committee_members, committeeMemberAccounts, committee_member_name_to_id } = this.props;
        let id = committee_member_name_to_id.get(name);
        let committee_member = committee_members.get(id);
        this._getCommitteeMember(id);

        if (!id || !committee_member) {
            return (
                <div className="grid-block vertical">
                </div>
            );    
        }

        return (
            <div className="grid-block vertical">
                <div className="grid-container text-center">
                    <h4>{name}</h4>
                    <AccountImage account={name} />
                    <h5>#{id}</h5>
                </div>
                <div className="grid-block small-vertical medium-horizontal">        
                    <div className="grid-content">
                        <Inspector data={ committee_member } search={false}/>
                    </div>
                    <div className="grid-content">
                        <Inspector data={ committeeMemberAccounts.get(id) } search={false}/>
                    </div>
                </div>
            </div>
        );
    }
}

CommitteeMember.contextTypes = { router: React.PropTypes.func.isRequired };

export default CommitteeMember;
