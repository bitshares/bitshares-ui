var db
var idb_helper

module.exports = idb_helper = {

    set_graphene_db: database => {
        db = database
    },
    
    trx_readwrite: object_stores => {
        return db.transaction(
            [object_stores], "readwrite"
        )
    },

    on_request_end: (request) => {
        //return request => {
        return new Promise((resolve, reject) => {
            request.onsuccess = new ChainEvent(
                request.onsuccess, resolve, request).event
            request.onerror = new ChainEvent(
                request.onerror, reject, request).event
        })
        //}(request)
    },
    
    on_transaction_end: (transaction) => {
        return new Promise((resolve, reject) => {
            transaction.oncomplete = new ChainEvent(
                transaction.oncomplete, resolve).event
            transaction.onabort = new ChainEvent(
                transaction.onabort, reject).event
        })
    },
    
    add: (store, object) => {
        return object => {
            var request = store.add(object)
            return idb_helper.on_request_end(request).then( event => {
                //DEBUG console.log('... object',object,'result',event.target.result,'event',event)
                if ( event.target.result != void 0) {
                    //todo does event provide the keyPath name? (instead of id)
                    object.id = event.target.result
                }
                return [ object, event ]
            })
        }(object)
    },
    
    cursor: (store_name, callback, transaction) => {
        return new Promise((resolve, reject)=>{
            if( ! transaction) {
                transaction = db.transaction(
                    [store_name], "readonly"
                )
                transaction.onerror = error => {
                    console.error("ERROR idb_helper.cursor transaction", error)
                    reject(error)
                }
            }
            
            let store = transaction.objectStore(store_name);
            let request = store.openCursor()
            request.onsuccess = e => {
                let cursor = e.target.result;
                var ret = callback(cursor, e)
                if(!cursor)
                    resolve(ret)
            };
            request.onerror = (e) => {
                var error = {
                    error: e.target.error.message,
                    data: e
                }
                console.log("ERROR idb_helper.cursor request", error)
                reject(error);
            };
            
        }).then()
    },
    
    autoIncrement_unique: (db, table_name, unique_index) => {
        db.createObjectStore(
            table_name, { keyPath: "id", autoIncrement: true }
        ).createIndex(
            "by_"+unique_index, unique_index, { unique: true }
        )
    }

}

class ChainEvent {
    constructor(existing_on_event, callback, request) {
        this.event = (event)=> {
           //DEBUG if(event.target.error) { console.log("---- transaction error ---->", event) }
           //event.request = request
           callback(event)
           if(existing_on_event)
               existing_on_event(event)
        }
    }
}

//var chain_event = (on_event, callback, request) => {
//   var existing_on_event = on_event
//   var new_on_event = (event)=> {
//       //if(event.target.error) {
//           //DEBUG console.log("---- transaction error ---->", event)
//       //}
//       callback(event, request)
//       if(existing_on_event)
//           existing_on_event(event)
//   }
//   return new_on_event
//}
