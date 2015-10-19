import React from "react";
import {PropTypes} from "react/addons";
import Immutable from "immutable";
import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";
import classnames from "classnames";

class OrderBookRowVertical extends React.Component {
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
                <td className={classnames({"show-for-large": !this.props.horizontal})}>{utils.format_number(order.value, base.precision - 2)}</td>
                <td>{utils.format_number(order.amount, quote.precision - 2)}</td>
                <td className={integerClass}>
                    <span className="price-integer">{order.price_int}</span>
                    .
                    <span className="price-decimal">{order.price_dec}</span>
                </td>
            </tr>
        )
    }
}

class OrderBookRowHorizontal extends React.Component {
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
                <td className={integerClass}>
                    <span className="price-integer">{order.price_int}</span>
                    .
                    <span className="price-decimal">{order.price_dec}</span>
                </td>
                <td>{utils.format_number(order.amount, quote.precision - 2)}</td>
                <td>{utils.format_number(order.value, base.precision - 2)}</td>
                <td>{utils.format_number(order.total, base.precision - 2)}</td>

            </tr>
        )
    }
}

class OrderBook extends React.Component {
    constructor(props) {
        super();
        this.state = {
            shouldScrollBottom: false,
            didScrollOnMount: true,
            flip: props.flipOrderBook
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
                !Immutable.is(nextProps.orders, this.props.orders) ||
                !Immutable.is(nextProps.calls, this.props.calls) ||
                !Immutable.is(nextProps.calls, this.props.calls) ||
                nextProps.horizontal !== this.props.horizontal ||
                nextState.flip !== this.state.flip
            );
    }

    // componentDidMount() {
    //     if (!this.props.horizontal) {
    //         let bidsContainer = React.findDOMNode(this.refs.bidsTbody);
    //         Ps.initialize(bidsContainer);
    //     }
    // }

    // componentDidUpdate() {
    //     if (!this.props.horizontal) {
    //         let bidsContainer = React.findDOMNode(this.refs.bidsTbody);
    //         Ps.initialize(bidsContainer);
    //     }
    // }

    _flipBuySell() {
        SettingsActions.changeViewSetting({
            flipOrderBook: !this.state.flip
        });

        this.setState({flip: !this.state.flip});
    }

