import React from "react";
import BalanceComponent from "../Utility/BalanceComponent";
import counterpart from "counterpart";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";
import {ChainStore, ChainTypes} from "bitsharesjs";
import {Asset} from "common/MarketClasses";
import AssetWrapper from "../Utility/AssetWrapper";
import {
    Modal,
    Button,
    Form,
    Alert,
    Tooltip,
    Input,
    Select
} from "bitshares-ui-style-guide";
import ApplicationApi from "../../api/ApplicationApi";

class CreateLockModal extends React.Component {
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
            targetType: null,
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

    onTargetTypeChanged(e) {
        this.setState({targetType: e});
    }

    canSubmit() {
        return this.state.targetType && this.state.amountAsset.hasAmount();
    }

    onSubmit() {
        ApplicationApi.createTicket(
            this.props.account,
            this.state.amountAsset.asset_id,
            this.state.amountAsset.getAmount(),
            this.state.targetType
        ).then(() => {
            this.state.amountAsset.setAmount({sats: 0});
            this.setState({
                amount: 0,
                numberOfPeriods: 1
            });
        });
        this.props.hideModal();
    }

    _getUnlockPeriod() {
        if (!this.state.targetType) return 0;
        const unlockPeriods = {
            0: 0,
            1: 180,
            2: 360,
            3: 720,
            4: Infinity
        };
        return unlockPeriods[this.state.targetType];
    }

    render() {
        console.log(this.props.asset);
        let assetId = this.props.asset.get("id");

        let currentBalance =
            this.props.account &&
            this.props.account.get("balances", []).size &&
            !!this.props.account.getIn(["balances", assetId])
                ? ChainStore.getObject(
                      this.props.account.getIn(["balances", assetId])
                  )
                : null;
        if (!currentBalance) {
            currentBalance = 0;
        } else {
            currentBalance = currentBalance.get("balance");
        }

        return (
            <div>
                {" "}
                asd asd
                <Modal
                    visible={this.props.visible}
                    onCancel={this.props.hideModal}
                    title={counterpart.translate("modal.create_lock.title")}
                    footer={[
                        <Button
                            type="primary"
                            key="submit"
                            onClick={this.onSubmit}
                            disabled={!this.canSubmit()}
                        >
                            {counterpart.translate("modal.create_lock.submit")}
                        </Button>,
                        <Button onClick={this.props.hideModal} key="cancel">
                            {counterpart.translate("cancel")}
                        </Button>
                    ]}
                >
                    <Alert
                        message={counterpart.translate(
                            "modal.create_lock.warning_message",
                            {lock_days: this._getUnlockPeriod()}
                        )}
                        type="warning"
                        showIcon
                        style={{marginBottom: "2em"}}
                    />
                    <Form layout="vertical">
                        <AmountSelector
                            label="modal.create_lock.amount"
                            amount={this.state.amount}
                            onChange={this.onAmountChanged.bind(this)}
                            asset={assetId}
                            assets={[assetId]}
                            display_balance={
                                <div
                                    onClick={() => {
                                        this.state.amountAsset.setAmount({
                                            sats: currentBalance
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
                        <Form.Item
                            label={counterpart.translate(
                                "modal.create_lock.targetType"
                            )}
                            validateStatus={
                                !this.state.targetType ? "warning" : ""
                            }
                            help={
                                !this.state.targetType
                                    ? counterpart.translate(
                                          "modal.create_lock.type_warning"
                                      )
                                    : ""
                            }
                        >
                            <Tooltip
                                placement="top"
                                title={counterpart.translate(
                                    "tooltip.create_lock_periods"
                                )}
                            >
                                <Select
                                    value={this.state.targetType}
                                    onChange={this.onTargetTypeChanged.bind(
                                        this
                                    )}
                                >
                                    {Object.keys(ChainTypes.ticket_type).map(
                                        key =>
                                            ChainTypes.ticket_type[key] != 0 ? (
                                                <Select.Option
                                                    key={
                                                        ChainTypes.ticket_type[
                                                            key
                                                        ]
                                                    }
                                                >
                                                    {ChainTypes.ticket_type[
                                                        key
                                                    ] +
                                                        ": " +
                                                        counterpart.translate(
                                                            "operation.ticket_types." +
                                                                key
                                                        )}
                                                </Select.Option>
                                            ) : null
                                    )}
                                </Select>
                            </Tooltip>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        );
    }
}

CreateLockModal = AssetWrapper(CreateLockModal, {
    propNames: ["asset"]
});

export default CreateLockModal;
