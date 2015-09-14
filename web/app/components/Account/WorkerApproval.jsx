import React from "react";
import Immutable from "immutable";
import {PropTypes} from "react";
import Translate from "react-translate-component";
import AutocompleteInput from "../Forms/AutocompleteInput";
import Tabs from "react-foundation-apps/src/tabs";
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
      console.log( "render...", worker);
      let total_votes = worker.total_votes_for - worker.total_votes_against; 
      let total_days = 1;
      let approval = "Neutral"

      console.log( "this.props.vote_ids: ", this.props.vote_ids )
      if( this.props.vote_ids.has( worker.vote_for ) && !this.props.vote_ids.has( worker.vote_against ) ) {
         approval = "Support"
      } else if( !this.props.vote_ids.has( worker.vote_for ) && this.props.vote_ids.has( worker.vote_against ) ) {
         approval = "Reject"
      }
      console.log( "worker: ", worker );

      return  (
      <div>
         <span> <LinkToAccountById account={worker.worker_account} /> </span>
         <span> {worker.name} </span>
         <div> {worker.url} </div>
         Total Votes: <FormattedAsset amount={total_votes} asset="1.3.0" /><br/>
         Daily Pay: <FormattedAsset amount={worker.daily_pay} asset="1.3.0" /><br/>
         Max Total Pay: <FormattedAsset amount={worker.daily_pay*total_days} asset="1.3.0" /><br/>
         Unclaimed Pay: <VestingBalance balance={worker.worker[1].balance} /> <br/>
         Status: {approval} <br/>
         

         <button className="button outline" onClick={this.onApprove.bind(this)}>
            <Translate content="account.votes.approve_worker"/>
         </button>

         <button className="button outline" onClick={this.onReject.bind(this)}>
            <Translate content="account.votes.reject_worker"/>
         </button>

      </div>
      )
   }

}

export default WorkerApproval
