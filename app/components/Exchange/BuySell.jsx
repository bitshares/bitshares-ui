import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import utils from "common/utils";
import Translate from "react-translate-component";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import counterpart from "counterpart";
import SettingsStore from "stores/SettingsStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import PriceText from "../Utility/PriceText";
import AssetName from "../Utility/AssetName";
import SimpleDepositWithdraw from "../Dashboard/SimpleDepositWithdraw";
import SimpleDepositBlocktradesBridge from "../Dashboard/SimpleDepositBlocktradesBridge";
import {Asset} from "common/MarketClasses";
import ExchangeInput from "./ExchangeInput";
import assetUtils from "common/asset_utils";
import DatePicker from "react-datepicker2/src/";
import moment from "moment";
import Icon from "../Icon/Icon";
import {
    Button,
    Input,
    Select
} from 'bitshares-ui-style-guide'

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

    shouldComponentUpdate(nextProps) {
        return (
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
            nextProps.expirationCustomTime !== this.props.expirationCustomTime
        );
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

    _onDeposit(e) {
        e.preventDefault();
        this.refs.deposit_modal.show();
    }

    _onBuy(e) {
        e.preventDefault();
        this.refs.bridge_modal.show();
    }

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
            backedCoin,
            hideHeader
        } = this.props;
        let amount, price, total;
        let caret = this.props.isOpen ? (
            <span>&#9660;</span>
        ) : (
            <span>&#9650;</span>
        );

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
                  amount *
                      quote.getIn(["options", "market_fee_percent"]) /
                      10000
              ).toFixed(maxQuoteMarketFee.precision);
        const baseFee = !amount
            ? 0
            : Math.min(
                  maxBaseMarketFee.getAmount({real: true}),
                  total * base.getIn(["options", "market_fee_percent"]) / 10000
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
            <div 
                style={{width: "100%"}} 
                data-tip={counterpart.translate("tooltip.market_fee", {percent: baseMarketFeePercent,asset: (basePrefix || "") + baseName})}
                className="inline-block tooltip"
            >
                <div style={{paddingBottom: 6}}>
                    <Translate content="explorer.asset.summary.market_fee" /> ({baseMarketFeePercent})
                </div>
                <Input 
                    defaultValue="0.0"
                    id="baseMarketFee"
                    value={baseFee}
                    addonAfter={<span><AssetName noTip name={base.get("symbol")} /></span>}
                />
            </div>
        ) : null;

        const {name: quoteName, prefix: quotePrefix} = utils.replaceName(
            this.props.quote
        );
        var quoteMarketFee = quoteFlagBooleans["charge_market_fee"] ? (
            <div 
                style={{width: "100%"}} 
                data-tip={counterpart.translate("tooltip.market_fee", {percent: quoteMarketFeePercent, asset: (quotePrefix || "") + quoteName})}
                className="inline-block tooltip"
            >
                <div style={{paddingBottom: 6}}>
                    <Translate content="explorer.asset.summary.market_fee" /> ({quoteMarketFeePercent})
                </div>
                <Input 
                    defaultValue="0.0"
                    id="quoteMarketFee"
                    value={quoteFee}
                    addonAfter={<span><AssetName noTip name={quote.get("symbol")} /></span>}
                />
            </div>
        ) : null;

        const isBid = type === "bid";
        let marketFee =
            isBid && quoteMarketFee
                ? quoteMarketFee
                : !isBid && baseMarketFee
                    ? baseMarketFee
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
                    {prefix}{name}
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

        let {name, prefix} = utils.replaceName(
            this.props[isBid ? "base" : "quote"]
        );
        let buyBorrowDepositName = (prefix ? prefix : "") + name;

        const translator = require("counterpart");

        let dataIntro = null;

        if (type == "bid") {
            dataIntro = translator.translate("walkthrough.buy_form");
        }

        if (type == "ask") {
            dataIntro = translator.translate("walkthrough.sell_form");
        }

        const expirationsOptionsList = Object.keys(this.props.expirations).map(
            (key, i) => (
                <option value={key} key={key}>
                    {this.props.expirations[key].title}
                </option>
            )
        );

        // datepicker puts on the end of body so it's out of theme scope
        // so theme is used on wrapperClassName
        const theme = SettingsStore.getState().settings.get("themes");

        const minExpirationDate = moment();

        const containerClass = 
            this.props.exchangeLayout <= 2 
                ? !this.props.isPanelActive 
                    ? "small-12 medium-6 large-6 xlarge-6" 
                    : "small-12 medium-6 large-12 xlarge-6" 
            : this.props.exchangeLayout >= 3 && this.props.exchangeLayout <= 4
                ? !this.props.isPanelActive 
                    ? "small-12 medium-6 large-6 xlarge-6" 
                    : "small-12 medium-12 xlarge-12"
            : "small-12 medium-12 xlarge-12";

        return (
            <div className={this.props.className}>
                <div className="buy-sell-container">
                    {!hideHeader ? <div
                        className={"exchange-content-header " + type}
                        data-intro={dataIntro}
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
                        {this.props.onFlip ? (
                            <span
                                onClick={this.props.onFlip}
                                style={{cursor: "pointer", fontSize: "1rem"}}
                                className="flip-arrow"
                            >
                                {" "}
                                &#8646;
                            </span>
                        ) : (
                            "null"
                        )}
                        {this.props.onTogglePosition ? (
                            <span
                                onClick={this.props.onTogglePosition}
                                style={{cursor: "pointer", fontSize: "1rem"}}
                                className="flip-arrow"
                            >
                                {" "}
                                &#8645;
                            </span>
                        ) : (
                            "null"
                        )}
                    </div> : null}

                    <form
                        className={
                            (!this.props.isOpen ? "hide-container " : "") +
                            "order-form"
                        }
                        style={{fontSize: "14px"}}
                        noValidate
                    >
                        <div className="grid-block no-overflow wrap shrink">
                            <div className={containerClass} style={{paddingRight: 10}}>
                                <div className="inputAddon">
                                    <div style={{paddingBottom: 6}}>
                                        <Translate content="exchange.price" />
                                        <span style={{float: "right"}}>
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
                                                {isBid ? <Translate content="exchange.lowest_ask" /> : <Translate content="exchange.highest_bid" />}
                                            </span>
                                        </span>
                                    </div>
                                    
                                    <Input defaultValue="0" id={`${type}Price`} value={price} onChange={priceChange} addonAfter={
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
                                        </span>} 
                                    />
                                </div>
                                <div className="inputAddon">
                                    <div style={{paddingBottom: 6}}><Translate content="transfer.amount" />
                                        <span style={{float: "right"}}>
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
                                                Use all balance
                                            </span>
                                        </span>
                                    </div>
                                    
                                    <Input 
                                        defaultValue="0.0" 
                                        id={`${type}Amount`}
                                        value={amount}
                                        onChange={amountChange}
                                        addonAfter={
                                            <AssetName
                                                style={{width: 100}}
                                                dataPlace="right"
                                                name={quote.get("symbol")}
                                            />
                                        } 
                                    />
                                </div>
                                
                            </div>
                            <div className={containerClass} style={{paddingRight: 10}}>
                                <div className="inputAddon">
                                    <div style={{paddingBottom: 6}}><Translate content="exchange.total" /></div>
                                    <Input 
                                        defaultValue="0.0" 
                                        id={`${type}Total`}
                                        value={total}
                                        onChange={totalChange}
                                        addonAfter={
                                            <AssetName
                                                dataPlace="right"
                                                name={base.get("symbol")}
                                            />
                                        } 
                                    />
                                </div>
                                <div className="inputAddon">
                                    <div style={{paddingBottom: 6}}><Translate content="transfer.fee" /></div>
                                    <Input 
                                        defaultValue="0.0" 
                                        id={`${type}Fee`}
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
                                <div className="inputAddon">
                                    {marketFee}
                                </div>
                            </div>
                        </div>

                        <div className="grid-block no-overflow">
                            <div className="small-12 medium-12 xlarge-12">
                                <div className="small-12 medium-6 xlarge-6">
                                    <span style={{marginBottom: 5}}><Translate content="transaction.expiration" /></span>
                                    <div className="expiration-datetime-picker" style={{minHeight: 60}}>
                                        <select
                                            onChange={this.props.onExpirationTypeChange}
                                            value={this.props.expirationType}
                                        >
                                            {expirationsOptionsList}
                                        </select>
                                        {this.props.expirationType === "SPECIFIC" ? (
                                            <DatePicker
                                                pickerPosition={"bottom center"}
                                                wrapperClassName={theme}
                                                timePicker={true}
                                                min={minExpirationDate}
                                                inputFormat={"Do MMM YYYY hh:mm A"}
                                                value={this.props.expirationCustomTime}
                                                onChange={this.props.onExpirationCustomChange}
                                            />
                                        ) : null}
                                    </div>
                                </div>
                                <div>
                                    {/*<div>
                                        Advanced options...
                                    </div>*/}
                                    <div>
                                        <Button 
                                            data-tip={disabledText ? disabledText : ""} 
                                            data-place="top"
                                            className={disabled ? null : buttonClass}
                                            disabled={disabled}
                                            onClick={onSubmit.bind(this, true)}
                                            type="primary"
                                            style={{margin: 5}}
                                        >
                                            {isBid ? "Buy" : "Sell"}
                                        </Button>
                                        {/* <Button
                                            style={{margin: 5}}
                                        >
                                            Clear
                                        </Button> */}
                                        {this.props.backedCoin ? (
                                            <Button 
                                                style={{margin: 5}}
                                                onClick={this._onDeposit.bind(this)}>
                                                    <TranslateWithLinks
                                                        string="exchange.buysell_formatter"
                                                        noLink
                                                        keys={[
                                                            {
                                                                type: "asset",
                                                                value: isBid ? base.get("symbol") : quote.get("symbol"),
                                                                arg: "asset"
                                                            },
                                                            {
                                                                type: "translate",
                                                                value: "exchange.deposit",
                                                                arg: "direction"
                                                            }
                                                        ]}
                                                    />
                                            </Button>
                                        ) : null}
                                        {this.props.onBorrow ? (
                                            <Button 
                                                style={{margin: 5}}
                                                onClick={this.props.onBorrow}
                                            >
                                                <TranslateWithLinks
                                                    string="exchange.buysell_formatter"
                                                    noLink
                                                    keys={[
                                                        {
                                                            type: "asset",
                                                            value: isBid ? base.get("symbol") : quote.get("symbol"),
                                                            arg: "asset"
                                                        },
                                                        {
                                                            type: "translate",
                                                            value: "exchange.borrow",
                                                            arg: "direction"
                                                        }
                                                    ]}
                                                />
                                            </Button>
                                        ) : null}
                                        {this.props.currentBridges ? (
                                            <Button 
                                                style={{margin: 5}}
                                                onClick={this._onBuy.bind(this)}
                                            >
                                                <TranslateWithLinks
                                                    string="exchange.buysell_formatter"
                                                    noLink
                                                    keys={[
                                                        {
                                                            type: "asset",
                                                            value: isBid ? base.get("symbol") : quote.get("symbol"),
                                                            arg: "asset"
                                                        },
                                                        {
                                                            type: "translate",
                                                            value: "exchange.buy_quick",
                                                            arg: "direction"
                                                        }
                                                    ]}
                                                />
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
                                    <div
                                        style={{paddingRight: 10}}
                                        className="float-right"
                                        data-tip={disabledText}
                                        data-place="right"
                                    >
                                        <input
                                            style={{margin: 0}}
                                            className={buttonClass}
                                            type="submit"
                                            onClick={onSubmit.bind(this, false)}
                                            value={forceSellText}
                                        />
                                    </div>
                                ) : isPredictionMarket ? (
                                    <div
                                        style={{paddingRight: 10}}
                                        className="float-right"
                                        data-tip={""}
                                    >
                                        <input
                                            style={{margin: 0}}
                                            className={buttonClass}
                                            type="submit"
                                            onClick={onSubmit.bind(this, false)}
                                            value={forceSellText}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </form>
                </div>
                <SimpleDepositWithdraw
                    ref="deposit_modal"
                    action="deposit"
                    fiatModal={false}
                    account={this.props.currentAccount.get("name")}
                    sender={this.props.currentAccount.get("id")}
                    asset={this.props[isBid ? "base" : "quote"].get("id")}
                    modalId={
                        "simple_deposit_modal" + (type === "bid" ? "" : "_ask")
                    }
                    balances={[this.props.balance]}
                    {...backedCoin}
                />

                {/* Bridge modal */}
                <SimpleDepositBlocktradesBridge
                    ref="bridge_modal"
                    action="deposit"
                    account={this.props.currentAccount.get("name")}
                    sender={this.props.currentAccount.get("id")}
                    asset={this.props.balanceId}
                    modalId={
                        "simple_bridge_modal" + (type === "bid" ? "" : "_ask")
                    }
                    balances={[this.props.balance]}
                    bridges={this.props.currentBridges}
                />
            </div>
        );
    }
}

export default BindToChainState(BuySell);
