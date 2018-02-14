import React from "react";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import {ChainTypes as GraphChainTypes} from "bitsharesjs/es";
import Notify from "notifyjs";
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

    _isOperationTransfer(operation) {
        return this._getOperationName(operation) === "transfer";
    }

    _isTransferToMyAccount(operation) {
        if (!this._isOperationTransfer(operation))
            throw Error("Operation is not transfer");

        return operation.getIn(["op", 1, "to"]) === this.props.account.get("id");
    }

    _notifyUserAboutTransferToHisAccount(/*operation*/) {
        this.notifyUsingBrowserNotification({
            title: "Money received",
            body: "Somebody sent some coins for you! Nice day!",
            closeOnClick: true,
        });
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.account.size && this.props.account.get("history")) {

            let lastOperation = this.props.account.get("history").first();

            if(this._isOperationTransfer(lastOperation) && this._isTransferToMyAccount(lastOperation)) {
                this._notifyUserAboutTransferToHisAccount(lastOperation);
            }

        }
    }

    notifyUsingBrowserNotification(params = {}) {

        /*
        * params.title (string) - title of notification
        * params.body (string) - body of notification
        * params.showTimeout (number) - number of seconds to show the notification
        * params.closeOnClick (boolean) - close the notification when clicked. Useful in chrome where the notification remains open until the timeout or the x is clicked.
        * params.onNotifyShow (function) - callback when notification is shown
        * params.onNotifyClose (function) - callback when notification is closed
        * params.onNotifyClick (function) - callback when notification is clicked
        * params.onNotifyError (function) - callback when notification throws an error
        * */

        if(!params.title && !params.body)
            return null;

        const notifyParams = {
            body: params.body
        };

        if(typeof params.onNotifyShow === "function")
            notifyParams.notifyShow = params.onNotifyShow;

        if(typeof params.onNotifyClose === "function")
            notifyParams.notifyClose = params.onNotifyShow;

        if(typeof params.onNotifyClick === "function")
            notifyParams.notifyClick = params.onNotifyShow;

        if(typeof params.onNotifyError === "function")
            notifyParams.notifyError = params.onNotifyShow;

        const notify = new Notify(params.title, notifyParams);

        notify.show();
    }

    render() {
        return (
            null
        );
    }

}

BrowserNotifications = BindToChainState(BrowserNotifications, {keep_updating: true});

export default BrowserNotifications;