import React from "react";
import counterpart from "counterpart";
import utils from "common/utils";
import FormattedAsset from "../Utility/FormattedAsset";
import LinkToAccountById from "../Utility/LinkToAccountById";
import BindToChainState from "../Utility/BindToChainState";
import {EquivalentValueComponent} from "../Utility/EquivalentValueComponent";
import Icon from "components/Icon/Icon";
import PaginatedList from "components/Utility/PaginatedList";
import Translate from "react-translate-component";
import AssetName from "../Utility/AssetName";
import stringSimilarity from "string-similarity";
import {hiddenProposals} from "../../lib/common/hideProposals";
import sanitize from "sanitize";

class WorkerList extends React.Component {
    constructor(props) {
        super(props);
    }

    onApprove(item) {
        let addVotes = [],
            removeVotes = [];

        if (item.vote_ids.has(item.worker.get("vote_against"))) {
            removeVotes.push(item.worker.get("vote_against"));
        }

        if (!item.vote_ids.has(item.worker.get("vote_for"))) {
            addVotes.push(item.worker.get("vote_for"));
        }

        this.props.onChangeVotes(addVotes, removeVotes);
    }

    onReject(item) {
        let addVotes = [],
            removeVotes = [];

        if (item.vote_ids.has(item.worker.get("vote_against"))) {
            removeVotes.push(item.worker.get("vote_against"));
        }

        if (item.vote_ids.has(item.worker.get("vote_for"))) {
            removeVotes.push(item.worker.get("vote_for"));
        }

        this.props.onChangeVotes(addVotes, removeVotes);
    }

