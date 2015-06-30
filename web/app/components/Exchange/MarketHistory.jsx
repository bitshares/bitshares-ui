import React from "react";
import {PropTypes} from "react/addons";
import Immutable from "immutable";
import classNames from "classnames";
import Ps from "perfect-scrollbar";

class MarketHistory extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
                !Immutable.is(nextProps.history, this.props.history)
            );
    }

    componentDidMount() {
        let historyContainer = React.findDOMNode(this.refs.history);
        Ps.initialize(historyContainer);
    }

    render() {
        
        function orderHistoryEntry(order) {
            let priceTrendCssClass = classNames({"orderHistoryBid": order.type === 1, "orderHistoryAsk": order.type !== 1});
            
            return (
                <tr>
                    <td>{order.amount}</td>
                    <td className={priceTrendCssClass}>{order.price}</td>
                    <td>{order.timestamp.getHours()}:{order.timestamp.getMinutes()}</td>
                </tr>
            );
        }

        return (
            <div className="grid-content market-content ps-container" ref="history">
                <table className="table expand order-table my-orders">
                    <p>MARKET HISTORY</p>
                    <thead>
                    <tr>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Time</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        this.props.history.map(orderHistoryEntry)
                    }
                    </tbody>
                </table>
            </div>
        );
    }
}

MarketHistory.defaultProps = {
    history: []
};

MarketHistory.propTypes = {
    history: PropTypes.object.isRequired
};

export default MarketHistory;
