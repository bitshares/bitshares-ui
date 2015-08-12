import React from "react";
import ChainStore from "api/chain.js"
import utils from "common/utils";

/**
 * @brief provides automatic fetching and updating of chain data
 *
 * Any property that is an object id will automatically be converted into
 * a state variable that is either null or an Immutable object.   The
 * Immutable object will automatically be updated anytime it changes on the
 * blockchain.
 *
 * In addition to automatically fetching/subscribing to object IDs, this
 * component will also automatically fetch / subscribe to the full accounts
 * of any account listed in props.full_accounts.${account_x} = ${name_or_id} or
 * automatically look up non-full accounts for props.accounts.${account_y} = ${name_or_id}
 *
 * Example:
 *
 * this.props = { 
 *      asset: "1.3.0", 
 *      balance: "2.5.1", 
 *      accounts: { owner: "nathan", issuer: "1.2.3" },
 *      full_accounts: { owner: "sam", issuer: "1.2.6" }
 * }
 *
 * Gets converted to
 *
 * this.state = { 
 *      asset: Object, 
 *      balance: Object, 
 *      accounts: { owner: Object, issuer: Object },
 *      full_accounts: { owner: Object, issuer: Object }
 * }
 *
 */
class ChainComponent extends React.Component
{
   constructor( props ) {
      super(props)
      this.update = this.update.bind(this)
      this.map_accounts = {}
   }

   update()
   {
      //DEBUG console.log( "update chain component", this.props )
      let new_state = {}
      for( var key in this.props )
      {
         if( utils.is_object_id( this.props[key] ) )
            new_state[key] =  ChainStore.getObject( this.props[key], this.update, true )
      }

      if( this.map_accounts )
      {
         for( let key in this.map_accounts )
            new_state[this.map_accounts[key]] = ChainStore.getAccount( this.props[key], this.update )
      }

      if( 'accounts' in this.props && typeof this.props.accounts == 'object' )
      {
         let accounts = {}
         for( var account in this.props.accounts )
            accounts[account] = ChainStore.getAccount( this.props.accounts[account], this.update )
         new_state.accounts = accounts
      }
      if( 'full_accounts' in this.props && typeof this.props.full_accounts == 'object' )
      {
         let full_accounts = {}
         for( var account in this.props.full_accounts )
            full_accounts[account] = ChainStore.getAccount( this.props.full_accounts[account], this.update, true )
         new_state.full_accounts = full_accounts
      }
      //DEBUG console.log( "update chain component, new_state:", new_state )
      this.setState( new_state )
   }

   componentWillMount() { this.update() }

   componentWillReceiveProps( next_props ) {
      let new_state = {}
      for( let key in this.next_props )
      {
         if( utils.is_object_id( next_props[key] ) && next_props[key] != this.props[key] )
            new_state[key] =  ChainStore.getObject( this.props[key], this.update, true )
      }
      if( 'accounts' in next_props && typeof next_props.accounts == 'object' )
      {
         let accounts = {}
         for( let account in next_props.accounts )
            accounts[account] = ChainStore.getAccount( next_props.accounts[account], this.update )
         new_state.accounts = accounts
      }
      if( 'full_accounts' in next_props && typeof next_props.full_accounts == 'object' )
      {
         let full_accounts = {}
         for( let account in next_props.full_accounts )
            full_accounts[account] = ChainStore.getAccount( next_props.full_accounts[account], this.update, true )
         new_state.full_accounts = full_accounts
      }
      // unsubscribe from no longer used objects
      for( let key in this.props )
      {
         if( utils.is_object_id( this.props[key] ) && this.props[key] !== next_props[key] )
            ChainStore.unsubscribeFromObject( this.props[key], this.update )
      }

      if( this.map_accounts )
      {
         for( let key in this.map_accounts )
            new_state[this.map_accounts[key]] = ChainStore.getAccount( this.props[key], this.update )
      }

      this.setState( new_state )
   }

   componentWillUnmount()
   {
      for( var key in this.props )
      {
         if( utils.is_object_id( this.props[key] ) )
            ChainStore.unsubscribeFromObject( this.props[key], this.update )
      }
   }

}


export default ChainComponent;
