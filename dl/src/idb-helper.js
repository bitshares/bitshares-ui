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
                console.log("ERROR!!! - ", e.target.error.message);
                reject({
                    error:evt.target.error.message,
                    data: evt
                })
            }
        })
    },
    
    add: (store, data_object, callback) => {
        return idb_helper.promise(
            store.add(data_object),
            data_object
        ).then( result => {
            console.log('... result',result)
            var [ evt, data_object ] = result
            console.log('... data_object',data_object)
            if ( ! evt.target.result == void 0)
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
                    console.error( "----- transaction error -----", error )
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
                console.log("ERROR!!! open_store - can't get '`${store_name}`' cursor. ", e.target.error.message);
                reject({
                    message: e.target.error.message,
                    indexeddb_event: e
                });
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
