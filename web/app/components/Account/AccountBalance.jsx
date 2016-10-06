import React from "react";
import AssetName from "../Utility/AssetName";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import BalanceComponent from "../Utility/BalanceComponent";

/**
 *  Given a balance_object, displays it in a pretty way
 *
 *  Expects one property, 'balance' which should be a balance_object id
 */

@BindToChainState({keep_updating: true})
class AccountBalance extends React.Component {

    static propTypes = {
      account: ChainTypes.ChainAccount.isRequired,
      asset: ChainTypes.ChainAsset.isRequired
    }

    render() {
        let asset_id = this.props.asset.get('id');
        let balance_id = this.props.account.getIn( ['balances',asset_id] );

        if( balance_id ) return <BalanceComponent balance={balance_id} />
        else return <span>0&nbsp;<AssetName name={this.props.asset.get('symbol')} /></span>
    }
}

export default AccountBalance;
