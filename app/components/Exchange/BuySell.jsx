import cnames from "classnames";
import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import utils from "common/utils";
import Translate from "react-translate-component";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import counterpart from "counterpart";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import PriceText from "../Utility/PriceText";
import AssetName from "../Utility/AssetName";
import {Asset} from "common/MarketClasses";
import ExchangeInput from "./ExchangeInput";
import assetUtils from "common/asset_utils";
import {DatePicker} from "antd";
import moment from "moment";
import Icon from "../Icon/Icon";
import SettleModal from "../Modal/SettleModal";
import {Button, Select, Popover, Tooltip} from "bitshares-ui-style-guide";
import ReactTooltip from "react-tooltip";
import AccountStore from "../../stores/AccountStore";

class BuySell extends React.Component {
    static propTypes = {
        balance: ChainTypes.ChainObject,
        type: PropTypes.string,
        amountChange: PropTypes.func.isRequired,
        priceChange: PropTypes.func.isRequired,
        onSubmit: PropTypes.func.isRequired,
        onExpirationTypeChange: PropTypes.func.isRequired,
        onExpirationCustomChange: PropTypes.func.isRequired
    };

    static defaultProps = {
        type: "bid"
    };

    constructor() {
        super();
        this.state = {
            forceReRender: false,
            isSettleModalVisible: false
        };

        this.showSettleModal = this.showSettleModal.bind(this);
        this.hideSettleModal = this.hideSettleModal.bind(this);
    }

