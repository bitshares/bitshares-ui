import React from "react";
import Immutable from "immutable";
import market_utils from "common/market_utils";
import utils from "common/utils";
import {AreaChart} from "react-d3-components";



class DepthChart extends React.Component {
    constructor() {
        super();
        this.state = {
            parentWidth: 0
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
                !Immutable.is(nextProps.orders, this.props.orders) ||
                nextState.parentWidth !== this.state.parentWidth
            );
    }

    handleResize() {
        let elem = React.findDOMNode(this);
        let width = elem.offsetWidth;

        this.setState({
            parentWidth: width
        });
    }

    componentDidMount() {
        if(this.props.width === "100%") {
            window.addEventListener("resize", this.handleResize.bind(this));
        }
        this.handleResize();
    }

    componentWillUnmount() {
        if(this.props.width === "100%") {
            window.removeEventListener("resize", this.handleResize.bind(this));
        }
    }

    render() {
        let {orders, account, base, quote, quoteSymbol, baseSymbol} = this.props;
        let bids = [], asks = [], data;

        let { width } = this.props;

        // Determine the right graph width to use if it"s set to be responsive
        if(width === "100%") {
            width = this.state.parentWidth || 400;
        }

        // data = [
        //     {
        //     label: "somethingA",
        //     values: [{x: 0, y: 2}, {x: 1.3, y: 5}, {x: 3, y: 6}, {x: 3.5, y: 6.5}, {x: 4, y: 6}, {x: 4.5, y: 6}, {x: 5, y: 7}, {x: 5.5, y: 8}, {x: 10, y: 0}]
        //     },
        //     {
        //     label: "somethingB",
        //     values: [{x: 1.3, y: 4}, {x: 3, y: 7}, {x: 3.5, y: 8}, {x: 4, y: 7}, {x: 4.5, y: 7}, {x: 5, y: 7.8}, {x: 7, y: 9}, {x: 10, y: 9}, {x: 15, y: 9}]
        //     }
        // ];

        if(orders.size > 0 && base && quote) {
            let quotePrecision = utils.get_asset_precision(quote.precision);
            let basePrecision = utils.get_asset_precision(base.precision);
            
            bids = orders.filter(a => {
                return a.sell_price.base.asset_id === base.id;
            }).sort((a, b) => {
                let {buy: a_buy, sell: a_sell} = market_utils.parseOrder(a, false);
                let {buy: b_buy, sell: b_sell} = market_utils.parseOrder(b, false);

                let a_price = (a_sell.amount / basePrecision) / (a_buy.amount / quotePrecision);
                let b_price = (b_sell.amount / basePrecision) / (b_buy.amount / quotePrecision);
                return a_price > b_price;
            }).map(order => {
                let isAskOrder = market_utils.isAsk(order, base);
                let {buy, sell} = market_utils.parseOrder(order, isAskOrder);
                let price = (sell.amount / basePrecision) / (buy.amount / quotePrecision);
                asks.push({x: price, y: 0});
                return {x: price, y: buy.amount / quotePrecision};
            }).toArray();

            if (bids.length === 0) {
                bids.push({x: 0, y: 0});
            } else {
                bids.push({x: bids[bids.length - 1].x + 0.001, y: 0});
            }
            for (var i = bids.length - 2; i >= 0; i--) {
                bids[i].y += bids[i + 1].y;
            }

            asks.push({x: bids[bids.length - 1].x + 0.001, y: 0});

            let asksIndex = 0;
            let askLength;
            orders.filter(a => {
                return a.sell_price.quote.asset_id === base.id;
            }).sort((a, b) => {
                let {buy: a_buy, sell: a_sell} = market_utils.parseOrder(a, true);
                let {buy: b_buy, sell: b_sell} = market_utils.parseOrder(b, true);

                let a_price = (a_sell.amount / basePrecision) / (a_buy.amount / quotePrecision);
                let b_price = (b_sell.amount / basePrecision) / (b_buy.amount / quotePrecision);
                return a_price > b_price;
            }).map((order) => {
                let isAskOrder = market_utils.isAsk(order, base);
                let {buy, sell} = market_utils.parseOrder(order, isAskOrder);
                let price = (sell.amount / basePrecision) / (buy.amount / quotePrecision);
                if (asksIndex === 0) {
                    asks.push({x: price - 0.001, y: 0});
                    bids.push({x: price - 0.001, y: 0});
                    askLength = asks.length - 1;
                }
                bids.push({x: price, y: 0});
                asks.push({x: price, y: asks[askLength + asksIndex].y + buy.amount / quotePrecision});
                asksIndex++;
                return true;

            }).toArray();

            if (asks.length === 1) {
                asks.push({x: asks[0].x * 2, y: asks[0].y});
            }

            data = [
            {
                label: "Bids",
                values: bids
            },
            {
                label: "Asks",
                values: asks
            }];

        }


        return (
            <div className="grid-content">
                <div className="card">
                    <h5>Depth Chart</h5>
                    {bids.length > 1 && asks.length > 1 ? <AreaChart
                        ref="chart"
                        data={data}
                        width={width}
                        height={300}
                        margin={{top: 10, bottom: 50, left: 50, right: 20}}
                        /> : <div style={{height: "300px", width: width}}/>}
                        
                    </div>
            </div>
        );
    }
}

DepthChart.defaultProps = {
    width: "100%",
    height: 300,
    margin: { left: -1, top: 10, bottom: 0, right: 1 }
};

export default DepthChart;
