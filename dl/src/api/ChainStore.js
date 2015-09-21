import Immutable from "immutable";
import utils from "../common/utils"
import Apis from "../rpc_api/ApiInstances.js"
import {object_type,impl_object_type} from "../chain/chain_types";
import validation from "common/validation"
import BigInteger from "bigi"


let op_history   = parseInt(object_type.operation_history, 10);
let limit_order  = parseInt(object_type.limit_order, 10);
let balance_type  = parseInt(object_type.balance, 10);
let vesting_balance_type  = parseInt(object_type.vesting_balance, 10);
let witness_object_type  = parseInt(object_type.witness, 10);
let worker_object_type  = parseInt(object_type.worker, 10);
let committee_member_object_type  = parseInt(object_type.committee_member, 10);
let account_object_type  = parseInt(object_type.account, 10);
let asset_object_type  = parseInt(object_type.asset, 10);

let order_prefix = "1." + limit_order + "."
let balance_prefix = "2." + parseInt(impl_object_type.account_balance,10) + "."
let account_stats_prefix = "2." + parseInt(impl_object_type.account_statistics,10) + "."
let asset_dynamic_data_prefix = "2." + parseInt(impl_object_type.asset_dynamic_data,10) + "."
let vesting_balance_prefix = "1." + vesting_balance_type + "."
let witness_prefix = "1." + witness_object_type + "."
let worker_prefix = "1." + worker_object_type + "."
let committee_prefix = "1." + committee_member_object_type + "."
let asset_prefix = "1." + asset_object_type + "."
let account_prefix = "1." + account_object_type + "."

const DEBUG = false

/**
 *  @brief maintains a local cache of blockchain state 
 *  
 *  The ChainStore maintains a local cache of blockchain state and exposes
 *  an API that makes it easy to query objects and receive updates when
 *  objects are available. 
 */
class ChainStore 
{
   constructor() {
      /** tracks everyone who wants to receive updates when the cache changes */
      this.subscribers = new Set()
      this.clearCache()
   }

   /**
    * Clears all cached state.  This should be called any time the network connection is
    * reset.
    */
   clearCache() {
      this.objects_by_id            = Immutable.Map()
      this.accounts_by_name         = Immutable.Map()
      this.assets_by_symbol         = Immutable.Map()
      this.account_ids_by_key       = Immutable.Map()
      this.balance_objects_by_address = Immutable.Map()
      this.get_account_refs_of_keys_calls = Immutable.Set()
      this.account_history_requests = new Map() ///< tracks pending history requests
      this.witness_by_account_id    = new Map()
      this.committee_by_account_id  = new Map()
      this.objects_by_vote_id       = new Map()
      this.subscribed = undefined
      this.fetching_get_full_accounts = new Set()
   }

   resetCache() {
       this.clearCache()
       this.init()
   }

   init() {
      return Apis.instance().db_api().exec( "set_subscribe_callback", [ this.onUpdate.bind(this), true ] )
          .then( v => { this.subscribed = true })
          .catch( error => {
            console.log( "Error: ", error )
           } )
   }

   onUpdate( updated_objects ) /// map from account id to objects
   {
      for( let a = 0; a < updated_objects.length; ++a )
      {
         for( let i = 0; i < updated_objects[a].length; ++i )
         {
            let obj = updated_objects[a][i]

            if( utils.is_object_id( obj ) ) /// the object was removed
               this.objects_by_id = this.objects_by_id.set( obj, null )
            else
               this._updateObject( obj, false )
         }
      }
      this.notifySubscribers()
   }

   notifySubscribers()
   {
      this.subscribers.forEach( (callback) => { callback() } )
   }

   /**
    *  Add a callback that will be called anytime any object in the cache is updated
    */
   subscribe( callback ) {
      if(this.subscribers.has(callback))
          console.error("Subscribe callback already exists", callback)
      this.subscribers.add( callback )
   }

