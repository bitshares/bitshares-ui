import React from "react";
import {PropTypes} from "react/addons";
import classNames from "classnames";
import utils from "common/utils";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import PriceText from "../Utility/PriceText";
import FormattedFee from "../Utility/FormattedFee";

@BindToChainState({keep_updating: true})
class BuySell extends React.Component {
    static propTypes = {
        balance: ChainTypes.ChainObject,
        type: PropTypes.string,
        amountChange: PropTypes.func.isRequired,
        priceChange: PropTypes.func.isRequired,
        onSubmit: PropTypes.func.isRequired
    }

    static defaultProps = {
        type: "buy"
    }

    shouldComponentUpdate(nextProps) {
        return (
                nextProps.amount !== this.props.amount ||
                nextProps.total !== this.props.total ||
                nextProps.currentPrice !== this.props.currentPrice ||
                nextProps.price !== this.props.price ||
                nextProps.balance !== this.props.balance ||
                nextProps.account !== this.props.account ||
                nextProps.className !== this.props.className
            );
    }

    _addBalance(balance) {
        if (this.props.type === "buy") {
            this.props.totalChange({target: {value: balance.toString()}});
        } else {
            this.props.amountChange({target: {value: balance.toString()}});
        }
    }

    _setPrice(price) {
        this.props.priceChange({target: {value: price.toString()}});
    }

    render() {
        let {type, quote, base, amountChange,
            priceChange, onSubmit, balance, totalPrecision, totalChange,
            balancePrecision, quotePrecision, currentPrice} = this.props;
        let amount, price, total;

        if (this.props.amount) amount = this.props.amount;
        if (this.props.price) price = this.props.price;
        if (this.props.total) total = this.props.total;

        let buttonText = `${type === "buy" ? counterpart.translate("exchange.buy") : counterpart.translate("exchange.sell")}`;
        let buttonClass = classNames("button buySellButton", type, {disabled: !(balance && balance.get("balance") > 0 && amount > 0 && price > 0)});
        let balanceSymbol = type === "buy" ? base.get("symbol") : quote.get("symbol");
        // let divClass = classNames(this.props.className, `${type}-form`);

        let balanceAmount = balance ? utils.get_asset_amount(balance.get("balance"), {precision: balancePrecision}) : 0;
        if (!balanceAmount) {
            balanceAmount = 0;
        }

        return (
            <div className={this.props.className + " middle-content"}>
                <form className="order-form" onSubmit={onSubmit} noValidate>
                    <div className="grid-block vertical no-overflow no-padding">

                            <div className="grid-block no-padding buy-sell-row">
                                <div className="grid-block small-3 no-margin no-overflow buy-sell-label">
                                    <Translate content="exchange.price" />:
                                </div>
                                <div className="grid-block small-6 no-margin no-overflow buy-sell-input">
                                    <input type="number" id="buyPrice" value={price} onChange={priceChange} autoComplete="off" placeholder="0.0"/>
                                </div>
                                <div className="grid-block small-3 no-margin no-overflow buy-sell-box">
                                    {base.get("symbol")}/{quote.get("symbol")}
                                </div>
                            </div>
                            
                            <div className="grid-block no-padding buy-sell-row">
                                <div className="grid-block small-3 no-margin no-overflow buy-sell-label">
                                    {buttonText}:
                                </div>
                                <div className="grid-block small-6 no-margin no-overflow buy-sell-input">
                                    <input type="number" id="buyAmount" value={amount} onChange={amountChange} autoComplete="off" placeholder="0.0"/>
                                </div>
                                <div className="grid-block small-3 no-margin no-overflow buy-sell-box">
                                    {quote.get("symbol")}
                                </div>
                            </div>

                            <div className="grid-block no-padding buy-sell-row bottom-row">
                                <div className="grid-block small-3 no-margin no-overflow buy-sell-label">
                                    {type === "buy" ? <Translate content="account.pay" /> : <Translate content="exchange.receive" />}:
                                </div>
                                <div className="grid-block small-6 no-margin no-overflow buy-sell-input">
                                    <input type="number" id="buyAmount" value={total} onChange={totalChange} autoComplete="off" placeholder="0.0"/>
                                </div>
                                <div className="grid-block small-3 no-margin no-overflow buy-sell-box">
                                    {base.get("symbol")}
                                </div>
                            </div>

                            <div className="grid-block no-padding buy-sell-row">
                                <div className="grid-block small-3 no-margin no-overflow buy-sell-label">
                                    <Translate content="transfer.fee" />:
                                </div>
                                <div className="grid-block small-6 no-margin no-overflow buy-sell-input">
                                    <FormattedFee opType="limit_order_create" />
                                </div>

                            </div>

                        </div>
                        <div>
                            <div className="grid-content clear-fix no-padding">
                                <div className="float-left">
                                      <div className="buy-sell-info">
                                          <div style={{display: "inline-block", minWidth: "7rem"}}>{this.props.account}:&nbsp;</div>
                                          <span style={{borderBottom: "#A09F9F 1px dotted", cursor: "pointer"}} onClick={this._addBalance.bind(this, balanceAmount)}>{utils.format_number(balanceAmount, balancePrecision)}</span> {balanceSymbol}
                                      </div>
                                      <div className="buy-sell-info">
                                          <div style={{display: "inline-block", minWidth: "7rem"}}>{this.props.type === "buy" ? <Translate content="exchange.lowest_ask" /> : <Translate content="exchange.highest_bid" />}:&nbsp;</div>
                                          <span style={{borderBottom: "#A09F9F 1px dotted", cursor: "pointer"}} onClick={this._setPrice.bind(this, currentPrice)}><PriceText price={currentPrice} quote={quote} base={base} />&nbsp;</span>{base.get("symbol")}/{quote.get("symbol")}
                                      </div>
                                  </div>
                                  <div className="float-right">
                                    <input className={buttonClass} type="submit" value={buttonText} />
                                  </div>
                              </div>
                              
                        </div>

                </form>
                </div>
        );
    }
}

export default BuySell;
