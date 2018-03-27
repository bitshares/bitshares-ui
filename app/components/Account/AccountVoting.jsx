import React from "react";
import Immutable from "immutable";
import Translate from "react-translate-component";
import accountUtils from "common/account_utils";
import {ChainStore, FetchChainObjects} from "bitsharesjs/es";
import WorkerApproval from "./WorkerApproval";
import VotingAccountsList from "./VotingAccountsList";
import cnames from "classnames";
import {Tabs, Tab} from "../Utility/Tabs";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import {Link} from "react-router/es";
import ApplicationApi from "api/ApplicationApi";
import AccountSelector from "./AccountSelector";
import Icon from "../Icon/Icon";
import AssetName from "../Utility/AssetName";
import counterpart from "counterpart";
import {EquivalentValueComponent} from "../Utility/EquivalentValueComponent";
import FormattedAsset from "../Utility/FormattedAsset";
import SettingsStore from "stores/SettingsStore";

class AccountVoting extends React.Component {
    static propTypes = {
        initialBudget: ChainTypes.ChainObject.isRequired,
        globalObject: ChainTypes.ChainObject.isRequired,
        proxy: ChainTypes.ChainAccount.isRequired
    };

    static defaultProps = {
        globalObject: "2.0.0"
    };

    constructor(props) {
        super(props);
        const proxyId = props.proxy.get("id");
        const proxyName = props.proxy.get("name");
        this.state = {
            proxy_account_id: proxyId === "1.2.5" ? "" : proxyId, //"1.2.16",
            prev_proxy_account_id: proxyId === "1.2.5" ? "" : proxyId,
            current_proxy_input: proxyId === "1.2.5" ? "" : proxyName,
            witnesses: null,
            committee: null,
            vote_ids: Immutable.Set(),
            proxy_vote_ids: Immutable.Set(),
            lastBudgetObject: props.initialBudget.get("id"),
            workerTableIndex: props.viewSettings.get("workerTableIndex", 1),
            all_witnesses: Immutable.List(),
            all_committee: Immutable.List()
        };
        this.onProxyAccountFound = this.onProxyAccountFound.bind(this);
        this.onPublish = this.onPublish.bind(this);
        this.onReset = this.onReset.bind(this);
        this._getVoteObjects = this._getVoteObjects.bind(this);
    }

    componentWillMount() {
        accountUtils.getFinalFeeAsset(this.props.account, "account_update");
        ChainStore.fetchAllWorkers();
        this.getBudgetObject();
    }

    componentDidMount() {
        this.updateAccountData(this.props);
        this._getVoteObjects();
        this._getVoteObjects("committee");
    }

    componentWillReceiveProps(np) {
        if (np.account !== this.props.account) {
            const proxyId = np.proxy.get("id");
            let newState = {
                proxy_account_id: proxyId === "1.2.5" ? "" : proxyId
            };
            this.setState({prev_proxy_account_id: newState.proxy_account_id});
            this.updateAccountData(np, newState);
        }
        this.getBudgetObject();
    }