   /**
    *  Remove a callback that was previously added via subscribe
    */
   unsubscribe( callback ) {
      if( ! this.subscribers.has(callback))
          console.error("Unsubscribe callback does not exists", callback)
      this.subscribers.delete( callback ) 
   }

   /** Clear an object from the cache to force it to be fetched again. This may
    * be useful if a query failed the first time and the wallet has reason to believe
    * it may succeede the second time.
    */
   clearObjectCache( id ) {
      this.objects_by_id = this.objects_by_id.delete(id)
   }

   /**
    * There are three states an object id could be in:
    *
    * 1. undefined       - returned if a query is pending
    * 3. defined         - return an object
    * 4. null            - query return null
    *
    */
   getObject( id )
   {
      if( !utils.is_object_id(id) )
         throw Error( "argument is not an object id: " + id )

      let result = this.objects_by_id.get( id )

      if( result === undefined )
         return this.fetchObject( id )
      if( result === true ) 
         return undefined

      return result
   }

   /**
    *  @return undefined if a query is pending
    *  @return null if id_or_symbol has been queired and does not exist
    *  @return object if the id_or_symbol exists 
    */
   getAsset( id_or_symbol ) 
   {
      if( !id_or_symbol )
         return null

      if( utils.is_object_id( id_or_symbol ) )
         return this.getObject( id_or_symbol )

      /// TODO: verify id_or_symbol is a valid symbol name

      let asset_id = this.assets_by_symbol.get( id_or_symbol )

      if( utils.is_object_id( asset_id ) )
         return this.getObject( asset_id )

      if( asset_id === null ) 
         return null

      if( asset_id === true ) 
         return undefined

      Apis.instance().db_api().exec( "lookup_asset_symbols", [ [id_or_symbol] ] )
          .then( asset_objects => {
                 console.log( "lookup symbol ", id_or_symbol )
              if( asset_objects.length && asset_objects[0] )
                 this._updateObject( asset_objects[0], true )
              else
                 this.assets_by_symbol = this.assets_by_symbol.set( id_or_symbol, null )
      }).catch( error => {
         console.log( "Error: ", error )
         this.assets_by_symbol = this.assets_by_symbol.delete( id_or_symbol )
      } )

      return undefined
   }

   /**
    *  @param the public key to find accounts that reference it
    *
    *  @return Set of account ids that reference the given key
    *  @return null if no accounts reference the given key
    *  @return undefined if the result is unknown
    *
    *  If this method returns undefined, then it will send a request to
    *  the server for the current set of accounts after which the
    *  server will notify us of any accounts that reference these keys
    */
   getAccountRefsOfKey( key )
   {
      if( this.get_account_refs_of_keys_calls.has(key) )
         return this.account_ids_by_key.get( key )
      else
      {
         this.get_account_refs_of_keys_calls = this.get_account_refs_of_keys_calls.add(key)
         Apis.instance().db_api().exec( "get_key_references", [ [key] ] )
         .then( vec_account_id => {
                  let refs = Immutable.Set()
                  vec_account_id = vec_account_id[0]
                  refs = refs.withMutations( r => {
                     for( let i = 0; i < vec_account_id.length; ++i ) {
                        r.add(vec_account_id[i]) 
                     }
                  } )
                  this.account_ids_by_key = this.account_ids_by_key.set( key, refs )
                  this.notifySubscribers()
                },
                error => {
                  this.account_ids_by_key             = this.account_ids_by_key.delete( key )
                  this.get_account_refs_of_keys_calls = this.get_account_refs_of_keys_calls.delete(key)
                  this.notifySubscribers()
                })
         return undefined
      }
      return undefined
   }

