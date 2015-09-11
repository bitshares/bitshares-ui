import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";

/**
 *  Given a collateral position object (call order), displays it in a pretty way
 *
 *  Expects one property, 'object' which should be a call order id
 */

@BindToChainState({keep_updating: true})
class CollateralPosition extends React.Component {

    static propTypes = {
        object: ChainTypes.ChainObject.isRequired
    }

    render() {
        let co = this.props.object.toJS();
        return (
            <tr>
                <td>{<FormattedAsset amount={co.debt} asset={co.call_price.quote.asset_id}/>}</td>
                <td>{<FormattedAsset amount={co.collateral} asset={co.call_price.base.asset_id}/>}</td>
                <td>{<FormattedPrice
                    base_amount={co.call_price.base.amount} base_asset={co.call_price.base.asset_id}
                    quote_amount={co.call_price.quote.amount} quote_asset={co.call_price.quote.asset_id}/>}
                </td>
            </tr>
        );
    }
}

export default CollateralPosition;