    updateAccountData({account}, state = this.state) {
        let {proxy_account_id} = state;
        const proxy = ChainStore.getAccount(proxy_account_id);
        let options = account.get("options");
        let proxyOptions = proxy ? proxy.get("options") : null;
        // let proxy_account_id = proxy ? proxy.get("id") : "1.2.5";
        let current_proxy_input = proxy ? proxy.get("name") : "";
        if (proxy_account_id === "1.2.5") {
            proxy_account_id = "";
            current_proxy_input = "";
        }

        let votes = options.get("votes");
        let vote_ids = votes.toArray();
        let vids = Immutable.Set(vote_ids);
        ChainStore.getObjectsByVoteIds(vote_ids);

        let proxyPromise = null,
            proxy_vids = Immutable.Set([]);
        const hasProxy = proxy_account_id !== "1.2.5";
        if (hasProxy && proxyOptions) {
            let proxy_votes = proxyOptions.get("votes");
            let proxy_vote_ids = proxy_votes.toArray();
            proxy_vids = Immutable.Set(proxy_vote_ids);
            ChainStore.getObjectsByVoteIds(proxy_vote_ids);

            proxyPromise = FetchChainObjects(
                ChainStore.getObjectByVoteID,
                proxy_vote_ids,
                10000
            );
        }

        Promise.all([
            FetchChainObjects(ChainStore.getObjectByVoteID, vote_ids, 10000),
            proxyPromise
        ]).then(res => {
            const [vote_objs, proxy_vote_objs] = res;
            function sortVoteObjects(objects) {
                let witnesses = new Immutable.List();
                let committee = new Immutable.List();
                let workers = new Immutable.Set();
                objects.forEach(obj => {
                    let account_id = obj.get("committee_member_account");
                    if (account_id) {
                        committee = committee.push(account_id);
                    } else if ((account_id = obj.get("worker_account"))) {
                        // console.log( "worker: ", obj );
                        //     workers = workers.add(obj.get("id"));
                    } else if ((account_id = obj.get("witness_account"))) {
                        witnesses = witnesses.push(account_id);
                    }
                });

                return {witnesses, committee, workers};
            }

            let {witnesses, committee, workers} = sortVoteObjects(vote_objs);
            let {
                witnesses: proxy_witnesses,
                committee: proxy_committee,
                workers: proxy_workers
            } = sortVoteObjects(proxy_vote_objs || []);
            let state = {
                proxy_account_id,
                current_proxy_input,
                witnesses: witnesses,
                committee: committee,
                workers: workers,
                proxy_witnesses: proxy_witnesses,
                proxy_committee: proxy_committee,
                proxy_workers: proxy_workers,
                vote_ids: vids,
                proxy_vote_ids: proxy_vids,
                prev_witnesses: witnesses,
                prev_committee: committee,
                prev_workers: workers,
                prev_vote_ids: vids
            };
            this.setState(state);
        });
    }

    isChanged(s = this.state) {
        return (
            s.proxy_account_id !== s.prev_proxy_account_id ||
            s.witnesses !== s.prev_witnesses ||
            s.committee !== s.prev_committee ||
            !Immutable.is(s.vote_ids, s.prev_vote_ids)
        );
    }

    _getVoteObjects(type = "witnesses", vote_ids) {
        let current = this.state[`all_${type}`];
        const isWitness = type === "witnesses";
        let lastIdx;
        if (!vote_ids) {
            vote_ids = [];
            let active = this.props.globalObject
                .get(
                    isWitness ? "active_witnesses" : "active_committee_members"
                )
                .sort((a, b) => {
                    return (
                        parseInt(a.split(".")[2], 10) -
                        parseInt(b.split(".")[2], 10)
                    );
                });
            const lastActive = active.last() || `1.${isWitness ? "6" : "5"}.1`;
            lastIdx = parseInt(lastActive.split(".")[2], 10);
            for (var i = 1; i <= lastIdx + 10; i++) {
                vote_ids.push(`1.${isWitness ? "6" : "5"}.${i}`);
            }
        } else {
            lastIdx = parseInt(vote_ids[vote_ids.length - 1].split(".")[2], 10);
        }
        FetchChainObjects(ChainStore.getObject, vote_ids, 5000, {}).then(
            vote_objs => {
                this.state[`all_${type}`] = current.concat(
                    Immutable.List(
                        vote_objs
                            .filter(a => !!a)
                            .map(a =>
                                a.get(
                                    isWitness
                                        ? "witness_account"
                                        : "committee_member_account"
                                )
                            )
                    )
                );
                if (!!vote_objs[vote_objs.length - 1]) {
                    // there are more valid vote objs, fetch 10 more
                    vote_ids = [];
                    for (var i = lastIdx + 11; i <= lastIdx + 20; i++) {
                        vote_ids.push(`1.${isWitness ? "6" : "5"}.${i}`);
                    }
                    return this._getVoteObjects(type, vote_ids);
                }
                this.forceUpdate();
            }
        );
    }