   /**
    * @return a Set of balance ids that are claimable with the given address
    * @return undefined if a query is pending and the set is not known at this time
    * @return a empty Set if no items are found
    *
    * If this method returns undefined, then it will send a request to the server for
    * the current state after which it will be subscribed to changes to this set.
    */
   getBalanceObjects( address )
   {
      let current = this.balance_objects_by_address.get( address )
      if( current === undefined )
      {
          /** because balance objects are simply part of the genesis state, there is no need to worry about
           * having to update them / merge them or index them in updateObject.
           */
          this.balance_objects_by_address = this.balance_objects_by_address.set( address, Immutable.Set() )
          Apis.instance().db_api().exec( "get_balance_objects", [ [address] ] )
              .then( balance_objects => {
                         let set = new Set()
                         for( let i = 0; i < balance_objects.length; ++i )
                         {
                            this._updateObject( balance_objects[i] )
                            set.add(balance_objects[i].id)
                         }
                         this.balance_objects_by_address = this.balance_objects_by_address.set( address, Immutable.Set(set) )
                         this.notifySubscribers()
                     },
                     error => {
                         this.balance_objects_by_address = this.balance_objects_by_address.delete( address )
                         this.notifySubscribers()
                     } )
      }
      return this.balance_objects_by_address.get( address )
   }

   
   /**
    *  If there is not already a pending request to fetch this object, a new
    *  request will be made.
    *
    *  @return null if the object does not exist,
    *  @return undefined if the object might exist but is not in cache
    *  @return the object if it does exist and is in our cache
    */
   fetchObject( id )
   {
      if( typeof id !== 'string' )
      {
         let result = []
         for( let i = 0; i < id.length; ++i )
            result.push( this.fetchObject( id[i] ) )
         return result
      }

      //console.log( "fetchObject: ", id )
      if( this.subscribed  !== true ) 
         return undefined

      if(DEBUG) console.log( "maybe fetch object: ", id )
      if( !utils.is_object_id(id) ) 
         throw Error( "argument is not an object id: " + id )

      if( id.substring( 0, 4 ) == "1.2." )
         return this.fetchFullAccount( id )
      
      let result = this.objects_by_id.get( id )
      if( result === undefined ) { // the fetch
         if(DEBUG) console.log( "fetching object: ", id )
         this.objects_by_id = this.objects_by_id.set( id, true )
         Apis.instance().db_api().exec( "get_objects", [ [id] ] ).then( optional_objects => {
                    //if(DEBUG) console.log('... optional_objects',optional_objects ? optional_objects[0].id : null)
                   for(let i = 0; i < optional_objects.length; i++) {
                       let optional_object = optional_objects[i]
                       if( optional_object )
                          this._updateObject( optional_object, true ) 
                       else 
                          this.objects_by_id = this.objects_by_id.set( id, null )
                   }
               }).catch( error => { // in the event of an error clear the pending state for id
                   console.log('!!! Chain API error',error)
                   this.objects_by_id = this.objects_by_id.delete(id)
               })
      }
      else if( result === true ) // then we are waiting a response
         return undefined
      return result // we have a response, return it
   }

   /**
    *  @return null if no such account exists
    *  @return undefined if such an account may exist, and fetch the the full account if not already pending
    *  @return the account object if it does exist
    */
   getAccount( name_or_id ) {
      if( utils.is_object_id(name_or_id) )
      {
         let account = this.getObject( name_or_id )
         if( account === undefined ) {
            return this.fetchFullAccount( name_or_id )
        }
        return account
      }
      else if( validation.is_account_name( name_or_id ) )
      {
         let account_id = this.accounts_by_name.get( name_or_id )
         if(account_id === null) return null; // already fetched and it wasn't found
         if( account_id === undefined ) // then no query, fetch it
            return this.fetchFullAccount( name_or_id )
         return this.getObject( account_id ) // return it
      }
      //throw Error( `Argument is not an account name or id: ${name_or_id}` )
   }

    /**
     * This method will attempt to lookup witness by account_id.
     * If witness doesn't exist it will return null, if witness is found it will return witness object,
     * if it's not fetched yet it will return undefined.
     * @param account_id - account id
     */
    getWitnessById(account_id) {
        let witness_id = this.witness_by_account_id.get(account_id);
        if (witness_id === undefined) {
            this.fetchWitnessByAccount(account_id);
            return undefined;
        }
        return witness_id ? this.getObject(witness_id) : null;
    }

