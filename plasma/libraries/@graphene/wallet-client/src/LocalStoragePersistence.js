
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
        let stateStr = localStorage.getItem(this.STATE)
        // console.log('stateStr', namespace, stateStr)
        this.state = stateStr ? fromJS(JSON.parse(stateStr)) : Map()
    }
    
    /**
        @arg {boolean} [save = true] - True to save (and keep saving) or False to delete disk (and not re-save)
    */
    setSaveToDisk( save = true ) {
        if( save === true ) {
            localStorage.setItem(this.STATE, JSON.stringify(this.state.toJS(),null,0))
        } else if( save === false ) {
            localStorage.removeItem(this.STATE)
        }
        this.saveToDisk = save
    }
    
    /**
        @arg {Immutable|object} newState gets merged with this.state.  If configured, save to disk.
    */
    setState(newState) {
        if( newState === undefined || this.state === newState )
            return
        
        // isEmpty test allows the initial emtpy state to change data-types: Map to List
        this.state = this.state.isEmpty() ? fromJS(newState) : this.state.merge(newState)
        if( this.saveToDisk )
            localStorage.setItem(this.STATE, JSON.stringify(this.state.toJS(),null,0))
    }
    
    getState() {
        return this.state
    }
    
    /**
        Ensures that memory is cleared.  If save to disk is enabled, persistent storage is also cleared.
    */
    clear() {
        if( this.saveToDisk ) localStorage.removeItem(this.STATE)
        this.state = Map()
    }
    
}