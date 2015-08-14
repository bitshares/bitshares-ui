import React from "react";
import Immutable from "immutable";
import {PropTypes} from "react";
import Translate from "react-translate-component";
import AutocompleteInput from "../Forms/AutocompleteInput";
import VotesTable from "./VotesTable";
import BaseComponent from "../BaseComponent";
import Tabs from "react-foundation-apps/src/tabs";
import counterpart from "counterpart";
import LoadingIndicator from "../LoadingIndicator";
import AccountSelector from "./AccountSelector";
import ChainComponent from "../Utility/ChainComponent"
import utils from "common/utils";
import WalletApi from "rpc_api/WalletApi";
import WalletDb from "stores/WalletDb.js"
import ChainStore from "api/chain.js"
import validation from "common/validation"
import AccountImage from "./AccountImage";


let wallet_api = new WalletApi()
/**
 *   Parameters:
 *
 *   account - the ID of the account that should be updated
 *   account_name - the name of the account that is being used
 *
 */
class AccountVoting extends ChainComponent {

    constructor(props) {
       super(props)
       this.state = {
          current_proxy : null, ///< the proxy used by the blockchain
          new_proxy:      null, ///< the proxy specified by the user
          new_witness:   null, ///< the new delegate specified by the user
          new_committee:  null, ///< the new witness specified by the user
          new_budget:   null, ///< the new budget specified by the user
          changed : false,
          witnesses: new Immutable.Map(),
          committee: new Immutable.Map(),
          init_witnesses: new Immutable.Map(),
          init_committee: new Immutable.Map()
       }
       this.map_accounts = { account_name: "account" }
    }

    onUpdate( next_props = null, next_state = {} )
    {
       console.log( "======================> ON UPDATE!!! <======================" )
       if( !next_props ) next_props = this.props
       if( !next_state.init_witnesses ) next_state.init_witnesses = this.state.init_witnesses
       if( !next_state.init_committee ) next_state.init_committee = this.state.init_committee
       if( !next_state.changed  ) next_state.changed = this.state.changed

       let acnt = ChainStore.getAccount( next_props.account_name, this.onUpdate.bind(this,null,{}) )
       if( acnt ) {
          let current_proxy_id = acnt.get('options').get('voting_account')
          if( current_proxy_id == "1.2.0" ) next_state.current_proxy = null
          else {
            let proxy_acnt = ChainStore.getAccount( current_proxy_id, this.onUpdate.bind(this,null,{}) ) 
            if( proxy_acnt )
               next_state.current_proxy = proxy_acnt.get('name')
          }

          let votes = acnt.get('options').get('votes')
          //console.log( "==========================> current_votes: ", votes.toJS() )
          let vote_objs = ChainStore.getObjectsByVoteID( votes.toArray(), this.onUpdate.bind(this,null,{}) )
          //console.log( "result: ", vote_objs )
          
          for( let v = 0; v < vote_objs.length; ++ v )
          {
             let vote_id = votes.get(v)
           //  console.log( "Vote: ", vote_id ) 
             let obj = vote_objs[v]
           //  console.log( "Obj: ", (obj?obj.toJS():null) )
             if( obj )
             {
                let is_witness = false
                let account_id = obj.get( 'committee_member_account' )
                if( !account_id ) 
                {
                   account_id = obj.get( 'witness_account' )
                   is_witness = true
                }
                let acnt = ChainStore.getAccount( account_id, this.onUpdate.bind(this,null,{}) )
                if( acnt )
                {
                   if( is_witness )
                      next_state.init_witnesses = next_state.init_witnesses.set( acnt.get('name'), obj )
                   else
                      next_state.init_committee = next_state.init_committee.set( acnt.get('name'), obj )
                }
             }
          }
       }
       next_state.init_witnesses = next_state.init_witnesses.sort()
       next_state.init_committee = next_state.init_committee.sort()
       if( !next_state.changed )
       {
          next_state.witnesses = next_state.init_witnesses
          next_state.committee = next_state.init_committee
       }

       if( next_state.new_witness == undefined && this.state.new_witness )
          next_state.new_witness = this.state.new_witness

       if( next_state.new_committee == undefined && this.state.new_committee )
          next_state.new_committee = this.state.new_committee

       if( next_state.new_witness )
       {
          console.log( "next_state: ", next_state )
          if( this.state.witnesses.get( next_state.new_witness ) )
          {
             next_state.current_add_witness_error = "Already voting for this witness"
          }
          else
          {
             if( next_state.new_witness.length > 2 )
             {
                next_state.current_add_witness = ChainStore.getWitness( next_state.new_witness, this.onUpdate.bind(this,null,{}) )
                //console.log( "current add witness: ", next_state.current_add_witness )
             }
             else
                next_state.current_add_witness = null

             if( !next_state.current_add_witness && next_state.new_witness && next_state.new_witness.length > 2)
                next_state.current_add_witness_error = "Account is not a witness"
             else
                next_state.current_add_witness_error = null
          }
       }
       else
          next_state.current_add_witness = null


       if( next_state.new_committee )
       {
          if( this.state.committee.get( next_state.new_committee ) )
          {
             next_state.current_add_committee_error = "Already voting for this committee member"
          }
          else
          {
             if( next_state.new_committee.length > 2 )
                next_state.current_add_committee = ChainStore.getCommitteeMember( next_state.new_committee, this.onUpdate.bind(this,null,{}) )
             else
                next_state.current_add_committee = null

             if( !next_state.current_add_committee && next_state.new_committee && next_state.new_committee.length > 2)
                next_state.current_add_committee_error = "Account is not a committee canidate"
             else
                next_state.current_add_committee_error = null
          }
       }
       else
       {
          next_state.current_add_committee = null
       }
       this.setState(next_state)
    }

