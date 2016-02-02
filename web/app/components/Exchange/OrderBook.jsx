import React from "react";
import ReactDOM from "react-dom";
import {PropTypes} from "react";
import Immutable from "immutable";
import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";
import classnames from "classnames";
import PriceText from "../Utility/PriceText";

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

        let {order, quote, base, type, final} = this.props;
        let changeClass = null;
        if (this.state.hasChanged) {
            changeClass = "order-change";
        }
        let integerClass = type === "bid" ? "orderHistoryBid" : type === "ask" ? "orderHistoryAsk" : "orderHistoryCall";

        return (
            <tr key={order.price_full} onClick={this.props.onClick} className={classnames({"final-row": final} ,changeClass)}>
                <td>{utils.format_number(order.value, base.get("precision") - 1)}</td>
                <td>{utils.format_number(order.amount, quote.get("precision") - 1)}</td>
                <td className={integerClass}>
                    <PriceText preFormattedPrice={order.price} />
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
                    <PriceText preFormattedPrice={order.price} />
                </td>
                <td>{utils.format_number(order.amount, quote.get("precision") - 2)}</td>
                <td>{utils.format_number(order.value, base.get("precision") - 2)}</td>
                <td>{utils.format_number(order.totalValue, base.get("precision") - 2)}</td>

            </tr>
        )
    }
}

class OrderBook extends React.Component {
    constructor(props) {
        super();
        this.state = {
            hasCentered: false,
            flip: props.flipOrderBook,
            showAllBids: false,
            showAllAsks: false
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
                !Immutable.is(nextProps.orders, this.props.orders) ||
                !Immutable.is(nextProps.calls, this.props.calls) ||
                !Immutable.is(nextProps.calls, this.props.calls) ||
                nextProps.horizontal !== this.props.horizontal ||
                nextState.flip !== this.state.flip ||
                nextState.showAllBids !== this.state.showAllBids ||
                nextState.showAllAsks !== this.state.showAllAsks ||
                nextProps.latest !== this.props.latest
            );
    }

    componentWillReceiveProps(nextProps) {
        if (!nextProps.marketReady) {
            this.setState({
                hasCentered: false
            });
        }
    }

    componentDidMount() {
        if (!this.props.horizontal) {
            let bidsContainer = ReactDOM.findDOMNode(this.refs.orderbook_container);
            Ps.initialize(bidsContainer);
        } else {
            let bidsContainer = ReactDOM.findDOMNode(this.refs.hor_bids);
            Ps.initialize(bidsContainer);
            let asksContainer = ReactDOM.findDOMNode(this.refs.hor_asks);
            Ps.initialize(asksContainer);            
        }
    }

    componentDidUpdate(prevProps) {
        if (!this.props.horizontal) {
            let bidsContainer = ReactDOM.findDOMNode(this.refs.orderbook_container);
            let centerRow = ReactDOM.findDOMNode(this.refs.centerRow);

            if (this.props.marketReady && !this.state.hasCentered || (prevProps.quote !== this.props.quote) ) {
                this._centerView();
                this.setState({hasCentered: true});
                setTimeout(() => {
                    this._centerView();
                }, 250);
            }
            Ps.update(bidsContainer);
        } else {
            let bidsContainer = ReactDOM.findDOMNode(this.refs.hor_bids);
            Ps.update(bidsContainer);         
            let asksContainer = ReactDOM.findDOMNode(this.refs.hor_asks);
            Ps.update(asksContainer);     
        }
    }

    _centerView() {
        let bidsContainer = ReactDOM.findDOMNode(this.refs.orderbook_container);
        let centerRow = ReactDOM.findDOMNode(this.refs.centerRow);
        let outer = bidsContainer.getBoundingClientRect();
        let center = centerRow.getBoundingClientRect();
        bidsContainer.scrollTop += (center.top + center.height / 2) - (outer.height / 2);
        Ps.update(bidsContainer);
    }

    _flipBuySell() {
        SettingsActions.changeViewSetting({
            flipOrderBook: !this.state.flip
        });

        this.setState({flip: !this.state.flip});
    }

