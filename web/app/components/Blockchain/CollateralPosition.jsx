import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import BorrowModal from "../Modal/BorrowModal";

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

    _onUpdatePosition(e) {
        e.preventDefault();
        let ref = "cp_modal_" + this.props.object.getIn(["call_price", "quote", "asset_id"]);
        this.refs[ref].show();
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

                <td>
                    <button onClick={this._onUpdatePosition.bind(this)} className="button success">Update</button>
                    <BorrowModal                
                        ref={"cp_modal_" + co.call_price.quote.asset_id}
                        quote_asset={co.call_price.quote.asset_id}
                        account={this.props.account}
                    />
                </td>
            </tr>
        );
    }
}

export default CollateralPosition;
