import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import FormattedAsset from "../Utility/FormattedAsset";
import utils from "common/utils";
import classNames from "classnames";
import BalanceComponent from "../Utility/BalanceComponent";
import WalletApi from "rpc_api/WalletApi";
import WalletDb from "stores/WalletDb";
import FormattedPrice from "../Utility/FormattedPrice";
import counterpart from "counterpart";
import {ChainStore} from "graphenejs-lib";

let wallet_api = new WalletApi();

import AccountSelector from "../Account/AccountSelector";
import AmountSelector from "../Utility/AmountSelector";

@BindToChainState({keep_updating: true})
class ModalContent extends React.Component {
    static propTypes = {
        asset: ChainTypes.ChainAsset.isRequired,
        account: ChainTypes.ChainAccount.isRequired
    };

    constructor() {
        super();
        this.state = {
            amount: 0
        };
    }

    onAmountChanged({amount,asset}) {
        this.setState({amount: amount});
    }

    onSubmit(e) {
        e.preventDefault();
        ZfApi.publish("settlement_modal", "close");

        let precision = utils.get_asset_precision(this.props.asset.get("precision"));
        let amount = this.state.amount.replace(/,/g, "");
        amount *= precision;

        var tr = wallet_api.new_transaction();
        tr.add_type_operation("asset_settle", {
            fee: {
                amount: 0,
                asset_id: 0
            },
            "account": this.props.account.get("id"),
            "amount": {
                "amount": amount,
                "asset_id": this.props.asset.get("id")
            }
        });
        return WalletDb.process_transaction(tr, null, true).then(result => {
            // console.log("asset settle result:", result);
            // this.dispatch(account_id);
            return true;
        }).catch(error => {
            console.error("asset settle error: ", error);
            return false;
        });

    }


    render() {
        let {asset, account} = this.props;
        let {amount} = this.state;

        if (!asset) {
            return null;
        }

        let assetID = asset.get('id');

        let account_balances = account.get("balances");

        let currentBalance = null, balanceAmount = 0;

        account_balances && account_balances.forEach( balance => {
            let balanceObject = ChainStore.getObject(balance);
            if (!balanceObject.get("balance")) {
                return null;
            }
            if (balanceObject.get("asset_type") === assetID) {
                currentBalance = balance;
                balanceAmount = balanceObject.get("balance");
            }
        })

        let precision = utils.get_asset_precision(asset.get("precision"));
        let parsedAmount = amount ? amount.replace(/,/g, "") : 0;
        let submit_btn_class = parseFloat(parsedAmount) > 0 && parseFloat(parsedAmount) * precision <= parseFloat(balanceAmount) ? "button success" : "button disabled";

        let balanceText = currentBalance ? (
            <span>
                <Translate content="exchange.balance"/>:&nbsp;
                <BalanceComponent balance={currentBalance}/>
            </span>) : null;

        return ( 
            <form className="grid-block vertical full-width-content">
                <Translate component="h3" content="modal.settle.title" asset={asset.get("symbol")} />
                <div className="grid-container " style={{paddingTop: "2rem"}}>
                    <div className="content-block" style={{maxWidth: "25rem"}}>
                        <AmountSelector label="modal.settle.amount"
                                        amount={amount}
                                        onChange={this.onAmountChanged.bind(this)}
                                        display_balance={balanceText}
                                        asset={ assetID  }
                                        assets={[assetID]}
                                        tabIndex={1}/>
                    </div>
                    <div className="content-block">
                        <input type="submit" className={submit_btn_class}
                               onClick={this.onSubmit.bind(this)}
                               value={counterpart.translate("modal.settle.submit")}/>
                    </div>
                </div>
            </form>
        );
    }

}


class SettleModal extends React.Component {

    show() {
        ZfApi.publish("settlement_modal", "open");
    }

    render() {
        return ( 
            <Modal id="settlement_modal" overlay={true} ref="settlement_modal">
                <Trigger close="settlement_modal">
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <div className="grid-block vertical">
                    <ModalContent {...this.props} />
                </div>
            </Modal>
        );
    }
}

export default SettleModal;