    /**
     * This method will attempt to lookup committee member by account_id.
     * If committee member doesn't exist it will return null, if committee member is found it will return committee member object,
     * if it's not fetched yet it will return undefined.
     * @param account_id - account id
     */
    getCommitteeMemberById(account_id) {
        let cm_id = this.committee_by_account_id.get(account_id);
        if (cm_id === undefined) {
            this.fetchCommitteeMemberByAccount(account_id);
            return undefined;
        }
        return cm_id ? this.getObject(cm_id) : null;
    }

   /**
    * Obsolete! Please use getWitnessById
    * This method will attempt to lookup the account, and then query to see whether or not there is
    * a witness for this account.  If the answer is known, it will return the witness_object, otherwise
    * it will attempt to look it up and return null.   Once the lookup has completed on_update will 
    * be called.
    *
    * @param id_or_account may either be an account_id, a witness_id, or an account_name
    */
   getWitness( id_or_account )
   {
      let account = this.getAccount( id_or_account )
      if( !account ) return null
      let account_id = account.get('id') 

      let witness_id = this.witness_by_account_id.get( account_id )
      if( witness_id === undefined )
         this.fetchWitnessByAccount( account_id )
      return this.getObject( witness_id )
       
      if( validation.is_account_name(id_or_account) || (id_or_account.substring(0,4) == "1.2."))
      {
         let account = this.getAccount( id_or_account )
         if( !account ) 
         {
            this.lookupAccountByName( id_or_account ).then ( account => {
               if( !account ) return null

               let account_id = account.get('id') 
               let witness_id = this.witness_by_account_id.get( account_id )
               if( utils.is_object_id( witness_id ) ) 
                   return this.getObject( witness_id, on_update )

               if( witness_id == undefined )
                  this.fetchWitnessByAccount( account_id ).then( witness => {
                         this.witness_by_account_id.set( account_id, witness?witness.get('id'):null )
                         if( witness && on_update ) on_update()
                  })
            }, error => {
               let witness_id = this.witness_by_account_id.set( id_or_account, null )
            } )
         }
         else 
         {
            let account_id = account.get('id') 
            let witness_id = this.witness_by_account_id.get( account_id )
            if( utils.is_object_id( witness_id ) ) 
                return this.getObject( witness_id, on_update )

            if( witness_id == undefined )
               this.fetchWitnessByAccount( account_id ).then( witness => {
                      this.witness_by_account_id.set( account_id, witness?witness.get('id'):null )
                      if( witness && on_update ) on_update()
               })
         }
         return null
      }
      return null
   }

    // Obsolete! Please use getCommitteeMemberById
   getCommitteeMember( id_or_account, on_update = null )
   {
      if( validation.is_account_name(id_or_account) || (id_or_account.substring(0,4) == "1.2."))
      {
         let account = this.getAccount( id_or_account )
         
         if( !account ) 
         {
            this.lookupAccountByName( id_or_account ).then( account=>{
               let account_id = account.get('id') 
               let committee_id = this.committee_by_account_id.get( account_id )
               if( utils.is_object_id( committee_id ) ) return this.getObject( committee_id, on_update )

               if( committee_id == undefined )
               {
                  this.fetchCommitteeMemberByAccount( account_id ).then( committee => {
                       this.committee_by_account_id.set( account_id, committee ? committee.get('id') : null )
                       if( on_update && committee) on_update()
                       } ) 
               }
            }, error => {
               let witness_id = this.committee_by_account_id.set( id_or_account, null )
            })
         } 
         else 
         {
               let account_id = account.get('id') 
               let committee_id = this.committee_by_account_id.get( account_id )
               if( utils.is_object_id( committee_id ) ) return this.getObject( committee_id, on_update )

               if( committee_id == undefined )
               {
                  this.fetchCommitteeMemberByAccount( account_id ).then( committee => {
                       this.committee_by_account_id.set( account_id, committee ? committee.get('id') : null )
                       if( on_update && committee) on_update()
                       } ) 
               }
         }
      }
      return null
   }