    onPublish() {
        let updated_account = this.props.account.toJS();
        let updateObject = {account: updated_account.id};
        let new_options = {memo_key: updated_account.options.memo_key};
        // updated_account.new_options = updated_account.options;
        let new_proxy_id = this.state.proxy_account_id;
        new_options.voting_account = new_proxy_id ? new_proxy_id : "1.2.5";
        new_options.num_witness = this.state.witnesses.size;
        new_options.num_committee = this.state.committee.size;

        updateObject.new_options = new_options;
        // Set fee asset
        updateObject.fee = {
            amount: 0,
            asset_id: accountUtils.getFinalFeeAsset(
                updated_account.id,
                "account_update"
            )
        };

        // Remove votes for expired workers
        let {vote_ids} = this.state;
        let workers = this._getWorkerArray();
        let now = new Date();

        function removeVote(list, vote) {
            if (list.includes(vote)) {
                list = list.delete(vote);
            }
            return list;
        }

        workers.forEach(worker => {
            if (worker) {
                if (new Date(worker.get("work_end_date")) <= now) {
                    vote_ids = removeVote(vote_ids, worker.get("vote_for"));
                }

                // TEMP Remove vote_against since they're no longer used
                vote_ids = removeVote(vote_ids, worker.get("vote_against"));
            }
        });

        // Submit votes
        FetchChainObjects(
            ChainStore.getWitnessById,
            this.state.witnesses.toArray(),
            4000
        )
            .then(res => {
                let witnesses_vote_ids = res.map(o => o.get("vote_id"));
                return Promise.all([
                    Promise.resolve(witnesses_vote_ids),
                    FetchChainObjects(
                        ChainStore.getCommitteeMemberById,
                        this.state.committee.toArray(),
                        4000
                    )
                ]);
            })
            .then(res => {
                updateObject.new_options.votes = res[0]
                    .concat(res[1].map(o => o.get("vote_id")))
                    .concat(
                        vote_ids
                            .filter(id => {
                                return id.split(":")[0] === "2";
                            })
                            .toArray()
                    )
                    .sort((a, b) => {
                        let a_split = a.split(":");
                        let b_split = b.split(":");

                        return (
                            parseInt(a_split[1], 10) - parseInt(b_split[1], 10)
                        );
                    });
                ApplicationApi.updateAccount(updateObject);
            });
    }

    onReset() {
        let s = this.state;
        if (
            this.refs.voting_proxy &&
            this.refs.voting_proxy.refs.bound_component
        )
            this.refs.voting_proxy.refs.bound_component.onResetProxy();
        this.setState(
            {
                proxy_account_id: s.prev_proxy_account_id,
                current_proxy_input: s.prev_proxy_input,
                witnesses: s.prev_witnesses,
                committee: s.prev_committee,
                workers: s.prev_workers,
                vote_ids: s.prev_vote_ids
            },
            () => {
                this.updateAccountData(this.props);
            }
        );
    }

    onAddItem(collection, item_id) {
        let state = {};
        state[collection] = this.state[collection].push(item_id);
        this.setState(state);
    }

    onRemoveItem(collection, item_id) {
        let state = {};
        state[collection] = this.state[collection].filter(i => i !== item_id);
        this.setState(state);
    }

    onChangeVotes(addVotes, removeVotes) {
        let state = {};
        state.vote_ids = this.state.vote_ids;
        if (addVotes.length) {
            addVotes.forEach(vote => {
                state.vote_ids = state.vote_ids.add(vote);
            });
        }
        if (removeVotes) {
            removeVotes.forEach(vote => {
                state.vote_ids = state.vote_ids.delete(vote);
            });
        }

        this.setState(state);
    }

    validateAccount(collection, account) {
        if (!account) return null;
        if (collection === "witnesses") {
            return FetchChainObjects(
                ChainStore.getWitnessById,
                [account.get("id")],
                3000
            ).then(res => {
                return res[0] ? null : "Not a witness";
            });
        }
        if (collection === "committee") {
            return FetchChainObjects(
                ChainStore.getCommitteeMemberById,
                [account.get("id")],
                3000
            ).then(res => {
                return res[0] ? null : "Not a committee member";
            });
        }
        return null;
    }

