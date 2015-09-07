var WebSocket = require('ws')
var Apis = require('../dl/src/rpc_api/ApiInstances');

var config = require( process.argv[2] ? process.argv[2] : './config.js' )


class RelayNode {
   constructor() {
      this.server      = undefined
      this.upstream    = undefined
      this.db_api      = undefined
      this.net_api      = undefined
      this.chain_props = undefined

      console.log( "config: \n", config )

      Apis.setRpcConnectionStatusCallback( s => { console.log( "status: ", s ); } );
      Apis.instance(config.api_host,config.api_port).init_promise.then(() => { this.onNewApiConnection(); });
   }

   onNewApiConnection() {
      console.log( "New Api Connection" );
      this.db_api        = Apis.instance().db_api();

      this.db_api.exec( 'set_subscribe_callback', [this.onChainStateUpdate.bind(this),true] );

      this.db_api.exec( 'get_dynamic_global_properties', [] )
                 .then( this.onDynamicChainState.bind(this),
                        error=>{ console.log( "onNewApiConnection error: ", error )});
      this.net_api = Apis.instance().network_api();
   }

   onChainStateUpdate( changes ) {
      changes[0].forEach( item => {
         if( item.id === "2.1.0" )
         {
            this.chain_props = item;
            this.db_api.exec( 'get_block', [item.head_block_number] )
                       .then( block => { 
                              if( block )
                              {
                                 this.onUpstreamBlock( block, JSON.stringify(['block',block]) ); 
                              }
                              else 
                                console.log( "UNABLE TO FIND BLOCK: ", item.head_block_number );
                              },
                              error => { console.log( "onChainStateUpdate error: ", error ); } );

            if( this.upstream && !this.upstream.synced )
               this.upstream.send(JSON.stringify( ['start', item.head_block_number + 1] ) );
         }
      } )
   }

   onDynamicChainState( chain_props ) {
      console.log( "Chain Props: ", chain_props );
      this.chain_props = chain_props;

      if( !config.upstream ) {
         this.startServer();
      } else {
         this.syncFromUpstream();
      }
   }

   startServer() {
        console.log( "Start Server: ", config.listen_port );
        this.server = new WebSocket.Server({port: config.listen_port});
        this.server.on('error', err =>  { console.log( "Server Error: ", err ); } )

        this.server.on('connection', con =>  {
            console.log( "ON NEW CONNECTION" );
            con.state = 'init'
            con.on('message', message =>  {
                 let msg = JSON.parse( message );
                 this.onDownstreamMessage( con, message )
            });
        });
   }

   syncFromUpstream() {
      let upstream = new WebSocket(config.upstream);
      upstream.on('open', () => {
        console.log( "connection opened" );
        upstream.send(JSON.stringify( ['start', this.chain_props.head_block_number + 1] ) );
      });
      upstream.on('message', this.onUpstreamMessage.bind(this) )
      upstream.on('close', () => { });
      upstream.on( 'error', e => { });

      this.upstream = upstream;
   }

   onUpstreamMessage( message ) {
      let msg = JSON.parse( message );
      let type = msg[0]
      let data = msg[1]

      switch( type ) {
         case 'block':
            this.onUpstreamBlock( data, message );
            break;
         case 'trx':
            this.onUpstreamTrx( data, message );
            break;
         case 'synced':
            this.upstream.synced = true
      }
   }

   onUpstreamBlock( block, message ) {
      if( !block ) throw Error( "invalid block" );
      this.net_api
          .exec( 'broadcast_block', [ block ] )
          .then( on_success =>{ this.downstreamBroadcast( message ); },
                 error => { console.log( "on UpstreamBlock error: ", error ); } );

   }

   onUpstreamTrx( trx, message ) {
      this.net_api
          .exec( 'broadcast_transaction', [ trx ] )
          .then( on_success =>{ this.downstreamBroadcast( message ); },
                 error => { console.log( "error: ", error ); } );
   }


   onDownstreamMessage( con, message ) {
      let msg = JSON.parse( message );
      let type = msg[0]
      let data = msg[1]

      switch( type ) {
         case 'block':
            this.onUpstreamBlock( con, data, message );
            break;
         case 'trx':
            this.onDownstreamTrx( con, data, message );
            break;
         case 'start':
            this.onDownstreamStartSync( con, data );
            break;
         case 'synced':
      }
   }

   onDownstreamStartSync( con, from_block_num )
   {
      this.db_api.exec( 'get_block', [from_block_num] )
                 .then( block => {
                           if( block ) 
                           {
                              con.send( JSON.stringify( ['block',block] ) );
                           }
                           else 
                           {
                             con.state = 'synced'
                             con.send( JSON.stringify( ['synced'] ) );
                             console.log( "chain is synced" );
                           }
                          
                        },
                        error => {
                           con.state = 'synced';
                        } );
   }

   onDownstreamBlock( con, block, message ) {
     this.db_net
         .exec( 'broadcast_block', [block] )
         .then( on_success => { 
                  if( this.upstream ) 
                  {
                    this.upstream.send( message );
                  }
                  else // this is the root node
                  {
                     onUpstreamMessage( message );
                  }
               },
               error => {
                  console.log( "downstream error: ", error )
               });
   }

   onDownstreamTrx( con, trx, message ) {
     this.db_api
         .exec( 'validate_transaction', [trx] )
         .then( on_success => { 
                  if( this.upstream ) 
                  {
                    this.upstream.send( message );
                  }
                  else // this is the root node
                  {
                     onUpstreamMessage( message );
                  }
               },
               error => {
                  console.log( "error: ", error )
               });
   }


   downstreamBroadcast( message ) {
      this.server.clients.forEach( client => { 
         if( client.state === 'synced' ) 
             client.send(message); 
      });
   }

   
}

let relay = new RelayNode();



console.log( "ready" );
