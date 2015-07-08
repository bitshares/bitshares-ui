var db;
var idb_helper

module.exports = idb_helper = {

    set_graphene_db: _db => {
        db = _db
    },
    
    promise: (request, passthrough_object) => {
        return new Promise((resolve, reject) => {
            passthrough_object => {
                request.onsuccess = (evt) => {
                    if(passthrough_object == void 0)
                        resolve(evt)
                    else
                        resolve([evt, passthrough_object])
                }
            }(passthrough_object)
            request.onerror = (evt) => {
                var error = {
                    error:evt.target.error.message,
                    data: evt
                }
                console.log("ERROR idb_helper.promise request", error)
                reject(error)
            }
        })
    },
    
    add: (store, data_object, callback) => {
        return idb_helper.promise(
            store.add(data_object),
            data_object
        ).then( result => {
            var [ evt, data_object ] = result
            if ( evt.target.result != void 0)
                data_object.id = evt.target.result
            
            return callback ? callback(data_object) : data_object
        })
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
            let request = store.openCursor();
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
