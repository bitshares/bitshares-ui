import React from "react";
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";
import Immutable from "immutable";

class BalanceWrapper extends React.Component {
    static propTypes = {
        balances: ChainTypes.ChainObjectsList,
        orders: ChainTypes.ChainObjectsList
    };

    static defaultProps = {
        balances: Immutable.List(),
        orders: Immutable.List()
    };

    render() {
        const {wrap, orders, ...others} = this.props;
        let balanceAssets = this.props.balances
            .filter(b => {
                return !!b && b.get("balance") !== 0;
            })
            .map(b => {
                return b.get("asset_type");
            });

        let ordersByAsset = orders.filter(o => !!o).reduce((orders, o) => {
            let asset_id = o.getIn(["sell_price", "base", "asset_id"]);
            if (!orders[asset_id]) orders[asset_id] = 0;
            orders[asset_id] += parseInt(o.get("for_sale"), 10);
            return orders;
        }, {});

        for (let id in ordersByAsset) {
            if (balanceAssets.indexOf(id) === -1) {
                balanceAssets.push(id);
            }
        }

        let Component = wrap;
        return (
            <Component
                {...others}
                orders={ordersByAsset}
                balanceAssets={Immutable.List(balanceAssets)}
            />
        );
    }
}

export default BindToChainState(BalanceWrapper);