    getHeader(workerTableIndex, preferredUnit) {
        return [
            workerTableIndex === 2
                ? null
                : {
                      title: (
                          <Translate
                              component="span"
                              content="account.votes.line"
                              style={{whiteSpace: "nowrap"}}
                          />
                      ),
                      dataIndex: "line",
                      align: "right",
                      render: item => {
                          return (
                              <span
                                  style={{
                                      textAlign: "right",
                                      paddingRight: 10,
                                      paddingLeft: 0,
                                      whiteSpace: "nowrap"
                                  }}
                              >
                                  {item
                                      ? item
                                      : counterpart.translate(
                                            "account.votes.expired"
                                        )}
                              </span>
                          );
                      }
                  },
            {
                title: (
                    <Translate
                        content="account.user_issued_assets.id"
                        style={{whiteSpace: "nowrap"}}
                    />
                ),
                dataIndex: "assets_id",
                align: "center",
                sorter: (a, b) => {
                    return a.assets_id > b.assets_id
                        ? 1
                        : a.assets_id < b.assets_id
                            ? -1
                            : 0;
                },
                render: item => {
                    return <span style={{whiteSpace: "nowrap"}}>{item}</span>;
                }
            },
            {
                title: (
                    <Translate
                        content="account.user_issued_assets.description"
                        style={{whiteSpace: "nowrap"}}
                    />
                ),
                dataIndex: "description",
                align: "left",
                sorter: (a, b) => {
                    return a.description.name > b.description.name
                        ? 1
                        : a.description.name < b.description.name
                            ? -1
                            : 0;
                },
                render: item => {
                    return (
                        <span>
                            <div
                                className="inline-block"
                                style={{
                                    paddingRight: 5,
                                    position: "relative",
                                    top: -1,
                                    whiteSpace: "nowrap"
                                }}
                            >
                                <a
                                    style={{
                                        visibility:
                                            item.url &&
                                            item.url.indexOf(".") !== -1
                                                ? "visible"
                                                : "hidden"
                                    }}
                                    href={sanitize(item.url, {
                                        whiteList: [], // empty, means filter out all tags
                                        stripIgnoreTag: true // filter out all HTML not in the whilelist
                                    })}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Icon
                                        name="share"
                                        size="2x"
                                        title="icons.share"
                                    />
                                </a>
                            </div>
                            <div className="inline-block">
                                {item.name}
                                <br />
                                <LinkToAccountById
                                    account={item.worker_account}
                                    maxDisplayAccountNameLength={null}
                                />
                            </div>
                        </span>
                    );
                }
            },
            {
                className: "column-hide-small",
                title: (
                    <Translate
                        content="account.votes.total_votes"
                        style={{whiteSpace: "nowrap"}}
                    />
                ),
                dataIndex: "total_votes",
                align: "right",
                sorter: (a, b) => a.total_votes - b.total_votes,
                render: item => {
                    return (
                        <FormattedAsset
                            amount={item}
                            asset="1.3.0"
                            decimalOffset={5}
                            hide_asset
                            style={{whiteSpace: "nowrap"}}
                        />
                    );
                }
            },
            workerTableIndex === 0
                ? {
                      title: (
                          <Translate
                              content="account.votes.missing"
                              style={{whiteSpace: "nowrap"}}
                          />
                      ),
                      dataIndex: "missing",
                      align: "right",
                      sorter: (a, b) => a.missing - b.missing,
                      render: item => {
                          return (
                              <span
                                  style={{
                                      textAlign: "right",
                                      whiteSpace: "nowrap"
                                  }}
                              >
                                  <FormattedAsset
                                      amount={Math.max(0, item)}
                                      asset="1.3.0"
                                      hide_asset
                                      decimalOffset={5}
                                  />
                              </span>
                          );
                      }
                  }
                : null,
            {
                title: (
                    <Translate
                        content="explorer.workers.period"
                        style={{whiteSpace: "nowrap"}}
                    />
                ),
                dataIndex: "period",
                align: "right",
                sorter: (a, b) =>
                    new Date(a.period.startDate) - new Date(b.period.startDate),
                render: item => {
                    return (
                        <span style={{whiteSpace: "nowrap"}}>
                            {item.startDate} - {item.endDate}
                        </span>
                    );
                }
            },
            workerTableIndex === 2 || workerTableIndex === 0
                ? null
                : {
                      title: (
                          <Translate
                              content="account.votes.funding"
                              style={{whiteSpace: "nowrap"}}
                          />
                      ),
                      dataIndex: "funding",
                      align: "right",
                      render: item => {
                          return (
                              <span
                                  style={{
                                      textAlign: "right",
                                      whiteSpace: "nowrap"
                                  }}
                                  className="hide-column-small"
                              >
                                  {item.isExpired
                                      ? "-"
                                      : utils.format_number(
                                            item.fundedPercent,
                                            2
                                        ) + "%"}
                              </span>
                          );
                      }
                  },
            workerTableIndex === 2 || workerTableIndex === 0
                ? null
                : {
                      title: (
                          <span>
                              <Translate
                                  content="explorer.witnesses.budget"
                                  style={{whiteSpace: "nowrap"}}
                              />
                              <div
                                  style={{
                                      paddingTop: 5,
                                      fontSize: "0.8rem"
                                  }}
                              >
                                  (<AssetName name={preferredUnit} />)
                              </div>
                          </span>
                      ),
                      dataIndex: "budget",
                      align: "right",
                      render: item => {
                          return (
                              <span
                                  style={{
                                      textAlign: "right",
                                      whiteSpace: "nowrap"
                                  }}
                              >
                                  {item.rest <= 0 ? (
                                      item.isExpired ? (
                                          "-"
                                      ) : (
                                          "0.00"
                                      )
                                  ) : (
                                      <EquivalentValueComponent
                                          hide_asset
                                          fromAsset="1.3.0"
                                          toAsset={item.preferredUnit}
                                          amount={item.rest}
                                      />
                                  )}
                              </span>
                          );
                      }
                  },
            {
                className: "column-hide-small",
                title: (
                    <span>
                        <Translate
                            content="account.votes.daily_pay"
                            style={{whiteSpace: "nowrap"}}
                        />
                        <div
                            style={{
                                paddingTop: 5,
                                fontSize: "0.8rem"
                            }}
                        >
                            (<AssetName name={preferredUnit} />)
                        </div>
                    </span>
                ),
                dataIndex: "daily_pay",
                align: "right",
                sorter: (a, b) => a.daily_pay.daily_pay - b.daily_pay.daily_pay,
                render: item => {
                    return (
                        <span
                            className={!item.proxy ? "clickable" : ""}
                            style={{whiteSpace: "nowrap"}}
                            onClick={
                                item.proxy
                                    ? () => {}
                                    : this[
                                          item.approvalState
                                              ? "onReject"
                                              : "onApprove"
                                      ].bind(this, item)
                            }
                        >
                            <EquivalentValueComponent
                                hide_asset
                                fromAsset="1.3.0"
                                toAsset={item.preferredUnit}
                                amount={item.daily_pay}
                                style={{whiteSpace: "nowrap"}}
                            />
                        </span>
                    );
                }
            },
            {
                className: "column-hide-small",
                title: (
                    <Translate
                        content="account.votes.toggle"
                        style={{whiteSpace: "nowrap"}}
                    />
                ),
                dataIndex: "toggle",
                align: "right",
                render: item => {
                    return (
                        <span
                            className={!item.proxy ? "clickable" : ""}
                            style={{whiteSpace: "nowrap"}}
                            onClick={
                                item.proxy
                                    ? () => {}
                                    : this[
                                          item.approvalState
                                              ? "onReject"
                                              : "onApprove"
                                      ].bind(this, item)
                            }
                        >
                            {!item.proxy ? (
                                <Icon
                                    name={
                                        item.approvalState
                                            ? "checkmark-circle"
                                            : "minus-circle"
                                    }
                                    title={
                                        item.approvalState
                                            ? "icons.checkmark_circle.approved"
                                            : "icons.minus_circle.disapproved"
                                    }
                                />
                            ) : (
                                <Icon
                                    name="locked"
                                    title="icons.locked.action"
                                />
                            )}
                        </span>
                    );
                }
            }
        ].filter(n => n);
    }