    componentWillReceiveProps( next_props ) {
       super.componentWillReceiveProps(next_props)
       this.onUpdate(next_props)
    }
    componentDidMount( ) {
       this.onUpdate()
    }

    onProxyChange( new_proxy ) {
       this.setState( {new_proxy} )
    }
    onAddWitnessChange( new_witness ) {
       this.onUpdate( null, {new_witness:new_witness,changed:true} )
    }
    onAddCommitteeChange( new_committee ) {
       this.onUpdate( null, {new_committee:new_committee,changed:true} )
    }

    onRemoveWitness( witness_to_remove )
    {
       console.log( "Add Witness", this.state.new_witness )
       let next_state = { 
            witnesses :  this.state.witnesses.delete( witness_to_remove ), changed: true
       }
       this.onUpdate( null, next_state )
    }
    onRemoveCommittee( member_to_remove )
    {
       console.log( "Add Commitee", this.state.new_committee )
       let next_state = { 
            committee :  this.state.committee.delete( member_to_remove ), changed : true
       }
       this.onUpdate( null, next_state )
    }
    onAddCommittee( ) {
       if( this.state.current_add_committee )
       {
          console.log( "Add Committee", this.state.new_committee )
          let next_state = { 
             new_committee : "",
             committee :  this.state.committee.set( this.state.new_committee, this.state.current_add_committee )
          }
          next_state.committee = next_state.committee.sort()
          this.onUpdate( null, next_state )
       }
    }

    onAddWitness( ) {
       if( this.state.current_add_witness )
       {
          console.log( "Add Witness", this.state.new_witness )
          let next_state = { 
             new_witness : "",
             witnesses :  this.state.witnesses.set( this.state.new_witness, this.state.current_add_witness )
          }
          next_state.witnesses = next_state.witnesses.sort()
          this.onUpdate( null, next_state )
       }
    }

    onPublish(){
       if( !this.state.account ) return

       let updated_account = this.state.account.toJS()
       updated_account.options.voting_account = this.state.new_proxy ? this.state.new_proxy : "1.2.0"
       updated_account.new_options = updated_account.options
       updated_account.new_options.voting_account = this.getNewProxyID()
       let witness_votes = this.state.witnesses.map( item => { console.log( "item:", item.toJS() ); return item.get('vote_id') } )
       let committee_votes = this.state.committee.map( item => { return item.get('vote_id') } )
       updated_account.new_options.num_committee = committee_votes.size
       updated_account.new_options.num_witness = witness_votes.size
       updated_account.new_options.votes = witness_votes.concat( committee_votes ).toArray()
       updated_account.new_options.votes = updated_account.new_options.votes.sort( (a,b)=>{ return parseInt(a.split(':')[1]) > parseInt(b.split(':')[1]) } )
      
       updated_account.account = updated_account.id
       console.log( "updated_account: ", updated_account)

       var tr = wallet_api.new_transaction();
       tr.add_type_operation("account_update", updated_account);
       return WalletDb.process_transaction(tr, null, true).then(result => {
           this.dispatch(account_name);
       }).catch(error => {
           console.log("[VoteActions.js] ----- publishChanges error ----->", error);
       });
    }

    getNewProxyID()
    {
       if( this.state.new_proxy == null) return null
       if( this.state.new_proxy == "" ) return "1.2.0"
       if( validation.is_account_name( this.state.new_proxy ) )
       {
          let acnt = ChainStore.getAccount( this.state.new_proxy, this.onUpdate.bind(this,null) )
          if( acnt ) return acnt.get( 'id' )
       }
       else {
          let id = "1.2."+this.state.new_proxy.substring(1) 
          let acnt = ChainStore.getAccount( id, this.onUpdate.bind(this,null) )
          if( acnt ) return acnt.get( 'id' )
       }
       return null
    }

