import React from "react";
import {PropTypes} from "react";
import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
import SettingsActions from "actions/SettingsActions";
import classnames from "classnames";
import PriceText from "../Utility/PriceText";
import TransitionWrapper from "../Utility/TransitionWrapper";
import AssetName from "../Utility/AssetName";
import { StickyTable } from "react-sticky-table";
import Icon from "../Icon/Icon";
import "react-sticky-table/dist/react-sticky-table.css";

class OrderBookRowVertical extends React.Component {

    shouldComponentUpdate(np) {
        if (np.order.market_base !== this.props.order.market_base) return false;
        return (
            np.order.ne(this.props.order) ||
            np.index !== this.props.index ||
            np.currentAccount !== this.props.currentAccount
        );
    }

    render() {
        let {order, quote, base, final} = this.props;
        const isBid = order.isBid();
        const isCall = order.isCall();
        let integerClass = isCall ? "orderHistoryCall" : isBid ? "orderHistoryBid" : "orderHistoryAsk";

        let price = <PriceText price={order.getPrice()} quote={quote} base={base} />;
        return (
            <div onClick={this.props.onClick} className={classnames("sticky-table-row order-row", {"final-row": final}, {"my-order": order.isMine(this.props.currentAccount)})}>
                <div className="cell left">
                    {utils.format_number(order[isBid ? "amountForSale" : "amountToReceive"]().getAmount({real: true}), base.get("precision"))}
                </div>
                <div className="cell">
                    {utils.format_number(order[isBid ? "amountToReceive" : "amountForSale"]().getAmount({real: true}), quote.get("precision"))}
                </div>
                <div className={`cell ${integerClass} right`}>
                    {price}
                </div>
            </div>
        );
    }
}

const elemHeight = (elem) => elem.getBoundingClientRect().height;


class OrderBookRowHorizontal extends React.Component {
    shouldComponentUpdate(np) {
        return (
            np.order.ne(this.props.order) ||
            np.position !== this.props.position ||
            np.index !== this.props.index ||
            np.currentAccount !== this.props.currentAccount
        );
    }

    render() {
        let {order, quote, base, position} = this.props;
        const isBid = order.isBid();
        const isCall = order.isCall();

        let integerClass = isCall ? "orderHistoryCall" : isBid ? "orderHistoryBid" : "orderHistoryAsk";

        let price = <PriceText price={order.getPrice()} quote={quote} base={base} />;
        let amount = isBid ?
            utils.format_number(order.amountToReceive().getAmount({real: true}), quote.get("precision")) :
            utils.format_number(order.amountForSale().getAmount({real: true}), quote.get("precision"));
        let value = isBid ?
            utils.format_number(order.amountForSale().getAmount({real: true}), base.get("precision")) :
            utils.format_number(order.amountToReceive().getAmount({real: true}), base.get("precision"));
        let total = isBid ?
            utils.format_number(order.totalForSale().getAmount({real: true}), base.get("precision")) :
            utils.format_number(order.totalToReceive().getAmount({real: true}), base.get("precision"));

        return (
            <tr onClick={this.props.onClick} className={order.isMine(this.props.currentAccount) ? "my-order" : ""} >
                {position === "left" ? <td>{total}</td> :
                <td style={{width: "25%"}} className={integerClass}>
                    {price}
                </td>
                }
                <td>{position === "left" ? value : amount}</td>
                <td>{position === "left" ? amount : value}</td>
                {position === "right" ? <td>{total}</td> :
                <td style={{width: "25%"}} className={integerClass}>
                    {price}
                </td>
                }
            </tr>
        );

    }
}

class OrderBook extends React.Component {
    constructor(props) {
        super();
        this.state = {
            flip: props.flipOrderBook,
            showAllBids: false,
            showAllAsks: false,
            rowCount: 20,
            autoScroll: true
        };
    }

