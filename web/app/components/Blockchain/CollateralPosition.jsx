import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import BorrowModal from "../Modal/BorrowModal";
import WalletApi from "rpc_api/WalletApi";
import WalletDb from "stores/WalletDb";
import Translate from "react-translate-component";

let wallet_api = new WalletApi();
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

    _onClosePosition(e) {
        e.preventDefault();
        let tr = wallet_api.new_transaction();

        tr.add_type_operation("call_order_update", {
            "fee": {
                amount: 0,
                asset_id: 0
            },
            "funding_account": this.props.object.get("borrower"),
            "delta_collateral": {
                "amount": -this.props.object.get("collateral"),
                "asset_id": this.props.object.getIn(["call_price", "base", "asset_id"])
            },
            "delta_debt": {
                "amount": -this.props.object.get("debt"),
                "asset_id": this.props.object.getIn(["call_price", "quote", "asset_id"])
            }});

        WalletDb.process_transaction(tr, null, true);
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
                    <button onClick={this._onUpdatePosition.bind(this)} className="button outline"><Translate content="borrow.update" /></button>
                    <BorrowModal                
                        ref={"cp_modal_" + co.call_price.quote.asset_id}
                        quote_asset={co.call_price.quote.asset_id}
                        account={this.props.account}
                    />
                </td>
                <td>
                    <button onClick={this._onClosePosition.bind(this)} className="button outline"><Translate content="transfer.close" /></button>
                </td>
            </tr>
        );
    }
}

export default CollateralPosition;
