import React from "react";
import ChainComponent from "../Utility/ChainComponent"
import FormattedAsset from "../Utility/FormattedAsset";


/**
 *  Given a balance_object, displays it in a pretty way
 *
 *  Expects one property, 'balance' which should be a balance_object id
 */
class BalanceComponent extends ChainComponent {

   render() {
      if( !this.state.balance ) return null

      let amount = this.state.balance.get('balance')
      let type   = this.state.balance.get('asset_type')
      return (<FormattedAsset amount={amount} asset={type.id} />)
   }
}

export default BalanceComponent;