    onProxyChange(current_proxy_input) {
        let proxyAccount = ChainStore.getAccount(current_proxy_input);
        if (
            !proxyAccount ||
            (proxyAccount &&
                proxyAccount.get("id") !== this.state.proxy_account_id)
        ) {
            this.setState({
                proxy_account_id: "",
                proxy_witnesses: Immutable.Set(),
                proxy_committee: Immutable.Set(),
                proxy_workers: Immutable.Set()
            });
        }
        this.setState({current_proxy_input});
    }

    onProxyAccountFound(proxy_account) {
        this.setState(
            {
                proxy_account_id: proxy_account ? proxy_account.get("id") : ""
            },
            () => {
                this.updateAccountData(this.props);
            }
        );
    }

    onClearProxy() {
        this.setState({
            proxy_account_id: ""
        });
    }

    _getTotalVotes(worker) {
        return (
            parseInt(worker.get("total_votes_for"), 10) -
            parseInt(worker.get("total_votes_against"), 10)
        );
    }

    getBudgetObject() {
        let {lastBudgetObject} = this.state;
        let budgetObject;
        budgetObject = ChainStore.getObject(lastBudgetObject);
        let idIndex = parseInt(lastBudgetObject.split(".")[2], 10);
        if (budgetObject) {
            let timestamp = budgetObject.get("time");
            if (!/Z$/.test(timestamp)) {
                timestamp += "Z";
            }
            let now = new Date();

            /* Use the last valid budget object to estimate the current budget object id.
            ** Budget objects are created once per hour
            */
            let currentID =
                idIndex +
                Math.floor(
                    (now - new Date(timestamp).getTime()) / 1000 / 60 / 60
                ) -
                1;
            if (idIndex >= currentID) return;
            let newID = "2.13." + Math.max(idIndex, currentID);
            let newIDInt = parseInt(newID.split(".")[2], 10);
            FetchChainObjects(
                ChainStore.getObject,
                [newID],
                undefined,
                {}
            ).then(res => {
                let [lbo] = res;
                if (lbo === null) {
                    // The object does not exist, the id was too high
                    this.setState(
                        {lastBudgetObject: `2.13.${newIDInt - 1}`},
                        this.getBudgetObject
                    );
                } else {
                    SettingsStore.setLastBudgetObject(newID);

                    this.setState({lastBudgetObject: newID});
                }
            });
        } else {
            // The object does not exist, decrement the ID
            let newID = `2.13.${idIndex - 1}`;
            FetchChainObjects(
                ChainStore.getObject,
                [newID],
                undefined,
                {}
            ).then(res => {
                let [lbo] = res;
                if (lbo === null) {
                    // The object does not exist, the id was too high
                    this.setState(
                        {lastBudgetObject: `2.13.${idIndex - 2}`},
                        this.getBudgetObject
                    );
                } else {
                    SettingsStore.setLastBudgetObject(newID);
                    this.setState({lastBudgetObject: newID});
                }
            });
        }
    }

    _getWorkerArray() {
        let workerArray = [];

        ChainStore.workers.forEach(workerId => {
            let worker = ChainStore.getObject(workerId, false, false);
            if (worker) workerArray.push(worker);
        });

        return workerArray;
    }

    _setWorkerTableIndex(index) {
        this.setState({
            workerTableIndex: index
        });
    }

