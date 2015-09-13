import React from "react";
import Notification from "react-foundation-apps/src/notification";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Operation from "../Blockchain/Operation";
import Immutable from "immutable";
import ChainStore from "api/ChainStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import {operations} from "chain/chain_types";

let ops = Object.keys(operations);

@BindToChainState({keep_updating: true})
class Notifier extends React.Component {
    
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.account.size && this.props.account.get("history")) {
            let ch = this.props.account.get("history").first().toJS();
            let nh = nextProps.account.get("history").first().toJS();
            if (nh && ch) {
                // Only trigger notifications for order fills
                if ( ops[nh.op[0]] === "fill_order" && ((!ch && nh.id) || (nh.id !== ch.id))) {
                    ZfApi.publish("account-notify", "open");
                    setTimeout(function() {ZfApi.publish("account-notify", "close"); }, 5000);
                }
            }
        }
    }

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.account.get("history"), this.props.account.get("history")) ||
            !Immutable.is(nextProps.account, this.props.account)
        );
    }

    render() {
        let {account} = this.props;

        if(!account) { return <div></div>; }

        let trx, info;

        if (this.props.account.get("history") && this.props.account.get("history").size) {
            trx = this.props.account.get("history").first().toJS();
            if (trx) {
                info = <Operation
                            key={trx.id}
                            op={trx.op}
                            result={trx.result}
                            block={trx.block_num}
                            current={account.get("id")}
                            hideDate={true}
                            hideFee={true}
                        />;
            }
        }

        if(!trx) { return <div></div>; }

        return (
            <Notification.Static id='account-notify' title={null} image="">
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
