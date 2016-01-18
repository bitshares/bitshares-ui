import React from "react";
import FormattedAsset from "./FormattedAsset";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";

/**
 *  Given a balance_object, displays it in a pretty way
 *
 *  Expects one property, 'balance' which should be a balance_object id
 */

@BindToChainState({keep_updating: true})
class BalanceComponent extends React.Component {

    static propTypes = {
        balance: ChainTypes.ChainObject.isRequired,
        assetInfo: React.PropTypes.node
    }

    render() {
        let amount = Number(this.props.balance.get('balance'));
        let type = this.props.balance.get('asset_type');
        return (<FormattedAsset amount={amount} asset={type} asPercentage={this.props.asPercentage} assetInfo={this.props.assetInfo}/>);
    }
}

export default BalanceComponent;
