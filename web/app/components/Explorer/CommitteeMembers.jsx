import React from "react";
import Immutable from "immutable";
import CommitteeMembersActions from "actions/CommitteeMembersActions";
import AccountImage from "../Account/AccountImage";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import ChainStore from "api/ChainStore";
import FormattedAsset from "../Utility/FormattedAsset";
import Translate from "react-translate-component";

@BindToChainState({keep_updating: true})
class CommitteeMemberCard extends React.Component {

    static propTypes = {
        committee_member: ChainTypes.ChainAccount.isRequired
    }

    static contextTypes = {
        router: React.PropTypes.func.isRequired
    };

    _onCardClick(e) {
        e.preventDefault();
        this.context.router.transitionTo("account", {account_name: this.props.committee_member.get("name")});
    }

    render() {
        let committee_member_data = ChainStore.getCommitteeMemberById( this.props.committee_member.get("id") )

        if (!committee_member_data) {
            return null;
        }

        return (
            <div className="grid-content account-card" onClick={this._onCardClick.bind(this)}>
                <div className="card">
                    <h4 className="text-center">{this.props.committee_member.get("name")}</h4>
                    <div className="card-content clearfix">
                        <div className="float-left">
                            <AccountImage account={this.props.committee_member.get("name")} size={{height: 64, width: 64}}/>
                        </div>
                        <ul className="balances">
                            <li><Translate content="account.votes.votes" />: <FormattedAsset decimalOffset={5} amount={committee_member_data.get("total_votes")} asset={"1.3.0"}/></li>
                        </ul>                        
                    </div>
                </div>
            </div>
        );
    }
}

class CommitteeMemberList extends React.Component {

    shouldComponentUpdate(nextProps) {
        return (
                !Immutable.is(nextProps.committee_members, this.props.committee_members) ||
                !Immutable.is(nextProps.committee_member_id_to_name, this.props.committee_member_id_to_name) ||
                nextProps.filter !== this.props.filter
            );
    }

    render() {

        let {committee_member_id_to_name, committee_members} = this.props;
        let itemRows = null;
        if (committee_members.size > 0) {
            itemRows = committee_members
                .filter(a => {
                    if (committee_member_id_to_name.get(a.id)) {
                        return committee_member_id_to_name.get(a.id).indexOf(this.props.filter) !== -1;
                    }
                    return true;
                })
                .sort((a, b) => {
                    if (committee_member_id_to_name.get(a.id) > committee_member_id_to_name.get(b.id)) {
                        return 1;
                    } else if (committee_member_id_to_name.get(a.id) < committee_member_id_to_name.get(b.id)) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
                .map((a) => {
                    return (
                        <CommitteeMemberCard key={a.id} committee_member={committee_member_id_to_name.get(a.id)} />
                    );
                }).toArray();
        } 

        return (
            <div className="grid-block small-up-1 medium-up-2 large-up-3">
                {itemRows}
            </div>
        );
    }
}

@BindToChainState({keep_updating: true})
class CommitteeMembers extends React.Component {

    static propTypes = {
        globalObject: ChainTypes.ChainObject.isRequired
    }

    static defaultProps = {
        globalObject: "2.0.0"
    }

    constructor(props) {
        super(props);
        this.state = {
            filterCommitteeMember: ""
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.committee_members, this.props.committee_members) ||
            !Immutable.is(nextProps.committee_member_id_to_name, this.props.committee_member_id_to_name) ||
            !Immutable.is(nextProps.globalObject, this.props.globalObject) ||
            nextState.filterCommitteeMember !== this.state.filterCommitteeMember
        );
    }

    _fetchCommitteeMembers(committeeMembersIds, committee_members, committee_member_id_to_name) {
        if (!Array.isArray(committeeMembersIds)) {
            committeeMembersIds = [committeeMembersIds];
        }

        let missing = [];
        let missingAccounts = [];
        committeeMembersIds.forEach(id => {
            // Check for missing witness data
            if (!committee_members.get(id)) {
                missing.push(id);
            // Check for missing witness account data
            } else if (!committee_member_id_to_name.get(id)) {
                missingAccounts.push(committee_members.get(id).committee_member_account);
            }
        });

        if (missing.length > 0) {
            CommitteeMembersActions.getCommitteeMembers(missing);
        } 

        if (missingAccounts.length > 0) {
            CommitteeMembersActions.getCommitteeMemberAccounts(missingAccounts);
        }
    }

    _onFilter(e) {
        e.preventDefault();
        this.setState({filterCommitteeMember: e.target.value});
    }

    render() {
        let {committee_member_id_to_name, committee_members, globalObject} = this.props;
        globalObject = globalObject.toJS();

        let activeCommitteeMembers = [];
        for (let key in globalObject.active_committee_members) {
            if (globalObject.active_committee_members.hasOwnProperty(key)) {
                activeCommitteeMembers.push(globalObject.active_committee_members[key]);
            }
        }

        this._fetchCommitteeMembers(activeCommitteeMembers, committee_members, committee_member_id_to_name);
       
        return (
            <div className="grid-block">
                <div className="grid-block page-layout">
                    <div className="grid-block small-5 medium-3">
                        <div className="grid-content">
                            <h5><Translate content="explorer.committee_members.active" />: {Object.keys(globalObject.active_committee_members).length}</h5>
                            <br/>
                        </div>
                    </div>
                    <div className="grid-block">
                        <div className="grid-content">
                            <div className="grid-block small-12 medium-6">
                                <Translate component="h3" content="markets.filter" />
                                <input type="text" value={this.state.filterCommitteeMember} onChange={this._onFilter.bind(this)} />
                            </div>
                            <CommitteeMemberList committee_members={committee_members} committee_member_id_to_name={committee_member_id_to_name} filter={this.state.filterCommitteeMember}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default CommitteeMembers;
