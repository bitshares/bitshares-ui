import utils from "common/utils";

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

let ChainObject = createChainableTypeChecker(objectIdChecker);
let ChainAccount = createChainableTypeChecker(objectIdChecker);
let ChainFullAccount = createChainableTypeChecker(objectIdChecker);

export default {ChainObject, ChainAccount, ChainFullAccount};
