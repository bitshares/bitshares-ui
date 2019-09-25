import React, {Component} from "react";
import {
    Drawer,
    Form,
    Input,
    InputNumber,
    Button,
    Row,
    Col,
    Radio,
    Select,
    Table,
    Collapse
} from "bitshares-ui-style-guide";
import {checkFeeStatusAsync} from "common/trxHelper";
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
import {ChainStore} from "tuscjs";
import PropTypes from "prop-types";
import AssetNameWrapper from "../Utility/AssetName";
import assetUtils from "lib/common/asset_utils";
import {Asset} from "../../lib/common/MarketClasses";

class ScaledOrderForm extends Component {
    static propTypes = {
        baseAssetBalance: PropTypes.number,
        quoteAssetBalance: PropTypes.number
    };

    constructor(props) {
        super(props);

        this.state = {
            orderCount: 1,
            feeAssets: []
        };
    }

    componentDidMount() {
        this._checkFeeAssets();
    }

    componentDidUpdate() {
        const orderCount = Number(this._getFormValues().orderCount || 1);
        const stateOrderCount = Number(this.state.orderCount);

        if (
            !isNaN(stateOrderCount) &&
            !isNaN(orderCount) &&
            Number(this.state.orderCount) !== orderCount
        ) {
            this.setState(
                {
                    orderCount: orderCount
                },
                () => {
                    this._checkFeeAssets();
                }
            );
        }
    }

    _getBaseAssetFlags() {
        return assetUtils.getFlagBooleans(
            this.props.baseAsset.getIn(["options", "flags"]),
            this.props.baseAsset.has("bitasset_data_id")
        );
    }

    _getQuoteAssetFlags() {
        return assetUtils.getFlagBooleans(
            this.props.quoteAsset.getIn(["options", "flags"]),
            this.props.quoteAsset.has("bitasset_data_id")
        );
    }

    _isMarketFeeVisible() {
        const baseAssetFlagBooleans = this._getBaseAssetFlags();

        const quoteAssetFlagBooleans = this._getQuoteAssetFlags();

        if (
            this._getFormValues().action === SCALED_ORDER_ACTION_TYPES.SELL &&
            quoteAssetFlagBooleans.charge_market_fee
        ) {
            return true;
        }

        if (
            this._getFormValues().action === SCALED_ORDER_ACTION_TYPES.BUY &&
            baseAssetFlagBooleans.charge_market_fee
        ) {
            return true;
        }

        return false;
    }

    _getFormValues() {
        return this.props.form.getFieldsValue();
    }

    _filterFeeStatuses(feeStatuses) {
        return feeStatuses
            .filter(feeStatus => {
                return (
                    feeStatus &&
                    feeStatus.hasPoolBalance &&
                    feeStatus.hasBalance
                );
            })
            .map(feeStatus => {
                return {
                    fee: feeStatus,
                    amount:
                        feeStatus.fee.getAmount() /
                        Math.pow(10, feeStatus.fee.precision),
                    asset: ChainStore.getAsset(feeStatus.fee.asset_id)
                };
            });
    }

    _checkFeeAssets() {
        // get account balances, check is each balance available to pay fee
        // for limit_order, filter only available assets and put it to local state

        this._getAccountAssetsFeeStatus().then(feeStatuses => {
            let assets = this._filterFeeStatuses(feeStatuses);

            this.setState({
                feeAssets: assets
            });
        });
    }

    _getAccountAssetsFeeStatus() {
        const {currentAccount} = this.props;

        const {orderCount} = this._getFormValues();

        if (
            !currentAccount ||
            !currentAccount.get ||
            !currentAccount.get("balances")
        ) {
            return false;
        }

        return new Promise(resolve => {
            let promises = [];

            currentAccount.get("balances").forEach(balance => {
                let balanceObj = ChainStore.getObject(balance);

                let promise = checkFeeStatusAsync({
                    accountID: currentAccount.get("id"),
                    feeID: balanceObj.get("asset_type"),
                    type: "limit_order_create",
                    operationsCount: orderCount
                });

                promises.push(promise);
            });

            Promise.all(promises).then(feesStatuses => {
                resolve(feesStatuses);
            });
        });
    }