    render() {
    //    console.log( "state: ", this.state )
    //    if( this.state.account ) console.log( "account: ", this.state.account.toJS() )
    //    if( this.state.init_witnesses ) console.log( "init_witnesses: ", this.state.init_witnesses.toJS() )
    //    if( this.state.init_committee ) console.log( "init_committee: ", this.state.init_committee.toJS() )

        let current_proxy_input = this.state.new_proxy != null ? this.state.new_proxy : this.state.current_proxy
        let current_proxy_error = null



        let new_id = this.getNewProxyID()
        if( new_id && this.state.account && this.state.account.get('id') == new_id )
            current_proxy_error = "cannot proxy to yourself"

        let proxy_is_set = new_id && new_id !== "1.2.0"

        let changed = this.state.account && 
                      new_id && 
                      !current_proxy_error
                      && new_id != this.state.account.get('options').get('voting_account')

        changed |= this.state.init_witnesses != this.state.witnesses
        changed |= this.state.init_committee != this.state.committee

        let publish_buttons_class = "button" + (changed? "" : " disabled");
        let add_witness_button_class = "button" + (this.state.current_add_witness?"":" disabled")
        let add_committee_button_class = "button" + (this.state.current_add_committee?"":" disabled")
        // console.log( "witnesses: ", this.state.witnesses.toJS() )

                              //<button className="button" onClick={this.onRemoveWitness.bind(this,name)}> Remove </button> 

        let witness_rows = this.state.witnesses.map( item => { 
             let witness = item.toJS()
             //console.log( "witness: ",witness )
             let witness_account = ChainStore.getAccount( witness.witness_account )
             let url  = witness.url 
             let name = witness_account.get('name')
             return (
                         <tr key={name}>
                            <td>
                                <button className="button outline" onClick={this.onRemoveWitness.bind(this, name)}>
                                <Translate content="account.votes.remove_witness" /></button> 
                            </td>
                            <td>
                               <AccountImage size={{height: 28, width: 28}} account={name} custom_image={null}/> 
                            </td>
                             <td>{name}</td>
                             <td>{url}</td>
                         </tr>
                    )} )

        let committee_rows = this.state.committee.map( item => { 
             let committee = item.toJS()
             //console.log( "committee: ",committee )
             let committee_account = ChainStore.getAccount( committee.committee_member_account )
             let url  = committee.url 
             let name = committee_account.get('name')
             return (
                         <tr key={name}>
                            <td>
                                <button className="button outline" onClick={this.onRemoveCommittee.bind(this, name)}>
                                <Translate content="account.votes.remove_committee" /></button> 
                            </td>
                            <td>
                               <AccountImage size={{height: 28, width: 28}} account={name} custom_image={null}/> 
                            </td>
                             <td>{name}</td>
                             <td>{url}</td>
                         </tr>
                    )} )




        let cw = ["30px", "30px", "10%", "90%"] ;
        return (
            <div className="grid-content">
                <div className="content-block">
                    <h3>Proxy</h3>
                    <AccountSelector label="account.votes.proxy"
                                     error={current_proxy_error}
                                     placeholder="NONE"
                                     account={current_proxy_input}
                                     onChange={this.onProxyChange.bind(this)}
                                     ref="proxy_selector"/>
                </div>
                <div className={"content-block" + (proxy_is_set ? " disabled" : "")}>
                    <h3>Witnesses</h3>
                    <AccountSelector label="account.votes.add_witness_label"
                                     error={this.state.current_add_witness_error}
                                     placeholder="New Witness Account"
                                     account={this.state.new_witness}
                                     onChange={this.onAddWitnessChange.bind(this)}
                                     onAction={this.onAddWitness.bind(this)}
                                     action_class={add_witness_button_class}
                                     action_label="account.votes.add_witness"
                                     ref="add_witness_selector"/>
                    <table className="table">
                        <thead>
                        <tr>
                            <th style={{width: cw[0]}}>ACTION</th>
                            <th style={{width: cw[1]}}></th>
                            <th style={{width: cw[2]}}><Translate content="account.votes.name"/></th>
                            <th style={{width: cw[3]}}><Translate content="account.votes.url"/></th>
                        </tr>
                        </thead>
                        <tbody>
                        {witness_rows}
                        </tbody>
                    </table>
                </div>
                <div className={"content-block" + (proxy_is_set ? " disabled" : "")}>
                    <h3>Committee</h3>
                    <AccountSelector label="account.votes.add_committee_label"
                                     error={this.state.current_add_committee_error}
                                     placeholder="New Committee Member"
                                     account={this.state.new_committee}
                                     onChange={this.onAddCommitteeChange.bind(this)}
                                     onAction={this.onAddCommittee.bind(this,this.state.new_committee)}
                                     action_class={add_committee_button_class}
                                     action_label="account.votes.add_committee"
                                     ref="add_committee_selector"/>
                    <table className="table">
                        <thead>
                        <tr>
                            <th style={{width: cw[0]}}>ACTION</th>
                            <th style={{width: cw[1]}}></th>
                            <th style={{width: cw[2]}}><Translate content="account.votes.name"/></th>
                            <th style={{width: cw[3]}}><Translate content="account.votes.url"/></th>
                        </tr>
                        </thead>
                        <tbody>
                        {committee_rows}
                        </tbody>
                    </table>
                </div>
                <div className="content-block">
                    <button className={publish_buttons_class} onClick={this.onPublish.bind(this)}>
                        <Translate content="account.votes.publish"/></button>
                </div>
            </div>
               )
    }
}


AccountVoting.defaultProps = {
    account_name: "",
    account_name_to_id: {}
};

AccountVoting.propTypes = {
    account_name: PropTypes.string.isRequired,
    account_name_to_id: PropTypes.object.isRequired
};

export default AccountVoting;
