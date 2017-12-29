import React from "react";
import utils from "common/utils";

class PriceText extends React.Component {

    render() {
        let {price, preFormattedPrice, quote, base, component} = this.props;

        let formattedPrice = preFormattedPrice ? preFormattedPrice : utils.price_to_text(price, quote, base);
        
        if (formattedPrice.full >= 1) {
            return (
                <span>
                    <span className="price-integer">{formattedPrice.int}.</span>
                    {formattedPrice.dec ? <span className="price-integer">{formattedPrice.dec}</span> : null}
                    {formattedPrice.trailing ? <span className="price-decimal">{formattedPrice.trailing}</span> : null}
                </span>
            )
        } else if (formattedPrice.full >= 0.1) {
            return (
                <span>
                    <span className="price-decimal">{formattedPrice.int}.</span>
                    {formattedPrice.dec ? <span className="price-integer">{formattedPrice.dec}</span> : null}
                    {formattedPrice.trailing ? <span className="price-decimal">{formattedPrice.trailing}</span> : null}
                </span>
            )
        } else {
            return (
                <span>
                    <span className="price-decimal">{formattedPrice.int}.</span>
                    {formattedPrice.dec ? <span className="price-decimal">{formattedPrice.dec}</span> : null}
                    {formattedPrice.trailing ? <span className="price-integer">{formattedPrice.trailing}</span> : null}
                </span>
            )
        }
    }
}

export default PriceText;