   /**
    *
    * @return a promise with the witness object
    */
   fetchWitnessByAccount( account_id )
   {
      return new Promise( (resolve,reject ) => {
          Apis.instance().db_api().exec( "get_witness_by_account", [ account_id ] )
              .then( optional_witness_object => {
                   if( optional_witness_object )
                   {
                       this.witness_by_account_id = this.witness_by_account_id.set( optional_witness_object.witness_account, optional_witness_object.id )
                      let witness_object = this._updateObject( optional_witness_object, true )
                      resolve(witness_object)
                   }
                   else 
                   {
                       this.witness_by_account_id = this.witness_by_account_id.set( account_id, null )
                       this.notifySubscribers()
                      resolve(null)
                   }
              }, reject ) } )
   }
   /**
    *
    * @return a promise with the witness object
    */
   fetchCommitteeMemberByAccount( account_id )
   {
      return new Promise( (resolve,reject ) => {
          Apis.instance().db_api().exec( "get_committee_member_by_account", [ account_id ] )
              .then( optional_committee_object => {
                   if( optional_committee_object )
                   {
                      this.committee_by_account_id = this.committee_by_account_id.set( optional_committee_object.committee_member_account, optional_committee_object.id )
                      let committee_object = this._updateObject( optional_committee_object, true )
                      resolve(committee_object)
                   }
                   else 
                   {
                       this.committee_by_account_id = this.committee_by_account_id.set( account_id, null )
                       this.notifySubscribers()
                      resolve(null)
                   }
              }, reject ) } )
   }


   /**
    *  Fetches an account and all of its associated data in a single query
    *
    *  @param an account name or account id
    *
    *  @return undefined if the account in question is in the process of being fetched
    *  @return the object if it has already been fetched
    *  @return null if the object has been queried and was not found
    */
   fetchFullAccount( name_or_id )
   {
      if(DEBUG) console.log( "Fetch full account: ", name_or_id )

      let fetch_account = false
      if( utils.is_object_id(name_or_id) ) 
      {
         let current = this.objects_by_id.get( name_or_id )
          fetch_account = current === undefined
          if( !fetch_account ) return current;
      }
      else
      {
         if( !validation.is_account_name( name_or_id ) )
            throw Error( "argument is not an account name: " + name_or_id )

         let account_id = this.accounts_by_name.get( name_or_id )
         if( account_id === null ) return null
         else if( utils.is_object_id( account_id ) )
            return this.getAccount(account_id);
      }
      

      if( ! this.fetching_get_full_accounts.has(name_or_id) ) {
          this.fetching_get_full_accounts.add(name_or_id)
          //console.log( "FETCHING FULL ACCOUNT: ", name_or_id )
          Apis.instance().db_api().exec("get_full_accounts", [[name_or_id],true])
              .then( results => {
                 this.fetching_get_full_accounts.delete(name_or_id)
                 if(results.length === 0) {
                     this.objects_by_id = this.objects_by_id.set( name_or_id, null );
                     return;
                 }
                 let full_account = results[0][1]
                 if(DEBUG) console.log( "full_account: ", full_account )

                 let {
                     account,
                     vesting_balances,
                     statistics,
                     call_orders,
                     limit_orders,
                     referrer_name, registrar_name, lifetime_referrer_name,
                     votes
                 } = full_account

                 this.accounts_by_name = this.accounts_by_name.set( account.name, account.id )
                 account.referrer_name = referrer_name
                 account.lifetime_referrer_name = lifetime_referrer_name
                 account.registrar_name = registrar_name
                 account.balances = {}
                 account.orders = new Immutable.Set()
                 account.vesting_balances = new Immutable.Set()
                 account.balances = new Immutable.Map()
                 account.call_orders = new Immutable.Set()

                  account.vesting_balances = account.vesting_balances.withMutations(set => {
                      vesting_balances.forEach(vb => {
                          this._updateObject( vb, false );
                          set.add( vb.id );
                      });
                  });

                  votes.forEach(v => this._updateObject( v, false ));

                  account.balances = account.balances.withMutations(map => {
                      full_account.balances.forEach(b => {
                          this._updateObject( b, false );
                          map.set( b.asset_type, b.id );
                      });
                  });

                  account.call_orders = account.call_orders.withMutations(set => {
                      call_orders.forEach(co => {
                          this._updateObject( co, false )
                          set.add( co.id )
                      });
                  });

                 this._updateObject( statistics, false )
                 let updated_account = this._updateObject( account, false )
                 this.fetchRecentHistory( updated_account )
                 this.notifySubscribers()
         }, error => {
            console.log( "Error: ", error )
            if( utils.is_object_id(name_or_id) )
               this.objects_by_id = this.objects_by_id.delete( name_or_id )
            else
               this.accounts_by_name = this.accounts_by_name.delete( name_or_id )
         })
      }
   }