    getData(workers, voteThreshold = 0) {
        let {hasProxy, proxy_vote_ids, vote_ids} = this.props;
        vote_ids = hasProxy ? proxy_vote_ids : vote_ids;
        voteThreshold = voteThreshold || 0;
        return workers.map((item, index) => {
            let worker = item.worker.toJS();
            const rank = index + 1;
            let total_votes =
                worker.total_votes_for - worker.total_votes_against;
            let approvalState = vote_ids.has(worker.vote_for)
                ? true
                : vote_ids.has(worker.vote_against)
                    ? false
                    : null;

            let fundedPercent = 0;

            if (worker.daily_pay < item.rest) {
                fundedPercent = 100;
            } else if (item.rest > 0) {
                fundedPercent = (item.rest / worker.daily_pay) * 100;
            }

            let startDate = counterpart.localize(
                new Date(worker.work_begin_date + "Z"),
                {type: "date", format: "short_custom"}
            );
            let endDate = counterpart.localize(
                new Date(worker.work_end_date + "Z"),
                {type: "date", format: "short_custom"}
            );

            let now = new Date();
            let isExpired = new Date(worker.work_end_date + "Z") <= now;
            let hasStarted = new Date(worker.work_begin_date + "Z") <= now;
            let isProposed =
                (!isExpired && total_votes < voteThreshold) || !hasStarted;
            let isPoll = !!item.poll;
            return {
                key: worker.id,
                line: !isPoll && isExpired ? null : !isExpired ? rank : null,
                assets_id: worker.id,
                description: worker,
                total_votes: total_votes,
                missing: voteThreshold - total_votes,
                period: {startDate, endDate},
                funding:
                    !isPoll && (isExpired || isProposed)
                        ? null
                        : {isExpired, fundedPercent},
                daily_pay: {
                    preferredUnit: item.preferredUnit,
                    daily_pay: worker.daily_pay,
                    proxy: hasProxy,
                    approvalState,
                    worker: item.worker,
                    vote_ids
                },
                budget:
                    !isPoll && (isExpired || isProposed)
                        ? null
                        : {
                              rest: item.rest,
                              isExpired,
                              preferredUnit: item.preferredUnit,
                              rest: item.rest
                          },
                toggle: {
                    proxy: hasProxy,
                    approvalState,
                    worker: item.worker,
                    vote_ids
                }
            };
        });
    }

    _getMappedWorkers(workers, maxDailyPayout, filterSearch) {
        let now = new Date();
        let remainingDailyPayout = maxDailyPayout;
        let voteThreshold = undefined;
        let mapped = workers
            .filter(a => {
                const name = a.get("name").toLowerCase();
                return a && name.indexOf(filterSearch) !== -1;
            })
            .sort((a, b) => {
                // first sort by votes so payout order is correct
                return this._getTotalVotes(b) - this._getTotalVotes(a);
            })
            .map(worker => {
                worker.isOngoing =
                    new Date(worker.get("work_end_date") + "Z") > now &&
                    new Date(worker.get("work_begin_date") + "Z") <= now;
                worker.isUpcoming =
                    new Date(worker.get("work_begin_date") + "Z") > now;
                worker.isExpired =
                    new Date(worker.get("work_end_date") + "Z") <= now;
                let dailyPay = parseInt(worker.get("daily_pay"), 10);
                worker.votes =
                    worker.get("total_votes_for") -
                    worker.get("total_votes_against");
                if (remainingDailyPayout > 0 && worker.isOngoing) {
                    worker.active = true;
                    remainingDailyPayout = remainingDailyPayout - dailyPay;
                    if (remainingDailyPayout <= 0 && !voteThreshold) {
                        // remember when workers become inactive
                        voteThreshold = worker.votes;
                    }
                    worker.remainingPayout = remainingDailyPayout + dailyPay;
                } else {
                    worker.active = false;
                    worker.remainingPayout = 0;
                }
                return worker;
            })
            .sort((a, b) => {
                // sort out expired
                if (a.isExpired !== b.isExpired) {
                    return a.isExpired ? 1 : -1;
                } else {
                    return this._getTotalVotes(b) - this._getTotalVotes(a);
                }
            });
        return {
            mappedWorkers: mapped,
            voteThreshold: voteThreshold
        };
    }

