import React from "react";
import Immutable from "immutable";
import {PropTypes} from "react";
import Translate from "react-translate-component";
import AutocompleteInput from "../Forms/AutocompleteInput";
import counterpart from "counterpart";
import LoadingIndicator from "../LoadingIndicator";
import AccountSelector from "./AccountSelector";
import utils from "common/utils";
import { ChainStore } from "@graphene/chain";
import { validation } from "@graphene/chain"
import AccountImage from "./AccountImage";
import {FetchChainObjects} from "@graphene/chain";
import ChainTypes from "../Utility/ChainTypes";
import FormattedAsset from "../Utility/FormattedAsset";
import VestingBalance from "../Utility/VestingBalance";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import BindToChainState from "../Utility/BindToChainState";

@BindToChainState()
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
      if( this.props.vote_ids.has( this.props.worker.get("vote_against") ) )
         this.props.onRemoveVote( this.props.worker.get("vote_against") );
      else
         this.props.onAddVote( this.props.worker.get("vote_for") );
   }

   onReject() {
      if( this.props.vote_ids.has( this.props.worker.get("vote_for") ) ) {
         this.props.onRemoveVote( this.props.worker.get("vote_for") );
      }
      else
         this.props.onAddVote( this.props.worker.get("vote_against") );
   }

   render() {
      let {rank} = this.props;
      let worker = this.props.worker.toJS();
      // console.log( "render...", worker);
      let total_votes = worker.total_votes_for - worker.total_votes_against; 
      let total_days = 1;
      let approval = counterpart.translate("account.votes.status.neutral");

      // console.log( "this.props.vote_ids: ", this.props.vote_ids )
      if( this.props.vote_ids.has( worker.vote_for ) && !this.props.vote_ids.has( worker.vote_against ) ) {
         approval = counterpart.translate("account.votes.status.supported");
      } else if( !this.props.vote_ids.has( worker.vote_for ) && this.props.vote_ids.has( worker.vote_against ) ) {
         approval = counterpart.translate("account.votes.status.rejected");
      }

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

      let startDate = counterpart.localize(new Date(worker.work_begin_date), { type: 'date' });
      let endDate = counterpart.localize(new Date(worker.work_end_date), { type: 'date' });
      
      return  (

            <tr>
                  <td style={{backgroundColor: fundedPercent > 0 ? "green" : "orange"}}>#{rank}</td>

                  <td>
                     <div>{worker.name}</div>
                     <div style={{paddingTop: 5, fontSize: "0.85rem"}}>
                        {startDate} - {endDate}</div>
                  </td>
                  <td>
                     <div><LinkToAccountById account={worker.worker_account} /></div>
                     <div style={{paddingTop: 5, fontSize: "0.85rem"}}><a target="_blank" href={worker.url}>{displayURL}</a> </div>
                  </td>
                  <td>
                     <FormattedAsset amount={total_votes} asset="1.3.0" decimalOffset={5}/>
                  </td>
                  <td className="hide-column-small">
                     <FormattedAsset amount={worker.daily_pay} asset="1.3.0" decimalOffset={5}/>
                  </td>
                  <td className="hide-column-small">
                     {worker.worker[1].balance ? <VestingBalance balance={worker.worker[1].balance} decimalOffset={5}/> : worker.worker[1].total_burned ?
                     <span>(<FormattedAsset amount={worker.worker[1].total_burned} asset="1.3.0" decimalOffset={5} />)</span> : null}
                  </td>
                  <td className="hide-column-small">
                     {utils.format_number(fundedPercent, 2)}%
                  </td>
                  <td>
                     {approval}
                  </td>
                  <td>
                     {approvalState !== true ? 
                        <button className="button success" onClick={this.onApprove.bind(this)}>
                           <Translate content="account.votes.approve_worker"/>
                        </button> : null}
                  </td>

                  <td>
                     {approvalState !== false ? 
                        <button className="button info" onClick={this.onReject.bind(this)}>
                           <Translate content="account.votes.reject_worker"/>
                        </button> : null}

                  </td>
               {/*<div className="button-group no-margin" style={{paddingTop: "1rem"}}>
                  

                 
               </div>*/}
            </tr>
      )
   }

}

export default WorkerApproval
