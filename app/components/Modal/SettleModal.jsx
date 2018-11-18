import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import BaseModal from "./BaseModal";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import MarketLink from "../Utility/MarketLink";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";
import BalanceComponent from "../Utility/BalanceComponent";
import WalletApi from "api/WalletApi";
import WalletDb from "stores/WalletDb";
import counterpart from "counterpart";
import {ChainStore} from "bitsharesjs";
import AmountSelector from "../Utility/AmountSelector";
import withWorthLessSettlementFlag from "../Utility/withWorthLessSettlementFlag";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import {Modal, Button} from "bitshares-ui-style-guide";

const WorthLessSettlementWarning = withWorthLessSettlementFlag(
    ({worthLessSettlement, asset, shortBackingAsset}) => {
        switch (worthLessSettlement) {
            case true:
                return (
                    <TranslateWithLinks
                        string="exchange.worth_less_settlement_warning"
                        keys={[
                            {
                                value: (
                                    <MarketLink
                                        base={asset.get("id")}
                                        quote={shortBackingAsset.get("id")}
                                    />
                                ),
                                arg: "market_link"
                            }
                        ]}
                    />
                );
            case undefined:
                return (
                    <Translate content="exchange.checking_for_worth_less_settlement" />
                );
            default:
                return null;
        }
    }
);

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

        this.onSubmit = this.onSubmit.bind(this);
    }

    onAmountChanged({amount, asset}) {
        this.setState({amount: amount});
    }

    onSubmit(e) {
        e.preventDefault();

        this.props.hideModal();

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
                <Translate content="exchange.balance" />
                :&nbsp;
                {currentBalance ? (
                    <BalanceComponent balance={currentBalance} />
                ) : (
                    "0 " + asset.get("symbol")
                )}
            </span>
        );

        const footer = [
            <Button key={"submit"} type="primary" onClick={this.onSubmit}>
                {counterpart.translate("modal.settle.submit")}
            </Button>,
            <Button key={"close"} onClick={this.props.hideModal}>
                {counterpart.translate("modal.close")}
            </Button>
        ];

        return (
            <Modal
                title={counterpart.translate("modal.settle.title", {
                    asset: asset.get("symbol")
                })}
                visible={this.props.visible}
                id={this.props.modalId}
                footer={footer}
                onCancel={this.props.hideModal}
                overlay={true}
                ref="settlement_modal"
            >
                <div className="grid-block vertical">
                    <form className="grid-block vertical full-width-content">
                        <WorthLessSettlementWarning asset={assetID} />
                        <div className="grid-container ">
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
                        </div>
                    </form>
                </div>
            </Modal>
        );
    }
}
ModalContent = BindToChainState(ModalContent);

class SettleModal extends React.Component {
    render() {
        return <ModalContent {...this.props} />;
    }
}

export default SettleModal;
