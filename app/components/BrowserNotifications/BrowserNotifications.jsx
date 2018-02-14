import React from "react";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import {ChainTypes as GraphChainTypes} from "bitsharesjs/es";
let {operations} = GraphChainTypes;

let OPERATIONS = Object.keys(operations);

class BrowserNotifications extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };

    _getOperationName(operation) {
        if (operation.getIn(["op", 0]) !== undefined)
            return OPERATIONS[operation.getIn(["op", 0])];
        return null;
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.account.size && this.props.account.get("history")) {

            // there should be check for operation type and notification about it

            // nextProps.account.get("history").forEach((operation) => {
            //     console.log(this._getOperationName(operation));
            // });

        }
    }

    render() {
        return (
            null
        );
    }

}

BrowserNotifications = BindToChainState(BrowserNotifications, {keep_updating: true});

export default BrowserNotifications;