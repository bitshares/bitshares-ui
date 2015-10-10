import React from "react";
import {PropTypes} from "react/addons";
import Immutable from "immutable";
import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";

class OrderBookRow extends React.Component {
    constructor() {
        super();
        this.state = {
            hasChanged: false
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.order.amount !== this.props.order.amount || nextProps.order.price_full !== this.props.order.price_full) {
            this.setState({hasChanged: true});
        } else {
            this.setState({hasChanged: false});
        }
    }

    render() {

        let {order, quote, base, type} = this.props;
        let changeClass = null;
        if (this.state.hasChanged) {
            changeClass = "order-change";
        }
        let integerClass = type === "bid" ? "orderHistoryBid" : type === "ask" ? "orderHistoryAsk" : "orderHistoryCall" ;

        return (
            <tr key={order.price_full} onClick={this.props.onClick} className={changeClass}>
                <td className="show-for-medium">{utils.format_number(order.value, base.precision)}</td>
                <td>{utils.format_number(order.amount, quote.precision)}</td>
                <td className={integerClass}>
                    <span className="price-integer">{order.price_int}</span>
                    .
                    <span className="price-decimal">{order.price_dec}</span>
                </td>
            </tr>
        )
    }
}

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
                !Immutable.is(nextProps.orders, this.props.orders) ||
                !Immutable.is(nextProps.calls, this.props.calls) ||
                !Immutable.is(nextProps.calls, this.props.calls)
            );
    }

    componentDidMount() {
        //let bidContainer = React.findDOMNode(this.refs.bidsTbody);
        //let askContainer = React.findDOMNode(this.refs.asksTbody);
        //bidContainer.scrollTop = bidContainer.scrollHeight;
        //Ps.initialize(bidContainer);
        //Ps.initialize(askContainer);
        //
        //if (bidContainer.scrollTop !== bidContainer.scrollHeight) {
        //    this.setState({didScrollOnMount: false});
        //}
    }

    componentWillReceiveProps(nextProps) {
        //let bidContainer = React.findDOMNode(this.refs.bidsTbody);
        //this.setState({shouldScrollBottom: Math.round(bidContainer.scrollTop + bidContainer.offsetHeight) === bidContainer.scrollHeight});
    }

    componentDidUpdate() {
        //let askContainer = React.findDOMNode(this.refs.asksTbody);
        //let bidContainer = React.findDOMNode(this.refs.bidsTbody);
        //if (this.state.shouldScrollBottom || !this.state.didScrollOnMount) {
        //    bidContainer.scrollTop = bidContainer.scrollHeight;
        //    this.setState({didScrollOnMount: true});
        //}
        //
        //Ps.update(bidContainer);
        //Ps.update(askContainer);
    }

    render() {
        let {combinedBids, combinedAsks, calls, invertedCalls, account, quote, base, quoteSymbol, baseSymbol} = this.props;
        let bidRows = null, askRows = null;
        let high = 0, low = 0;

        if(base && quote) {
            let totalBidAmount = 0;

            high = combinedBids.length > 0 ? combinedBids[combinedBids.length - 1].price_full : 0;

            bidRows = combinedBids.sort((a, b) => {
                return b.price_full - a.price_full;
            }).map(order => {
                totalBidAmount += order.amount;
                return (
                    <OrderBookRow
                        key={order.price_full}
                        order={order}
                        onClick={this.props.onClick.bind(this, order.price_full, totalBidAmount, "bid")}
                        base={base}
                        quote={quote}
                        type={order.type}
                    />
                )
            }).reverse();

            low = combinedAsks.length > 0 ? combinedAsks[0].price_full : 0;

            let totalAskAmount = 0;
            askRows = combinedAsks.sort((a, b) => {
                return a.price_full - b.price_full;
            }).map(order => {
                totalAskAmount += order.amount;
                return (
                    <OrderBookRow
                            key={order.price_full}
                            order={order}
                            onClick={this.props.onClick.bind(this, order.price_full, totalAskAmount, "ask")}
                            base={base}
                            quote={quote}
                            type={order.type}
                        />
                    );
            });
        }

        let spread = high > 0 && low > 0 ? utils.format_number(low - high, base.precision) : "0";

        return (
                <div className="left-order-book no-padding" style={{overflowY: "hidden"}}>
                    <div className="table-container">
                        <table className="table order-table table-hover text-right">
                            <tbody id="test" ref="bidsTbody" className="orderbook ps-container orderbook-top">
                                {bidRows}
                                <tr key="top-header" className="top-header">
                                    <td style={{textAlign: "right"}}><Translate content="exchange.value" /><br/><small>({baseSymbol})</small></td>
                                    <td style={{textAlign: "right"}}><Translate content="transfer.amount" /><br/><small>({quoteSymbol})</small></td>
                                    <td style={{textAlign: "right"}}><Translate content="exchange.price" /><br/><small>({baseSymbol}/{quoteSymbol})</small></td>
                                </tr>
                                <tr key="spread" className="spread-row">
                                    <td colSpan="3" className="text-center spread">
                                        <Translate content="exchange.spread" />: {spread} {baseSymbol}
                                    </td>
                                </tr>
                                <tr key="bottom-header" className="bottom-header">
                                    <td style={{textAlign: "right"}}><Translate content="exchange.value" /><br/><small>({baseSymbol})</small></td>
                                    <td style={{textAlign: "right"}}><Translate content="transfer.amount" /><br/><small>({quoteSymbol})</small></td>
                                    <td style={{textAlign: "right"}}><Translate content="exchange.price" /><br/><small>({baseSymbol}/{quoteSymbol})</small></td>
                                </tr>
                                {askRows}
                            </tbody>
                        </table>
                    </div>
                    {/*<div className="text-center spread"><Translate content="exchange.spread" />: {spread} {baseSymbol}</div>
                    <div className="table-container">
                        <table className="table order-table table-hover text-right">
                            <tbody ref="asksTbody" className="orderbook ps-container orderbook-bottom">
                                {askRows}
                            </tbody>
                        </table>
                    </div>*/}
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