   getAccountMemberStatus( account ) {
      if( account === undefined ) return undefined
      if( account === null ) return "unknown" 
      if( account.get( 'lifetime_referrer' ) == account.get( 'id' ) )
         return "lifetime"
      let exp = new Date( account.get('membership_expiration_date') ).getTime()
      let now = new Date().getTime()
      if( exp < now )
         return "basic"
      return "annual" 
   }

   getAccountBalance( account, asset_type )
   {
      let balances = account.get( 'balances' )
      if( !balances ) 
         return 0

      let balance_obj_id = balances.get( asset_type )
      if( balance_obj_id )
      {
         let bal_obj = this.objects_by_id.get( balance_obj_id )
         if( bal_obj ) return bal_obj.get( 'balance' )
      }
      return 0
   }

   /**
    * There are two ways to extend the account history, add new more
    * recent history, and extend historic hstory. This method will fetch
    * the most recent account history and prepend it to the list of
    * historic operations.
    *
    *  @param account immutable account object
    *  @return a promise with the account history
    */
   fetchRecentHistory( account, limit = 100 )
   {
      // console.log( "get account history: ", account )
      /// TODO: make sure we do not submit a query if there is already one
      /// in flight...
        let account_id = account;
        if( !utils.is_object_id(account_id) && account.toJS ) 
           account_id = account.get('id')

        if( !utils.is_object_id(account_id)  )
           return
        
        account = this.objects_by_id.get(account_id)
        if( !account ) return
        

        let pending_request = this.account_history_requests.get(account_id)
        if( pending_request ) 
        {
           pending_request.requests++
           return pending_request.promise
        }
        else pending_request = { requests: 0 }


        let most_recent = "1." + op_history + ".0"
        let history = account.get( 'history' )

        if( history && history.size )  most_recent = history.first().get('id')


        /// starting at 0 means start at NOW, set this to something other than 0
        /// to skip recent transactions and fetch the tail
        let start = "1." + op_history + ".0"

        pending_request.promise = new Promise( (resolve, reject) => {
            Apis.instance().history_api().exec("get_account_history", 
                              [ account_id, most_recent, limit, start])
                .then( operations => {
                       let current_account = this.objects_by_id.get( account_id )
                       let current_history = current_account.get( 'history' )
                       if( !current_history ) current_history = Immutable.List()
                       let updated_history = Immutable.fromJS(operations);
                       updated_history = updated_history.withMutations( list => {
                              for( let i = 0; i < current_history.size; ++i )
                                  list.push( current_history.get(i) )
                                                      } )
                       let updated_account = current_account.set( 'history', updated_history )
                       this.objects_by_id = this.objects_by_id.set( account_id, updated_account )

                       //if( current_history != updated_history )
                       //   this._notifyAccountSubscribers( account_id )

                       let pending_request = this.account_history_requests.get(account_id)
                       this.account_history_requests.delete(account_id)
                       if( pending_request.requests > 0 )
                       {
                          // it looks like some more history may have come in while we were
                          // waiting on the result, lets fetch anything new before we resolve
                          // this query.
                          this.fetchRecentHistory(updated_account, limit ).then( resolve, reject )
                       }
                       else
                          resolve(updated_account)
                       }) // end then
                     })

        this.account_history_requests.set( account_id, pending_request )
        return pending_request.promise
   }

