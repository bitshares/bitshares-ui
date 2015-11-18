import React from "react";
import Immutable from "immutable";
import {PropTypes} from "react";
import Translate from "react-translate-component";
import AutocompleteInput from "../Forms/AutocompleteInput";
import counterpart from "counterpart";
import LoadingIndicator from "../LoadingIndicator";
import AccountSelector from "./AccountSelector";
import utils from "common/utils";
import WalletApi from "rpc_api/WalletApi";
import WalletDb from "stores/WalletDb.js"
import ChainStore from "api/ChainStore";
import validation from "common/validation"
import AccountImage from "./AccountImage";
import {FetchChainObjects} from "api/ChainStore";
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
   }
   constructor( props ) {
      super(props);
   }

   onApprove() {
      if( this.props.vote_ids.has( this.props.worker.get("vote_for") ) )
         this.props.onRemoveVote( this.props.worker.get("vote_for") );
      else
         this.props.onAddVote( this.props.worker.get("vote_for") );
   }

   onReject() {
      if( this.props.vote_ids.has( this.props.worker.get("vote_against") ) )
         this.props.onRemoveVote( this.props.worker.get("vote_against") );
      else
         this.props.onAddVote( this.props.worker.get("vote_against") );
   }

   render() {
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

      return  (
      <div style={{padding: "0.5em 0.5em"}} className="grid-content account-card worker-card">
         <div className="card">
            <div className="card-divider text-center info">
               <span> {worker.name} </span>
            </div>
            <div className="card-section">
               <ul >
                  <li>
                     <span><Translate content="account.votes.worker_account" />:&nbsp;<LinkToAccountById account={worker.worker_account} /> </span>
                  </li>
                  <li>
                     <div><Translate content="account.votes.url" />:&nbsp;<a target="_blank" href={worker.url}>{worker.url}</a> </div>
                  </li>
                  <li>
                     <Translate content="account.votes.total_votes" />: <FormattedAsset amount={total_votes} asset="1.3.0" /><br/>
                  </li>
                  <li>
                     <Translate content="account.votes.daily_pay" />: <FormattedAsset amount={worker.daily_pay} asset="1.3.0" /><br/>
                  </li>
                  <li>
                     <Translate content="account.votes.max_pay" />: <FormattedAsset amount={worker.daily_pay*total_days} asset="1.3.0" /><br/>
                  </li>
                  <li>
                     <Translate content="account.votes.unclaimed" />: <VestingBalance balance={worker.worker[1].balance} /> <br/>
                  </li>
                  <li>
                     <Translate content="account.votes.status.title" />: {approval} <br/>
                  </li>
                  <li>
                     Id: {this.props.worker.get("id")} <br/>
                  </li>
               </ul>

               <div className="button-group no-margin" style={{paddingTop: "1rem"}}>
                  <button className="button success" onClick={this.onApprove.bind(this)}>
                     <Translate content="account.votes.approve_worker"/>
                  </button>

                  <button className="button info" onClick={this.onReject.bind(this)}>
                     <Translate content="account.votes.reject_worker"/>
                  </button>
               </div>
            </div>

         </div>
      </div>
      )
   }

}

export default WorkerApproval
