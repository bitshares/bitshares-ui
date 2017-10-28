import React from "react";
import counterpart from "counterpart";
import utils from "common/utils";
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset";
import LinkToAccountById from "../Utility/LinkToAccountById";
import BindToChainState from "../Utility/BindToChainState";
import {EquivalentValueComponent} from "../Utility/EquivalentValueComponent";
import Icon from "components/Icon/Icon";

class WorkerApproval extends React.Component{

    static propTypes = {
        worker: ChainTypes.ChainObject.isRequired ,
        onAddVote: React.PropTypes.func, /// called with vote id to add
        onRemoveVote: React.PropTypes.func, /// called with vote id to remove
        vote_ids: React.PropTypes.object  /// Set of items currently being voted for
    };

    static defaultProps = {
        tempComponent: "tr"
    };

    constructor( props ) {
        super(props);
    }

    onApprove() {
        let addVotes = [], removeVotes = [];

        if( this.props.vote_ids.has( this.props.worker.get("vote_against") ) ) {
            removeVotes.push(this.props.worker.get("vote_against"));
        }

        if( !this.props.vote_ids.has( this.props.worker.get("vote_for") ) ) {
            addVotes.push(this.props.worker.get("vote_for"));
        }

        this.props.onChangeVotes( addVotes, removeVotes);
    }

    onReject() {
        let addVotes = [], removeVotes = [];

        if( this.props.vote_ids.has( this.props.worker.get("vote_against") ) ) {
            removeVotes.push(this.props.worker.get("vote_against"));
        }

        if( this.props.vote_ids.has( this.props.worker.get("vote_for") ) ) {
            removeVotes.push(this.props.worker.get("vote_for"));
        }

        this.props.onChangeVotes( addVotes, removeVotes);
    }

    render() {
        let {rank} = this.props;
        let worker = this.props.worker.toJS();
        let total_votes = worker.total_votes_for - worker.total_votes_against;
        let approvalState = this.props.vote_ids.has(worker.vote_for) ? true :
            this.props.vote_ids.has(worker.vote_against) ? false :
            null;

        let displayURL = worker.url ? worker.url.replace(/http:\/\/|https:\/\//, "") : "";

        if (displayURL.length > 25) {
            displayURL = displayURL.substr(0, 25) + "...";
        }

        let fundedPercent = 0;

        if (worker.daily_pay < this.props.rest) {
            fundedPercent = 100;
        } else if (this.props.rest > 0) {
            fundedPercent = this.props.rest / worker.daily_pay * 100;
        }

        let startDate = counterpart.localize(new Date(worker.work_begin_date), { type: "date", format: "short_custom" });
        let endDate = counterpart.localize(new Date(worker.work_end_date), { type: "date", format: "short_custom" });

        let now = new Date();
        let isExpired = new Date(worker.work_end_date) <= now;
        return  (

            <tr className={approvalState ? "" : "unsupported"}>
                {isExpired ? null : <td style={{textAlign: "right", paddingRight: 10, paddingLeft: 0}}>{rank}</td>}

                <td style={{textAlign: "left"}} colSpan={isExpired ? "2" : "1"}>
                    <div className="inline-block" style={{paddingRight: 5, position: "relative", top: 2}}>
                        <a style={{visibility: worker.url && worker.url.indexOf(".") !== -1 ? "visible": "hidden"}} href={worker.url} target="_blank" rel="noopener noreferrer">
                            <Icon name="share" />
                        </a>
                    </div>
                    {worker.name.substr(0, 30)}{worker.name.length > 30 ? "..." : ""}
                </td>

                <td style={{textAlign: "left"}} className="hide-column-small">
                    <LinkToAccountById account={worker.worker_account} />
                </td>

                <td style={{textAlign: "right"}} className="hide-column-small">
                    <FormattedAsset amount={total_votes} asset="1.3.0" decimalOffset={5} hide_asset/>
                </td>

                <td style={{textAlign: "right"}} className="hide-column-small">
                    {utils.format_number(fundedPercent, 2)}%
                </td>

                <td>
                    {startDate} - {endDate}
                </td>

                <td style={{textAlign: "right"}} className="hide-column-small">
                    <EquivalentValueComponent hide_asset fromAsset="1.3.0" toAsset={this.props.preferredUnit} amount={worker.daily_pay}/>
                </td>

                <td
                    className="clickable"
                    onClick={this.props.proxy ? () => {} : this[approvalState ? "onReject" : "onApprove"].bind(this)}
                >
                    {!this.props.proxy ?
                        <Icon name={approvalState ? "checkmark-circle" : "minus-circle"} /> :
                        <Icon name="locked" />}
                </td>
            </tr>
        );
    }
}

export default BindToChainState(WorkerApproval);
