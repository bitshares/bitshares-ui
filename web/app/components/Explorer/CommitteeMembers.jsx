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

@BindToChainState({keep_updating: true})
class CommitteeMemberList extends React.Component {
    static propTypes = {
        committee_members: ChainTypes.ChainObjectsList.isRequired
    }

    render() {
        let {committee_members} = this.props;
        let itemRows = null;

        if (committee_members.length > 0 && committee_members[1]) {
            itemRows = committee_members
                .filter(a => {
                    if (!a) {return false; }
                    let account = ChainStore.getObject(a.get("committee_member_account"));
                    if (!account) { return false; }
                    
                    return account.get("name").indexOf(this.props.filter) !== -1;
                    
                })
                .sort((a, b) => {
                    let a_account = ChainStore.getObject(a.get("committee_member_account"));
                    let b_account = ChainStore.getObject(b.get("committee_member_account"));
                    if (!a_account || !b_account) {
                        return 0;
                    }
                    if (a_account.get("name") > b_account.get("name")) {
                        return 1;
                    } else if (a_account.get("name") < b_account.get("name")) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
                .map((a) => {
                    return (
                        <CommitteeMemberCard key={a.get("id")} committee_member={a.get("committee_member_account")} />
                    );
                });
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
            !Immutable.is(nextProps.globalObject, this.props.globalObject) ||
            nextState.filterCommitteeMember !== this.state.filterCommitteeMember
        );
    }

    _onFilter(e) {
        e.preventDefault();
        this.setState({filterCommitteeMember: e.target.value});
    }

    render() {
        let {globalObject} = this.props;
        globalObject = globalObject.toJS();

        let activeCommitteeMembers = [];
        for (let key in globalObject.active_committee_members) {
            if (globalObject.active_committee_members.hasOwnProperty(key)) {
                activeCommitteeMembers.push(globalObject.active_committee_members[key]);
            }
        }
      
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
                            <CommitteeMemberList
                                committee_members={Immutable.List(globalObject.active_committee_members)}
                                filter={this.state.filterCommitteeMember}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default CommitteeMembers;
