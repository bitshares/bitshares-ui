
import IndexedDbPersistence from "../src/IndexedDbPersistence"
import assert from "assert"
import { is } from "immutable"

const namespace = "testdb"
const dbDisk = ()=> new IndexedDbPersistence(namespace, true/*save*/)

describe('IndexedDb', ()=> {

    beforeEach(()=> dbDisk().open("default").then(db => db.setSaveToDisk(false)))
    
    it('open', ()=> dbDisk().open("default").then(db => db.close()))
    
    it('clear', ()=> dbDisk().open("default").then(db => db.clear()))
    
    it('save', ()=>{
        let db = dbDisk()
        return Promise.resolve()
        .then( ()=> db.open("default") )
        .then( ()=> db.setState({ "a":"b" }) )
        
        // this should close and re-open, however fakeIndexedDB always forgets state
        
        .then( ()=> assert( db.getState().has("a"), "expecting saved state") )
        .then( ()=> db.getAllKeys().then( keys => assert.equal(keys.length, 1, "expecting default key" )))
        .then( ()=> db.clear() )
    })

})