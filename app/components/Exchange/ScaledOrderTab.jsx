import React, {Component} from "react";
import moment from "moment";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import {
    Input,
    Form,
    Select,
    Button,
    Col,
    Row,
    Radio
} from "bitshares-ui-style-guide";
import AssetNameWrapper from "../Utility/AssetName";
import {SCALED_ORDER_ACTION_TYPES} from "../../services/Exchange";
import {Asset} from "../../lib/common/MarketClasses";
import ChainStore from "tuscjs/es/chain/src/ChainStore";
import counterpart from "counterpart";
import {Validation} from "../../services/Validation/Validation";
import assetUtils from "../../lib/common/asset_utils";
import {checkFeeStatusAsync} from "../../lib/common/trxHelper";
import PriceText from "../Utility/PriceText";
import AssetName from "../Utility/AssetName";
import {
    preciseAdd,
    preciseDivide,
    preciseMultiply,
    preciseMinus
} from "../../services/Math";
import {DatePicker} from "antd";

class ScaledOrderForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            orderCount: 1,
            feeAssets: []
        };

        this.handleClickBalance = this.handleClickBalance.bind(this);
        this.handleCurrentPriceClick = this.handleCurrentPriceClick.bind(this);
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

    isFormValid() {
        const formValues = this._getFormValues();

        if (!formValues) return false;

        if (
            !formValues.priceLower ||
            isNaN(Number(formValues.priceLower)) ||
            Number(formValues.priceLower) <= 0
        )
            return false;

        if (
            !formValues.amount ||
            isNaN(Number(formValues.amount)) ||
            Number(formValues.amount) <= 0
        )
            return false;

        if (
            !formValues.priceUpper ||
            isNaN(Number(formValues.priceUpper)) ||
            Number(formValues.priceUpper) <= 0 ||
            Number(formValues.priceUpper) <= Number(formValues.priceLower)
        )
            return false;

        if (
            !formValues.orderCount ||
            isNaN(Number(formValues.orderCount)) ||
            Number(formValues.orderCount) <= 1
        )
            return false;

        return true;
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
            baseAssetFlagBooleans.charge_market_fee
        ) {
            return true;
        }

        if (
            this._getFormValues().action === SCALED_ORDER_ACTION_TYPES.BUY &&
            quoteAssetFlagBooleans.charge_market_fee
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

        if (action === SCALED_ORDER_ACTION_TYPES.SELL) asset = base;

        if (action === SCALED_ORDER_ACTION_TYPES.BUY) asset = quote;

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

        if (action === SCALED_ORDER_ACTION_TYPES.SELL) asset = base;

        if (action === SCALED_ORDER_ACTION_TYPES.BUY) asset = quote;

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
            orderCount <= 1 ||
            orderCount <= 0 ||
            priceLower >= priceUpper
        )
            return 0;

        const step = preciseDivide(
            preciseMinus(priceUpper, priceLower),
            preciseMinus(orderCount, 1)
        );

        const amountPerOrder = preciseDivide(amount, orderCount);

        let total = 0;

        for (let i = 0; i < orderCount; i += 1) {
            // total += amountPerOrder * (priceLower + step * i);
            total = preciseAdd(
                total,
                preciseMultiply(
                    amountPerOrder,
                    preciseAdd(priceLower, preciseMultiply(step, i))
                )
            );
        }

        return total;
    }

    _getQuantityFromTotal(total) {
        const formValues = this._getFormValues();

        const priceLower = Number(formValues.priceLower);
        const priceUpper = Number(formValues.priceUpper);
        const orderCount = Number(formValues.orderCount);

        const isCorrect = value => !isNaN(value);

        if (
            !isCorrect(priceLower) ||
            !isCorrect(priceUpper) ||
            !isCorrect(total) ||
            !isCorrect(orderCount) ||
            orderCount <= 0 ||
            priceLower >= priceUpper
        )
            return 0;

        const step = preciseDivide(
            preciseMinus(priceUpper, priceLower),
            preciseMinus(orderCount, 1)
        );

        let sum = 0;

        for (let i = 0; i < orderCount; i += 1) {
            // sum + ((priceLower + step * i) / orderCount)

            sum = preciseAdd(
                sum,
                Number(
                    preciseDivide(
                        preciseAdd(priceLower, preciseMultiply(step, i)),
                        orderCount
                    )
                )
            );
        }

        return preciseDivide(total, sum);
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

    getDatePickerRef = node => {
        this.datePricker = node;
    };

    handleClickBalance() {
        if (this.props.type === "bid") {
            this.props.form.setFieldsValue({
                amount: this._getQuantityFromTotal(this.props.baseAssetBalance)
            });
        } else {
            this.props.form.setFieldsValue({
                amount: this.props.quoteAssetBalance
            });
        }
    }

    handleCurrentPriceClick() {
        this.props.form.setFieldsValue({
            priceLower: this.props.currentPrice
        });
    }

    onExpirationSelectChange = e => {
        if (e.target.value === "SPECIFIC") {
            this.datePricker.picker.handleOpenChange(true);
        } else {
            this.datePricker.picker.handleOpenChange(false);
        }

        this.props.onExpirationTypeChange(e);
    };

    onExpirationSelectClick = e => {
        if (e.target.value === "SPECIFIC") {
            if (this.firstClick) {
                this.secondClick = true;
            }
            this.firstClick = true;
            if (this.secondClick) {
                this.datePricker.picker.handleOpenChange(true);
                this.firstClick = false;
                this.secondClick = false;
            }
        }
    };

    onExpirationSelectBlur = () => {
        this.firstClick = false;
        this.secondClick = false;
    };

    render() {
        const {type, quoteAsset, baseAsset, expirationCustomTime} = this.props;

        const isBid = type === "bid";

        const quote = quoteAsset;
        const base = baseAsset;

        const {getFieldDecorator} = this.props.form;

        const marketFeeSymbol = (
            <AssetNameWrapper name={this.props.quoteAsset.get("symbol")} />
        );

        const quantitySymbol = (
            <AssetNameWrapper name={this.props.quoteAsset.get("symbol")} />
        );

        const totalSymbol = (
            <AssetNameWrapper name={this.props.baseAsset.get("symbol")} />
        );

        const priceSymbol = (
            <span>
                <AssetName dataPlace="right" name={baseAsset.get("symbol")} />
                &nbsp;/&nbsp;
                <AssetName dataPlace="right" name={quoteAsset.get("symbol")} />
            </span>
        );

        const formItemProps = {
            labelCol: {span: 6},
            wrapperCol: {span: 16, offset: 2}
        };

        const actionRadio = getFieldDecorator("action", {
            initialValue: isBid
                ? SCALED_ORDER_ACTION_TYPES.BUY
                : SCALED_ORDER_ACTION_TYPES.SELL
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

        const priceLowerInput = getFieldDecorator("priceLower", {
            validateFirst: true,
            validateTrigger: "onBlur",
            rules: [
                Validation.Rules.required(),
                Validation.Rules.number(),
                Validation.Rules.min({min: 0, name: "Price", higherThan: true})
            ]
        })(
            <Input
                placeholder="0.0"
                style={{width: "100%"}}
                autoComplete="off"
                addonAfter={priceSymbol}
            />
        );

        const formValues = this._getFormValues();

        const priceLower = Number((formValues && formValues.priceLower) || 0);

        const priceUpperInput = getFieldDecorator("priceUpper", {
            validateFirst: true,
            validateTrigger: "onBlur",
            rules: [
                Validation.Rules.required(),
                Validation.Rules.number(),
                Validation.Rules.min({
                    min: priceLower,
                    name: "Price",
                    higherThan: true
                })
            ]
        })(
            <Input
                placeholder="0.0"
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
                placeholder="0.0"
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
                addonAfter={totalSymbol}
                value={this._getTotal()}
            />
        );

        const totalInputValidation = Validation.Rules.balance({
            balance: this.props.baseAssetBalance,
            symbol: this.props.baseAsset.get("symbol")
        });

        const totalInputValidator = totalInputValidation.validator(
            null,
            this._getTotal(),
            a => a === undefined
        );
        const totalInputHelp =
            isBid && !totalInputValidator ? totalInputValidation.message : null;
        const totalInputStatus = isBid && !totalInputValidator ? "error" : "";

        const quantityRules = [
            Validation.Rules.required(),
            Validation.Rules.number(),
            Validation.Rules.min({min: 0, higherThan: true, name: "Quantity"})
        ];

        if (!isBid) {
            quantityRules.push(
                Validation.Rules.balance({
                    balance: this.props.quoteAssetBalance,
                    symbol: this.props.quoteAsset.get("symbol")
                })
            );
        }

        const quantityInput = getFieldDecorator("amount", {
            validateFirst: true,
            validateTrigger: "onBlur",
            rules: quantityRules
        })(
            <Input
                placeholder="0.0"
                style={{width: "100%"}}
                autoComplete="off"
                addonAfter={quantitySymbol}
            />
        );

        const orderCountInput = getFieldDecorator("orderCount", {
            validateFirst: true,
            rules: [
                Validation.Rules.required(),
                Validation.Rules.number(),
                Validation.Rules.min({
                    min: 1,
                    name: "Orders Count",
                    higherThan: true
                })
            ]
        })(
            <Input
                style={{width: "100%"}}
                placeholder="0"
                autoComplete="off"
                addonAfter={counterpart.translate("scaled_orders.order_s")}
            />
        );

        const lastPriceLabel = counterpart.translate(
            isBid ? "exchange.lowest_ask" : "exchange.highest_bid"
        );

        let expirationTip;

        if (this.props.expirationType !== "SPECIFIC") {
            expirationTip = this.props.expirations[
                this.props.expirationType
            ].get();
        }

        const expirationsOptionsList = Object.keys(this.props.expirations).map(
            key => (
                <option value={key} key={key}>
                    {key === "SPECIFIC" && expirationCustomTime !== "Specific"
                        ? moment(expirationCustomTime).format(
                              "Do MMM YYYY hh:mm A"
                          )
                        : this.props.expirations[key].title}
                </option>
            )
        );

        return (
            <div className="buy-sell-container" style={{padding: "5px"}}>
                <Form
                    className="order-form"
                    layout="horizontal"
                    hideRequiredMark={true}
                    style={{padding: "8px 15px"}}
                >
                    <Form.Item
                        {...formItemProps}
                        label={counterpart.translate(
                            "scaled_orders.price_lower"
                        )}
                    >
                        {priceLowerInput}
                    </Form.Item>

                    <Form.Item
                        {...formItemProps}
                        label={counterpart.translate(
                            "scaled_orders.price_upper"
                        )}
                    >
                        {priceUpperInput}
                    </Form.Item>

                    <Form.Item
                        {...formItemProps}
                        label={counterpart.translate("scaled_orders.quantity")}
                    >
                        {quantityInput}
                    </Form.Item>

                    <Form.Item
                        {...formItemProps}
                        label={counterpart.translate(
                            "scaled_orders.order_count"
                        )}
                    >
                        {orderCountInput}
                    </Form.Item>

                    <Form.Item
                        {...formItemProps}
                        help={totalInputHelp}
                        validateStatus={totalInputStatus}
                        label={counterpart.translate("scaled_orders.total")}
                    >
                        {totalInput}
                    </Form.Item>

                    <Form.Item
                        {...formItemProps}
                        label={counterpart.translate("scaled_orders.fee")}
                    >
                        {feeInput}
                    </Form.Item>

                    {this._isMarketFeeVisible() ? (
                        <Form.Item
                            {...formItemProps}
                            label={`${counterpart.translate(
                                "scaled_orders.market_fee"
                            )} ${this._getMarketFeePercentage()}%`}
                        >
                            {marketFeeInput}
                        </Form.Item>
                    ) : null}

                    <Form.Item
                        label={counterpart.translate("transaction.expiration")}
                        {...formItemProps}
                    >
                        <div
                            className="expiration-datetime-picker scaled-orders"
                            style={{marginTop: "5px"}}
                        >
                            <DatePicker
                                ref={this.getDatePickerRef}
                                className="expiration-datetime-picker--hidden"
                                showTime
                                showToday={false}
                                disabledDate={current =>
                                    current < moment().add(59, "minutes")
                                }
                                value={
                                    expirationCustomTime !== "Specific"
                                        ? expirationCustomTime
                                        : moment().add(1, "hour")
                                }
                                onChange={this.props.onExpirationCustomChange}
                            />
                            <select
                                className="cursor-pointer"
                                style={{marginTop: "5px"}}
                                onChange={this.onExpirationSelectChange}
                                onClick={this.onExpirationSelectClick}
                                onBlur={this.onExpirationSelectBlur}
                                data-tip={
                                    expirationTip &&
                                    moment(expirationTip).format(
                                        "Do MMM YYYY hh:mm A"
                                    )
                                }
                                value={this.props.expirationType}
                            >
                                {expirationsOptionsList}
                            </select>
                        </div>
                    </Form.Item>

                    <Form.Item label={lastPriceLabel} {...formItemProps}>
                        <span
                            style={{
                                borderBottom: "#A09F9F 1px dotted",
                                cursor: "pointer"
                            }}
                            onClick={this.handleCurrentPriceClick}
                        >
                            <PriceText
                                price={this.props.currentPrice}
                                quote={quote}
                                base={base}
                            />{" "}
                            <AssetNameWrapper name={base.get("symbol")} noTip />
                            /
                            <AssetNameWrapper
                                name={quote.get("symbol")}
                                noTip
                            />
                        </span>
                    </Form.Item>

                    <Form.Item
                        label={counterpart.translate("exchange.balance")}
                        {...formItemProps}
                    >
                        <span
                            style={{
                                borderBottom: "#A09F9F 1px dotted",
                                cursor: "pointer"
                            }}
                            onClick={this.handleClickBalance}
                        >
                            {!isBid
                                ? this.props.quoteAssetBalance
                                : this.props.baseAssetBalance}{" "}
                            <AssetNameWrapper
                                name={
                                    !isBid
                                        ? quote.get("symbol")
                                        : base.get("symbol")
                                }
                                noTip
                            />
                        </span>
                    </Form.Item>

                    <Button
                        onClick={this.props.handleSubmit}
                        type="primary"
                        disabled={!this.isFormValid()}
                    >
                        {counterpart.translate(
                            isBid
                                ? "scaled_orders.action.buy"
                                : "scaled_orders.action.sell"
                        )}
                    </Button>
                </Form>
            </div>
        );
    }
}

ScaledOrderForm = Form.create({})(ScaledOrderForm);

class ScaledOrderTab extends Component {
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

        if (
            this.props.lastClickedPrice &&
            this.props.lastClickedPrice !== prevProps.lastClickedPrice
        ) {
            if (
                this.formRef &&
                this.formRef.props &&
                this.formRef.props.form &&
                this.formRef.props.form.setFieldsValue
            ) {
                this.formRef.props.form.setFieldsValue({
                    priceLower: Number(this.props.lastClickedPrice)
                });
            }
        }
    }

    prepareOrders(values) {
        const orders = [];

        const amount = Number(values.amount);
        const priceLower = Number(values.priceLower);
        const priceUpper = Number(values.priceUpper);
        const orderCount = Number(values.orderCount);

        let expirationTime = null;
        if (this.props.expirationType === "SPECIFIC") {
            expirationTime = this.props.expirations[
                this.props.expirationType
            ].get(this.props.type);
        } else {
            expirationTime = this.props.expirations[
                this.props.expirationType
            ].get(this.props.type);
        }

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

        const step = ((priceUpper - priceLower) / (orderCount - 1)).toPrecision(
            5
        );

        const amountPerOrder = amount / orderCount;

        const sellAsset =
            values.action === SCALED_ORDER_ACTION_TYPES.SELL
                ? this.props.quoteAsset
                : this.props.baseAsset;
        const buyAsset =
            values.action === SCALED_ORDER_ACTION_TYPES.BUY
                ? this.props.quoteAsset
                : this.props.baseAsset;

        const sellAmount = i => {
            let scaledAmount = amountPerOrder * (priceLower + step * i);
            return values.action === SCALED_ORDER_ACTION_TYPES.BUY
                ? Number(scaledAmount.toPrecision(5)) *
                      Math.pow(10, sellAsset.get("precision"))
                : Number(amountPerOrder.toPrecision(5)) *
                      Math.pow(10, sellAsset.get("precision"));
        };

        const buyAmount = i => {
            let scaledAmount = amountPerOrder * (priceLower + step * i);
            return values.action === SCALED_ORDER_ACTION_TYPES.SELL
                ? Number(scaledAmount.toPrecision(5)) *
                      Math.pow(10, buyAsset.get("precision"))
                : Number(amountPerOrder.toPrecision(5)) *
                      Math.pow(10, buyAsset.get("precision"));
        };

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
                expirationTime: expirationTime
            });
        }

        this.props.createScaledOrder(
            orders,
            ChainStore.getAsset(values.feeCurrency).get("id")
        );
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

    _getBalanceByAssetId(assetId, precision) {
        let balance = 0;

        let balances = this.props.currentAccount.get("balances");

        if (balances.get(assetId) !== undefined) {
            let balanceObj = ChainStore.getObject(balances.get(assetId));

            balance = balanceObj.get("balance") / Math.pow(10, precision);
        }

        return balance;
    }

    render() {
        let baseAssetBalance = this._getBalanceByAssetId(
            this.props.baseAsset.get("id"),
            this.props.baseAsset.get("precision")
        );
        let quoteAssetBalance = this._getBalanceByAssetId(
            this.props.quoteAsset.get("id"),
            this.props.quoteAsset.get("precision")
        );

        return (
            <ScaledOrderForm
                {...this.props}
                wrappedComponentRef={this.saveFormRef}
                baseAssetBalance={baseAssetBalance}
                quoteAssetBalance={quoteAssetBalance}
                handleSubmit={this.handleSubmit}
            />
        );
    }
}

export default ScaledOrderTab;