   //_notifyAccountSubscribers( account_id )
   //{
   //   let sub = this.subscriptions_by_account.get( account_id )
   //   let acnt = this.objects_by_id.get(account_id)
   //   if( !sub ) return
   //   for( let item of sub.subscriptions )
   //      item( acnt )
   //}

   /**
    *  Callback that receives notification of objects that have been
    *  added, remove, or changed and are relevant to account_id
    *
    *  This method updates or removes objects from the main index and
    *  then updates the account object with relevant meta-info depending
    *  upon the type of account
    */
   _updateAccount( account_id, payload )
   {
      let updates = payload[0]
      let acnt = this.objects_by_id.get(account_id)

      for( let i = 0; i < updates.length; ++i )
      {
         let update = updates[i]
         if( typeof update  == 'string' )
         {
            let old_obj = this._removeObject( update )

            if( update.search( order_prefix ) == 0 )
            {
                  acnt = acnt.setIn( ['orders'], set => set.delete(update) )
            }
            else if( update.search( vesting_balance_prefix ) == 0 )
            {
                  acnt = acnt.setIn( ['vesting_balances'], set => set.delete(update) )
            }
         }
         else
         {
            let updated_obj = this._updateObject( update )

            if( update.id.search( balance_prefix ) == 0 )
            {
               if( update.owner == account_id )
                  acnt = acnt.setIn( ['balances'], map => map.set(update.asset_type,update.id) )
            }
            else if( update.id.search( order_prefix ) == 0 )
            {
               if( update.owner == account_id )
                  acnt = acnt.setIn( ['orders'], set => set.add(update.id) )
            }
            else if( update.id.search( vesting_balance_prefix ) == 0 )
            {
               if( update.owner == account_id )
                  acnt = acnt.setIn( ['vesting_balances'], set => set.add(update.id) )
            }

            this.objects_by_id = this.objects_by_id.set( acnt.id, acnt )
         }
      }
      this.fetchRecentHistory( acnt ) 
   }


