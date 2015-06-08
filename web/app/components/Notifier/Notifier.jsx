import React from "react";
import Notification from "react-foundation-apps/lib/notification";
import ZfApi from "react-foundation-apps/lib/utils/foundation-api";
import FormattedAsset from "../Utility/FormattedAsset";
import {Link} from "react-router";
import TransactionRow from "../Account/TransactionRow";

class Notifier extends React.Component {

    componentWillReceiveProps(nextProps) {
        let id = nextProps.currentAccount.id;
        let ch = this.props.accountHistories.get(id);
        let nh = nextProps.accountHistories.get(id);
        if (nh && ch && nh[0]) {
            if ((!ch[0] && nh[0].id) || (nh[0].id !== ch[0].id)) {
                ZfApi.publish("account-notify", "open");
                setTimeout(function() {ZfApi.publish("account-notify", "close"); }, 10000);
            }
        }
    }

    shouldComponentUpdate(nextProps) {
        return (
                nextProps.accountHistories !== this.props.accountHistories ||
                nextProps.currentAccount !== this.props.currentAccount ||
                nextProps.assets !== this.props.assets
            );
    }

    render() {

        let {assets, account_id_to_name, currentAccount} = this.props;
        let id = currentAccount.id,
            trx, info;

        if (this.props.accountHistories.get(id)) {
            trx = this.props.accountHistories.get(id)[0];
            if (trx) {
                info = <TransactionRow op={trx.op} block={trx.block_num} accounts={account_id_to_name} assets={assets} current={currentAccount.name}/>;
            }
        }

        if(!trx) { return null; }

        return (
            <Notification.Static id='account-notify' title="New transaction" image="">
                <table className="table">
                    <tbody>
                        {info}
                    </tbody>
                </table>
            </Notification.Static>
        );
    }

}

export default Notifier;