    // shouldComponentUpdate(nextProps, nextState) {
    //     console.log("calls changed:", !Immutable.is(nextProps.calls, this.props.calls), nextProps.calls && nextProps.calls.toJS(), this.props.calls && this.props.calls.toJS());
    //     const callsChanged = didOrdersChange(nextProps.calls, this.props.calls);
    //     const limitsChanged = didOrdersChange(nextProps.orders, this.props.orders);
    //     console.log("callsChanged:", callsChanged, "limitsChanged", limitsChanged);
    //     return (
    //         !Immutable.is(nextProps.orders, this.props.orders) ||
    //         !Immutable.is(nextProps.calls, this.props.calls) ||
    //         nextProps.horizontal !== this.props.horizontal ||
    //         !utils.are_equal_shallow(nextProps.latest, this.props.latest) ||
    //         nextProps.smallScreen !== this.props.smallScreen ||
    //         nextProps.wrapperClass !== this.props.wrapperClass ||
    //         !utils.are_equal_shallow(nextState, this.state)
    //     );
    // }

    componentWillReceiveProps(nextProps) {
        // Change of market or direction
        if (nextProps.base.get("id") !== this.props.base.get("id") || nextProps.quote.get("id") !== this.props.quote.get("id")) {

            if (this.refs.askTransition) {
                this.refs.askTransition.resetAnimation();
                if (this.refs.hor_asks) this.refs.hor_asks.scrollTop = 0;
                if (this.refs.hor_bids) this.refs.hor_bids.scrollTop = 0;
            }

            if (this.refs.bidTransition) {
                this.refs.bidTransition.resetAnimation();
            }

            if (this.refs.vert_bids) this.refs.vert_bids.scrollTop = 0;

            if (!this.props.horizontal) {
                this.setState({autoScroll: true});
            }
        }

        if (
          !utils.are_equal_shallow(nextProps.combinedAsks, this.props.combinedAsks) ||
          !utils.are_equal_shallow(nextProps.combinedBids, this.props.combinedBids)
        ) {
            this.setState({}, () => {
                this.psUpdate();
            });
        }
    }

    queryStickyTable = (query) => this.refs.vertical_sticky_table.table.querySelector(query)

    verticalScrollBar = () => this.queryStickyTable("#y-scrollbar");

    componentDidMount() {
        if (!this.props.horizontal) {
            Ps.initialize(this.verticalScrollBar());
            this.centerVerticalScrollBar();
        } else {
            let bidsContainer = this.refs.hor_bids;
            Ps.initialize(bidsContainer);
            let asksContainer = this.refs.hor_asks;
            Ps.initialize(asksContainer);
        }

    }

    centerVerticalScrollBar() {
        if (!this.props.horizontal && this.state.autoScroll) {
            const scrollableContainer = this.queryStickyTable("#sticky-table-y-wrapper");
            const centerTextContainer = this.refs.center_text;
            const centeringOffset = 21;
            const scrollTo = centerTextContainer.offsetTop - (elemHeight(scrollableContainer) / 2) + centeringOffset;

            this.setState({ownScroll: true}, () => scrollableContainer.scrollTop = scrollTo);
        }
    }