   /**
    *  Updates the object in place by only merging the set
    *  properties of object.  
    *
    *  This method will create an immutable object with the given ID if
    *  it does not already exist.
    *
    *  This is a "private" method called when data is received from the
    *  server and should not be used by others.
    *
    *  @pre object.id must be a valid object ID
    *  @return an Immutable constructed from object and deep merged with the current state
    */
   _updateObject( object, notify_subscribers )
   {
//      console.log( "update: ", object )
      if( object.id == "2.1.0" ) {
         object.participation = 100*(BigInteger(object.recent_slots_filled).bitCount() / 128.0)
      }

      let current = this.objects_by_id.get( object.id )
      if( !current ) 
         current = Immutable.Map(); 
      let prior   = current
      if( current === undefined || current === true )
         this.objects_by_id = this.objects_by_id.set( object.id, current = Immutable.fromJS(object) )
      else
      {
         this.objects_by_id = this.objects_by_id.set( object.id, current = current.mergeDeep( Immutable.fromJS(object) ) )
      }


      if( object.id.substring(0,balance_prefix.length) == balance_prefix )
      {
         let owner = this.objects_by_id.get( object.owner )
         if( owner === undefined || owner === null ) 
         {
            owner = {id:object.owner, balances:{ } }
            owner.balances[object.asset_type] = object.id
            owner = Immutable.fromJS( owner )
         }
         else
         {
            let balances = owner.get( "balances" );
            if( !balances ) 
               owner = owner.set( "balances", Immutable.Map() )
            owner = owner.setIn( ['balances',object.asset_type],  object.id )
         }
         this.objects_by_id = this.objects_by_id.set( object.owner, owner  )
      }
      else if( object.id.substring(0,account_stats_prefix.length) == account_stats_prefix )
      {
        // console.log( "HISTORY CHANGED" )
         let prior_most_recent_op = prior ? prior.get('most_recent_op') : "2.9.0"

         if( prior_most_recent_op != object.most_recent_op ) {
            this.fetchRecentHistory( object.owner );
         }
      }
      else if( object.id.substring(0,witness_prefix.length) == witness_prefix )
      {
         this.witness_by_account_id.set( object.witness_account, object.id )
         this.objects_by_vote_id.set( object.vote_id, object.id )
      }
      else if( object.id.substring(0,committee_prefix.length) == committee_prefix )
      {
         this.committee_by_account_id.set( object.committee_member_account, object.id )
         this.objects_by_vote_id.set( object.vote_id, object.id )
      }
      else if( object.id.substring(0,account_prefix.length) == account_prefix )
      {
         this.accounts_by_name = this.accounts_by_name.set( object.name, object.id )
      }
      else if( object.id.substring(0,asset_prefix.length) == asset_prefix )
      {
         this.assets_by_symbol = this.assets_by_symbol.set( object.symbol, object.id )
         let dynamic = current.get( 'dynamic' );
         if( !dynamic )
            this.getObject( object.dynamic_asset_data_id );
      }
      else if( object.id.substring(0,asset_dynamic_data_prefix.length) == asset_dynamic_data_prefix )
      {
         let asset_id = asset_prefix + object.id.substring( asset_dynamic_data_prefix.length )
         let asset_obj = this.objects_by_id.get( asset_id );
         if(asset_obj && asset_obj.set) asset_obj = asset_obj.set( 'dynamic', current );
         this.objects_by_id = this.objects_by_id.set( asset_id, asset_obj );
      }
      else if( object.id.substring(0,worker_prefix.length ) == worker_prefix )
      {
        this.objects_by_vote_id.set( object.vote_for, object.id );
        this.objects_by_vote_id.set( object.vote_against, object.id );
      }

      if( notify_subscribers )
         this.notifySubscribers()

      return current;
   }

   getObjectsByVoteIds( vote_ids )
   {
      let result = []
      let missing = []
      for( let i = 0; i < vote_ids.length; ++i )
      {
         let obj = this.objects_by_vote_id.get( vote_ids[i] )
         if( obj )
            result.push(this.getObject( obj ) )
         else
         {
            result.push( null )
            missing.push( vote_ids[i] )
         }
      }

      if( missing.length ) {
          // we may need to fetch some objects
          Apis.instance().db_api().exec( "lookup_vote_ids", [ missing ] )
              .then( vote_obj_array => {
                   console.log( "missing ===========> ", missing )
                   console.log( "vote objects ===========> ", vote_obj_array )
                   for( let i = 0; i < vote_obj_array.length; ++i )
                   {
                      if( vote_obj_array[i] )
                      {
                         this._updateObject( vote_obj_array[i] )
                      }
                   }
          }, error => console.log( "Error looking up vote ids: ", error ) )
      }
      return result
   }

    getObjectByVoteID( vote_id )
    {
        let obj_id = this.objects_by_vote_id.get( vote_id )
        if( obj_id ) return this.getObject( obj_id );
        return undefined;
    }
}

let chain_store = new ChainStore();

export default chain_store;

export function FetchChainObjects(method, object_ids, timeout) {
    let get_object = method.bind(chain_store);

    return new Promise((resolve, reject) => {

        let timeout_handle = null;

        function onUpdate(not_subscribed_yet = false) {
            let res = object_ids.map(id => get_object(id));
            if (res.findIndex(o => o === undefined) === -1) {
                if(timeout_handle) clearTimeout(timeout_handle);
                if(!not_subscribed_yet) chain_store.unsubscribe(onUpdate);
                resolve(res);
                return true;
            }
            return false;
        }

        let resolved = onUpdate(true);
        if(!resolved) chain_store.subscribe(onUpdate);

        if(timeout && !resolved) timeout_handle = setTimeout(() => {
            chain_store.unsubscribe(onUpdate);
            reject("timeout");
        }, timeout);

    });

}
