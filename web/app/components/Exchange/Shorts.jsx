import React from "react";
import MarketsActions from "actions/MarketsActions";
import utils from "common/utils";
import classNames from "classnames";

//require("./shorts.scss");

// TODO: get shorts from API call
let shorts = [
    {collateralAmount: 10000, amount: 50 },
    {collateralAmount: 11000, amount: 60 },
    {collateralAmount: 25000, amount: 180 }
];

class Shorts extends React.Component {
    constructor() {
        super();

        this.state = {
            baseSymbol: "CORE",
            quoteSymbol: "USD",
            priceFeed: 80,
            shorts: shorts,
            amount: 1000
        };
    }

    _createShort() {
        this.setState({shorts: this.state.shorts.concat([{
            amount: this.state.amount,
            collateralAmount: this.state.amount * this.state.priceFeed * 2
        }])});
    }

    _amountChanged(e) {
         this.setState({amount: e.target.value });
    }

    componentDidMount() {
        // subscribe to notifications here
    }

    componentWillUnmount() {
        // unsubscribe from notifications here
    }

    render() {
        let shortForm = (
            <form className="order-form"
                onSubmit={this._createShort.bind(this /*other params*/)}>
                <label>
                    <input type="text" id="amount" value={this.state.amount} onChange={this._amountChanged.bind(this)} />
                </label>
                <p>This will lock up {this.state.amount * this.state.priceFeed * 2} {this.state.baseSymbol} as collateral.</p>
                <input type="submit" className="button" value={"Create " + this.state.amount + " " + this.state.quoteSymbol} />
            </form>
        );


        function shortEntry(short) {
            let backing = Math.round((((short.collateralAmount / short.amount) / this.state.priceFeed) * 10000)) / 100;

            return (
                <tr>
                    <td>{short.amount} {short.quoteSymbol}</td>
                    <td>{short.collateralAmount}</td>
                    <td>{backing}%</td>
                </tr>
            );
        }

        return (
            <div className="grid-block vertical">
                <div className="grid-block page-layout">
                    <div className="grid-block medium-3 large-2 left-column">
                        <div className="grid-content">
                            <p>Create Short</p>
                            {shortForm}
                        </div>
                    </div>
                    <div className="grid-block medium-6 large-8 main-content vertical">
                        <div className="grid-content">
                            <p>Open positions</p>
                            <table style={{width: "100%"}} className="table expand">
                                <thead>
                                <tr>
                                    <th>Short</th>
                                    <th>Collateral</th>
                                    <th>Backing</th>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    this.state.shorts.map(shortEntry, this)
                                }
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="grid-block medium-3 large-2 right-column">
                        <div className="grid-content">
                            <p>RIGHT COLUMN</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Shorts;