    _getTotalVotes(worker) {
        return (
            parseInt(worker.get("total_votes_for"), 10) -
            parseInt(worker.get("total_votes_against"), 10)
        );
    }

    _decideRowClassName(row, index) {
        return row.toggle.approvalState ? "" : "unsupported";
    }

    render() {
        let {
            workerTableIndex,
            preferredUnit,
            setWorkersLength,
            workerBudget,
            hideLegacyProposals,
            getWorkerArray,
            filterSearch
        } = this.props;
        const workersHeader = this.getHeader(workerTableIndex, preferredUnit);

        let workerArray = getWorkerArray();
        let {mappedWorkers, voteThreshold} = this._getMappedWorkers(
            workerArray,
            workerBudget,
            filterSearch
        );

        const hideProposals = (filteredWorker, compareWith) => {
            if (!hideLegacyProposals) {
                return true;
            }

            let duplicated = compareWith.some(worker => {
                const isSimilarName =
                    stringSimilarity.compareTwoStrings(
                        filteredWorker.get("name"),
                        worker.get("name")
                    ) > 0.8;
                const sameId = worker.get("id") === filteredWorker.get("id");
                const isNewer =
                    worker.get("id").substr(5, worker.get("id").length) >
                    filteredWorker.get("id").substr(5, worker.get("id").length);
                return isSimilarName && !sameId && isNewer;
            });
            const newDate = new Date();
            const totalVotes =
                filteredWorker.get("total_votes_for") -
                filteredWorker.get("total_votes_against");
            const hasLittleVotes = totalVotes < 2000000000000;
            const hasStartedOverAMonthAgo =
                new Date(filteredWorker.get("work_begin_date") + "Z") <=
                new Date(newDate.setMonth(newDate.getMonth() - 2));

            const manualHidden = hiddenProposals.includes(
                filteredWorker.get("id")
            );

            let hidden =
                ((!!duplicated || hasStartedOverAMonthAgo) && hasLittleVotes) ||
                manualHidden;

            return !hidden;
        };

        let polls = mappedWorkers
            .filter(a => {
                let lowercase = a.get("name").toLowerCase();
                return lowercase.includes("bsip") || lowercase.includes("poll");
            })
            .map(worker => {
                return {
                    preferredUnit,
                    rest: worker.remainingPayout,
                    poll: true,
                    worker: worker
                };
            })
            .filter(a => !!a);

        // remove polls
        mappedWorkers = mappedWorkers.filter(a => {
            let lowercase = a.get("name").toLowerCase();
            return !lowercase.includes("bsip") && !lowercase.includes("poll");
        });

        let onGoingWorkers = mappedWorkers.filter(a => {
            return a.isOngoing;
        });
        let activeWorkers = mappedWorkers
            .filter(a => {
                return a.active && a.isOngoing;
            })
            .map(worker => {
                return {
                    preferredUnit,
                    rest: worker.remainingPayout,
                    worker: worker
                };
            })
            .filter(a => !!a);

        let newWorkers = mappedWorkers
            .filter(a => {
                return (
                    !a.active &&
                    !a.isExpired &&
                    hideProposals(a, onGoingWorkers)
                );
            })
            .map(worker => {
                return {
                    preferredUnit,
                    rest: 0,
                    worker: worker
                };
            });

        let expiredWorkers = workerArray
            .filter(a => {
                return a.isExpired;
            })
            .map(worker => {
                return {
                    preferredUnit,
                    rest: 0,
                    worker: worker
                };
            });
        // fixme: don't call setState in render
        setWorkersLength(
            newWorkers.length,
            activeWorkers.length,
            polls.length,
            expiredWorkers.length,
            voteThreshold
        );
        const workers =
            workerTableIndex === 0
                ? newWorkers
                : workerTableIndex === 1
                    ? activeWorkers
                    : workerTableIndex === 2
                        ? expiredWorkers
                        : polls;
        return (
            <PaginatedList
                className="table dashboard-table table-hover"
                rowClassName={this._decideRowClassName.bind(this)}
                rows={this.getData(workers, voteThreshold)}
                header={workersHeader}
                pageSize={50}
                label="utility.total_x_assets"
                leftPadding="1.5rem"
            />
        );
    }
}

export default BindToChainState(WorkerList);
