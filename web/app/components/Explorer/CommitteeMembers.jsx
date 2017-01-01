import React from "react";
import Immutable from "immutable";
import AccountImage from "../Account/AccountImage";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import {ChainStore} from "graphenejs-lib";
import FormattedAsset from "../Utility/FormattedAsset";
import Translate from "react-translate-component";
import { connect } from "alt-react";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";

class CommitteeMemberCard extends React.Component {

    static propTypes = {
        committee_member: ChainTypes.ChainAccount.isRequired
    };

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    }

    _onCardClick(e) {
        e.preventDefault();
        this.context.router.push(`/account/${this.props.committee_member.get("name")}`);
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
CommitteeMemberCard = BindToChainState(CommitteeMemberCard, {keep_updating: true});

class CommitteeMemberRow extends React.Component {

    static propTypes = {
        committee_member: ChainTypes.ChainAccount.isRequired
    };

    static contextTypes = {
        router: React.PropTypes.object.isRequired
    }

    _onRowClick(e) {
        e.preventDefault();
        this.context.router.push(`/account/${this.props.committee_member.get("name")}`);
    }

    render() {
        let {committee_member, rank} = this.props;
        let committee_member_data = ChainStore.getCommitteeMemberById( committee_member.get("id") )
        if ( !committee_member_data ) return null;
        let total_votes = committee_member_data.get( "total_votes" );

        let url = committee_member_data.get("url");

        url = url && url.length > 0 && url.indexOf("http") === -1 ? "http://" + url : url;

        return (
            <tr>
                <td onClick={this._onRowClick.bind(this)}>{rank}</td>
                <td onClick={this._onRowClick.bind(this)}>{committee_member.get("name")}</td>
                <td onClick={this._onRowClick.bind(this)}><FormattedAsset amount={committee_member_data.get('total_votes')} asset="1.3.0" /></td>
                <td><a href={url} target="_blank">{committee_member_data.get("url")}</a></td>
            </tr>
        )
    }
}
CommitteeMemberRow = BindToChainState(CommitteeMemberRow, {keep_updating: true});

class CommitteeMemberList extends React.Component {
    static propTypes = {
        committee_members: ChainTypes.ChainObjectsList.isRequired
    }

    constructor () {
        super();
        this.state = {
          sortBy: 'rank',
          inverseSort: true
        };
    }

    _setSort(field) {
        this.setState({
            sortBy: field,
            inverseSort: field === this.state.sortBy ? !this.state.inverseSort : this.state.inverseSort
        });
    }

    render() {
        let {committee_members, cardView, membersList} = this.props;
        let {sortBy, inverseSort} = this.state;

        let itemRows = null;

        let ranks = {};

        committee_members
        .filter(a => {
            if (!a) {
                return false;
            }
            return membersList.indexOf(a.get("id")) !== -1;
        })
        .sort((a, b) => {
            if (a && b) {
                return parseInt(b.get("total_votes"), 10) - parseInt(a.get("total_votes"), 10);
            }
        })
        .forEach( (c, index) => {
            if (c) {
                ranks[c.get("id")] = index + 1;
            }
        });

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

                    switch (sortBy) {
                        case 'name':
                            if (a_account.get("name") > b_account.get("name")) {
                                return inverseSort ? 1 : -1;
                            } else if (a_account.get("name") < b_account.get("name")) {
                                return inverseSort ? -1 : 1;
                            } else {
                                return 0;
                            }
                            break;

                        case "rank":
                            return !inverseSort ? ranks[b.get("id")] - ranks[a.get("id")] : ranks[a.get("id")] - ranks[b.get("id")];
                            break;

                        default:
                            return !inverseSort ? parseInt(b.get(sortBy), 10) - parseInt(a.get(sortBy), 10) : parseInt(a.get(sortBy), 10) - parseInt(b.get(sortBy), 10);
                    }
                })
                .map((a) => {
                    if (!cardView) {
                        return (
                            <CommitteeMemberRow key={a.get("id")} rank={ranks[a.get("id")]} committee_member={a.get("committee_member_account")} />
                        );
                    } else {
                        return (
                            <CommitteeMemberCard key={a.get("id")} rank={ranks[a.get("id")]} committee_member={a.get("committee_member_account")} />
                        );
                    }
                });
        }

        // table view
        if (!cardView) {
            return (
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th className="clickable" onClick={this._setSort.bind(this, 'rank')}><Translate content="explorer.witnesses.rank" /></th>
                            <th className="clickable" onClick={this._setSort.bind(this, 'name')}><Translate content="account.votes.name" /></th>
                            <th className="clickable" onClick={this._setSort.bind(this, 'total_votes')}><Translate content="account.votes.votes" /></th>
                            <th ><Translate content="account.votes.url" /></th>
                        </tr>
                    </thead>
                <tbody>
                    {itemRows}
                </tbody>

            </table>
            )
        }
        else {
            return (
                <div className="grid-block small-up-1 medium-up-2 large-up-3">
                    {itemRows}
                </div>
            );
        }
    }
}
CommitteeMemberList = BindToChainState(CommitteeMemberList, {keep_updating: true, show_loader: true});

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
            filterCommitteeMember: props.filterCommitteeMember || "",
            cardView: props.cardView
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.globalObject, this.props.globalObject) ||
            nextState.filterCommitteeMember !== this.state.filterCommitteeMember ||
            nextState.cardView !== this.state.cardView
        );
    }

    _onFilter(e) {
        e.preventDefault();
        this.setState({filterCommitteeMember: e.target.value.toLowerCase()});

        SettingsActions.changeViewSetting({
            filterCommitteeMember: e.target.value.toLowerCase()
        });
    }

    _toggleView() {
        SettingsActions.changeViewSetting({
            cardViewCommittee: !this.state.cardView
        });

        this.setState({
            cardView: !this.state.cardView
        });
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
                            <div className="view-switcher">
                                <span className="button outline" onClick={this._toggleView.bind(this)}>{!this.state.cardView ? <Translate content="explorer.witnesses.card"/> : <Translate content="explorer.witnesses.table"/>}</span>
                            </div>
                        </div>

                    </div>
                    <div className="grid-block vertical">
                            <div className="grid-block vertical small-12 medium-6">
                                <Translate component="h3" content="markets.filter" />
                                <input type="text" value={this.state.filterCommitteeMember} onChange={this._onFilter.bind(this)} />
                            </div>
                            <CommitteeMemberList
                                committee_members={Immutable.List(globalObject.active_committee_members)}
                                membersList={globalObject.active_committee_members}
                                filter={this.state.filterCommitteeMember}
                                cardView={this.state.cardView}
                            />
                        </div>
                </div>
            </div>
        );
    }
}
CommitteeMembers = BindToChainState(CommitteeMembers, {keep_updating: true});

class CommitteeMembersStoreWrapper extends React.Component {
    render () {
        return <CommitteeMembers {...this.props}/>;
    }
}

CommitteeMembersStoreWrapper = connect(CommitteeMembersStoreWrapper, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            cardView: SettingsStore.getState().viewSettings.get("cardViewCommittee"),
            filterCommitteeMember: SettingsStore.getState().viewSettings.get("filterCommitteeMember"),
        };
    }
});

export default CommitteeMembersStoreWrapper;
