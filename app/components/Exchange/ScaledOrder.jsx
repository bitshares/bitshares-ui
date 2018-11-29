import React, {Component} from "react";
import {
    Modal,
    Form,
    Input,
    InputNumber,
    Button,
    Row,
    Col,
    Radio
} from "bitshares-ui-style-guide";
import {Validation} from "services/Validation/Validation";
import {
    SCALED_ORDER_DISTRIBUTION_TYPES,
    SCALED_ORDER_ACTION_TYPES
} from "services/Exchange";

import counterpart from "counterpart";
import AltContainer from "alt-container";
import BindToChainState from "components/Utility/BindToChainState";
import AccountStore from "../../stores/AccountStore";
import ChainTypes from "../Utility/ChainTypes";
import {ChainStore} from "bitsharesjs";
import PropTypes from "prop-types";
import AssetNameWrapper from "../Utility/AssetName";

class ScaledOrderForm extends Component {
    static propTypes = {
        baseAssetBalance: PropTypes.number
    };

    render() {
        const priceSymbol = "bitUSD";

        const amountSymbol = (
            <AssetNameWrapper name={this.props.baseAsset.get("name")} />
        );

        const {getFieldDecorator} = this.props.form;

        const priceLowerInput = getFieldDecorator("priceLower", {
            validateFirst: true,
            rules: [Validation.Rules.required(), Validation.Rules.number()]
        })(
            <Input
                style={{width: "100%"}}
                autoComplete="off"
                addonAfter={priceSymbol}
            />
        );

        const priceUpperInput = getFieldDecorator("priceUpper", {
            validateFirst: true,
            rules: [Validation.Rules.required(), Validation.Rules.number()]
        })(
            <Input
                style={{width: "100%"}}
                autoComplete="off"
                addonAfter={priceSymbol}
            />
        );

        const amountInput = getFieldDecorator("amount", {
            validateFirst: true,
            rules: [
                Validation.Rules.required(),
                Validation.Rules.number(),
                Validation.Rules.range({
                    max: this.props.baseAssetBalance,
                    min: 0
                })
            ]
        })(
            <Input
                style={{width: "100%"}}
                autoComplete="off"
                addonAfter={amountSymbol}
            />
        );

        const orderCountInput = getFieldDecorator("orderCount", {
            validateFirst: true,
            rules: [Validation.Rules.required(), Validation.Rules.number()]
        })(<Input style={{width: "100%"}} autoComplete="off" />);

        const distributionRadio = getFieldDecorator("distribution", {
            initialValue: SCALED_ORDER_DISTRIBUTION_TYPES.FLAT
        })(
            <Radio.Group>
                <Radio value={SCALED_ORDER_DISTRIBUTION_TYPES.FLAT}>
                    {counterpart.translate("scaled_orders.distribution.flat")}
                </Radio>
            </Radio.Group>
        );

        const actionRadio = getFieldDecorator("action", {
            initialValue: SCALED_ORDER_ACTION_TYPES.BUY
        })(
            <Radio.Group>
                <Radio value={SCALED_ORDER_ACTION_TYPES.BUY}>
                    {counterpart.translate("scaled_orders.action.buy")}
                </Radio>
                <Radio value={SCALED_ORDER_ACTION_TYPES.SELL}>
                    {counterpart.translate("scaled_orders.action.sell")}
                </Radio>
            </Radio.Group>
        );

        return (
            <Form layout="vertical" hideRequiredMark={true}>
                <Row>
                    <Col span={11}>
                        <Form.Item
                            label={counterpart.translate(
                                "scaled_orders.price_lower"
                            )}
                        >
                            {priceLowerInput}
                        </Form.Item>
                    </Col>
                    <Col span={11} offset={2}>
                        <Form.Item
                            label={counterpart.translate(
                                "scaled_orders.price_upper"
                            )}
                        >
                            {priceUpperInput}
                        </Form.Item>
                    </Col>
                </Row>
                <Row>
                    <Col span={11}>
                        <Form.Item
                            label={counterpart.translate(
                                "scaled_orders.amount"
                            )}
                        >
                            {amountInput}
                        </Form.Item>
                    </Col>
                    <Col span={11} offset={2}>
                        <Form.Item
                            label={counterpart.translate(
                                "scaled_orders.order_count"
                            )}
                        >
                            {orderCountInput}
                        </Form.Item>
                    </Col>
                </Row>
                <Row>
                    <Col span={11}>
                        <Form.Item
                            label={counterpart.translate(
                                "scaled_orders.distribution.title"
                            )}
                        >
                            {distributionRadio}
                        </Form.Item>
                    </Col>
                </Row>
                <Row>
                    <Col span={11}>
                        <Form.Item
                            label={counterpart.translate(
                                "scaled_orders.action.title"
                            )}
                        >
                            {actionRadio}
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        );
    }
}

ScaledOrderForm = Form.create({})(ScaledOrderForm);

class ScaledOrderModal extends Component {
    static propTypes = {
        currentAccount: ChainTypes.ChainAccount.isRequired,
        quoteAsset: ChainTypes.ChainAsset.isRequired,
        baseAsset: ChainTypes.ChainAsset.isRequired
    };

    constructor(props) {
        super(props);

        this.saveFormRef = this.saveFormRef.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit() {
        const form = this.formRef.props.form;

        form.validateFields((err, values) => {
            if (err) return;

            console.log("submitted", values);
        });
    }

    saveFormRef(ref) {
        this.formRef = ref;
    }

    _getBalanceByAssetId(assetId) {
        let balance = 0;

        let balances = this.props.currentAccount.get("balances");

        if (balances.get(assetId) !== undefined) {
            let balanceObj = ChainStore.getObject(balances.get(assetId));

            balance =
                balanceObj.get("balance") /
                Math.pow(10, this.props.baseAsset.get("precision"));
        }

        return balance;
    }

    render() {
        let baseAssetBalance = this._getBalanceByAssetId(
            this.props.baseAsset.get("id")
        );
        let quoteAssetBalance = this._getBalanceByAssetId(
            this.props.quoteAsset.get("id")
        );

        let baseAsset = this.props.baseAsset;
        let quoteAsset = this.props.baseAsset;

        const footer = [
            <Button key="submit" type="primary" onClick={this.handleSubmit}>
                Exchange Submit
            </Button>,
            <Button key="cancel">Cancel</Button>
        ];

        return (
            <Modal
                footer={footer}
                placement={"right"}
                title={counterpart.translate("scaled_orders.title")}
                visible={this.props.visible}
            >
                <ScaledOrderForm
                    baseAsset={baseAsset}
                    quoteAsset={quoteAsset}
                    wrappedComponentRef={this.saveFormRef}
                    baseAssetBalance={baseAssetBalance}
                    quoteAssetBalance={quoteAssetBalance}
                />
            </Modal>
        );
    }
}

ScaledOrderModal = BindToChainState(ScaledOrderModal);

class ScaledOrderModalContainer extends React.Component {
    render() {
        return (
            <AltContainer
                stores={[AccountStore]}
                inject={{
                    currentAccount: () => {
                        return AccountStore.getState().currentAccount;
                    }
                }}
            >
                <ScaledOrderModal {...this.props} />
            </AltContainer>
        );
    }
}

export default ScaledOrderModalContainer;
