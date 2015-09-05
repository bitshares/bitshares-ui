import React from "react";
import {PropTypes} from "react/addons";
import classNames from "classnames";
import utils from "common/utils";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";

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
                nextProps.balance !== this.props.balance
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
        let {type, quoteSymbol, baseSymbol, amount, price, amountChange,
            priceChange, onSubmit, balance, totalPrecision, total, totalChange,
            balancePrecision, quotePrecision, currentPrice} = this.props;
        
        let buttonText = `${type === "buy" ? counterpart.translate("exchange.buy") : counterpart.translate("exchange.sell")}`;
        let buttonClass = classNames("button buySellButton", type, {disabled: !(balance && balance.get("balance") > 0 && amount > 0 && price > 0)});
        let balanceSymbol = type === "buy" ? baseSymbol : quoteSymbol;
        let divClass = classNames(this.props.className, `${type}-form`);

        let balanceAmount = balance ? utils.get_asset_amount(balance.get("balance"), {precision: balancePrecision}) : 0;

        return (
            <div className={divClass}>
                <form className="order-form" onSubmit={onSubmit}>
                    <div className="grid-block vertical">
                        <div className="grid-content">
                            <div className="buy-sell-info">
                                <Translate content="exchange.balance" />:&nbsp;
                                <span style={{borderBottom: "#A09F9F 1px dotted", cursor: "pointer"}} onClick={this._addBalance.bind(this, balanceAmount)}>{utils.format_number(balanceAmount, balancePrecision)}</span> {balanceSymbol}
                            </div>
                            <div className="buy-sell-info">
                                {this.props.type === "buy" ? <Translate content="exchange.lowest_ask" /> : <Translate content="exchange.highest_bid" />}:&nbsp;
                                <span style={{borderBottom: "#A09F9F 1px dotted", cursor: "pointer"}} onClick={this._setPrice.bind(this, currentPrice)}>{utils.format_number(currentPrice, quotePrecision)}</span> {baseSymbol}/{quoteSymbol}
                            </div>
                        </div>

                        <div className="grid-content no-overflow no-padding" style={{width: "90%", margin: "0 5%"}}>

                            <div className="buy-sell-row">
                                <div className="buy-sell-label">
                                    <Translate  content="exchange.price" />:
                                </div>
                                <div className="buy-sell-details">
                                    <div className="buy-sell-box">{baseSymbol}</div>
                                    <div className="buy-sell-input">
                                        <input type="text" id="buyPrice" value={price} onChange={priceChange} style={{ paddingRight: "4px" ,}}/>
                                    </div>
                                </div>
                            </div>

                            <div className="buy-sell-row">
                                <div className="buy-sell-label">
                                    <Translate  content="exchange.quantity" />:
                                </div>
                                <div className="buy-sell-details">
                                    <div className="buy-sell-box">{quoteSymbol}</div>
                                    <div className="buy-sell-input">
                                        <input type="text" id="buyAmount" value={amount} onChange={amountChange} style={{float: "right", width: "100%" , paddingRight: "4px"}}/>
                                    </div>
                                </div>
                            </div>

                            <div className="buy-sell-row bottom-row">
                                <div className="buy-sell-label">
                                    <Translate  content="exchange.total" />:
                                </div>
                                <div className="buy-sell-details">
                                    <div className="buy-sell-box">{baseSymbol}</div>
                                    <div className="buy-sell-input">
                                        <input type="text" id="buyAmount" value={total} onChange={totalChange} style={{float: "right", width: "100%" , paddingRight: "4px"}}/>
                                    </div>
                                </div>
                            </div>

                            <input className={buttonClass} type="submit" value={buttonText} />
                        </div>


                    </div>


                </form>
                </div>
        );
    }
}

export default BuySell;
