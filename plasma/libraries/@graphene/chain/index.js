import { List } from "immutable"

module.exports = {
    
    Apis: require("./src/ApiInstances").default,
    ChainStore: require("./src/ChainStore").default,
    TransactionBuilder: require("./src/TransactionBuilder").default,
    FetchChainObjects: require("./src/ChainStore").default.FetchChainObjects,
    
    chain_types: require("./src/ChainTypes"),
    number_utils: require("./src/number_utils"),
    transaction_helper: require("./src/transaction_helper"),
    validation: require("./src/validation"),
    chain_config: require("./src/config"),
    lookup: require("./src/lookup"),
    
    /** Helper function for FetchChainObjects */
    fetchChain: (methodName, objectIds, timeout = 1900) => {
        
        let chainStore = require("./src/ChainStore")
        let ChainStore = chainStore.default
        let method = ChainStore[methodName]
        if( ! method ) throw new Error("ChainStore does not have method " + methodName)
        
        let arrayIn = Array.isArray(objectIds)
        if( ! arrayIn ) objectIds = [ objectIds ]
        
        return chainStore.FetchChainObjects(method, List(objectIds), timeout)
            .then( res => arrayIn ? res : res.get(0) )
    }
    
}