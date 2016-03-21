
import { fromJS, Map, Set } from "immutable"
import assert from "assert"

/**
    By default, this will use the W3C `localStorage` global object to persist all state updates.
*/
export default class IndexedDbPersistence {
    
    /**
        Create and load any saved information from disk. 
        
        @arg {string} database unique to each object store.  Must contain only letters numbers a understore or dash.
        
        @arg {boolean} [saveToDisk = true] - Should operations also update the disk?  Calls to this.clear() or this.setState() (for example) will operate on RAM (false) or RAM and disk (true).
    */
    constructor(database, saveToDisk = true) {
        assert.equal(typeof database, "string", "database")
        
        const tryImpl = impl =>{try{ this.impl = impl() } catch(e){ return e }}
        tryImpl(()=> window.openDatabase ? (shimIndexedDB || indexedDB) : indexedDB )
        if( ! this.impl ) tryImpl(()=> indexedDB )
        if( ! this.impl ) tryImpl(()=> fakeIndexedDB )// unit tests
        if( ! this.impl ) throw tryImpl(()=> indexedDB )
        
        if("__useShim" in this.impl)
            this.impl.__useShim() //always use shim
        
        if( ! /[a-z0-9_-]+/i.test( database )) throw new TypeError(
            "Database name should match /[a-z0-9_-]+/i.")
        
        this.database = database
        this.saveToDisk = saveToDisk
        this.dbSave = dbSave.bind(this)
        this.dbGet = dbGet.bind(this)
        this.dbDel = dbDel.bind(this)
    }
    
    open(key) {
        if( key ) assert.equal(typeof key, "string", "database")
        this.key = key
        return new Promise( (resolve, reject) => {
            let req = this.impl.open(this.database)
            req.onerror = evt => reject(evt.target.error)
            req.onupgradeneeded = evt => {
                this.db = evt.target.result
                this.db.createObjectStore("key_value", { keyPath: "key" })
            }
            req.onsuccess = evt => {
                this.db = evt.target.result
                if( ! key)
                    resolve(this)
                else
                    resolve(this.dbGet().then(()=> this))
            }
        })
    }
    
    close() {
        this.db.close()
        this.db = null
        this.state = Map()
        this.status = undefined
    }
    
    /**
        @arg {boolean} [save = true] - True to save (and keep saving) or False to delete disk (and not re-save)
    */
    setSaveToDisk( save = true ) {
        
        assert.equal(typeof save, "boolean", "save")
        if( ! this.db )
            throw new Error("Database is not open")
        
        let p
        if( save === true ) {
            let stateStr = JSON.stringify(this.state.toJS(),null,0)
            p = this.dbSave(stateStr)
            
        } else if( save === false ) {
            p = this.dbDel()
        }
        this.saveToDisk = save
        return p
    }
    
    /**
        @arg {Immutable|object} newState gets merged with this.state.  If configured, save to disk.
    */
    setState(newState) {
        if( this.setSaveToDisk && ! this.db )
            throw new Error("Database is not open")
        
        if( newState === undefined || this.state === newState )
            return Promise.resolve()
        
        let prevState = this.state
        // isEmpty test allows the initial emtpy state to change data-types: Map to List
        this.state = this.state.isEmpty() ? fromJS(newState) : this.state.merge(newState)

        let p
        if( this.saveToDisk && this.state !== prevState) {
            let stateStr = JSON.stringify(this.state.toJS(),null,0)
            p = this.dbSave(stateStr)
        } else {
            this.status = "ok"
            p = Promise.resolve()
        }
        if( this.saveToDisk === false )
            this.status = "ok"
        
        return p
    }
    
    
    getState() {
        return this.state
    }
    
    /**
        Ensures that memory is cleared.  If save to disk is enabled, persistent storage is also cleared.
    */
    clear() {
        this.status = "error"
        let p
        if( this.saveToDisk )
            p = this.dbDel()
        else {
            p = Promise.resolve()
        }
        this.state = Map()
        this.status = "ok"
        return p
    }
    
    /** @return {Promise<array<string>>} - keys collected via this.open(key) */
    getAllKeys() {
        return new Promise( (resolve, reject) => {
            let transaction = this.db.transaction(["key_value"], "readonly")
            let store = transaction.objectStore("key_value")
            let request = store.openCursor()
            let keys = []
            request.onsuccess = evt => {
                let cursor = evt.target.result
                if(cursor) {
                    keys.push(cursor.value.key)
                    cursor.continue()
                } else
                    resolve(keys)
            }
            request.onerror = evt => {
                reject(evt.target.error)
            }
        })
    }
}

function dbSave(value) {
    assert(this.key, "key is required")
    return new Promise( (resolve, reject) => {
        let transaction = this.db.transaction(["key_value"], "readwrite")
        let store = transaction.objectStore("key_value")
        let request = store.put({ key: this.key, value })
        request.onsuccess = evt => {
            // console.log('dbSave', value)
            this.status = "ok"
            resolve()
        }
        request.onerror = evt => {
            this.status = "error"
            reject(evt.target.error)
        }
    })
}

function dbGet() {
    assert(this.key, "key is required")
    return new Promise( (resolve, reject) => {
        let transaction = this.db.transaction(["key_value"], "readonly")
        let store = transaction.objectStore("key_value")
        let request = store.get(this.key)
        request.onsuccess = evt => {
            var result = evt.target.result
            let stateStr = result ? result.value : null
            // console.log('dbGet result', evt.target.result, stateStr)
            this.state = stateStr ? fromJS(JSON.parse(stateStr)) : Map()
            this.status = "ok"
            resolve()
        }
        request.onerror = evt => {
            this.status = "error"
            reject(evt.target.error)
        }
    })
}

function dbDel() {
    assert(this.key, "key is required")
    return new Promise( (resolve, reject) => {
        let transaction = this.db.transaction(["key_value"], "readwrite")
        let store = transaction.objectStore("key_value")
        let request = store.delete(this.key)
        request.onsuccess = evt => {
            this.status = "ok"
            resolve()
        }
        request.onerror = evt => {
            this.status = "error"
            reject(evt.target.error)
        }
    })
}