    /*
     * Force re-rendering component when state changes.
     * This is required for an updated value of component width
     *
     * It will trigger a re-render twice
     * - Once when state is changed
     * - Once when forceReRender is set to false
     */
    _forceRender(np) {
        if (this.state.forceReRender) {
            this.setState({
                forceReRender: false
            });
        }

        if (this.props.parentWidth !== np.parentWidth) {
            this.setState({
                forceReRender: true
            });
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        this._forceRender(nextProps, nextState);

        return (
            nextState.isSettleModalVisible !==
                this.state.isSettleModalVisible ||
            nextProps.amount !== this.props.amount ||
            nextProps.onBorrow !== this.props.onBorrow ||
            nextProps.total !== this.props.total ||
            nextProps.currentPrice !== this.props.currentPrice ||
            nextProps.price !== this.props.price ||
            nextProps.balance !== this.props.balance ||
            nextProps.account !== this.props.account ||
            nextProps.className !== this.props.className ||
            (nextProps.fee && this.props.fee
                ? nextProps.fee.ne(this.props.fee)
                : false) ||
            nextProps.isPredictionMarket !== this.props.isPredictionMarket ||
            nextProps.feeAsset !== this.props.feeAsset ||
            nextProps.isOpen !== this.props.isOpen ||
            nextProps.hasFeeBalance !== this.props.hasFeeBalance ||
            nextProps.expirationType !== this.props.expirationType ||
            nextProps.expirationCustomTime !==
                this.props.expirationCustomTime ||
            nextProps.parentWidth !== this.props.parentWidth ||
            nextState.forceReRender !== this.state.forceReRender ||
            nextProps.singleColumnOrderForm !==
                this.props.singleColumnOrderForm ||
            nextProps.hideFunctionButtons !== this.props.hideFunctionButtons ||
            nextState.isQuickDepositVisible !== this.state.isQuickDepositVisible
        );
    }

    getDatePickerRef = node => {
        this.datePricker = node;
    };

    showSettleModal() {
        this.setState({
            isSettleModalVisible: true
        });
    }

    hideSettleModal() {
        this.setState({
            isSettleModalVisible: false
        });
    }

    _addBalance(balance) {
        if (this.props.type === "bid") {
            this.props.totalChange({
                target: {value: balance.getAmount({real: true}).toString()}
            });
        } else {
            this.props.amountChange({
                target: {value: balance.getAmount({real: true}).toString()}
            });
        }
    }

    _setPrice(price) {
        this.props.priceChange({target: {value: price.toString()}});
    }

    handleQuickDepositVisibleChange = visible => {
        this.setState({isQuickDepositVisible: visible});
        if (visible) {
            setTimeout(() => {
                ReactTooltip.rebuild();
            }, 20);
        }
    };

    onDeposit() {
        this.setState({
            isQuickDepositVisible: false
        });
        this.props.onDeposit();
    }

    onBuy() {
        this.setState({
            isQuickDepositVisible: false
        });
        this.props.onBuy();
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
        let {
            type,
            quote,
            base,
            amountChange,
            fee,
            isPredictionMarket,
            priceChange,
            onSubmit,
            balance,
            totalChange,
            balancePrecision,
            currentPrice,
            currentPriceObject,
            feeAsset,
            feeAssets,
            hasFeeBalance,
            hideHeader,
            verticalOrderForm
        } = this.props;
        const {expirationCustomTime} = this.props;

        let clientWidth = this.refs.order_form
            ? this.refs.order_form.clientWidth
            : 0;
        let singleColumnForm =
            clientWidth < 450 || this.props.singleColumnOrderForm
                ? true
                : false;

        let amount, price, total;

        if (this.props.amount) amount = this.props.amount;
        if (this.props.price) price = this.props.price;
        if (this.props.total) total = this.props.total;

        let balanceAmount = new Asset({
            amount: balance ? balance.get("balance") : 0,
            precision: balancePrecision,
            asset_id: this.props.balanceId
        });

        const maxBaseMarketFee = new Asset({
            amount: base.getIn(["options", "max_market_fee"]),
            asset_id: base.get("asset_id"),
            precision: base.get("precision")
        });
        const maxQuoteMarketFee = new Asset({
            amount: quote.getIn(["options", "max_market_fee"]),
            asset_id: quote.get("asset_id"),
            precision: quote.get("precision")
        });
        const baseMarketFeePercent =
            base.getIn(["options", "market_fee_percent"]) / 100 + "%";
        const quoteMarketFeePercent =
            quote.getIn(["options", "market_fee_percent"]) / 100 + "%";
        const quoteFee = !amount
            ? 0
            : Math.min(
                  maxQuoteMarketFee.getAmount({real: true}),
                  (amount * quote.getIn(["options", "market_fee_percent"])) /
                      10000
              ).toFixed(maxQuoteMarketFee.precision);
        const baseFee = !amount
            ? 0
            : Math.min(
                  maxBaseMarketFee.getAmount({real: true}),
                  (total * base.getIn(["options", "market_fee_percent"])) /
                      10000
              ).toFixed(maxBaseMarketFee.precision);
        const baseFlagBooleans = assetUtils.getFlagBooleans(
            base.getIn(["options", "flags"]),
            base.has("bitasset_data_id")
        );
        const quoteFlagBooleans = assetUtils.getFlagBooleans(
            quote.getIn(["options", "flags"]),
            quote.has("bitasset_data_id")
        );

        const {name: baseName, prefix: basePrefix} = utils.replaceName(
            this.props.base
        );
        var baseMarketFee = baseFlagBooleans["charge_market_fee"] ? (
            verticalOrderForm ? (
                <Tooltip
                    title={counterpart.translate("tooltip.market_fee", {
                        percent: baseMarketFeePercent,
                        asset: (basePrefix || "") + baseName
                    })}
                >
                    <div className="grid-block no-overflow wrap shrink">
                        <div className="small-12 buy-sell-label">
                            <Translate content="explorer.asset.summary.market_fee" />
                            , {baseMarketFeePercent}
                        </div>
                        <div className="inputAddon small-12">
                            <ExchangeInput
                                placeholder="0.0"
                                id="baseMarketFee"
                                defaultValue={baseFee}
                                value={baseFee}
                                addonAfter={
                                    <span>
                                        <AssetName
                                            noTip
                                            name={base.get("symbol")}
                                        />
                                    </span>
                                }
                            />
                        </div>
                    </div>
                </Tooltip>
            ) : singleColumnForm ? (
                <Tooltip
                    title={counterpart.translate("tooltip.market_fee", {
                        percent: baseMarketFeePercent,
                        asset: (basePrefix || "") + baseName
                    })}
                >
                    <div className="grid-block no-overflow wrap shrink">
                        <div className="small-3 buy-sell-label">
                            <Translate content="explorer.asset.summary.market_fee" />
                            , {baseMarketFeePercent}
                        </div>
                        <div className="inputAddon small-9">
                            <ExchangeInput
                                placeholder="0.0"
                                id="baseMarketFee"
                                defaultValue={baseFee}
                                value={baseFee}
                                addonAfter={
                                    <span>
                                        <AssetName
                                            noTip
                                            name={base.get("symbol")}
                                        />
                                    </span>
                                }
                            />
                        </div>
                    </div>
                </Tooltip>
            ) : (
                <Tooltip
                    title={counterpart.translate("tooltip.market_fee", {
                        percent: baseMarketFeePercent,
                        asset: (basePrefix || "") + baseName
                    })}
                >
                    <div className="grid-block no-overflow wrap shrink">
                        <div className="small-12 buy-sell-label">
                            <Translate content="explorer.asset.summary.market_fee" />
                            , {baseMarketFeePercent}
                        </div>
                        <div className="inputAddon small-12">
                            <ExchangeInput
                                placeholder="0.0"
                                id="baseMarketFee"
                                defaultValue={baseFee}
                                value={baseFee}
                                addonAfter={
                                    <span>
                                        <AssetName
                                            noTip
                                            name={base.get("symbol")}
                                        />
                                    </span>
                                }
                            />
                        </div>
                    </div>
                </Tooltip>
            )
        ) : null;

        const {name: quoteName, prefix: quotePrefix} = utils.replaceName(
            this.props.quote
        );
        var quoteMarketFee = quoteFlagBooleans["charge_market_fee"] ? (
            verticalOrderForm ? (
                <Tooltip
                    title={counterpart.translate("tooltip.market_fee", {
                        percent: quoteMarketFeePercent,
                        asset: (quotePrefix || "") + quoteName
                    })}
                >
                    <div className="grid-block no-overflow wrap shrink">
                        <div className="small-12 buy-sell-label">
                            <Translate content="explorer.asset.summary.market_fee" />
                            , {quoteMarketFeePercent}
                        </div>
                        <div className="inputAddon small-12">
                            <ExchangeInput
                                placeholder="0.0"
                                id="quoteMarketFee"
                                defaultValue={quoteFee}
                                value={quoteFee}
                                addonAfter={
                                    <span>
                                        <AssetName
                                            style={{width: 100}}
                                            noTip
                                            name={quote.get("symbol")}
                                        />
                                    </span>
                                }
                            />
                        </div>
                    </div>
                </Tooltip>
            ) : singleColumnForm ? (
                <Tooltip
                    title={counterpart.translate("tooltip.market_fee", {
                        percent: quoteMarketFeePercent,
                        asset: (quotePrefix || "") + quoteName
                    })}
                >
                    <div className="grid-block no-overflow wrap shrink">
                        <div className="small-3 buy-sell-label">
                            <Translate content="explorer.asset.summary.market_fee" />
                            , {quoteMarketFeePercent}
                        </div>
                        <div className="inputAddon small-9">
                            <ExchangeInput
                                placeholder="0.0"
                                id="quoteMarketFee"
                                defaultValue={quoteFee}
                                value={quoteFee}
                                addonAfter={
                                    <span>
                                        <AssetName
                                            style={{width: 100}}
                                            noTip
                                            name={quote.get("symbol")}
                                        />
                                    </span>
                                }
                            />
                        </div>
                    </div>
                </Tooltip>
            ) : (
                <Tooltip
                    title={counterpart.translate("tooltip.market_fee", {
                        percent: quoteMarketFeePercent,
                        asset: (quotePrefix || "") + quoteName
                    })}
                >
                    <div className="grid-block no-overflow wrap shrink">
                        <div className="small-12 buy-sell-label">
                            <Translate content="explorer.asset.summary.market_fee" />
                            , {quoteMarketFeePercent}
                        </div>
                        <div className="inputAddon small-12">
                            <ExchangeInput
                                placeholder="0.0"
                                id="quoteMarketFee"
                                defaultValue={quoteFee}
                                value={quoteFee}
                                addonAfter={
                                    <span>
                                        <AssetName
                                            style={{width: 100}}
                                            noTip
                                            name={quote.get("symbol")}
                                        />
                                    </span>
                                }
                            />
                        </div>
                    </div>
                </Tooltip>
            )
        ) : null;

        var emptyCell = !verticalOrderForm ? (
            <div
                style={{visibility: "hidden"}}
                className="grid-block no-overflow wrap shrink"
            >
                <div className="small-3 buy-sell-label">
                    <Translate content="explorer.asset.summary.market_fee" />
                </div>
                <div className="inputAddon small-9">
                    <ExchangeInput
                        placeholder="0.0"
                        id="emptyPlaceholder"
                        defaultValue="0"
                        addonAfter={
                            <span>
                                <AssetName
                                    style={{width: 100}}
                                    noTip
                                    name={quote.get("symbol")}
                                />
                            </span>
                        }
                    />
                </div>
            </div>
        ) : null;

        const isBid = type === "bid";
        let marketFee =
            isBid && quoteMarketFee
                ? quoteMarketFee
                : !isBid && baseMarketFee
                    ? baseMarketFee
                    : quoteMarketFee || baseMarketFee
                        ? emptyCell
                        : null;

        let hasBalance = isBid
            ? balanceAmount.getAmount({real: true}) >= parseFloat(total)
            : balanceAmount.getAmount({real: true}) >= parseFloat(amount);

        let forceSellText = isBid
            ? counterpart.translate("exchange.buy")
            : counterpart.translate("exchange.sell");

        let noBalance = isPredictionMarket
            ? false
            : !(balanceAmount.getAmount() > 0 && hasBalance);
        let invalidPrice = !(price > 0);
        let invalidAmount = !(amount > 0);

        let disabled = noBalance || invalidPrice || invalidAmount;

        let buttonClass = classNames(type, {
            disabled: disabled
        });
        let balanceSymbol = isBid ? base.get("symbol") : quote.get("symbol");

        let disabledText = invalidPrice
            ? counterpart.translate("exchange.invalid_price")
            : invalidAmount
                ? counterpart.translate("exchange.invalid_amount")
                : noBalance
                    ? counterpart.translate("exchange.no_balance")
                    : null;

        // Fee asset selection
        if (
            feeAssets[1] &&
            feeAssets[1].getIn([
                "options",
                "core_exchange_rate",
                "quote",
                "asset_id"
            ]) === "1.3.0" &&
            feeAssets[1].getIn([
                "options",
                "core_exchange_rate",
                "base",
                "asset_id"
            ]) === "1.3.0"
        ) {
            feeAsset = feeAssets[0];
            feeAssets.splice(1, 1);
        }
        let index = 0;
        let options = feeAssets.map(asset => {
            let {name, prefix} = utils.replaceName(asset);
            return (
                <Select.Option key={asset.get("id")} value={index++}>
                    {prefix}
                    {name}
                </Select.Option>
            );
        });

        // Subtract fee from amount to sell
        let balanceToAdd;

        if (feeAsset.get("symbol") === balanceSymbol) {
            balanceToAdd = balanceAmount.clone(
                balanceAmount.getAmount() - fee.getAmount()
            );
        } else {
            balanceToAdd = balanceAmount;
        }

        let dataIntro = isBid
            ? counterpart.translate("walkthrough.buy_form")
            : counterpart.translate("walkthrough.sell_form");

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

        const containerClass = "small-12";
        let formContent;

        // OrderForm is in panel
        if (verticalOrderForm) {
            formContent = (
                <div className={containerClass}>
                    <div className="grid-block no-overflow wrap shrink">
                        <Translate
                            className="small-12 buy-sell-label"
                            content="exchange.price"
                        />
                        <div className="inputAddon small-12">
                            <ExchangeInput
                                id={`${type}Price`}
                                value={price}
                                onChange={priceChange}
                                autoComplete="off"
                                placeholder="0.0"
                                addonAfter={
                                    <span>
                                        <AssetName
                                            dataPlace="right"
                                            name={base.get("symbol")}
                                        />
                                        &nbsp;/&nbsp;
                                        <AssetName
                                            dataPlace="right"
                                            name={quote.get("symbol")}
                                        />
                                    </span>
                                }
                            />
                        </div>
                    </div>
                    <div className="grid-block no-overflow wrap shrink">
                        {/*  */}
                        <Translate
                            className="small-12 buy-sell-label"
                            content="transfer.amount"
                        />
                        <div className="inputAddon small-12">
                            <ExchangeInput
                                id={`${type}Amount`}
                                value={amount}
                                onChange={amountChange}
                                autoComplete="off"
                                placeholder="0.0"
                                addonAfter={
                                    <span>
                                        <AssetName
                                            dataPlace="right"
                                            name={quote.get("symbol")}
                                        />
                                    </span>
                                }
                            />
                        </div>
                    </div>
                    <div className="grid-block no-overflow wrap shrink">
                        <Translate
                            className="small-12 buy-sell-label"
                            content="exchange.total"
                        />
                        <div className="inputAddon small-12">
                            <ExchangeInput
                                id={`${type}Total`}
                                value={total}
                                onChange={totalChange}
                                autoComplete="off"
                                placeholder="0.0"
                                addonAfter={
                                    <span>
                                        <AssetName
                                            dataPlace="right"
                                            name={base.get("symbol")}
                                        />
                                    </span>
                                }
                            />
                        </div>
                    </div>
                    <div className="grid-block no-overflow wrap shrink">
                        <Translate
                            className="small-12 buy-sell-label"
                            content="transfer.fee"
                        />
                        <div className="inputAddon small-12">
                            <ExchangeInput
                                id={`${type}Fee`}
                                placeholder="0.0"
                                defaultValue={
                                    !hasFeeBalance
                                        ? counterpart.translate(
                                              "transfer.errors.insufficient"
                                          )
                                        : fee.getAmount({real: true})
                                }
                                disabled
                                addonAfter={
                                    <Select
                                        style={{width: 100}}
                                        disabled={feeAssets.length === 1}
                                        defaultValue={feeAssets.indexOf(
                                            this.props.feeAsset
                                        )}
                                        onChange={this.props.onChangeFeeAsset}
                                    >
                                        {options}
                                    </Select>
                                }
                            />
                        </div>
                    </div>
                    {marketFee}
                </div>
            );
        } else {
            formContent = singleColumnForm ? (
                <div className={containerClass}>
                    <div className="grid-block no-overflow wrap shrink">
                        <Translate
                            className="small-3 buy-sell-label"
                            content="exchange.price"
                        />
                        <div className="inputAddon small-9">
                            <ExchangeInput
                                id={`${type}Price`}
                                value={price}
                                onChange={priceChange}
                                autoComplete="off"
                                placeholder="0.0"
                                addonAfter={
                                    <span>
                                        <AssetName
                                            dataPlace="right"
                                            name={base.get("symbol")}
                                        />
                                        &nbsp;/&nbsp;
                                        <AssetName
                                            dataPlace="right"
                                            name={quote.get("symbol")}
                                        />
                                    </span>
                                }
                            />
                        </div>
                    </div>
                    <div className="grid-block no-overflow wrap shrink">
                        {/*  */}
                        <Translate
                            className="small-3 buy-sell-label"
                            content="transfer.amount"
                        />
                        <div className="inputAddon small-9">
                            <ExchangeInput
                                id={`${type}Amount`}
                                value={amount}
                                onChange={amountChange}
                                autoComplete="off"
                                placeholder="0.0"
                                addonAfter={
                                    <span>
                                        <AssetName
                                            dataPlace="right"
                                            name={quote.get("symbol")}
                                        />
                                    </span>
                                }
                            />
                        </div>
                    </div>
                    <div className="grid-block no-overflow wrap shrink">
                        <Translate
                            className="small-3 buy-sell-label"
                            content="exchange.total"
                        />
                        <div className="inputAddon small-9">
                            <ExchangeInput
                                id={`${type}Total`}
                                value={total}
                                onChange={totalChange}
                                autoComplete="off"
                                placeholder="0.0"
                                addonAfter={
                                    <span>
                                        <AssetName
                                            dataPlace="right"
                                            name={base.get("symbol")}
                                        />
                                    </span>
                                }
                            />
                        </div>
                    </div>
                    <div className="grid-block no-overflow wrap shrink">
                        <Translate
                            className="small-3 buy-sell-label"
                            content="transfer.fee"
                        />
                        <div className="inputAddon small-9">
                            <ExchangeInput
                                id={`${type}Fee`}
                                placeholder="0.0"
                                value={
                                    !hasFeeBalance
                                        ? counterpart.translate(
                                              "transfer.errors.insufficient"
                                          )
                                        : fee.getAmount({real: true})
                                }
                                disabled
                                addonAfter={
                                    <Select
                                        style={{width: 100}}
                                        disabled={feeAssets.length === 1}
                                        defaultValue={feeAssets.indexOf(
                                            this.props.feeAsset
                                        )}
                                        onChange={this.props.onChangeFeeAsset}
                                    >
                                        {options}
                                    </Select>
                                }
                            />
                        </div>
                    </div>
                    {marketFee}
                </div>
            ) : (
                <div className={containerClass}>
                    <div className="grid-block no-overflow wrap shrink">
                        <div className="small-6">
                            <div className="small-11 grid-block no-overflow wrap shrink">
                                <Translate
                                    className="small-3 buy-sell-label"
                                    content="exchange.price"
                                />
                                <div
                                    className="small-9 buy-sell-label"
                                    style={{textAlign: "right"}}
                                >
                                    <span
                                        style={{
                                            borderBottom: "#A09F9F 1px dotted",
                                            cursor: "pointer"
                                        }}
                                        onClick={this.props.setPrice.bind(
                                            this,
                                            type,
                                            currentPriceObject.sellPrice()
                                        )}
                                    >
                                        <PriceText
                                            price={currentPrice}
                                            quote={quote}
                                            base={base}
                                        />{" "}
                                    </span>
                                </div>
                            </div>
                            <div className="inputAddon small-11">
                                <ExchangeInput
                                    id={`${type}Price`}
                                    value={price}
                                    onChange={priceChange}
                                    autoComplete="off"
                                    placeholder="0.0"
                                    addonAfter={
                                        <span>
                                            <AssetName
                                                dataPlace="right"
                                                name={base.get("symbol")}
                                            />
                                            &nbsp;/&nbsp;
                                            <AssetName
                                                dataPlace="right"
                                                name={quote.get("symbol")}
                                            />
                                        </span>
                                    }
                                />
                            </div>
                        </div>
                        <div className="small-6">
                            <div className="small-12 grid-block no-overflow wrap shrink">
                                <Translate
                                    className="small-3 buy-sell-label"
                                    content="exchange.total"
                                />
                                <div
                                    className="small-9 buy-sell-label"
                                    style={{textAlign: "right"}}
                                >
                                    <Translate
                                        className="small-3 buy-sell-label"
                                        content="exchange.balance"
                                    />
                                    &nbsp;
                                    <span
                                        style={{
                                            borderBottom: "#A09F9F 1px dotted",
                                            cursor: "pointer"
                                        }}
                                        onClick={this._addBalance.bind(
                                            this,
                                            balanceToAdd
                                        )}
                                    >
                                        {utils.format_number(
                                            balanceAmount.getAmount({
                                                real: true
                                            }),
                                            balancePrecision
                                        )}{" "}
                                    </span>
                                </div>
                            </div>

                            <div className="inputAddon small-12">
                                <ExchangeInput
                                    id={`${type}Total`}
                                    value={total}
                                    onChange={totalChange}
                                    autoComplete="off"
                                    placeholder="0.0"
                                    addonAfter={
                                        <span>
                                            <AssetName
                                                dataPlace="right"
                                                name={base.get("symbol")}
                                            />
                                        </span>
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <div className="grid-block no-overflow wrap shrink">
                        <div className="small-6">
                            {/*  */}
                            <Translate
                                className="small-3 buy-sell-label"
                                content="transfer.amount"
                            />
                            <div className="inputAddon small-11">
                                <ExchangeInput
                                    id={`${type}Amount`}
                                    value={amount}
                                    onChange={amountChange}
                                    autoComplete="off"
                                    placeholder="0.0"
                                    addonAfter={
                                        <span>
                                            <AssetName
                                                dataPlace="right"
                                                name={quote.get("symbol")}
                                            />
                                        </span>
                                    }
                                />
                            </div>
                        </div>
                        <div className="small-6">
                            <Translate
                                className="small-3 buy-sell-label"
                                content="transfer.fee"
                            />
                            <div className="inputAddon small-12">
                                <ExchangeInput
                                    id={`${type}Fee`}
                                    placeholder="0.0"
                                    defaultValue={
                                        !hasFeeBalance
                                            ? counterpart.translate(
                                                  "transfer.errors.insufficient"
                                              )
                                            : fee.getAmount({real: true})
                                    }
                                    disabled
                                    addonAfter={
                                        <Select
                                            style={{width: 100}}
                                            disabled={feeAssets.length === 1}
                                            defaultValue={feeAssets.indexOf(
                                                this.props.feeAsset
                                            )}
                                            onChange={
                                                this.props.onChangeFeeAsset
                                            }
                                        >
                                            {options}
                                        </Select>
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        const otherAsset = isBid ? base : quote;
        const isBitAsset = !!otherAsset.get("bitasset");
        // check if globally settled
        const isGloballySettled =
            isBitAsset && otherAsset.get("bitasset").get("settlement_fund") > 0;

        const currentAccount = AccountStore.getState().currentAccount;

        return (
            <div
                className={cnames(this.props.className)}
                style={this.props.styles}
            >
                <div
                    className="buy-sell-container"
                    style={{paddingRight: 5}}
                    //data-intro={dataIntro}
                >
                    {!hideHeader ? (
                        <div
                            className={
                                "exchange-content-header exchange-content-header--buy-sell-form " +
                                type
                            }
                        >
                            <span>
                                <TranslateWithLinks
                                    string="exchange.buysell_formatter"
                                    noLink
                                    noTip
                                    keys={[
                                        {
                                            type: "asset",
                                            value: quote.get("symbol"),
                                            arg: "asset"
                                        },
                                        {
                                            type: "translate",
                                            value: isPredictionMarket
                                                ? "exchange.short"
                                                : isBid
                                                    ? "exchange.buy"
                                                    : "exchange.sell",
                                            arg: "direction"
                                        }
                                    ]}
                                />
                            </span>
                            {/* <span>{buttonText} <AssetName dataPlace="top" name={quote.get("symbol")} /></span> */}
                            {this.props.onFlip &&
                            !this.props.hideFunctionButtons ? (
                                <span
                                    onClick={this.props.onFlip}
                                    style={{
                                        cursor: "pointer",
                                        fontSize: "1rem"
                                    }}
                                    className="flip-arrow"
                                >
                                    {" "}
                                    &#8646;
                                </span>
                            ) : null}
                            {this.props.onTogglePosition &&
                            !this.props.hideFunctionButtons ? (
                                <span
                                    onClick={this.props.onTogglePosition}
                                    style={{
                                        cursor: "pointer",
                                        fontSize: "1rem"
                                    }}
                                    className="flip-arrow"
                                >
                                    {" "}
                                    &#8645;
                                </span>
                            ) : null}
                            {this.props.moveOrderForm &&
                            !this.props.hideFunctionButtons ? (
                                <Icon
                                    onClick={this.props.moveOrderForm}
                                    name="thumb-tack"
                                    className="icon-14px icon-fill order-book-button-v"
                                    style={{marginLeft: 5}}
                                />
                            ) : null}
                        </div>
                    ) : null}

                    <form
                        ref="order_form"
                        className={
                            (!this.props.isOpen ? "hide-container " : "") +
                            "order-form"
                        }
                        style={{fontSize: "14px"}}
                        noValidate
                    >
                        <div className="grid-block no-overflow wrap shrink">
                            {this.props.moveOrderForm && verticalOrderForm ? (
                                <div
                                    style={{width: "100%", textAlign: "right"}}
                                    onClick={this.props.moveOrderForm}
                                >
                                    <Icon
                                        name="thumb-tack"
                                        className="icon-18px icon-fill order-book-button-v"
                                    />
                                </div>
                            ) : null}
                            {formContent}
                        </div>

                        <div className="grid-block no-overflow wrap shrink">
                            <div
                                className={
                                    singleColumnForm
                                        ? "small-12 grid-block"
                                        : "small-6"
                                }
                            >
                                <Translate
                                    className="small-4 buy-sell-label"
                                    content="transaction.expiration"
                                />
                                <div className="small-8 expiration-datetime-picker">
                                    <DatePicker
                                        ref={this.getDatePickerRef}
                                        className="expiration-datetime-picker--hidden"
                                        showTime
                                        showToday={false}
                                        disabledDate={current =>
                                            current <
                                            moment().add(59, "minutes")
                                        }
                                        value={
                                            expirationCustomTime !== "Specific"
                                                ? expirationCustomTime
                                                : moment().add(1, "hour")
                                        }
                                        onChange={
                                            this.props.onExpirationCustomChange
                                        }
                                    />
                                    <select
                                        className="cursor-pointer"
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
                            </div>
                            {!singleColumnForm ? (
                                <div className="small-6">{marketFee}</div>
                            ) : null}
                            <div className="small-12 medium-12 xlarge-12">
                                {singleColumnForm ? (
                                    <div className="grid-block no-overflow wrap shrink">
                                        <Translate
                                            className="small-4 buy-sell-label"
                                            content={
                                                isBid
                                                    ? "exchange.lowest_ask"
                                                    : "exchange.highest_bid"
                                            }
                                        />
                                        <div className="small-8 buy-sell-label">
                                            <span
                                                style={{
                                                    borderBottom:
                                                        "#A09F9F 1px dotted",
                                                    cursor: "pointer"
                                                }}
                                                onClick={this.props.setPrice.bind(
                                                    this,
                                                    type,
                                                    currentPriceObject.sellPrice()
                                                )}
                                            >
                                                <PriceText
                                                    price={currentPrice}
                                                    quote={quote}
                                                    base={base}
                                                />{" "}
                                                <AssetName
                                                    name={base.get("symbol")}
                                                    noTip
                                                />
                                                /
                                                <AssetName
                                                    name={quote.get("symbol")}
                                                    noTip
                                                />
                                            </span>
                                        </div>
                                    </div>
                                ) : null}
                                {singleColumnForm ? (
                                    <div className="grid-block no-overflow wrap shrink">
                                        <Translate
                                            className="small-4 buy-sell-label"
                                            content="exchange.balance"
                                        />
                                        <div className="small-8 buy-sell-label">
                                            <span
                                                style={{
                                                    borderBottom:
                                                        "#A09F9F 1px dotted",
                                                    cursor: "pointer"
                                                }}
                                                onClick={this._addBalance.bind(
                                                    this,
                                                    balanceToAdd
                                                )}
                                            >
                                                {utils.format_number(
                                                    balanceAmount.getAmount({
                                                        real: true
                                                    }),
                                                    balancePrecision
                                                )}{" "}
                                                <AssetName
                                                    name={balanceSymbol}
                                                    noTip
                                                />
                                            </span>
                                        </div>
                                    </div>
                                ) : null}
                                <div style={{marginTop: 10}}>
                                    <div>
                                        <Tooltip
                                            placement="top"
                                            title={
                                                disabledText ? disabledText : ""
                                            }
                                        >
                                            <Button
                                                className={
                                                    disabled
                                                        ? null
                                                        : buttonClass
                                                }
                                                disabled={disabled}
                                                onClick={onSubmit.bind(
                                                    this,
                                                    true
                                                )}
                                                type="primary"
                                                style={{margin: 5}}
                                            >
                                                {isBid ? "Buy" : "Sell"}
                                            </Button>
                                        </Tooltip>
                                        {/* <Button
                                            style={{margin: 5}}
                                            onClick={this.props.clearForm.bind(this, isBid)}
                                        >
                                            Clear
                                        </Button> */}

                                        {this.props.currentBridges &&
                                        !this.props.backedCoin ? (
                                            <Tooltip
                                                title={counterpart.translate(
                                                    "exchange.quick_deposit_bridge",
                                                    {
                                                        target: isBid
                                                            ? baseName
                                                            : quoteName
                                                    }
                                                )}
                                            >
                                                <Button
                                                    style={{margin: 5}}
                                                    onClick={this.props.onBuy.bind(
                                                        this
                                                    )}
                                                    disabled={
                                                        !this.props
                                                            .currentAccount ||
                                                        this.props.currentAccount.get(
                                                            "id"
                                                        ) === "1.2.3"
                                                    }
                                                >
                                                    <Translate
                                                        content="exchange.quick_deposit"
                                                        asset={
                                                            isBid
                                                                ? baseName
                                                                : quoteName
                                                        }
                                                    />
                                                </Button>
                                            </Tooltip>
                                        ) : null}
                                        {this.props.backedCoin &&
                                        !this.props.currentBridges ? (
                                            <Tooltip
                                                title={counterpart.translate(
                                                    "tooltip.gateway"
                                                )}
                                            >
                                                <Button
                                                    style={{margin: 5}}
                                                    onClick={this.props.onDeposit.bind(
                                                        this
                                                    )}
                                                    disabled={
                                                        !this.props
                                                            .currentAccount ||
                                                        this.props.currentAccount.get(
                                                            "id"
                                                        ) === "1.2.3"
                                                    }
                                                >
                                                    <Translate
                                                        content="exchange.quick_deposit"
                                                        asset={
                                                            isBid
                                                                ? baseName
                                                                : quoteName
                                                        }
                                                    />
                                                </Button>
                                            </Tooltip>
                                        ) : null}
                                        {this.props.currentBridges &&
                                        this.props.backedCoin ? (
                                            <Popover
                                                title={
                                                    <Translate
                                                        content="exchange.quick_deposit"
                                                        asset={
                                                            isBid
                                                                ? baseName
                                                                : quoteName
                                                        }
                                                    />
                                                }
                                                trigger="click"
                                                visible={
                                                    this.state
                                                        .isQuickDepositVisible
                                                }
                                                onVisibleChange={
                                                    this
                                                        .handleQuickDepositVisibleChange
                                                }
                                                content={
                                                    <div>
                                                        <Tooltip
                                                            title={counterpart.translate(
                                                                "exchange.quick_deposit_gateway",
                                                                {
                                                                    asset: isBid
                                                                        ? baseName
                                                                        : quoteName
                                                                }
                                                            )}
                                                        >
                                                            <Button
                                                                style={{
                                                                    marginRight: 5
                                                                }}
                                                                onClick={this.onDeposit.bind(
                                                                    this
                                                                )}
                                                            >
                                                                <Translate content="exchange.quick_deposit_gateway_button" />
                                                            </Button>
                                                        </Tooltip>

                                                        <Tooltip
                                                            title={counterpart.translate(
                                                                "exchange.quick_deposit_bridge",
                                                                {
                                                                    target: isBid
                                                                        ? baseName
                                                                        : quoteName
                                                                }
                                                            )}
                                                        >
                                                            <Button
                                                                onClick={this.onBuy.bind(
                                                                    this
                                                                )}
                                                            >
                                                                <Translate content="exchange.quick_deposit_bridge_button" />
                                                            </Button>
                                                        </Tooltip>
                                                    </div>
                                                }
                                            >
                                                <Tooltip
                                                    title={counterpart.translate(
                                                        "exchange.quick_deposit_tooltip",
                                                        {
                                                            asset: isBid
                                                                ? baseName
                                                                : quoteName
                                                        }
                                                    )}
                                                >
                                                    <Button
                                                        style={{margin: 5}}
                                                        disabled={
                                                            !this.props
                                                                .currentAccount ||
                                                            this.props.currentAccount.get(
                                                                "id"
                                                            ) === "1.2.3"
                                                        }
                                                    >
                                                        <Translate
                                                            content="exchange.quick_deposit"
                                                            asset={
                                                                isBid
                                                                    ? baseName
                                                                    : quoteName
                                                            }
                                                        />
                                                    </Button>
                                                </Tooltip>
                                            </Popover>
                                        ) : null}
                                        {this.props.onBorrow &&
                                        !isGloballySettled ? (
                                            <Button
                                                style={{margin: 5}}
                                                disabled={
                                                    !this.props
                                                        .currentAccount ||
                                                    this.props.currentAccount.get(
                                                        "id"
                                                    ) === "1.2.3"
                                                }
                                                onClick={this.props.onBorrow}
                                            >
                                                <Translate content="exchange.borrow" />
                                            </Button>
                                        ) : null}
                                        {isGloballySettled ? (
                                            <Button
                                                style={{margin: 5}}
                                                disabled={
                                                    !this.props
                                                        .currentAccount ||
                                                    this.props.currentAccount.get(
                                                        "id"
                                                    ) === "1.2.3"
                                                }
                                                onClick={this.showSettleModal}
                                                data-tip={counterpart.translate(
                                                    "exchange.settle_globally_settled_tooltip"
                                                )}
                                            >
                                                <Translate content="exchange.settle_globally_settled" />
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="grid-content clear-fix no-padding">
                                {/* SHORT button */}
                                {disabledText && isPredictionMarket ? (
                                    <Tooltip
                                        title={disabledText}
                                        placement="right"
                                    >
                                        <div
                                            style={{paddingRight: 10}}
                                            className="float-right"
                                        >
                                            <input
                                                style={{margin: 0}}
                                                className={buttonClass}
                                                type="submit"
                                                onClick={onSubmit.bind(
                                                    this,
                                                    false
                                                )}
                                                value={forceSellText}
                                            />
                                        </div>
                                    </Tooltip>
                                ) : isPredictionMarket ? (
                                    <Tooltip title={""} placement="right">
                                        <div
                                            style={{paddingRight: 10}}
                                            className="float-right"
                                        >
                                            <input
                                                style={{margin: 0}}
                                                className={buttonClass}
                                                type="submit"
                                                onClick={onSubmit.bind(
                                                    this,
                                                    false
                                                )}
                                                value={forceSellText}
                                            />
                                        </div>
                                    </Tooltip>
                                ) : null}
                            </div>
                        </div>
                    </form>
                </div>

                {isGloballySettled &&
                    !!this.props.currentAccount && (
                        <SettleModal
                            visible={this.state.isSettleModalVisible}
                            hideModal={this.hideSettleModal}
                            showModal={this.showSettleModal}
                            asset={otherAsset.get("id")}
                            account={this.props.currentAccount}
                        />
                    )}
            </div>
        );
    }
}

export default BindToChainState(BuySell);
