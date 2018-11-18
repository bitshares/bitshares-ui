import React from "react";
import AmountSelector from "./AmountSelector";
import {Price, Asset} from "common/MarketClasses";
import AssetWrapper from "../Utility/AssetWrapper";

class PriceInput extends React.Component {
    constructor(props) {
        super();

        let quote = new Asset({
            amount: 0,
            asset_id: props.quote.get("id"),
            precision: props.quote.get("precision")
        });
        let base = new Asset({
            amount: 0,
            asset_id: props.base.get("id"),
            precision: props.base.get("precision")
        });

        let price = new Price({
            quote,
            base
        });

        this.state = {
            price,
            realPriceValue: price.toReal()
        };
    }

    onPriceChanged({amount}) {
        this.state.price.setPriceFromReal(parseFloat(amount));
        this.setState({
            realPriceValue: amount
        });

        if (this.props.onPriceChanged)
            this.props.onPriceChanged(this.state.price.clone());
    }

    render() {
        const {realPriceValue, price} = this.state;

        return (
            <AmountSelector
                label={this.props.label}
                amount={realPriceValue}
                onChange={this.onPriceChanged.bind(this)}
                asset={price.base.asset_id}
                base={this.props.quote.get("symbol")}
                isPrice
                assets={[price.quote.asset_id]}
                placeholder="0.0"
                tabIndex={1}
                style={{
                    width: "100%",
                    paddingRight: "10px"
                }}
            />
        );
    }
}

PriceInput = AssetWrapper(PriceInput, {
    propNames: ["quote", "base"],
    defaultProps: {
        base: "1.3.0"
    }
});

export default PriceInput;
