import React from "react";
import {PropTypes} from "react/addons";
import classNames from "classnames";
import utils from "common/utils";

class BuySell extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
                nextProps.amount !== this.props.amount ||
                nextProps.price !== this.props.price
            );
    }

    render() {
        let {type, quoteSymbol, baseSymbol, amount, price, amountChange, priceChange, onSubmit, balance} = this.props;
        // console.log("this.props", this.props);
        let total = amount * price;
        let buttonText = `${type === "buy" ? "Buy" : "Sell"} ${amount} ${quoteSymbol}`;
        let balanceSymbol = type === "buy" ? quoteSymbol : baseSymbol;
        let divClass = classNames(this.props.className, `${type}-form`);

        return (
            <div className={divClass}>
                <form className="order-form" onSubmit={onSubmit}>
                    <div className="grid-block">
                        <div className="grid-content">
                            <label style={{"margin-right": "10px"}}> {/* TODO: move the margin style into a CSS class */}
                                Quantity ({quoteSymbol}):
                                <input type="text" id="buyAmount" value={amount} onChange={amountChange}/>
                            </label>
                        </div>
                        <div className="grid-content">
                            <label style={{"margin-right": "10px"}}>
                                Price: ({baseSymbol} per {quoteSymbol}):
                                <input type="text" id="buyPrice" value={price} onChange={priceChange}/>
                            </label>
                        </div>
                    </div>
  
                    <input class={type} type="submit" className="button buySellButton" value={buttonText}/>
                    <p>Balance: {`${utils.format_number(balance, 3)} ${balanceSymbol}`}</p>
                    <p>Total ({baseSymbol}): { utils.format_number(total, 3) }</p>
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
    base: PropTypes.object.isRequired,
    quote: PropTypes.object.isRequired,
    amountChange: PropTypes.func.isRequired,
    priceChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};

export default BuySell;
