import React from "react";
import {PropTypes} from "react/addons";
import classNames from "classnames";

class BuySell extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
                nextProps.amount !== this.props.amount ||
                nextProps.price !== this.props.price
            );
    }

    render() {
        let {type, quoteSymbol, baseSymbol, amount, price, amountChange, priceChange, onSubmit} = this.props;
        console.log("this.props", this.props);
        let total = amount * price;
        let buttonText = `${type === "buy" ? "Buy" : "Sell"} ${amount} ${quoteSymbol}`;
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
                    <p>Total ({baseSymbol}): { total.toFixed(3) }</p>
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
