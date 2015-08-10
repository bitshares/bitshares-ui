import React from "react";
import ChainComponent from "./ChainComponent"
import FormattedAsset from "./FormattedAsset";
import {ObjectIdType} from "./CustomTypes";

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
      return (<FormattedAsset amount={amount} asset={type} />)
   }
}


BalanceComponent.propTypes = {
   balance: ObjectIdType
}

export default BalanceComponent;
