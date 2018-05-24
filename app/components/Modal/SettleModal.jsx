import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import BaseModal from "./BaseModal";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";
import BalanceComponent from "../Utility/BalanceComponent";
import WalletApi from "api/WalletApi";
import WalletDb from "stores/WalletDb";
import counterpart from "counterpart";
import {ChainStore} from "bitsharesjs/es";
import AmountSelector from "../Utility/AmountSelector";

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

    onAmountChanged({amount, asset}) {
        this.setState({amount: amount});
    }

    onSubmit(e) {
        e.preventDefault();
        ZfApi.publish("settlement_modal", "close");

        let precision = utils.get_asset_precision(
            this.props.asset.get("precision")
        );
        let amount = this.state.amount.replace(/,/g, "");
        amount *= precision;

        var tr = WalletApi.new_transaction();
        tr.add_type_operation("asset_settle", {
            fee: {
                amount: 0,
                asset_id: 0
            },
            account: this.props.account.get("id"),
            amount: {
                amount: amount,
                asset_id: this.props.asset.get("id")
            }
        });
        return WalletDb.process_transaction(tr, null, true)
            .then(result => {
                // console.log("asset settle result:", result);
                // this.dispatch(account_id);
                return true;
            })
            .catch(error => {
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

        let assetID = asset.get("id");

        let account_balances = account.get("balances");

        let currentBalance = null,
            balanceAmount = 0;

        account_balances &&
            account_balances.forEach(balance => {
                let balanceObject = ChainStore.getObject(balance);
                if (!balanceObject.get("balance")) {
                    return null;
                }
                if (balanceObject.get("asset_type") === assetID) {
                    currentBalance = balance;
                    balanceAmount = balanceObject.get("balance");
                }
            });

        let precision = utils.get_asset_precision(asset.get("precision"));
        let parsedAmount = amount ? amount.replace(/,/g, "") : 0;
        let submit_btn_class =
            parseFloat(parsedAmount) > 0 &&
            parseFloat(parsedAmount) * precision <= parseFloat(balanceAmount)
                ? "button success"
                : "button disabled";

        let balanceText = (
            <span>
                <Translate content="exchange.balance" />:&nbsp;
                {currentBalance ? (
                    <BalanceComponent balance={currentBalance} />
                ) : (
                    "0 " + asset.get("symbol")
                )}
            </span>
        );

        return (
            <form className="grid-block vertical full-width-content">
                <Translate
                    component="h3"
                    style={{textAlign: "center"}}
                    content="modal.settle.title"
                    asset={asset.get("symbol")}
                />
                <div className="grid-container " style={{paddingTop: "2rem"}}>
                    <div className="content-block">
                        <AmountSelector
                            label="modal.settle.amount"
                            amount={amount}
                            onChange={this.onAmountChanged.bind(this)}
                            display_balance={balanceText}
                            asset={assetID}
                            assets={[assetID]}
                            tabIndex={1}
                        />
                    </div>
                    <div className="content-block">
                        <input
                            type="submit"
                            className={submit_btn_class}
                            onClick={this.onSubmit.bind(this)}
                            value={counterpart.translate("modal.settle.submit")}
                        />
                    </div>
                </div>
            </form>
        );
    }
}
ModalContent = BindToChainState(ModalContent);

class SettleModal extends React.Component {
    constructor() {
        super();

        this.state = {open: false};
    }

    show() {
        this.setState({open: true}, () => {
            ZfApi.publish(this.props.modalId, "open");
        });
    }

    onClose() {
        this.setState({open: false});
    }

    render() {
        return !this.state.open ? null : (
            <BaseModal
                id={this.props.modalId}
                onClose={this.onClose.bind(this)}
                overlay={true}
                ref="settlement_modal"
            >
                <div className="grid-block vertical">
                    <ModalContent {...this.props} />
                </div>
            </BaseModal>
        );
    }
}

export default SettleModal;