    _onToggleShowAll(type) {
        if (type === "asks") {
            this.setState({
                showAllAsks: !this.state.showAllAsks
            });
        } else {
            this.setState({
                showAllBids: !this.state.showAllBids
            });
        }
    }

    render() {
        let {combinedBids, combinedAsks, quote, base, quoteSymbol, baseSymbol, horizontal} = this.props;
        let {showAllAsks, showAllBids} = this.state;

        let bidRows = null, askRows = null;
        let high = 0, low = 0;

        if(base && quote) {
            let totalBidAmount = 0;
            let totalBidValue = 0;
            high = combinedBids.length > 0 ? combinedBids.reduce((total, a) => {
                return total < a.price_full ? a.price_full : total;
            }, 0) : 0;

            let bidCount = combinedBids.length - 1;
            bidRows = combinedBids.sort((a, b) => {
                return b.price_full - a.price_full;
            })
            .filter(a => {
                return a.price_full >= high / 5
            })
            .map((order, index) => {
                totalBidAmount += order.amount;
                totalBidValue += order.value;
                order.totalValue = totalBidValue;
                order.totalAmount = totalBidAmount;

                return (horizontal ?
                    <OrderBookRowHorizontal
                        key={order.price_full}
                        order={order}
                        onClick={this.props.onClick.bind(this, "bid", order)}
                        base={base}
                        quote={quote}
                        type={order.type}
                    /> :
                    <OrderBookRowVertical
                        key={order.price_full}
                        order={order}
                        onClick={this.props.onClick.bind(this, "bid", order)}
                        base={base}
                        quote={quote}
                        type={order.type}
                        final={index === 0}
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
            }).filter(a => {
                return a.price_full <= low * 5;
            }).map((order, index) => {
                totalAskAmount += order.amount;
                totalAskValue += order.value;
                order.totalValue = totalAskValue;
                order.totalAmount = totalAskAmount;

                return (horizontal ?

                    <OrderBookRowHorizontal
                        key={order.price_full}
                        order={order}
                        onClick={this.props.onClick.bind(this, "ask", order)}
                        base={base}
                        quote={quote}
                        type={order.type}
                    /> :
                    <OrderBookRowVertical
                        key={order.price_full}
                        order={order}
                        onClick={this.props.onClick.bind(this, "ask", order)}
                        base={base}
                        quote={quote}
                        type={order.type}
                        final={0 === index}

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
            })
        }

        let spread = high > 0 && low > 0 ? utils.format_number(low - high, base.get("precision")) : "0";

        if (this.props.horizontal) {
            if (!showAllBids) {
                bidRows.splice(13, bidRows.length);
            }

            if (!showAllAsks) {
                askRows.splice(13, askRows.length);
            }

            return (
                    <div className="grid-block small-12 no-padding small-vertical medium-horizontal align-spaced no-overflow middle-content">
                        <div className={classnames("small-12 medium-5", this.state.flip ? "order-1" : "order-3")}>
                            <div className="exchange-content-header"><Translate content="exchange.asks" /></div>
                            <table className="table order-table table-hover text-right no-overflow">
                                <thead>
                                    <tr key="top-header" className="top-header">
                                        <th style={{paddingRight: 18, textAlign: "right"}}><Translate content="exchange.price" /><br/><span className="header-sub-title">({baseSymbol}/{quoteSymbol})</span></th>
                                        <th style={{paddingRight: 18, textAlign: "right"}}><Translate content="transfer.amount" /><br/><span className="header-sub-title">({quoteSymbol})</span></th>
                                        <th style={{paddingRight: 18, textAlign: "right"}}><Translate content="exchange.value" /><br/><span className="header-sub-title">({baseSymbol})</span></th>
                                        <th style={{paddingRight: 18, textAlign: "right"}}><Translate content="exchange.total" /><br/><span className="header-sub-title">({baseSymbol})</span></th>
                                    </tr>
                                </thead>
                            </table>
                            <div className="grid-block no-padding market-right-padding" ref="hor_asks" style={{overflow: "hidden", maxHeight: 299}}>
                                <table className="table order-table table-hover text-right no-overflow">
                                    <tbody className="orderbook orderbook-top">
                                        {askRows}
                                    </tbody>
                                </table>
                            </div>
                            {askRows.length > 13 ? <div className="orderbook-showall"><div onClick={this._onToggleShowAll.bind(this, "asks")} className="button outline"><Translate content={showAllAsks ? "exchange.hide" : "exchange.show_asks"} /></div></div> : null}
                        </div>
                        <div className="grid-block vertical align-center text-center no-padding shrink order-2">
                            <span onClick={this._flipBuySell.bind(this)} style={{cursor: "pointer", fontSize: "2rem", paddingBottom: "1rem"}}>&#8646;</span>
                            <button onClick={this.props.moveOrderBook} className="button outline"><Translate content="exchange.vertical" /></button>
                        </div>
                        <div className={classnames("small-12 medium-5", this.state.flip ? "order-3" : "order-1")}>
                            <div className="exchange-content-header"><Translate content="exchange.bids" /></div>
                            <table className="table order-table table-hover text-right market-right-padding">
                                <thead>
                                    <tr key="top-header" className="top-header">
                                        <th style={{paddingRight: 18, textAlign: "right"}}><Translate content="exchange.price" /><br/><span className="header-sub-title">({baseSymbol}/{quoteSymbol})</span></th>
                                        <th style={{paddingRight: 18, textAlign: "right"}}><Translate content="transfer.amount" /><br/><span className="header-sub-title">({quoteSymbol})</span></th>
                                        <th style={{paddingRight: 18, textAlign: "right"}}><Translate content="exchange.value" /><br/><span className="header-sub-title">({baseSymbol})</span></th>
                                        <th style={{paddingRight: 18, textAlign: "right"}}><Translate content="exchange.total" /><br/><span className="header-sub-title">({baseSymbol})</span></th>
                                    </tr>
                                </thead>
                            </table>    
                            <div className="grid-block no-padding market-right-padding" ref="hor_bids" style={{overflow: "hidden", maxHeight: 299}}>
                                <table className="table order-table table-hover text-right">
                                    <tbody className="orderbook orderbook-bottom">
                                        {bidRows}
                                    </tbody>
                                </table>
                            </div>
                            {bidRows.length > 13 ? <div className="orderbook-showall"><div onClick={this._onToggleShowAll.bind(this, "bids")} className="button outline "><Translate content={showAllBids ? "exchange.hide" : "exchange.show_bids"} /></div></div> : null}
                        </div>
                    </div>
            );
        } else {
            return (
                <div className="left-order-book no-padding no-overflow">
                    <div className="grid-block shrink left-orderbook-header market-right-padding-only">
                        <table className="table expand order-table table-hover text-right">
                            <thead>
                                <tr>
                                    <th style={{textAlign: "right", "borderBottomColor": "#777"}}><Translate content="exchange.value" /><br/><span className="header-sub-title">({baseSymbol})</span></th>
                                    <th style={{textAlign: "right", "borderBottomColor": "#777"}}><Translate content="transfer.amount" /><br/><span className="header-sub-title">({quoteSymbol})</span></th>
                                    <th style={{textAlign: "right", "borderBottomColor": "#777"}}><Translate content="exchange.price" /><br/><span className="header-sub-title">{baseSymbol}/{quoteSymbol}</span></th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                    <div className="table-container grid-content market-right-padding-only" ref="orderbook_container" style={{overflow: "hidden"}}>
                        <table className="table order-table table-hover text-right">
                            <tbody id="test" className="orderbook ps-container orderbook-top">
                                {askRows}
                                <tr onClick={this._centerView.bind(this)} key="spread" className="orderbook-latest-price" ref="centerRow">
                                    <td colSpan="3" className="text-center spread">
                                        {this.props.latest ? <span className={this.props.changeClass}><PriceText preFormattedPrice={this.props.latest} /> {baseSymbol}/{quoteSymbol}</span> : null}
                                    </td>
                                </tr>
                                {bidRows}
                            </tbody>
                        </table>
                    </div>
                    <div style={{width: "100%", borderTop: "1px solid grey"}} className="align-center grid-block footer shrink bottom-header">
                        <div onClick={this.props.moveOrderBook} className="button outline">
                            <Translate content="exchange.horizontal" />
                        </div>
                    </div>
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
