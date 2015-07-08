import React from "react";
import {PropTypes} from "react/addons";
import Immutable from "immutable";
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
        let {bids, asks, account, quote, base, quoteSymbol, baseSymbol} = this.props;
        let bidRows = null, askRows = null;
        let high = 0, low = 0;
        
        if(base && quote) {
            // let start = new Date();

            high = bids.length > 0 ? bids[bids.length - 1].price_full : 0;

            bidRows = bids.map(order => {
                return (
                     <tr key={order.price_full}>
                        <td className="show-for-medium">{(order.value).toFixed(3)}</td>
                        <td>{order.amount.toFixed(3)}</td>
                        <td className="orderHistoryBid">
                            <span className="price-integer">{order.price_int}</span>
                            .
                            <span className="price-decimal">{order.price_dec}</span>
                        </td>
                    </tr>
                    );
            });

            // console.log("time to process bids in orderbook:", new Date() - start, "ms");

            // start = new Date();

            low = asks.length > 0 ? asks[0].price_full : 0;

            askRows = asks.map(order => {
                return (
                     <tr key={order.price_full}>
                        <td className="show-for-medium">{order.value.toFixed(3)}</td>
                        <td >{order.amount.toFixed(3)}</td>
                        <td className="orderHistoryAsk">
                            <span className="price-integer">{order.price_int}</span>
                            .
                            <span className="price-decimal">{order.price_dec}</span>
                        </td>

                    </tr>
                    );
            });

            // console.log("time to process asks in orderbook:", new Date() - start, "ms");
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
                                    {bidRows}
                                </tbody>
                                <tr>
                                    <td colSpan="3" className="text-center">Spread: {high > 0 && low > 0 ? low - high : 0} {baseSymbol}</td>
                                </tr>
                                <tbody ref="asksTbody" className="orderbook ps-container">
                                    {askRows}
                                </tbody>
                    </table>
                </div>
        );
    }
}

OrderBook.defaultProps = {
    bids: [],
    asks: [],
    orders: {}
};

OrderBook.propTypes = {
    bids: PropTypes.array.isRequired,
    asks: PropTypes.array.isRequired,
    orders: PropTypes.object.isRequired
};

export default OrderBook;
