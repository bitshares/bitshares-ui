import React from "react";
import {PropTypes} from "react/addons";
import Immutable from "immutable";
import Ps from "perfect-scrollbar";
import utils from "common/utils";
import Translate from "react-translate-component";
import ChainStore from "api/ChainStore";

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
        let {history, base, baseSymbol, quoteSymbol} = this.props;
        let historyRows = null;

        if (history.size > 0) {
            historyRows = this.props.history.filter(a => {
                return a.receives.asset_id === base.id;
            })
            .sort((a, b) => {
                return parseInt(b.order_id.split(".")[2], 10) - parseInt(a.order_id.split(".")[2], 10);
            })
            .map(order => {
                let receivesAsset = ChainStore.getObject(order.receives.asset_id);
                let paysAsset = ChainStore.getObject(order.pays.asset_id);
                let receives = null, pays = null, price = null;
                if (receivesAsset && paysAsset) {
                    receives = utils.format_asset(order.receives.amount, receivesAsset, true);
                    pays = utils.format_asset(order.pays.amount, paysAsset, true);
                    price = utils.format_price(order.receives.amount, receivesAsset, order.pays.amount, paysAsset, true);
                }
                
                return (
                    <tr key={order.order_id}>
                        <td>{receives}</td>
                        <td>{pays}</td>
                        <td>{price}</td>
                    </tr>
                );
            }).toArray();
        }

        return (
            <div className="grid-content market-content ps-container no-padding" ref="history">
                <table className="table expand order-table table-hover text-right">
                    <p style={{textTransform: "uppercase"}}><Translate content="exchange.market_history" /></p>
                    <thead>
                    <tr>
                        <th style={{textAlign: "right"}}><Translate content="exchange.value" /><br/><small>({baseSymbol})</small></th>
                        <th style={{textAlign: "right"}}><Translate content="transfer.amount" /><br/><small>({quoteSymbol})</small></th>
                        <th style={{textAlign: "right"}}><Translate content="exchange.price" /><br/><small>({baseSymbol}/{quoteSymbol})</small></th>
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
    history: PropTypes.object.isRequired
};

export default MarketHistory;
