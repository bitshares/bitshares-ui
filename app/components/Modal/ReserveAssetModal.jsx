import React from "react";
import BalanceComponent from "../Utility/BalanceComponent";
import counterpart from "counterpart";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";
import AssetActions from "actions/AssetActions";
import {ChainStore} from "tuscjs";
import {Asset} from "common/MarketClasses";
import AssetWrapper from "../Utility/AssetWrapper";
import {Modal, Button, Form, Alert} from "bitshares-ui-style-guide";

class ReserveAssetModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);

        this.onSubmit = this.onSubmit.bind(this);
    }

    componentWillReceiveProps(np) {
        if (
            np.asset &&
            this.props.asset &&
            np.asset.get("id") !== this.props.asset.get("id")
        ) {
            this.setState(this.getInitialState(np));
        }
    }

    getInitialState(props) {
        return {
            amount: 0,
            amountAsset: new Asset({
                amount: 0,
                asset_id: props.asset.get("id"),
                precision: props.asset.get("precision")
            })
        };
    }

    onAmountChanged({amount, asset}) {
        this.state.amountAsset.setAmount({real: amount});
        this.setState({amount, asset});
    }

    onSubmit() {
        AssetActions.reserveAsset(
            this.state.amountAsset.getAmount(),
            this.props.asset.get("id"),
            this.props.account.get("id")
        ).then(() => {
            this.state.amountAsset.setAmount({sats: 0});
            this.setState({amount: 0});
        });
        this.props.hideModal();
    }

    render() {
        let assetId = this.props.asset.get("id");

        let currentBalance =
            this.props.account &&
            this.props.account.get("balances", []).size &&
            !!this.props.account.getIn(["balances", assetId])
                ? ChainStore.getObject(
                      this.props.account.getIn(["balances", assetId])
                  )
                : null;
        if (!currentBalance) return null;

        return (
            <Modal
                visible={this.props.visible}
                onCancel={this.props.hideModal}
                title={counterpart.translate("modal.reserve.title")}
                footer={[
                    <Button type="primary" key="submit" onClick={this.onSubmit}>
                        {counterpart.translate("modal.reserve.submit")}
                    </Button>,
                    <Button onClick={this.props.hideModal} key="cancel">
                        {counterpart.translate("cancel")}
                    </Button>
                ]}
            >
                <Alert
                    message={counterpart.translate(
                        "modal.reserve.warning_message"
                    )}
                    type="warning"
                    showIcon
                    style={{marginBottom: "2em"}}
                />
                <Form layout="vertical">
                    <AmountSelector
                        label="modal.reserve.amount"
                        amount={this.state.amount}
                        onChange={this.onAmountChanged.bind(this)}
                        asset={assetId}
                        assets={[assetId]}
                        display_balance={
                            <div
                                onClick={() => {
                                    this.state.amountAsset.setAmount({
                                        sats: currentBalance.get("balance")
                                    });
                                    this.setState({
                                        amount: this.state.amountAsset.getAmount(
                                            {real: true}
                                        )
                                    });
                                }}
                            >
                                <BalanceComponent
                                    balance={this.props.account.getIn([
                                        "balances",
                                        assetId
                                    ])}
                                />
                            </div>
                        }
                        tabIndex={1}
                    />
                </Form>
            </Modal>
        );
    }
}

ReserveAssetModal = AssetWrapper(ReserveAssetModal, {
    propNames: ["asset"]
});

export default ReserveAssetModal;
