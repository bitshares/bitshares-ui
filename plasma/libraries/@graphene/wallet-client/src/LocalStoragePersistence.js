
import { fromJS, Map } from "immutable"

/**
    By default, this will use the W3C `localStorage` global object to persist all state updates.
*/
export default class LocalStoragePersistence {
    
    /**
        Create and load any saved information from disk. 
        
        @arg {string} namespace unique to each object store.  Must contain only letters numbers a understore or dash.
        
        @arg {boolean} [saveToDisk = true] - Should operations also update the disk?  Calls to this.clear() or this.setState() (for example) will operate on RAM (false) or RAM and disk (true).
    */
    constructor(namespace, saveToDisk = true) {
        
        if( ! /[a-z0-9_-]+/i.test( namespace )) throw new TypeError(
            "@arg {string} namespace unique to each wallet.  Must match /[a-z0-9_-]+/i.")
        
        const key = "LocalStoragePersistence::" + namespace
        this.STATE = key
        this.saveToDisk = saveToDisk
        this.status = "error"
        let stateStr = localStorage.getItem(this.STATE)
        // console.log('stateStr', namespace, stateStr)
        this.state = stateStr ? fromJS(JSON.parse(stateStr)) : Map()
        this.status = "ok"
    }
    
    /**
        @arg {boolean} [save = true] - True to save (and keep saving) or False to delete disk (and not re-save)
    */
    setSaveToDisk( save = true ) {
        this.status = "error"
        if( save === true ) {
            localStorage.setItem(this.STATE, JSON.stringify(this.state.toJS(),null,0))
        } else if( save === false ) {
            localStorage.removeItem(this.STATE)
        }
        this.status = "ok"
        this.saveToDisk = save
    }
    
    /**
        @arg {Immutable|object} newState gets merged with this.state.  If configured, save to disk.
    */
    setState(newState) {
        if( newState === undefined || this.state === newState )
            return
        
        // isEmpty test allows the initial emtpy state to change data-types: Map to List
        let prevState = this.state
        this.status = "error"
        this.state = this.state.isEmpty() ? fromJS(newState) : this.state.merge(newState)
        if( this.saveToDisk && this.state !== prevState) {
            localStorage.setItem(this.STATE, JSON.stringify(this.state.toJS(),null,0))
        }
        this.status = "ok"
    }
    
    getState() {
        return this.state
    }
    
    /** If an implementation needed local storage wallets, this will fetch the list of wallet names. */
    // getAllKeys(prefix) {
    //     let wallet_names = Set()
    //     // const prefix = "LocalStoragePersistence::wallet::" + chain_config.address_prefix + "::"
    //     for(let i = 0; i < localStorage.length; i++) {
    //         // console.log('localStorage.key('+i+')', localStorage.key(i))
    //         let key = localStorage.key(i)
    //         if(key.indexOf(prefix) === 0) 
    //             wallet_names = wallet_names.add( key.substring(prefix.length) )
    //     }
    //     return wallet_names
    // }
    
    /**
        Ensures that memory is cleared.  If save to disk is enabled, persistent storage is also cleared.
    */
    clear() {
        this.status = "error"
        if( this.saveToDisk ) localStorage.removeItem(this.STATE)
        this.state = Map()
        this.status = "ok"
        return this
    }
    
}