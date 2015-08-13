import React from "react";
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
          new_budget:   null ///< the new budget specified by the user
       }
       this.map_accounts = { account_name: "account" }
    }

    onUpdate( next_props = null, next_state = {} )
    {
       if( !next_props ) next_props = this.props

       let acnt = ChainStore.getAccount( next_props.account_name, this.onUpdate.bind(this,null,{}) )
       if( acnt ) {
          let current_proxy_id = acnt.get('options').get('voting_account')
          if( current_proxy_id == "1.2.0" ) next_state.current_proxy = null
          else {
            let proxy_acnt = ChainStore.getAccount( current_proxy_id, this.onUpdate.bind(this,null,{}) ) 
            if( proxy_acnt )
               next_state.current_proxy = proxy_acnt.get('name')
          }
       }

       if( next_state.new_witness == undefined && this.state.new_witness )
          next_state.new_witness = this.state.new_witness

       if( next_state.new_witness )
       {
          if( next_state.new_witness.length > 2 )
             next_state.current_add_witness = ChainStore.getWitness( next_state.new_witness, this.onUpdate.bind(this,null,{}) )
          else
             next_state.current_add_witness = null

          if( !next_state.current_add_witness && next_state.new_witness && next_state.new_witness.length > 2)
             next_state.current_add_witness_error = "Account is not a witness"
          else
             next_state.current_add_witness_error = null
       }

       this.setState(next_state)
    }

    componentWillReceiveProps( next_props ) {
       super.componentWillReceiveProps(next_props)
       this.onUpdate(next_props)
    }

    onProxyChange( new_proxy ) {
       this.setState( {new_proxy} )
    }
    onAddWitnessChange( new_witness ) {
       this.onUpdate( null, {new_witness} )
    }
    onAddWitness( new_witness ) {
       this.setState( {new_witness} )
    }

    onPublish(){
       if( !this.state.account ) return

       let updated_account = this.state.account.toJS()
       updated_account.options.voting_account = this.state.new_proxy ? this.state.new_proxy : "1.2.0"
       updated_account.new_options = updated_account.options
       updated_account.new_options.voting_account = this.getNewProxyID()
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
        console.log( "state: ", this.state )
        let current_input = this.state.new_proxy != null ? this.state.new_proxy : this.state.current_proxy
        let current_error = null



        let new_id = this.getNewProxyID()
        if( new_id && this.state.account && this.state.account.get('id') == new_id )
           current_error = "cannot proxy to yourself"

        let changed = this.state.account && 
                      new_id && 
                      !current_error 
                      && new_id != this.state.account.get('options').get('voting_account')

        let publish_buttons_class = "button" + (changed? "" : " disabled");
        let add_witness_button_class = "button" + (this.state.current_add_witness?"":" disabled")
        return (
                <div className="grid-block vertical">
                   <div className="grid-block shrink no-overflow">
                        <AccountSelector label="account.votes.proxy"
                                         error={current_error}
                                         placeholder="NONE"
                                         account={current_input}
                                         onChange={this.onProxyChange.bind(this)}
                                         ref="proxy_selector" />
                   </div>
                   <div className="grid-content no-overflow shrink">
                   <hr/>
                   </div>
                   <div className="grid-block shrink no-overflow">
                      <div className="grid-block no-overflow">
                        <AccountSelector label="account.votes.add_witness_label"
                                         error={this.state.current_add_witness_error}
                                         placeholder="Witness Account"
                                         account={this.state.new_witness}
                                         onChange={this.onAddWitnessChange.bind(this)}
                                         onAction={this.onAddWitness.bind(this)}
                                         action_class={add_witness_button_class}
                                         action_label="account.votes.add_witness"
                                         ref="add_witness_selector" />
                      </div>
                   </div>

                    <div className="grid-block">
                        <Tabs>
                            <Tabs.Tab title="Delegates">
                                <VotesTable
                                    />
                            </Tabs.Tab>
                            <Tabs.Tab title="Witnesses">
                                <VotesTable
                                    />
                            </Tabs.Tab>
                            <Tabs.Tab title="Budget">
                                <VotesTable
                                    />
                            </Tabs.Tab>
                          </Tabs>
                    </div>


                   <div className="grid-content no-overflow">
                        <button className={publish_buttons_class} 
                        onClick={this.onPublish.bind(this)}> 
                        <Translate content="account.votes.publish" /></button> 
                   </div>
                </div>
               )
           /*
            <div className="grid-content">
                <div className="content-block">
                    <div className="medium-4">
                    </div>
                </div>
                {my_proxy_account === "" ?
                    (
                    ) : null
                }
                <div className="content-block">
                    <div className="actions clearfix">
                        <button className={action_buttons_class} onClick={this.onPublish.bind(this)}><Translate content="account.perm.publish" /></button>
                        &nbsp; &nbsp;
                        <a href="#" className={action_buttons_class + " secondary"} onClick={this.onCancelChanges.bind(this)}><Translate content="account.perm.reset" /></a>
                    </div>
                </div>
            </div>
        );
        */
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
