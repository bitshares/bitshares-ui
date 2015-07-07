import React from "react";
import Immutable from "immutable";
import classNames from "classnames";
import market_utils from "common/market_utils";
import Ps from "perfect-scrollbar";

class OrderBook extends React.Component {
    constructor() {
        super();
        this.state = {
            shouldScrollBottom: false,
            didScrollOnMount: true
        };
    }

    shouldComponentUpdate(nextProps) {
        return (
            !Immutable.is(nextProps.orders, this.props.orders)
            );
    }

    componentDidMount() {
        let bidContainer = React.findDOMNode(this.refs.bidsTbody);
        let askContainer = React.findDOMNode(this.refs.asksTbody);
        bidContainer.scrollTop = bidContainer.scrollHeight;
        Ps.initialize(bidContainer);
        Ps.initialize(askContainer);

        if (bidContainer.scrollTop !== bidContainer.scrollHeight) {
            this.setState({didScrollOnMount: false});
        }
    }

    componentWillReceiveProps() {
        let bidContainer = React.findDOMNode(this.refs.bidsTbody);
        this.setState({shouldScrollBottom: Math.round(bidContainer.scrollTop + bidContainer.offsetHeight) === bidContainer.scrollHeight});
    }

    componentDidUpdate() {
        let askContainer = React.findDOMNode(this.refs.asksTbody);
        let bidContainer = React.findDOMNode(this.refs.bidsTbody);
        if (this.state.shouldScrollBottom || !this.state.didScrollOnMount) {
            bidContainer.scrollTop = bidContainer.scrollHeight;
            this.setState({didScrollOnMount: true});
        }

        Ps.update(bidContainer);
        Ps.update(askContainer);
    }

    render() {
        let {orders, account, quote, base, quoteSymbol, baseSymbol} = this.props;
        let bids = null, asks = null;
        let high = 0, low = 0;
        
        if(orders.size > 0 && base && quote) {
            // let quotePrecision = utils.get_asset_precision(quote.precision);
            // let basePrecision = utils.get_asset_precision(base.precision);

            bids = orders.filter(a => {
                return a.sell_price.base.asset_id === base.id;
            }).sort((a, b) => {
                let {price: a_price} = market_utils.parseOrder(a, base, quote);
                let {price: b_price} = market_utils.parseOrder(b, base, quote);

                return a_price.full - b_price.full;
            }).map(order => {
                let isAskOrder = market_utils.isAsk(order, base);
                let {value, price, amount} = market_utils.parseOrder(order, base, quote);
                let tdClass = classNames({orderHistoryBid: !isAskOrder, orderHistoryAsk: isAskOrder});
                high = price.full;
                return (
                     <tr key={order.id}>
                        <td className="show-for-medium">{(value).toFixed(3)}</td>
                        <td>{(amount).toFixed(3)}</td>
                        <td className={tdClass}>
                            <span className="price-integer">{price.int}</span>
                            .
                            <span className="price-decimal">{price.dec}</span>
                        </td>
                        {/*TODO: add expiration data <td>{order.expiration}</td> */}
                    </tr>
                    );
            }).toArray();

            let askIndex = 0;
            asks = orders.filter(a => {
                return a.sell_price.quote.asset_id === base.id;
            }).sort((a, b) => {
                let {price: a_price} = market_utils.parseOrder(a, base, quote);
                let {price: b_price} = market_utils.parseOrder(b, base, quote);
                return a_price.full - b_price.full;
            }).map(order => {
                let isAskOrder = market_utils.isAsk(order, base);
                let {value, price, amount} = market_utils.parseOrder(order, base, quote);
                let tdClass = classNames({orderHistoryBid: !isAskOrder, orderHistoryAsk: isAskOrder});
                if (askIndex === 0) {
                    low = price.full;
                }
                askIndex++;
                return (
                     <tr key={order.id}>
                        <td className="show-for-medium">{(value).toFixed(3)}</td>
                        <td >{(amount).toFixed(3)}</td>
                        <td className={tdClass}>
                            <span className="price-integer">{price.int}</span>
                            .
                            <span className="price-decimal">{price.dec}</span>
                        </td>

                        {/*TODO: add expiration data <td>{order.expiration}</td> */}
                    </tr>
                    );
            }).toArray();
        }

        return (
                <div className="grid-content" style={{overflowY: "hidden"}}>
                    <table className="table order-table fixed-height">
                        <thead>
                        <tr>
                            <th className="show-for-medium">Value</th>
                            <th>Amount</th>
                            <th>Price</th>
                        </tr>
                        </thead>
                                <tbody id="test" ref="bidsTbody" className="orderbook ps-container">
                                    {bids}
                                </tbody>
                                <tr><td colSpan="3" className="text-center">Spread: {high > 0 && low > 0 ? low - high : 0} {baseSymbol}</td></tr>
                                <tbody ref="asksTbody" className="orderbook ps-container">
                                    {asks}
                                </tbody>
                    </table>
                </div>
        );
    }
}

export default OrderBook;
