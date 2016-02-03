import { List } from "immutable"
import Apis from "./src/ApiInstances"
import ChainStore from "./src/ChainStore"
import TransactionBuilder from "./src/TransactionBuilder"

module.exports = {
    
    Apis,
    ChainStore,
    TransactionBuilder,
    FetchChainObjects: ChainStore.FetchChainObjects,
    
    chain_types: require("./src/ChainTypes"),
    number_utils: require("./src/number_utils"),
    transaction_helper: require("./src/transaction_helper"),
    validation: require("./src/validation"),
    chain_config: require("./src/config"),
    lookup: require("./src/lookup"),
    
    /** Helper function for FetchChainObjects */
    fetchChain: (methodName, objectIds, timeout = 1900) => {
        
        let chainStore = require("./src/ChainStore")
        let method = ChainStore[methodName]
        if( ! method ) throw new Error("ChainStore does not have method " + methodName)
        
        let arrayIn = Array.isArray(objectIds)
        if( ! arrayIn ) objectIds = [ objectIds ]
        
        return chainStore.FetchChainObjects(method, List(objectIds), timeout)
            .then( res => arrayIn ? res : res.get(0) )
    }
    
}