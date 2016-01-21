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
class VestingBalance extends React.Component {

    static propTypes = {
        balance: ChainTypes.ChainObject.isRequired
    }

    render() {
        let amount = Number(this.props.balance.getIn(['balance','amount']));
        let type = this.props.balance.getIn(['balance','asset_id']);
        return <FormattedAsset amount={amount} asset={type} decimalOffset={this.props.decimalOffset || 0}/>;
    }
}

export default VestingBalance;
