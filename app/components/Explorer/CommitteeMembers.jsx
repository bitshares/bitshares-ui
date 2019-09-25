import counterpart from "counterpart";
import React from "react";
import Immutable from "immutable";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import {ChainStore} from "tuscjs";
import {connect} from "alt-react";
import SettingsActions from "actions/SettingsActions";
import FormattedAsset from "../Utility/FormattedAsset";
import SettingsStore from "stores/SettingsStore";
import {Table} from "bitshares-ui-style-guide";
import sanitize from "sanitize";
import SearchInput from "../Utility/SearchInput";

class CommitteeMemberList extends React.Component {
    static propTypes = {
        committee_members: ChainTypes.ChainObjectsList.isRequired
    };

    constructor() {
        super();
    }

    render() {
        let {committee_members, membersList} = this.props;

        let dataSource = null;

        let ranks = {};

        committee_members
            .filter(a => {
                if (!a) {
                    return false;
                }
                return membersList.indexOf(a.get("id")) !== -1;
            })
            .forEach((c, index) => {
                if (c) {
                    ranks[c.get("id")] = index + 1;
                }
            });

        if (committee_members.length > 0 && committee_members[1]) {
            dataSource = committee_members
                .filter(a => {
                    if (!a) {
                        return false;
                    }
                    let account = ChainStore.getObject(
                        a.get("committee_member_account")
                    );
                    if (!account) {
                        return false;
                    }

                    let account_data = ChainStore.getCommitteeMemberById(
                        account.get("id")
                    );

                    if (!account_data) return false;

                    return (
                        account.get("name").indexOf(this.props.filter || "") !==
                        -1
                    );
                })
                .map(a => {
                    let account = ChainStore.getObject(
                        a.get("committee_member_account")
                    );

                    let account_data = ChainStore.getCommitteeMemberById(
                        account.get("id")
                    );

                    return {
                        key: a.get("id"),
                        rank: ranks[a.get("id")],
                        name: account.get("name"),
                        votes: account_data.get("total_votes"),
                        url: sanitize(account_data.get("url"), {
                            whiteList: [], // empty, means filter out all tags
                            stripIgnoreTag: true // filter out all HTML not in the whilelist
                        })
                    };
                });
        }

        const columns = [
            {
                key: "#",
                title: "#",
                dataIndex: "rank",
                sorter: (a, b) => {
                    return a.rank > b.rank ? 1 : a.rank < b.rank ? -1 : 0;
                }
            },
            {
                key: "name",
                title: "NAME",
                dataIndex: "name",
                sorter: (a, b) => {
                    return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
                }
            },
            {
                key: "votes",
                title: "VOTES",
                dataIndex: "votes",
                render: item => (
                    <FormattedAsset
                        amount={item}
                        asset="1.3.0"
                        decimalOffset={5}
                    />
                ),
                sorter: (a, b) => {
                    return a.votes > b.votes ? 1 : a.votes < b.votes ? -1 : 0;
                }
            },
            {
                key: "url",
                title: "WEBPAGE",
                dataIndex: "url",
                render: item => (
                    <a href={item} target="_blank" rel="noopener noreferrer">
                        {item}
                    </a>
                )
            }
        ];

        return (
            <Table
                columns={columns}
                dataSource={dataSource}
                pagination={false}
            />
        );
    }
}
CommitteeMemberList = BindToChainState(CommitteeMemberList, {
    show_loader: true
});

class CommitteeMembers extends React.Component {
    static propTypes = {
        globalObject: ChainTypes.ChainObject.isRequired
    };

    static defaultProps = {
        globalObject: "2.0.0"
    };

    constructor(props) {
        super(props);
        this.state = {
            filterCommitteeMember: props.filterCommitteeMember || ""
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.globalObject, this.props.globalObject) ||
            nextState.filterCommitteeMember !==
                this.state.filterCommitteeMember ||
            nextState.cardView !== this.state.cardView
        );
    }

    _onFilter(e) {
        this.setState({filterCommitteeMember: e.target.value.toLowerCase()});

        SettingsActions.changeViewSetting({
            filterCommitteeMember: e.target.value.toLowerCase()
        });
    }

    render() {
        let {globalObject} = this.props;
        globalObject = globalObject.toJS();

        let activeCommitteeMembers = [];
        for (let key in globalObject.active_committee_members) {
            if (globalObject.active_committee_members.hasOwnProperty(key)) {
                activeCommitteeMembers.push(
                    globalObject.active_committee_members[key]
                );
            }
        }

        return (
            <div className="grid-block">
                <div className="grid-block vertical medium-horizontal">
                    <div className="grid-block vertical">
                        <div className="grid-content">
                            <SearchInput
                                placeholder={counterpart.translate(
                                    "explorer.witnesses.filter_by_name"
                                )}
                                value={this.state.filterCommitteeMember}
                                onChange={this._onFilter.bind(this)}
                                style={{
                                    width: "200px",
                                    marginBottom: "12px",
                                    marginTop: "4px"
                                }}
                            />
                            <CommitteeMemberList
                                filter={this.state.filterCommitteeMember}
                                committee_members={Immutable.List(
                                    globalObject.active_committee_members
                                )}
                                membersList={
                                    globalObject.active_committee_members
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
CommitteeMembers = BindToChainState(CommitteeMembers);

class CommitteeMembersStoreWrapper extends React.Component {
    render() {
        return <CommitteeMembers {...this.props} />;
    }
}

CommitteeMembersStoreWrapper = connect(
    CommitteeMembersStoreWrapper,
    {
        listenTo() {
            return [SettingsStore];
        },
        getProps() {
            return {
                cardView: SettingsStore.getState().viewSettings.get(
                    "cardViewCommittee"
                ),
                filterCommitteeMember: SettingsStore.getState().viewSettings.get(
                    "filterCommitteeMember"
                )
            };
        }
    }
);

export default CommitteeMembersStoreWrapper;
