var db;

module.exports = {

    set_graphene_db: _db => {
        db = _db
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
