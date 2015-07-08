import React from "react";
import {PropTypes} from "react/addons";
import classNames from "classnames";
import utils from "common/utils";

class BuySell extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
                nextProps.amount !== this.props.amount ||
                nextProps.price !== this.props.price ||
                nextProps.balance !== this.props.balance
            );
    }

    render() {
        let {type, quoteSymbol, baseSymbol, amount, price, amountChange, priceChange, onSubmit, balance} = this.props;
        // console.log("this.props", this.props);
        let total = amount * price;
        let buttonText = `${type === "buy" ? "Buy" : "Sell"} ${amount} ${quoteSymbol}`;
        let buttonClass = classNames("button buySellButton", type);
        let balanceSymbol = type === "buy" ? baseSymbol : quoteSymbol;
        let divClass = classNames(this.props.className, `${type}-form`);

        return (
            <div className={divClass}>
                <form className="order-form" onSubmit={onSubmit}>
                    <div className="grid-block">
                        <div className="grid-content">
                            <label> {/* TODO: move the margin style into a CSS class */}
                                Quantity ({quoteSymbol}):
                                <input type="text" id="buyAmount" value={amount} onChange={amountChange}/>
                            </label>
                        </div>
                        <div className="grid-content">
                            <label>
                                Price: ({baseSymbol} per {quoteSymbol}):
                                <input type="text" id="buyPrice" value={price} onChange={priceChange}/>
                            </label>
                        </div>
                    </div>
  
                    <input className={buttonClass} type="submit" value={buttonText}/>
                    <p className="buy-sell-info">Balance: {`${utils.format_number(balance, 3)} ${balanceSymbol}`}</p>
                    <p className="buy-sell-info">Total ({baseSymbol}): { utils.format_number(total, 3) }</p>
                </form>
                </div>
        );
    }
}

BuySell.defaultProps = {
    type: "buy"
};

BuySell.propTypes = {
    type: PropTypes.string,
    amountChange: PropTypes.func.isRequired,
    priceChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};

export default BuySell;
