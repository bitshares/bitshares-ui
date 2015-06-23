import React from "react";
import MarketsActions from "actions/MarketsActions";
import utils from "common/utils";
import classNames from "classnames";

class Margin extends React.Component {
    constructor(props) {
        super();

        this.state = {
            nextCollateral: props.collateral,
            nextAmount: props.amount
        };
    }

    _createShort() {
        // TODO: make API call to adjust margin position
        console.log("Updating margin: " + this.state.nextAmount + " " + this.props.quoteSymbol);
    }

    _amountChanged(e) {
         this.setState({nextAmount: e.target.value });
    }

    render() {
        let backing = Math.round((((this.state.nextCollateral / this.state.nextAmount) / this.props.priceFeed) * 10000)) / 100;

        return (
            <form className="order-form"
                // TODO: allow adjustment of the collateral position
                onSubmit={this._createShort.bind(this)}>
                <label>
                    <input type="text" id="amount" value={this.state.nextAmount} onChange={this._amountChanged.bind(this)} />
                </label>
                <p>Collateral locked: {this.state.nextAmount * this.props.priceFeed * 2} {this.props.baseSymbol}.</p>
                <input type="submit" className="button" value={"Create " + this.state.nextAmount + " " + this.props.quoteSymbol} />
            </form>
        );
    }
}

export default Margin;