    _getFee() {
        const formValues = this._getFormValues();

        let amount = 0;

        if (formValues && formValues.feeCurrency) {
            this.state.feeAssets.forEach(feeAsset => {
                if (
                    feeAsset &&
                    feeAsset.asset &&
                    feeAsset.asset.get("symbol") === formValues.feeCurrency
                ) {
                    amount = feeAsset.amount;
                }
            });
        }

        return amount;
    }

    _getMarketFee() {
        const formValues = this._getFormValues();

        const base = this.props.baseAsset;
        const quote = this.props.quoteAsset;

        const quantity = Number(this._getTotal());
        const action = formValues.action;

        if (isNaN(quantity)) return null;

        let asset = null;

        if (action === SCALED_ORDER_ACTION_TYPES.SELL) asset = quote;

        if (action === SCALED_ORDER_ACTION_TYPES.BUY) asset = base;

        if (!asset || !asset.get || !asset.getIn) return null;

        const maxMarketFee = new Asset({
            amount: asset.getIn(["options", "max_market_fee"]),
            asset_id: asset.get("asset_id"),
            precision: asset.get("precision")
        });

        const marketFeePercent = this._getMarketFeePercentage();

        return !quantity
            ? 0
            : Math.min(
                  maxMarketFee.getAmount({real: true}),
                  (quantity / 100) * marketFeePercent
              ).toFixed(maxMarketFee.precision);
    }

    _getMarketFeePercentage() {
        const {action} = this._getFormValues();

        const base = this.props.baseAsset;
        const quote = this.props.quoteAsset;

        let asset = null;

        if (action === SCALED_ORDER_ACTION_TYPES.SELL) asset = quote;

        if (action === SCALED_ORDER_ACTION_TYPES.BUY) asset = base;

        return Number(asset.getIn(["options", "market_fee_percent"]) / 100);
    }

    _getTotal() {
        const formValues = this._getFormValues();

        const amount = Number(formValues.amount);
        const priceLower = Number(formValues.priceLower);
        const priceUpper = Number(formValues.priceUpper);
        const orderCount = Number(formValues.orderCount);

        const isCorrect = value => !isNaN(value);

        if (
            !isCorrect(priceLower) ||
            !isCorrect(priceUpper) ||
            !isCorrect(amount) ||
            !isCorrect(orderCount) ||
            orderCount <= 0 ||
            priceLower >= priceUpper
        )
            return 0;

        const step = ((priceUpper - priceLower) / (orderCount - 1)).toFixed(6);

        const amountPerOrder = amount / orderCount;

        let total = 0;

        for (let i = 0; i < orderCount; i += 1) {
            total += Number(
                (amountPerOrder * (priceLower + step * i)).toFixed(6)
            );
        }

        return total.toFixed(6);
    }

    _getPreviewDataSource() {
        const formValues = this._getFormValues();

        const dataSource = [];

        const action = formValues.action;
        const amount = Number(formValues.amount);
        const priceLower = Number(formValues.priceLower);
        const priceUpper = Number(formValues.priceUpper);
        const orderCount = Number(formValues.orderCount);

        const isCorrect = value => !isNaN(value);

        if (
            !isCorrect(priceLower) ||
            !isCorrect(priceUpper) ||
            !isCorrect(amount) ||
            !isCorrect(orderCount) ||
            orderCount <= 0 ||
            priceLower >= priceUpper
        )
            return [];

        const step = ((priceUpper - priceLower) / (orderCount - 1)).toFixed(6);

        const amountPerOrder = amount / orderCount;

        for (let i = 0; i < orderCount; i += 1) {
            dataSource.push({
                quote: amountPerOrder.toFixed(6),
                base: (amountPerOrder * (priceLower + step * i)).toFixed(6),
                price: (priceLower + step * i).toFixed(6)
            });
        }

        return action === SCALED_ORDER_ACTION_TYPES.BUY
            ? dataSource.reverse()
            : dataSource;
    }

