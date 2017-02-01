import React from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import utils from "common/utils";
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset";
import VestingBalance from "../Utility/VestingBalance";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
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
        // console.log( "render...", worker);
        let total_votes = worker.total_votes_for - worker.total_votes_against;
        let total_days = 1;

        let approvalState = this.props.vote_ids.has(worker.vote_for) ? true :
        this.props.vote_ids.has(worker.vote_against) ? false :
        null;

        let approval = null;

        // console.log( "this.props.vote_ids: ", this.props.vote_ids )
        if( approvalState === true ) {
            approval = <Icon name="checkmark" />;
        }

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

        let startDate = counterpart.localize(new Date(worker.work_begin_date), { type: "date" });
        let endDate = counterpart.localize(new Date(worker.work_end_date), { type: "date" });

        let now = new Date();
        let isExpired = new Date(worker.work_end_date) <= now;

        return  (

            <tr>
                {isExpired ? null : <td style={{backgroundColor: fundedPercent > 0 ? "green" : "orange"}}>#{rank}</td>}

                <td colSpan={isExpired ? "2" : "1"}>
                    <div>{worker.name}</div>
                    <div style={{paddingTop: 5, fontSize: "0.85rem"}}>
                    {startDate} - {endDate}</div>
                </td>

                <td className="hide-column-small">
                    <div><LinkToAccountById account={worker.worker_account} /></div>
                    <div style={{paddingTop: 5, fontSize: "0.85rem"}}><a target="_blank" href={worker.url}>{displayURL}</a> </div>
                </td>

                <td className="hide-column-small">
                    <FormattedAsset amount={total_votes} asset="1.3.0" decimalOffset={5}/>
                </td>

                <td className="hide-column-small">
                    <FormattedAsset amount={worker.daily_pay} asset="1.3.0" decimalOffset={5}/>
                    {this.props.preferredUnit !== "1.3.0" ?<div style={{paddingTop: 5}}>
                        (<EquivalentValueComponent fromAsset="1.3.0" toAsset={this.props.preferredUnit} amount={worker.daily_pay}/>)
                    </div> : null}
                </td>

                <td className="hide-column-large">
                    {worker.worker[1].balance ?
                        <VestingBalance balance={worker.worker[1].balance} decimalOffset={5}/> :
                        worker.worker[1].total_burned ?
                        <span>(<FormattedAsset amount={worker.worker[1].total_burned} asset="1.3.0" decimalOffset={5} />)</span> :
                            null}
                </td>

                <td className="hide-column-small">
                    {utils.format_number(fundedPercent, 2)}%
                </td>

                <td style={{textAlign: "right"}}>
                    {approvalState !== true ?
                    <button className="button outline small success" onClick={this.onApprove.bind(this)}>
                    +
                    </button> :
                    <button className="button outline small info" onClick={this.onReject.bind(this)}>
                    -
                    </button>}
                </td>

                <td style={{padding: 0, textAlign: "center", backgroundColor: approvalState === true ? "green" : approvalState === false ? "red" : "transparent"}}>
                    {approval}
                </td>

                {/*<div className="button-group no-margin" style={{paddingTop: "1rem"}}>
                </div>*/}
            </tr>
        );
    }
}

export default BindToChainState(WorkerApproval);