    render() {
        let {workerTableIndex} = this.state;
        let preferredUnit = this.props.settings.get("unit") || "1.3.0";
        let hasProxy = !!this.state.proxy_account_id; // this.props.account.getIn(["options", "voting_account"]) !== "1.2.5";
        let publish_buttons_class = cnames("button", {
            disabled: !this.isChanged()
        });
        let {globalObject} = this.props;
        let budgetObject;
        if (this.state.lastBudgetObject) {
            budgetObject = ChainStore.getObject(this.state.lastBudgetObject);
        }

        let totalBudget = 0;
        // let unusedBudget = 0;
        let workerBudget = globalObject
            ? parseInt(
                  globalObject.getIn(["parameters", "worker_budget_per_day"]),
                  10
              )
            : 0;

        if (budgetObject) {
            workerBudget = Math.min(
                24 * budgetObject.getIn(["record", "worker_budget"]),
                workerBudget
            );
            totalBudget = Math.min(
                24 * budgetObject.getIn(["record", "worker_budget"]),
                workerBudget
            );
        }

        let now = new Date();
        let workerArray = this._getWorkerArray();

        let voteThreshold = 0;
        let workers = workerArray
            .filter(a => {
                if (!a) {
                    return false;
                }

                return (
                    new Date(a.get("work_end_date") + "Z") > now &&
                    new Date(a.get("work_begin_date") + "Z") <= now
                );
            })
            .sort((a, b) => {
                return this._getTotalVotes(b) - this._getTotalVotes(a);
            })
            .map((worker, index) => {
                let dailyPay = parseInt(worker.get("daily_pay"), 10);
                workerBudget = workerBudget - dailyPay;
                let votes =
                    worker.get("total_votes_for") -
                    worker.get("total_votes_against");
                if (workerBudget <= 0 && !voteThreshold) {
                    voteThreshold = votes;
                }

                if (voteThreshold && votes < voteThreshold) return null;

                return (
                    <WorkerApproval
                        preferredUnit={preferredUnit}
                        rest={workerBudget + dailyPay}
                        rank={index + 1}
                        key={worker.get("id")}
                        worker={worker.get("id")}
                        vote_ids={
                            this.state[hasProxy ? "proxy_vote_ids" : "vote_ids"]
                        }
                        onChangeVotes={this.onChangeVotes.bind(this)}
                        proxy={hasProxy}
                        voteThreshold={voteThreshold}
                    />
                );
            })
            .filter(a => !!a);

        // unusedBudget = Math.max(0, workerBudget);

        let newWorkers = workerArray
            .filter(a => {
                if (!a) {
                    return false;
                }

                let votes =
                    a.get("total_votes_for") - a.get("total_votes_against");
                return (
                    (new Date(a.get("work_end_date") + "Z") > now &&
                        votes < voteThreshold) ||
                    new Date(a.get("work_begin_date") + "Z") > now
                );
            })
            .sort((a, b) => {
                return this._getTotalVotes(b) - this._getTotalVotes(a);
            })
            .map((worker, index) => {
                // let dailyPay = parseInt(worker.get("daily_pay"), 10);
                // workerBudget = workerBudget - dailyPay;

                return (
                    <WorkerApproval
                        preferredUnit={preferredUnit}
                        rest={0}
                        rank={index + 1}
                        key={worker.get("id")}
                        worker={worker.get("id")}
                        vote_ids={
                            this.state[hasProxy ? "proxy_vote_ids" : "vote_ids"]
                        }
                        onChangeVotes={this.onChangeVotes.bind(this)}
                        proxy={hasProxy}
                        voteThreshold={voteThreshold}
                    />
                );
            });

        let expiredWorkers = workerArray
            .filter(a => {
                if (!a) {
                    return false;
                }

                return new Date(a.get("work_end_date")) <= now;
            })
            .sort((a, b) => {
                return this._getTotalVotes(b) - this._getTotalVotes(a);
            })
            .map((worker, index) => {
                // let dailyPay = parseInt(worker.get("daily_pay"), 10);
                // workerBudget = workerBudget - dailyPay;

                return (
                    <WorkerApproval
                        preferredUnit={preferredUnit}
                        rest={0}
                        rank={index + 1}
                        key={worker.get("id")}
                        worker={worker.get("id")}
                        vote_ids={
                            this.state[hasProxy ? "proxy_vote_ids" : "vote_ids"]
                        }
                        onChangeVotes={this.onChangeVotes.bind(this)}
                        proxy={hasProxy}
                        voteThreshold={voteThreshold}
                    />
                );
            });

        let actionButtons = (
            <span>
                <button
                    className={cnames(publish_buttons_class, {
                        success: this.isChanged()
                    })}
                    onClick={this.onPublish}
                    tabIndex={4}
                >
                    <Translate content="account.votes.publish" />
                </button>
                <button
                    className={"button " + publish_buttons_class}
                    onClick={this.onReset}
                    tabIndex={8}
                >
                    <Translate content="account.perm.reset" />
                </button>
            </span>
        );

        let proxyInput = (
            <AccountSelector
                hideImage
                style={{width: "50%", maxWidth: 250}}
                account={this.state.current_proxy_input}
                accountName={this.state.current_proxy_input}
                onChange={this.onProxyChange.bind(this)}
                onAccountChanged={this.onProxyAccountFound}
                tabIndex={1}
                placeholder="Proxy not set"
            >
                <span
                    style={{
                        paddingLeft: 5,
                        position: "relative",
                        top: -1,
                        display: hasProxy ? "" : "none"
                    }}
                >
                    <Icon name="locked" size="1x" />
                </span>
                <span
                    style={{
                        paddingLeft: 5,
                        position: "relative",
                        top: 9,
                        display: !hasProxy ? "" : "none"
                    }}
                >
                    <Link to="/help/voting">
                        <Icon name="question-circle" size="1x" />
                    </Link>
                </span>
            </AccountSelector>
        );

        const showExpired = workerTableIndex === 2;

        const saveText = (
            <div
                className="inline-block"
                style={{
                    float: "right",
                    visibility: this.isChanged() ? "visible" : "hidden",
                    color: "red",
                    padding: "0.85rem",
                    fontSize: "0.9rem"
                }}
            >
                <Translate content="account.votes.save_finish" />
            </div>
        );

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
                <div className="content-block small-12">
                    <div className="tabs-container generic-bordered-box">
                        <Tabs
                            setting="votingTab"
                            className="account-tabs"
                            defaultActiveTab={1}
                            segmented={false}
                            actionButtons={saveText}
                            tabsClass="account-overview no-padding bordered-header content-block"
                        >
                            <Tab title="explorer.witnesses.title">
                                <div className={cnames("content-block")}>
                                    <div className="header-selector">
                                        {/* <Link to="/help/voting/witness"><Icon name="question-circle" /></Link> */}
                                        {proxyInput}
                                        <div
                                            style={{
                                                float: "right",
                                                marginTop: "-2.5rem"
                                            }}
                                        >
                                            {actionButtons}
                                        </div>
                                    </div>

                                    <VotingAccountsList
                                        type="witness"
                                        label="account.votes.add_witness_label"
                                        items={this.state.all_witnesses}
                                        validateAccount={this.validateAccount.bind(
                                            this,
                                            "witnesses"
                                        )}
                                        onAddItem={this.onAddItem.bind(
                                            this,
                                            "witnesses"
                                        )}
                                        onRemoveItem={this.onRemoveItem.bind(
                                            this,
                                            "witnesses"
                                        )}
                                        tabIndex={hasProxy ? -1 : 2}
                                        supported={
                                            this.state[
                                                hasProxy
                                                    ? "proxy_witnesses"
                                                    : "witnesses"
                                            ]
                                        }
                                        withSelector={false}
                                        active={globalObject.get(
                                            "active_witnesses"
                                        )}
                                        proxy={this.state.proxy_account_id}
                                    />
                                </div>
                            </Tab>

                            <Tab title="explorer.committee_members.title">
                                <div className={cnames("content-block")}>
                                    <div className="header-selector">
                                        {/* <Link to="/help/voting/committee"><Icon name="question-circle" /></Link> */}
                                        {proxyInput}
                                        <div
                                            style={{
                                                float: "right",
                                                marginTop: "-2.5rem"
                                            }}
                                        >
                                            {actionButtons}
                                        </div>
                                    </div>
                                    <VotingAccountsList
                                        type="committee"
                                        label="account.votes.add_committee_label"
                                        items={this.state.all_committee}
                                        validateAccount={this.validateAccount.bind(
                                            this,
                                            "committee"
                                        )}
                                        onAddItem={this.onAddItem.bind(
                                            this,
                                            "committee"
                                        )}
                                        onRemoveItem={this.onRemoveItem.bind(
                                            this,
                                            "committee"
                                        )}
                                        tabIndex={hasProxy ? -1 : 3}
                                        supported={
                                            this.state[
                                                hasProxy
                                                    ? "proxy_committee"
                                                    : "committee"
                                            ]
                                        }
                                        withSelector={false}
                                        active={globalObject.get(
                                            "active_committee_members"
                                        )}
                                        proxy={this.state.proxy_account_id}
                                    />
                                </div>
                            </Tab>

                            <Tab title="account.votes.workers_short">
                                <div className="header-selector">
                                    <div style={{float: "right"}}>
                                        <Link to="/create-worker">
                                            <div className="button">
                                                <Translate content="account.votes.create_worker" />
                                            </div>
                                        </Link>
                                    </div>
                                    <div className="selector">
                                        {/* <Link to="/help/voting/worker"><Icon name="question-circle" /></Link> */}
                                        <div
                                            style={{paddingLeft: 10}}
                                            className={cnames("inline-block", {
                                                inactive: workerTableIndex !== 0
                                            })}
                                            onClick={this._setWorkerTableIndex.bind(
                                                this,
                                                0
                                            )}
                                        >
                                            {counterpart.translate(
                                                "account.votes.new",
                                                {count: newWorkers.length}
                                            )}
                                        </div>
                                        <div
                                            className={cnames("inline-block", {
                                                inactive: workerTableIndex !== 1
                                            })}
                                            onClick={this._setWorkerTableIndex.bind(
                                                this,
                                                1
                                            )}
                                        >
                                            {counterpart.translate(
                                                "account.votes.active",
                                                {count: workers.length}
                                            )}
                                        </div>

                                        {expiredWorkers.length ? (
                                            <div
                                                className={cnames(
                                                    "inline-block",
                                                    {inactive: !showExpired}
                                                )}
                                                onClick={
                                                    !showExpired
                                                        ? this._setWorkerTableIndex.bind(
                                                              this,
                                                              2
                                                          )
                                                        : () => {}
                                                }
                                            >
                                                <Translate content="account.votes.expired" />
                                            </div>
                                        ) : null}
                                    </div>
                                    <div style={{marginTop: "2rem"}}>
                                        {proxyInput}
                                        <div
                                            style={{
                                                float: "right",
                                                marginTop: "-2.5rem"
                                            }}
                                        >
                                            {actionButtons}
                                        </div>
                                    </div>
                                </div>

                                {/* {showExpired ? null : (
                                <div style={{paddingTop: 10, paddingBottom: 20}}>
                                    <table>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <Translate content="account.votes.total_budget" />:</td>
                                                <td style={{paddingLeft: 20, textAlign: "right"}}>
                                                    &nbsp;{globalObject ? <FormattedAsset amount={totalBudget} asset="1.3.0" decimalOffset={5}/> : null}
                                                    <span>&nbsp;({globalObject ? <EquivalentValueComponent fromAsset="1.3.0" toAsset={preferredUnit} amount={totalBudget}/> : null})</span>
                                                </td></tr>
                                            <tr>
                                                <td><Translate content="account.votes.unused_budget" />:</td>
                                                <td style={{paddingLeft: 20, textAlign: "right"}}> {globalObject ? <FormattedAsset amount={unusedBudget} asset="1.3.0" decimalOffset={5}/> : null}</td></tr>
                                        </tbody>
                                    </table>
                                </div>)} */}

                                <table className="table dashboard-table table-hover">
                                    {workerTableIndex ===
                                    2 ? null : workerTableIndex === 0 ? (
                                        <thead>
                                            <tr>
                                                <th />
                                                <th
                                                    colSpan="3"
                                                    style={{textAlign: "left"}}
                                                >
                                                    <Translate content="account.votes.threshold" />
                                                </th>
                                                <th
                                                    style={{textAlign: "right"}}
                                                >
                                                    <FormattedAsset
                                                        decimalOffset={5}
                                                        hide_asset
                                                        amount={voteThreshold}
                                                        asset="1.3.0"
                                                    />
                                                </th>
                                                <th colSpan="3" />
                                            </tr>
                                            <tr>
                                                <th
                                                    style={{
                                                        border: "none",
                                                        backgroundColor:
                                                            "transparent"
                                                    }}
                                                />
                                            </tr>
                                        </thead>
                                    ) : (
                                        <thead>
                                            <tr>
                                                <th />
                                                <th
                                                    colSpan="4"
                                                    style={{textAlign: "left"}}
                                                >
                                                    <Translate content="account.votes.total_budget" />{" "}
                                                    (<AssetName
                                                        name={preferredUnit}
                                                    />)
                                                </th>
                                                <th
                                                    colSpan="2"
                                                    className="hide-column-small"
                                                />
                                                <th
                                                    style={{textAlign: "right"}}
                                                >
                                                    {globalObject ? (
                                                        <EquivalentValueComponent
                                                            hide_asset
                                                            fromAsset="1.3.0"
                                                            toAsset={
                                                                preferredUnit
                                                            }
                                                            amount={totalBudget}
                                                        />
                                                    ) : null}
                                                </th>
                                                <th className="hide-column-small" />
                                            </tr>
                                            <tr>
                                                <th
                                                    style={{
                                                        border: "none",
                                                        backgroundColor:
                                                            "transparent"
                                                    }}
                                                />
                                            </tr>
                                        </thead>
                                    )}
                                    <thead>
                                        <tr>
                                            {workerTableIndex === 2 ? null : (
                                                <th
                                                    style={{textAlign: "right"}}
                                                >
                                                    <Translate content="account.votes.line" />
                                                </th>
                                            )}
                                            <th style={{textAlign: "center"}}>
                                                <Translate content="account.user_issued_assets.id" />
                                            </th>
                                            <th style={{textAlign: "left"}}>
                                                <Translate content="account.user_issued_assets.description" />
                                            </th>
                                            <th
                                                style={{textAlign: "right"}}
                                                className="hide-column-small"
                                            >
                                                <Translate content="account.votes.total_votes" />
                                            </th>
                                            {workerTableIndex === 0 ? (
                                                <th
                                                    style={{textAlign: "right"}}
                                                >
                                                    <Translate content="account.votes.missing" />
                                                </th>
                                            ) : null}
                                            <th>
                                                <Translate content="explorer.workers.period" />
                                            </th>
                                            {workerTableIndex === 2 ||
                                            workerTableIndex === 0 ? null : (
                                                <th
                                                    style={{textAlign: "right"}}
                                                    className="hide-column-small"
                                                >
                                                    <Translate content="account.votes.funding" />
                                                </th>
                                            )}
                                            <th
                                                style={{textAlign: "right"}}
                                                className="hide-column-small"
                                            >
                                                <Translate content="account.votes.daily_pay" />
                                                <div
                                                    style={{
                                                        paddingTop: 5,
                                                        fontSize: "0.8rem"
                                                    }}
                                                >
                                                    (<AssetName
                                                        name={preferredUnit}
                                                    />)
                                                </div>
                                            </th>
                                            {workerTableIndex === 2 ||
                                            workerTableIndex === 0 ? null : (
                                                <th
                                                    style={{textAlign: "right"}}
                                                >
                                                    <Translate content="explorer.witnesses.budget" />
                                                    <div
                                                        style={{
                                                            paddingTop: 5,
                                                            fontSize: "0.8rem"
                                                        }}
                                                    >
                                                        (<AssetName
                                                            name={preferredUnit}
                                                        />)
                                                    </div>
                                                </th>
                                            )}

                                            <th>
                                                <Translate content="account.votes.toggle" />
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {workerTableIndex === 0
                                            ? newWorkers
                                            : workerTableIndex === 1
                                                ? workers
                                                : expiredWorkers}
                                    </tbody>
                                </table>
                            </Tab>
                        </Tabs>
                    </div>
                </div>
            </div>
        );
    }
}
AccountVoting = BindToChainState(AccountVoting);

const BudgetObjectWrapper = props => {
    return (
        <AccountVoting
            {...props}
            initialBudget={SettingsStore.getLastBudgetObject()}
        />
    );
};

export default BudgetObjectWrapper;
