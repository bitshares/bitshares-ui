import utils from "common/utils";
import Immutable from "immutable";

function createChainableTypeChecker(validate) {
    function checkType(isRequired, props, propName, componentName, location) {
        componentName = componentName || ANONYMOUS;
        if (props[propName] == null) {
            if (isRequired) {
                return new Error(
                    ("Required " + location + " `" + propName + "` was not specified in ") +
                    ("`" + componentName + "`.")
                );
            }
            return null;
        } else {
            return validate(props, propName, componentName, location);
        }
    }

    let chainedCheckType = checkType.bind(null, false);
    chainedCheckType.isRequired = checkType.bind(null, true);

    return chainedCheckType;
}

function objectIdChecker(props, propName, componentName, location) {
    componentName = componentName || "ANONYMOUS";
    if (props[propName]) {
        let value = props[propName];
        if (typeof value === "string") {
            return utils.is_object_id(value) ? null : new Error(`${propName} in ${componentName} should be an object id`);
        } else if (typeof value === "object") {
            // TODO: check object type (probably we should require an object to be a tcomb structure)
        } else {
            return new Error(`${propName} in ${componentName} should be an object id or object`);
        }
    }
    // assume all ok
    return null;
}

function keyChecker(props, propName, componentName, location) {
    componentName = componentName || "ANONYMOUS";
    if (props[propName]) {
        let value = props[propName];
        if (typeof value === "string") {
            // TODO: check if it's valid key
            return null
        } else {
            return new Error(`${propName} in ${componentName} should be a key string`);
        }
    }
    // assume all ok
    return null;
}

function assetChecker(props, propName, componentName, location) {
    componentName = componentName || "ANONYMOUS";
    if (props[propName]) {
        let value = props[propName];
        if (typeof value === "string") {
            // TODO: check if it's valid asset symbol or id
            return null
        } else {
            return new Error(`${propName} in ${componentName} should be an asset symbol or id`);
        }
    }
    // assume all ok
    return null;
}

function objectsListChecker(props, propName, componentName, location) {
    componentName = componentName || "ANONYMOUS";
    if (props[propName]) {
        let value = props[propName];
        if (Immutable.List.isList(value)) {
            return null
        } else {
            return new Error(`${propName} in ${componentName} should be Immutable.List`);
        }
    }
    // assume all ok
    return null;
}

function accountsListChecker(props, propName, componentName, location) {
    componentName = componentName || "ANONYMOUS";
    if (props[propName]) {
        let value = props[propName];
        console.log( "value: ", value )
        if (Immutable.List.isList(value)) {
            return null
        } else {
            return new Error(`${propName} in ${componentName} should be Immutable.List`);
        }
    }
    // assume all ok
    return null;
}


let ChainObject = createChainableTypeChecker(objectIdChecker);
let ChainAccount = createChainableTypeChecker(objectIdChecker);
let ChainKeyRefs = createChainableTypeChecker(keyChecker);
let ChainAddressBalances = createChainableTypeChecker(keyChecker);
let ChainAsset = createChainableTypeChecker(assetChecker);
let ChainObjectsList = createChainableTypeChecker(objectsListChecker);
let ChainAccountsList = createChainableTypeChecker(accountsListChecker);

export default {ChainObject, ChainAccount, ChainKeyRefs, ChainAddressBalances, ChainAsset, ChainObjectsList, ChainAccountsList};