    render() {
        const priceSymbol = (
            <div
                style={{
                    maxWidth: "110px",
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                }}
            >
                <AssetNameWrapper name={this.props.quoteAsset.get("symbol")} />/
                <AssetNameWrapper name={this.props.baseAsset.get("symbol")} />
            </div>
        );

        const marketFeeSymbol = (
            <AssetNameWrapper name={this.props.quoteAsset.get("symbol")} />
        );

        const quantitySymbol = (
            <AssetNameWrapper name={this.props.quoteAsset.get("symbol")} />
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

        const feeCurrencySelect = getFieldDecorator("feeCurrency", {
            initialValue:
                ChainStore.getAsset("1.3.0") &&
                ChainStore.getAsset("1.3.0").get &&
                ChainStore.getAsset("1.3.0").get("symbol")
        })(
            <Select
                showSearch
                dropdownMatchSelectWidth={false}
                style={{minWidth: "80px", maxWidth: "120px"}}
            >
                {this.state.feeAssets &&
                    this.state.feeAssets.map &&
                    this.state.feeAssets.map(feeAsset => {
                        return (
                            <Select.Option
                                key={feeAsset.asset.get("symbol")}
                                value={`${feeAsset.asset.get("symbol")}`}
                            >
                                <AssetNameWrapper
                                    name={feeAsset.asset.get("symbol")}
                                    noTip={true}
                                />
                            </Select.Option>
                        );
                    })}
            </Select>
        );

        const feeInput = (
            <Input
                disabled
                style={{width: "100%"}}
                autoComplete="off"
                addonAfter={feeCurrencySelect}
                value={this._getFee()}
            />
        );

        const marketFeeInput = (
            <Input
                disabled
                style={{width: "100%"}}
                autoComplete="off"
                addonAfter={marketFeeSymbol}
                value={this._getMarketFee()}
            />
        );

        const totalInput = (
            <Input
                disabled
                style={{width: "100%"}}
                autoComplete="off"
                addonAfter={marketFeeSymbol}
                value={this._getTotal()}
            />
        );

        const quantityInput = getFieldDecorator("amount", {
            validateFirst: true,
            rules: [
                Validation.Rules.required(),
                Validation.Rules.number(),
                Validation.Rules.balance({
                    balance: this.props.quoteAssetBalance
                })
            ]
        })(
            <Input
                style={{width: "100%"}}
                autoComplete="off"
                addonAfter={quantitySymbol}
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

        let columns = [];

        const formValues = this._getFormValues();

        if (formValues.action === SCALED_ORDER_ACTION_TYPES.BUY) {
            columns = [
                {
                    title: this.props.baseAsset.get("symbol"),
                    dataIndex: "base",
                    key: "base"
                },
                {
                    title: this.props.quoteAsset.get("symbol"),
                    dataIndex: "quote",
                    key: "quote"
                },
                {
                    title: counterpart.translate(
                        "scaled_orders.preview_table.price"
                    ),
                    dataIndex: "price",
                    key: "price",
                    render: value => (
                        <span style={{color: "green"}}>{value}</span>
                    )
                }
            ];
        } else {
            columns = [
                {
                    title: counterpart.translate(
                        "scaled_orders.preview_table.price"
                    ),
                    dataIndex: "price",
                    key: "price",
                    render: value => <span style={{color: "red"}}>{value}</span>
                },
                {
                    title: this.props.quoteAsset.get("symbol"),
                    dataIndex: "quote",
                    key: "quote"
                },
                {
                    title: this.props.baseAsset.get("symbol"),
                    dataIndex: "base",
                    key: "base"
                }
            ];
        }

        const dataSource = this._getPreviewDataSource();

        return (
            <Form layout="vertical" hideRequiredMark={true}>
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
                                "scaled_orders.quantity"
                            )}
                        >
                            {quantityInput}
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
                            label={counterpart.translate("scaled_orders.fee")}
                        >
                            {feeInput}
                        </Form.Item>
                    </Col>
                    {this._isMarketFeeVisible() ? (
                        <Col span={11} offset={2}>
                            <Form.Item
                                label={`${counterpart.translate(
                                    "scaled_orders.market_fee"
                                )} ${this._getMarketFeePercentage()}%`}
                            >
                                {marketFeeInput}
                            </Form.Item>
                        </Col>
                    ) : null}
                </Row>
                <Row>
                    <Col span={11}>
                        <Form.Item
                            label={counterpart.translate("scaled_orders.total")}
                        >
                            {totalInput}
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
                    <Col span={24}>
                        <Form.Item>
                            <Collapse>
                                <Collapse.Panel header="Preview">
                                    <Table
                                        pagination={false}
                                        columns={columns}
                                        dataSource={dataSource}
                                        rowKey={record => record.total}
                                    />
                                </Collapse.Panel>
                            </Collapse>
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
        this.handleCancel = this.handleCancel.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (
            this.props.baseAsset &&
            prevProps.baseAsset &&
            this.props.baseAsset.get &&
            prevProps.baseAsset.get &&
            this.props.baseAsset.get("id") !== prevProps.baseAsset.get("id") &&
            this.formRef &&
            this.formRef.props &&
            this.formRef.props.form
        ) {
            this.formRef.props.form.resetFields();
        }
    }

    prepareOrders(values) {
        const orders = [];

        const amount = Number(values.amount);
        const priceLower = Number(values.priceLower);
        const priceUpper = Number(values.priceUpper);
        const orderCount = Number(values.orderCount);

        const isCorrect = value => !isNaN(value);

        if (
            !isCorrect(priceLower) ||
            !isCorrect(priceUpper) ||
            !isCorrect(amount) ||
            !isCorrect(orderCount) ||
            orderCount <= 0 ||
            priceLower >= priceUpper
        )
            return [];

        const step = ((priceUpper - priceLower) / (orderCount - 1)).toFixed(6);

        const amountPerOrder = amount / orderCount;

        const sellAsset =
            values.action === SCALED_ORDER_ACTION_TYPES.SELL
                ? this.props.quoteAsset
                : this.props.baseAsset;
        const buyAsset =
            values.action === SCALED_ORDER_ACTION_TYPES.BUY
                ? this.props.quoteAsset
                : this.props.baseAsset;

        const sellAmount = i =>
            values.action === SCALED_ORDER_ACTION_TYPES.BUY
                ? Number(
                      (amountPerOrder / (priceLower + step * i)).toFixed(6)
                  ) * Math.pow(10, sellAsset.get("precision"))
                : Number(amountPerOrder.toFixed(6)) *
                  Math.pow(10, sellAsset.get("precision"));

        const buyAmount = i =>
            values.action === SCALED_ORDER_ACTION_TYPES.SELL
                ? Number(
                      (amountPerOrder / (priceLower + step * i)).toFixed(6)
                  ) * Math.pow(10, buyAsset.get("precision"))
                : Number(amountPerOrder.toFixed(6)) *
                  Math.pow(10, buyAsset.get("precision"));

        for (let i = 0; i < orderCount; i += 1) {
            orders.push({
                for_sale: new Asset({
                    asset_id: sellAsset.get("id"),
                    precision: sellAsset.get("precision"),
                    amount: sellAmount(i)
                }),

                to_receive: new Asset({
                    asset_id: buyAsset.get("id"),
                    precision: buyAsset.get("precision"),
                    amount: buyAmount(i)
                }),

                expirationTime: new Date().getTime() + 60 * 60 * 1000
            });
        }

        this.props.createScaledOrder(
            orders,
            ChainStore.getAsset(values.feeCurrency).get("id")
        );

        this.props.hideModal();
    }

    handleSubmit() {
        const form = this.formRef.props.form;

        form.validateFields((err, values) => {
            if (err) return;

            this.prepareOrders(values);
        });
    }

    handleCancel() {
        this.props.hideModal();
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
        let quoteAsset = this.props.quoteAsset;

        const footer = [
            <Button key="submit" type="primary" onClick={this.handleSubmit}>
                Exchange Submit
            </Button>,
            <Button key="cancel" onClick={this.handleCancel}>
                Cancel
            </Button>
        ];

        return (
            <Drawer
                onClose={this.handleCancel}
                width={"40%"}
                placement={"right"}
                title={counterpart.translate("scaled_orders.title")}
                visible={this.props.visible}
            >
                <ScaledOrderForm
                    currentAccount={this.props.currentAccount}
                    baseAsset={baseAsset}
                    quoteAsset={quoteAsset}
                    wrappedComponentRef={this.saveFormRef}
                    baseAssetBalance={baseAssetBalance}
                    quoteAssetBalance={quoteAssetBalance}
                />
                <div className="scaled-order-drawer--footer">{footer}</div>
            </Drawer>
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
