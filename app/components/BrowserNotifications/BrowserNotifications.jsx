import React from "react";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import {ChainTypes as GraphChainTypes, ChainStore} from "bitsharesjs/es";
import counterpart from "counterpart";
import utils from "common/utils";
import Notify from "notifyjs";
let {operations} = GraphChainTypes;

let OPERATIONS = Object.keys(operations);

class BrowserNotifications extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        settings: React.PropTypes.object
    };

    componentWillMount() {
        if (Notify.needsPermission) {
            Notify.requestPermission();
        }
    }

    componentWillReceiveProps(nextProps) {
        // if browser notifications disabled on settings we can skip all checks
        if (!nextProps.settings.get("browser_notifications").allow) {
            console.log("browser notifications disabled by settings");
            return false;
        }

        // if app not permitted to send notifications skip all checks
        if (Notify.needsPermission) {
            console.log(
                "browser notifications disabled by Browser Permissions"
            );
            return false;
        }

        if (
            nextProps.account &&
            this.props.account &&
            nextProps.account.size &&
            this.props.account.get("history") &&
            nextProps.account.get("history")
        ) {
            let lastOperationOld = this.props.account.get("history").first();
            let lastOperationNew = nextProps.account.get("history").first();
            if (!lastOperationNew || !lastOperationOld) return false;

            // if operations not updated do not notify user
            if (lastOperationNew.get("id") === lastOperationOld.get("id")) {
                return false;
            }

            if (
                this._isOperationTransfer(lastOperationNew) &&
                this._isTransferToMyAccount(lastOperationNew) &&
                nextProps.settings.get("browser_notifications").additional
                    .transferToMe
            ) {
                this._notifyUserAboutTransferToHisAccount(lastOperationNew);
            }
        }
    }

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

        return (
            operation.getIn(["op", 1, "to"]) === this.props.account.get("id")
        );
    }

    _notifyUserAboutTransferToHisAccount(operation) {
        const assetId = operation.getIn(["op", 1, "amount", "asset_id"]);
        const from = operation.getIn(["op", 1, "from"]);

        const amount = operation.getIn(["op", 1, "amount", "amount"]);

        if (!assetId || !from || !amount)
            throw Error("Operation has wrong format");

        const title = counterpart.translate(
            "browser_notification_messages.money_received_title",
            {
                from: this._getAccountNameById(from)
            }
        );

        const body = counterpart.translate(
            "browser_notification_messages.money_received_body",
            {
                amount: this._getRealAmountByAssetId(amount, assetId),
                symbol: this._getAssetSymbolByAssetId(assetId)
            }
        );

        this.notifyUsingBrowserNotification({
            title: title,
            body: body,
            closeOnClick: true
        });
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

        if (!params.title && !params.body) return null;

        const notifyParams = {
            body: params.body
        };

        if (typeof params.onNotifyShow === "function")
            notifyParams.notifyShow = params.onNotifyShow;

        if (typeof params.onNotifyClose === "function")
            notifyParams.notifyClose = params.onNotifyShow;

        if (typeof params.onNotifyClick === "function")
            notifyParams.notifyClick = params.onNotifyShow;

        if (typeof params.onNotifyError === "function")
            notifyParams.notifyError = params.onNotifyShow;

        const notify = new Notify(params.title, notifyParams);

        notify.show();
    }

    _getRealAmountByAssetId(amount, assetId) {
        const asset = ChainStore.getAsset(assetId);

        return utils.get_asset_amount(amount, asset);
    }

    _getAssetSymbolByAssetId(assetId) {
        const asset = ChainStore.getAsset(assetId);

        return asset.get("symbol");
    }

    _getAccountNameById(accountId) {
        const account = ChainStore.getAccount(accountId);
        if (!account) return "";
        return account.get("name");
    }

    render() {
        return null;
    }
}

BrowserNotifications = BindToChainState(BrowserNotifications, {
    keep_updating: true
});

export default BrowserNotifications;
