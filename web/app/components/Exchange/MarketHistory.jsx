import React from "react";
import {PropTypes} from "react/addons";
import Immutable from "immutable";
import Ps from "perfect-scrollbar";
import utils from "common/utils";

class MarketHistory extends React.Component {
    shouldComponentUpdate(nextProps) {
        return (
                !Immutable.is(nextProps.history, this.props.history) ||
                !Immutable.is(nextProps.assets, this.props.assets)
            );
    }

    componentDidMount() {
        let historyContainer = React.findDOMNode(this.refs.history);
        Ps.initialize(historyContainer);
    }

    render() {
        let {assets, history, base, baseSymbol, quoteSymbol} = this.props;
        let historyRows = null;

        if (assets.size > 0 && history.size > 0) {
            historyRows = this.props.history.filter(a => {
                return a.receives.asset_id === base.id;
            })
            .sort((a, b) => {
                return parseInt(b.order_id.split(".")[2], 10) - parseInt(a.order_id.split(".")[2], 10);
            })
            .map(order => {
                let receives = utils.get_asset_amount(order.receives.amount, assets.get(order.receives.asset_id));
                let pays = utils.get_asset_amount(order.pays.amount, assets.get(order.pays.asset_id));

                return (
                    <tr key={order.order_id}>
                        <td>{receives}</td>
                        <td>{pays}</td>
                        <td>{receives / pays}</td>
                    </tr>
                );
            }).toArray();
        }

        return (
            <div className="grid-content market-content ps-container" ref="history">
                <table className="table expand order-table">
                    <p>MARKET HISTORY</p>
                    <thead>
                    <tr>
                        <th>Value ({baseSymbol})</th>
                        <th>Amount ({quoteSymbol})</th>
                        <th>Price ({baseSymbol}/{quoteSymbol}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        historyRows
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
    history: PropTypes.object.isRequired,
    assets: PropTypes.object
};

export default MarketHistory;
