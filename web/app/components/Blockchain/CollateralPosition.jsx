import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import BorrowModal from "../Modal/BorrowModal";
import WalletApi from "rpc_api/WalletApi";
import WalletDb from "stores/WalletDb";
import Translate from "react-translate-component";
import utils from "common/utils";
import {ChainStore} from "graphenejs-lib";
import ActionSheet from "react-foundation-apps/src/action-sheet";
import Icon from "../Icon/Icon";

let wallet_api = new WalletApi();
/**
 *  Given a collateral position object (call order), displays it in a pretty way
 *
 *  Expects one property, 'object' which should be a call order id
 */

@BindToChainState({keep_updating: true})
class CollateralPosition extends React.Component {

    static propTypes = {
        debtAsset: ChainTypes.ChainAsset.isRequired,
        collateralAsset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        tempComponent: "tr"
    };

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

    _getFeedPrice() {

        if (!this.props) {
            return 1;
        }

        return 1 / utils.get_asset_price(
            this.props.debtAsset.getIn(["bitasset", "current_feed", "settlement_price", "quote", "amount"]),
            this.props.collateralAsset,
            this.props.debtAsset.getIn(["bitasset", "current_feed", "settlement_price", "base", "amount"]),
            this.props.debtAsset
        );
    }

    _getCollateralRatio(debt, collateral) {
        let c = utils.get_asset_amount(collateral, this.props.collateralAsset);
        let d = utils.get_asset_amount(debt, this.props.debtAsset);
        return c / (d / this._getFeedPrice());
    }

    render() {
        let co = this.props.object.toJS();
        let cr = this._getCollateralRatio(co.debt, co.collateral);

        let quoteAssetID = co.call_price.quote.asset_id;
        let quoteAsset = ChainStore.getAsset(quoteAssetID);

        return (
            <tr>
                <td>{<FormattedAsset amount={co.debt} asset={co.call_price.quote.asset_id}/>}</td>
                <td>{<FormattedAsset amount={co.collateral} asset={co.call_price.base.asset_id}/>}</td>
                <td>{utils.format_number(cr, 2)}</td>
                <td className="column-hide-small">{<FormattedPrice
                    base_amount={co.call_price.base.amount} base_asset={co.call_price.base.asset_id}
                    quote_amount={co.call_price.quote.amount} quote_asset={co.call_price.quote.asset_id}/>}
                </td>

                <td>
                    <ActionSheet>
                        <ActionSheet.Button title="">
                            <a style={{padding: "1rem"}}>
                                &nbsp;<Translate content="account.perm.action" /> &nbsp;
                                <Icon className="icon-14px" name="chevron-down"/>
                            </a>
                        </ActionSheet.Button>
                        <ActionSheet.Content >
                            <ul className="no-first-element-top-border">
                                <li className="dropdown-options">
                                        <a onClick={this._onUpdatePosition.bind(this)}>
                                            <Translate content="borrow.adjust" />
                                        </a>
                                </li>
                                <li className="dropdown-options">
                                    <a onClick={this._onClosePosition.bind(this)}>
                                        <Translate content="borrow.close" />
                                    </a>
                                </li>
                            </ul>
                        </ActionSheet.Content>
                    </ActionSheet>
                    {quoteAsset ? (
                    <BorrowModal
                        ref={"cp_modal_" + co.call_price.quote.asset_id}
                        quote_asset={co.call_price.quote.asset_id}
                        backing_asset={quoteAsset.getIn(["bitasset", "options", "short_backing_asset"])}
                        account={this.props.account}
                    />) : null}
                </td>
            </tr>
        );
    }
}

@BindToChainState({keep_updating: true})
export default class CollateralPositionWrapper extends React.Component {
    static propTypes = {
        object: ChainTypes.ChainObject.isRequired
    };

    render() {
        let {object} = this.props;
        let debtAsset = object.getIn(["call_price", "quote", "asset_id"]);
        let collateralAsset = object.getIn(["call_price", "base", "asset_id"]);

        return <CollateralPosition debtAsset={debtAsset} collateralAsset={collateralAsset} {...this.props} />;
    }



}