    render() {
        let {combinedBids, combinedAsks, quote, base, quoteSymbol, baseSymbol, horizontal} = this.props;
        let bidRows = null, askRows = null;
        let high = 0, low = 0;

        if(base && quote) {
            let totalBidAmount = 0;
            let totalBidValue = 0;
            high = combinedBids.length > 0 ? combinedBids.reduce((total, a) => {
                return total < a.price_full ? a.price_full : total;
            }, 0) : 0;

            bidRows = combinedBids.sort((a, b) => {
                return b.price_full - a.price_full;
            }).map(order => {
                totalBidAmount += order.amount;
                totalBidValue += order.value;
                order.total = totalBidValue;
                if (order.price_full < high / 5) {
                    return null;
                }
                return (horizontal ? 
                    <OrderBookRowHorizontal
                        key={order.price_full}
                        order={order}
                        onClick={this.props.onClick.bind(this, order.price_full, totalBidAmount, "bid")}
                        base={base}
                        quote={quote}
                        type={order.type}
                    /> :
                    <OrderBookRowVertical
                        key={order.price_full}
                        order={order}
                        onClick={this.props.onClick.bind(this, order.price_full, totalBidAmount, "bid")}
                        base={base}
                        quote={quote}
                        type={order.type}
                    />
                )
            }).filter(a => {
                return a !== null;
            })
            .sort((a, b) => {
                return parseFloat(b.key) - parseFloat(a.key);
            });

            low = combinedAsks.length > 0 ? combinedAsks.reduce((total, a) => {
                if (!total) {
                    return a.price_full;
                }
                return total > a.price_full ? a.price_full : total;
            }, null) : 0;

            let totalAskAmount = 0;
            let totalAskValue = 0;
            askRows = combinedAsks.sort((a, b) => {
                return a.price_full - b.price_full;
            }).map(order => {
                totalAskAmount += order.amount;
                totalAskValue += order.value;
                order.total = totalAskValue;
                if (order.price_full > low * 5) {
                    return null;
                }
                return (horizontal ?

                    <OrderBookRowHorizontal
                        key={order.price_full}
                        order={order}
                        onClick={this.props.onClick.bind(this, order.price_full, totalAskAmount, "ask")}
                        base={base}
                        quote={quote}
                        type={order.type}
                    /> :
                    <OrderBookRowVertical
                        key={order.price_full}
                        order={order}
                        onClick={this.props.onClick.bind(this, order.price_full, totalAskAmount, "ask")}
                        base={base}
                        quote={quote}
                        type={order.type}
                    />
                    );
            }).filter(a => {
                return a !== null;
            }).sort((a, b) => {
                if (horizontal) {
                    return parseFloat(a.key) - parseFloat(b.key);
                } else {
                    return parseFloat(b.key) - parseFloat(a.key);
                }
            });
        }

        let spread = high > 0 && low > 0 ? utils.format_number(low - high, base.precision) : "0";

        if (this.props.horizontal) {
            return (
                    <div className="grid-block small-12 no-padding small-vertical medium-horizontal align-spaced no-overflow middle-content" style={{maxHeight: "400px"}}>
                        <div className={classnames("small-12 medium-5", this.state.flip ? "order-1" : "order-3")}>
                            <table className="table order-table table-hover text-right">
                                <thead>
                                    <tr key="top-header" className="top-header">
                                        <th style={{textAlign: "right"}}><Translate content="exchange.price" /><br/><small>({baseSymbol}/{quoteSymbol})</small></th>
                                        <th style={{textAlign: "right"}}><Translate content="transfer.amount" /><br/><small>({quoteSymbol})</small></th>
                                        <th style={{textAlign: "right"}}><Translate content="exchange.value" /><br/><small>({baseSymbol})</small></th>
                                        <th style={{textAlign: "right"}}><Translate content="exchange.total" /><br/><small>({baseSymbol})</small></th>
                                    </tr>
                                </thead>
                                <tbody id="test" className="orderbook orderbook-top">
                                    {askRows}
                                </tbody>
                            </table>
                        </div>
                        <div className="grid-block vertical align-center text-center no-padding shrink order-2">
                            <span onClick={this._flipBuySell.bind(this)} style={{cursor: "pointer", fontSize: "2rem", paddingBottom: "1rem"}}>&#8646;</span>
                            <button onClick={this.props.moveOrderBook} className="button outline"><Translate content="exchange.vertical" /></button>
                        </div>
                        <div className={classnames("small-12 medium-5", this.state.flip ? "order-3" : "order-1")}>
                            <table className="table order-table table-hover text-right">
                                <thead>
                                    <tr key="top-header" className="top-header">
                                        <th style={{textAlign: "right"}}><Translate content="exchange.price" /><br/><small>({baseSymbol}/{quoteSymbol})</small></th>
                                        <th style={{textAlign: "right"}}><Translate content="transfer.amount" /><br/><small>({quoteSymbol})</small></th>
                                        <th style={{textAlign: "right"}}><Translate content="exchange.value" /><br/><small>({baseSymbol})</small></th>
                                        <th style={{textAlign: "right"}}><Translate content="exchange.total" /><br/><small>({baseSymbol})</small></th>
                                    </tr>
                                </thead>
                                <tbody className="orderbook ps-container orderbook-bottom">
                                    {bidRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
            );
        } else {
            return (
                <div className="left-order-book no-padding no-overflow">
                    <div className="table-container grid-content no-padding" ref="orderbook_container" style={{overflow: "hidden"}}>
                        <table className="table order-table table-hover text-right">
                            <tbody id="test" ref="bidsTbody" className="orderbook ps-container orderbook-top">
                                {askRows}
                                <tr key="top-header" className="top-header">
                                    <td className="show-for-large" style={{textAlign: "right"}}><Translate content="exchange.value" /><br/><small>({baseSymbol})</small></td>
                                    <td style={{textAlign: "right"}}><Translate content="transfer.amount" /><br/><small>({quoteSymbol})</small></td>
                                    <td style={{textAlign: "right"}}><Translate content="exchange.price" /><br/><small>({baseSymbol}/{quoteSymbol})</small></td>
                                </tr>
                                <tr key="spread" className="spread-row">
                                    <td colSpan="3" className="text-center spread">
                                        <Translate content="exchange.spread" />: {spread} {baseSymbol}
                                    </td>
                                </tr>
                                <tr key="bottom-header" className="bottom-header">
                                    <td className="show-for-large" style={{textAlign: "right"}}><Translate content="exchange.value" /><br/><small>({baseSymbol})</small></td>
                                    <td style={{textAlign: "right"}}><Translate content="transfer.amount" /><br/><small>({quoteSymbol})</small></td>
                                    <td style={{textAlign: "right"}}><Translate content="exchange.price" /><br/><small>({baseSymbol}/{quoteSymbol})</small></td>
                                </tr>
                                {bidRows}
                            </tbody>
                        </table>
                    </div>
                    <div className="text-center grid-block footer shrink" ><button onClick={this.props.moveOrderBook} className="button outline"><Translate content="exchange.horizontal" /></button></div>
                </div>
            );
        }
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
