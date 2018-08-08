import React from "react";
import counterpart from "counterpart";
import utils from "common/utils";
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset";
import LinkToAccountById from "../Utility/LinkToAccountById";
import BindToChainState from "../Utility/BindToChainState";
import {EquivalentValueComponent} from "../Utility/EquivalentValueComponent";
import Icon from "components/Icon/Icon";
import PropTypes from "prop-types";

class WorkerApproval extends React.Component {
    static propTypes = {
        worker: ChainTypes.ChainObject.isRequired,
        onAddVote: PropTypes.func, /// called with vote id to add
        onRemoveVote: PropTypes.func, /// called with vote id to remove
        vote_ids: PropTypes.object /// Set of items currently being voted for
    };

    static defaultProps = {
        tempComponent: "tr"
    };

    constructor(props) {
        super(props);
    }

    onApprove() {
        let addVotes = [],
            removeVotes = [];

        if (this.props.vote_ids.has(this.props.worker.get("vote_against"))) {
            removeVotes.push(this.props.worker.get("vote_against"));
        }

        if (!this.props.vote_ids.has(this.props.worker.get("vote_for"))) {
            addVotes.push(this.props.worker.get("vote_for"));
        }

        this.props.onChangeVotes(addVotes, removeVotes);
    }

    onReject() {
        let addVotes = [],
            removeVotes = [];

        if (this.props.vote_ids.has(this.props.worker.get("vote_against"))) {
            removeVotes.push(this.props.worker.get("vote_against"));
        }

        if (this.props.vote_ids.has(this.props.worker.get("vote_for"))) {
            removeVotes.push(this.props.worker.get("vote_for"));
        }

        this.props.onChangeVotes(addVotes, removeVotes);
    }

    render() {
        let {rank} = this.props;
        let worker = this.props.worker.toJS();
        let total_votes = worker.total_votes_for - worker.total_votes_against;
        let approvalState = this.props.vote_ids.has(worker.vote_for)
            ? true
            : this.props.vote_ids.has(worker.vote_against) ? false : null;

        let fundedPercent = 0;

        if (worker.daily_pay < this.props.rest) {
            fundedPercent = 100;
        } else if (this.props.rest > 0) {
            fundedPercent = this.props.rest / worker.daily_pay * 100;
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
            (!isExpired && total_votes < this.props.voteThreshold) ||
            !hasStarted;
        return (
            <tr className={approvalState ? "" : "unsupported"}>
                {isExpired ? null : (
                    <td
                        style={{
                            textAlign: "right",
                            paddingRight: 10,
                            paddingLeft: 0
                        }}
                    >
                        {rank}
                    </td>
                )}

                <td className="worker-id" style={{textAlign: "left"}}>
                    {worker.id}
                </td>

                <td className="worker-name" style={{textAlign: "left"}}>
                    <div
                        className="inline-block"
                        style={{paddingRight: 5, position: "relative", top: -1}}
                    >
                        <a
                            style={{
                                visibility:
                                    worker.url && worker.url.indexOf(".") !== -1
                                        ? "visible"
                                        : "hidden"
                            }}
                            href={worker.url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Icon name="share" title="icons.share" />
                        </a>
                    </div>
                    <div
                        data-tip={worker.name}
                        className="inline-block tooltip"
                    >
                        {worker.name}
                        <br />
                        <LinkToAccountById account={worker.worker_account} />
                    </div>
                </td>

                <td style={{textAlign: "right"}} className="hide-column-small">
                    <FormattedAsset
                        amount={total_votes}
                        asset="1.3.0"
                        decimalOffset={5}
                        hide_asset
                    />
                </td>

                {!isProposed ? null : (
                    <td style={{textAlign: "right"}}>
                        <FormattedAsset
                            amount={Math.max(
                                0,
                                this.props.voteThreshold - total_votes
                            )}
                            asset="1.3.0"
                            hide_asset
                            decimalOffset={5}
                        />
                    </td>
                )}

                <td>
                    {startDate} - {endDate}
                </td>

                {isExpired || isProposed ? null : (
                    <td
                        style={{textAlign: "right"}}
                        className="hide-column-small"
                    >
                        {utils.format_number(fundedPercent, 2)}%
                    </td>
                )}

                <td style={{textAlign: "right"}} className="hide-column-small">
                    <EquivalentValueComponent
                        hide_asset
                        fromAsset="1.3.0"
                        toAsset={this.props.preferredUnit}
                        amount={worker.daily_pay}
                    />
                </td>

                {isExpired || isProposed ? null : (
                    <td style={{textAlign: "right"}}>
                        {this.props.rest <= 0 ? (
                            "0.00"
                        ) : (
                            <EquivalentValueComponent
                                hide_asset
                                fromAsset="1.3.0"
                                toAsset={this.props.preferredUnit}
                                amount={this.props.rest}
                            />
                        )}
                    </td>
                )}

                <td
                    className="clickable"
                    onClick={
                        this.props.proxy
                            ? () => {}
                            : this[
                                  approvalState ? "onReject" : "onApprove"
                              ].bind(this)
                    }
                >
                    {!this.props.proxy ? (
                        <Icon
                            name={
                                approvalState
                                    ? "checkmark-circle"
                                    : "minus-circle"
                            }
                            title={
                                approvalState
                                    ? "icons.checkmark_circle.approved"
                                    : "icons.minus_circle.disapproved"
                            }
                        />
                    ) : (
                        <Icon name="locked" title="icons.locked.action" />
                    )}
                </td>
            </tr>
        );
    }
}

export default BindToChainState(WorkerApproval);