    psUpdate() {
        if (!this.props.horizontal) {
            Ps.update(this.verticalScrollBar());
            this.centerVerticalScrollBar();
        } else {
            let bidsContainer = this.refs.hor_bids;
            Ps.update(bidsContainer);
            let asksContainer = this.refs.hor_asks;
            Ps.update(asksContainer);
        }
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

            if (this.state.showAllAsks) {
                this.refs.hor_asks.scrollTop = 0;
            }

        } else {
            this.setState({
                showAllBids: !this.state.showAllBids
            });

            if (this.state.showAllBids) {
                this.refs.hor_bids.scrollTop = 0;
            }
        }
    }

    toggleSpreadValue = () => {
        this.setState({displaySpreadAsPercentage: !this.state.displaySpreadAsPercentage});
    }

    toggleAutoScroll = () => {
        const newState = {autoScroll: !this.state.autoScroll};
        if (newState.autoScroll)
            this.setState(newState, this.centerVerticalScrollBar);
        else
            this.setState(newState);
    }

    render() {
        let {combinedBids, combinedAsks, highestBid, lowestAsk, quote, base,
            totalAsks, totalBids, quoteSymbol, baseSymbol, horizontal} = this.props;
        let {showAllAsks, showAllBids, rowCount, displaySpreadAsPercentage} = this.state;
        const noOrders = (!lowestAsk.sell_price) && (!highestBid.sell_price);
        const hasAskAndBids = !!(lowestAsk.sell_price && highestBid.sell_price)
        const spread = hasAskAndBids && (displaySpreadAsPercentage ?
          `${(100 * (lowestAsk._real_price / highestBid._real_price - 1)).toFixed(2)}%`
          : <PriceText price={lowestAsk._real_price - highestBid._real_price} base={base} quote={quote}/>);
        let bidRows = null, askRows = null;
        if(base && quote) {
            bidRows = combinedBids
            .map((order, index) => {
                return (horizontal ?
                    <OrderBookRowHorizontal
                        index={index}
                        key={order.getPrice() + (order.isCall() ? "_call" : "")}
                        order={order}
                        onClick={this.props.onClick.bind(this, order)}
                        base={base}
                        quote={quote}
                        position={!this.state.flip ? "left" : "right"}
                        currentAccount={this.props.currentAccount}
                    /> :
                    <OrderBookRowVertical
                        index={index}
                        key={order.getPrice() + (order.isCall() ? "_call" : "")}
                        order={order}
                        onClick={this.props.onClick.bind(this, order)}
                        base={base}
                        quote={quote}
                        final={index === 0}
                        currentAccount={this.props.currentAccount}
                    />
                );
            });

            let tempAsks = combinedAsks;
            if (!horizontal) {
                tempAsks.sort((a,b) => {
                    return b.getPrice() - a.getPrice();
                });
            }
            askRows = tempAsks.map((order, index) => {
                return (horizontal ?

                    <OrderBookRowHorizontal
                        index={index}
                        key={order.getPrice() + (order.isCall() ? "_call" : "")}
                        order={order}
                        onClick={this.props.onClick.bind(this, order)}
                        base={base}
                        quote={quote}
                        type={order.type}
                        position={!this.state.flip ? "right" : "left"}
                        currentAccount={this.props.currentAccount}
                    /> :
                    <OrderBookRowVertical
                        index={index}
                        key={order.getPrice() + (order.isCall() ? "_call" : "")}
                        order={order}
                        onClick={this.props.onClick.bind(this, order)}
                        base={base}
                        quote={quote}
                        type={order.type}
                        final={0 === index}
                        currentAccount={this.props.currentAccount}
                    />
                    );
            });


        }

        if (this.props.horizontal) {

            let totalBidsLength = bidRows.length;
            let totalAsksLength = askRows.length;

            if (!showAllBids) {
                bidRows.splice(rowCount, bidRows.length);
            }

            if (!showAllAsks) {
                askRows.splice(rowCount, askRows.length);
            }

            let leftHeader = (
                <thead>
                    <tr key="top-header" className="top-header">
                        <th><Translate className="header-sub-title" content="exchange.total" /><span className="header-sub-title"> (<AssetName dataPlace="top" name={baseSymbol} />)</span></th>
                        <th><span className="header-sub-title"><AssetName dataPlace="top" name={baseSymbol} /></span></th>
                        <th><span className="header-sub-title"><AssetName dataPlace="top" name={quoteSymbol} /></span></th>
                        <th>
                            <Translate className={(this.state.flip ? "ask-total" : "bid-total") + " header-sub-title"} content="exchange.price" />
                        </th>
                    </tr>
                </thead>
            );

            let rightHeader = (
                <thead>
                    <tr key="top-header" className="top-header">
                        <th>
                            <Translate className={(!this.state.flip ? "ask-total" : "bid-total") + " header-sub-title"} content="exchange.price" />
                        </th>
                        <th><span className="header-sub-title"><AssetName dataPlace="top" name={quoteSymbol} /></span></th>
                        <th><span className="header-sub-title"><AssetName dataPlace="top" name={baseSymbol} /></span></th>
                        <th><Translate className="header-sub-title" content="exchange.total" /><span className="header-sub-title"> (<AssetName dataPlace="top" name={baseSymbol} />)</span></th>
                    </tr>
                </thead>
            );

            const translator = require("counterpart");

            return (
                    <div className={classnames(this.props.wrapperClass, "grid-block orderbook no-padding small-vertical medium-horizontal align-spaced no-overflow small-12 xlarge-8")}>
                        <div className={classnames("small-12 medium-6 middle-content", this.state.flip ? "order-1" : "order-2")}>
                            <div className="exchange-bordered">
                                <div className="exchange-content-header ask" data-intro={translator.translate("walkthrough.sell_orders")}>
                                    <Translate content="exchange.asks" />
                                    {this.state.flip ? (
                                    <div style={{display:"inline-block"}}>
                                        <span onClick={this._flipBuySell.bind(this)} style={{cursor: "pointer", fontSize: "1rem", marginLeft: "4px", position: "relative", top: "-2px"}} className="flip-arrow">  &#8646;</span>
                                        <span className="order-book-button-v" onClick={this.props.moveOrderBook}>
                                            <Icon name="thumb-tack" className="icon-14px" />
                                        </span>
                                    </div>) : null}
                                    <div style={{lineHeight: "16px"}} className="float-right header-sub-title">
                                        <Translate content="exchange.total" />
                                        <span>: </span>
                                        {utils.format_number(totalAsks, quote.get("precision"))}
                                        <span> (<AssetName name={quoteSymbol} />)</span>
                                    </div>
                                </div>
                                <div style={{paddingRight: "0.6rem"}}>
                                    <table className="table order-table table-hover fixed-table text-right">
                                        {!this.state.flip ? rightHeader : leftHeader}
                                    </table>
                                </div>
                                <div className="grid-block" ref="hor_asks" style={{paddingRight: "0.6rem", overflow: "hidden", maxHeight: 210}}>
                                    <table style={{paddingBottom: 5}} className="table order-table table-hover fixed-table text-right no-overflow">
                                        <TransitionWrapper
                                            ref="askTransition"
                                            className="orderbook clickable"
                                            component="tbody"
                                            transitionName="newrow"
                                        >
                                            {askRows}
                                        </TransitionWrapper>
                                    </table>
                                </div>
                                {totalAsksLength > rowCount ? (
                                <div className="orderbook-showall">
                                    <a onClick={this._onToggleShowAll.bind(this, "asks")}>
                                        <Translate content={showAllAsks ? "exchange.hide" : "exchange.show_asks"} />
                                        {!showAllAsks ? <span> ({totalAsksLength})</span> : null}
                                    </a>
                                </div>) : null}
                            </div>
                        </div>

                        <div className={classnames("small-12 medium-6 middle-content", this.state.flip ? "order-2" : "order-1")}>
                            <div className="exchange-bordered">
                                <div className="exchange-content-header bid" data-intro={translator.translate("walkthrough.buy_orders")}>
                                    <Translate content="exchange.bids" />
                                    {!this.state.flip ? (
                                    <div style={{display:"inline-block"}}>
                                        <span onClick={this._flipBuySell.bind(this)} style={{cursor: "pointer", fontSize: "1rem", marginLeft: "4px", position: "relative", top: "-2px"}} className="flip-arrow">  &#8646;</span>
                                        <span className="order-book-button-v" onClick={this.props.moveOrderBook}>
                                            <Icon name="thumb-tack" className="icon-14px" />
                                        </span>
                                    </div>) : null}
                                    <div style={{lineHeight: "16px"}} className="float-right header-sub-title">
                                        <Translate content="exchange.total" />
                                        <span>: </span>
                                        {utils.format_number(totalBids, base.get("precision"))}
                                        <span> (<AssetName name={baseSymbol} />)</span>
                                    </div>
                                </div>
                                <div style={{paddingRight: "0.6rem"}}>
                                    <table className="table order-table table-hover fixed-table text-right">
                                        {this.state.flip ? rightHeader : leftHeader}
                                    </table>
                                </div>
                                <div className="grid-block" ref="hor_bids" style={{paddingRight: "0.6rem", overflow: "hidden", maxHeight: 210}}>
                                    <table style={{paddingBottom: 5}} className="table order-table table-hover fixed-table text-right no-overflow">
                                        <TransitionWrapper
                                            ref="bidTransition"
                                            className="orderbook clickable"
                                            component="tbody"
                                            transitionName="newrow"
                                        >
                                            {bidRows}
                                        </TransitionWrapper>
                                    </table>
                                </div>
                                {totalBidsLength > rowCount ? (
                                <div className="orderbook-showall">
                                    <a onClick={this._onToggleShowAll.bind(this, "bids")}>
                                        <Translate content={showAllBids ? "exchange.hide" : "exchange.show_bids"} />
                                        {!showAllBids ? <span> ({totalBidsLength})</span> : null}
                                    </a>
                                </div>) : null}
                            </div>
                        </div>
                    </div>
            );
        } else {
            // Vertical orderbook
            return (
                <div className="left-order-book no-padding no-overflow">
                    <div className="order-table-container">
                        <StickyTable stickyColumnCount={0} className="order-table table"  ref="vertical_sticky_table">
                            <div className="sticky-table-row top-header">
                                <div className="cell header-cell left">
                                    <span className="header-sub-title"><AssetName name={baseSymbol} /></span>
                                </div>
                                <div className="cell header-cell">
                                    <span className="header-sub-title"><AssetName name={quoteSymbol} /></span>
                                </div>
                                <div className="cell header-cell right">
                                    <Translate className="header-sub-title" content="exchange.price" />
                                </div>
                            </div>
                            <TransitionWrapper
                                ref="askTransition"
                                className="transition-container clickable"
                                component="div"
                                transitionName="newrow"
                            >
                                {askRows.length > 0
                                    ? askRows
                                    : (noOrders || <div className="sticky-table-row">
                                          <td className="cell no-orders padtop" colSpan="3">
                                              No asks
                                          </td>
                                      </div>)}
                            </TransitionWrapper>
                            <div className="sticky-table-row" ref="center_text">
                              {noOrders ? <td colSpan={3} className="no-orders padtop">No orders</td> :
                                <td className="cell center-cell" colSpan="3">
                                    <div className="orderbook-latest-price">
                                        <div className="text-center spread">
                                            {(!!spread) && <span className="clickable left" onClick={this.toggleSpreadValue}>
                                                Spread <span className="spread-value">{spread}</span>
                                            </span>}
                                            <Icon className="lock-unlock clickable" onClick={this.toggleAutoScroll} name={this.state.autoScroll ? "locked" : "unlocked"} />
                                            {(!!this.props.latest) && <span className="right">
                                                Latest <span className={this.props.changeClass}><PriceText preFormattedPrice={this.props.latest} /></span>
                                            </span>}
                                        </div>
                                    </div>
                                </td>
                              }
                            </div>
                            <TransitionWrapper
                                ref="bidTransition"
                                className="transition-container clickable"
                                component="div"
                                transitionName="newrow"
                            >
                                {bidRows.length > 0
                                    ? bidRows
                                    : (noOrders || <div className="sticky-table-row">
                                          <td className="cell no-orders" colSpan="3">
                                              No bids
                                          </td>
                                      </div>)}
                            </TransitionWrapper>
                        </StickyTable>
                    </div>
                    <div className="v-align no-padding align-center grid-block footer shrink bottom-header">
                        <div onClick={this.props.moveOrderBook}>
                            <Icon name="thumb-untack" className="icon-14px" className="order-book-button-h" />
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
