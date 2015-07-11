var db
var idb_helper

module.exports = idb_helper = {

    set_graphene_db: database => {
        db = database
    },

    on_request_end: (request) => {
        return new Promise((resolve, reject) => {
            request.onsuccess = chain_event(request.onsuccess, resolve)
            request.onerror = chain_event(request.onerror, reject)
        })
    },
    
    on_transaction_end: (transaction) => {
        return new Promise((resolve, reject) => {
            transaction.oncomplete = chain_event(transaction.oncomplete, resolve)
            transaction.onerror = chain_event(transaction.onerror, reject)
            transaction.onabort = chain_event(transaction.onabort, reject)
        })
    },
    
    add: (store, object) => {
        (object) => {
            idb_helper.on_request_end(store.add(object)).then( event => {
                if ( event.target.result != void 0)
                    //todo does event provide the keyPath name? (instead of id)
                    object.id = event.target.result
                
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
                callback(cursor, e)
                if(!cursor)
                    resolve()
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

var chain_event = (on_event, callback) => {
   var existing_on_event = on_event
   var new_on_event = (event)=> {
       callback(event)
       if(existing_on_event)
           existing_on_event(event)
   }
   return new_on_event
}
