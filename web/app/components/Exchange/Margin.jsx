import React from "react";
import Icon from "../Icon/Icon";
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

    _adjustMargin() {
        // TODO: make API call to adjust margin position
        console.log("Updating margin: " + this.state.nextAmount + " " + this.props.quoteSymbol);
    }

    _amountChanged(e) { this.setState({nextAmount: e.target.value }); }
    _collateralChanged(e) { this.setState({nextCollateral: e.target.value }); }

    render() {
        let backing = Number(((this.state.nextCollateral / this.state.nextAmount) / this.props.priceFeed) * 100).toFixed(2);
        let backingClass = backing < this.props.marginCallFeed ? "backingError" : backing < this.props.marginCallFeed  * 1.3333 ? "backingWarning" : "backingSafe";

        if(backing == "NaN" || backing == Infinity) backing = "N/A"; else backing = backing + "%";

        let form = (
            <form className="order-form" onSubmit={this._adjustMargin.bind(this)}>
                <label>Margin ({this.props.quoteSymbol}): 
                    <input type="text" id="amount" value={this.state.nextAmount} onChange={this._amountChanged.bind(this)} />
                </label>
                <label>Collateral ({this.props.baseSymbol}): 
                    <input type="text" id="collateral" value={this.state.nextCollateral} onChange={this._collateralChanged.bind(this)} />
                </label>
                <p>Backing: <span className={backingClass}>{backing}</span> <Icon name="question-circle" fillClass="fill-black" /></p>
                <input type="submit" className="button" value={"Create " + this.state.nextAmount + " " + this.props.quoteSymbol} />
            </form>
        );

        let view = (
            <p></p>
        );

        return (
            form
        );
    }
}

export default Margin;
