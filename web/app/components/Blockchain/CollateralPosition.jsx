import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import BorrowModal from "../Modal/BorrowModal";
import WalletApi from "api/WalletApi";
import WalletDb from "stores/WalletDb";
import Translate from "react-translate-component";
import utils from "common/utils";
import counterpart from "counterpart";

const wallet_api = new WalletApi();
/**
 *  Given a collateral position object (call order), displays it in a pretty way
 *
 *  Expects one property, 'object' which should be a call order id
 */

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

    _getCollateralRatio() {
        const co = this.props.object.toJS();
        const c = utils.get_asset_amount(co.collateral, this.props.collateralAsset);
        const d = utils.get_asset_amount(co.debt, this.props.debtAsset);
        return c / (d / this._getFeedPrice());
    }

    _getMR() {
        return this.props.debtAsset.getIn(["bitasset", "current_feed", "maintenance_collateral_ratio"]) / 1000;
    }

    _getStatusClass() {
        let cr = this._getCollateralRatio();
        const mr = this._getMR();

        if (isNaN(cr)) return null;
        if (cr < mr) {
            return "danger";
        } else if (cr < (mr + 0.5)) {
            return "warning";
        } else {
            return "";
        }
    }

    _getCRTip() {
        const statusClass = this._getStatusClass();
        const mr = this._getMR();
        if (!statusClass || statusClass === "") return null;

        if (statusClass === "danger") {
            return counterpart.translate("tooltip.cr_danger", {mr});
        } else if (statusClass === "warning") {
            return counterpart.translate("tooltip.cr_warning", {mr});
        } else {
            return null;
        }
    }

    render() {
        let {debtAsset, object} = this.props;
        const co = object.toJS();
        const cr = this._getCollateralRatio();
        const d = utils.get_asset_amount(co.debt, this.props.debtAsset);

        const statusClass = this._getStatusClass();

        return (
            <tr className="margin-row">
                <td>{<FormattedAsset amount={co.debt} asset={co.call_price.quote.asset_id}/>}</td>
                <td className="column-hide-medium">
                    <FormattedAsset
                        decimalOffset={5}
                        amount={co.collateral}
                        asset={co.call_price.base.asset_id}
                    />
                </td>
                <td data-place="bottom" data-tip={this._getCRTip()} className={"center-content "+ statusClass} >{utils.format_number(cr, 2)}</td>
                <td className={"center-content column-hide-small"}>
                    <FormattedPrice
                        callPrice
                        decimals={2}
                        base_amount={co.call_price.base.amount} base_asset={co.call_price.base.asset_id}
                        quote_amount={co.call_price.quote.amount} quote_asset={co.call_price.quote.asset_id}
                    />
                </td>

                <td>
                    <div
                        data-place="left"
                        data-tip={counterpart.translate("tooltip.update_position")}
                        style={{paddingBottom: 5}}
                    >
                        <a onClick={this._onUpdatePosition.bind(this)}>
                            <Translate content="borrow.adjust" />
                        </a>
                    </div>
                    <div
                        data-place="left"
                        data-tip={counterpart.translate("tooltip.close_position", {amount: d, asset: debtAsset.get("symbol")})}
                        style={{paddingBottom: 5}}
                    >
                        <a onClick={this._onClosePosition.bind(this)}>
                            <Translate content="borrow.close" />
                        </a>
                    </div>
                    {debtAsset ? (
                        <BorrowModal
                            ref={"cp_modal_" + co.call_price.quote.asset_id}
                            quote_asset={co.call_price.quote.asset_id}
                            backing_asset={debtAsset.getIn(["bitasset", "options", "short_backing_asset"])}
                            account={this.props.account}
                        />) : null}
                </td>

            </tr>
        );
    }
}
CollateralPosition = BindToChainState(CollateralPosition, {keep_updating: true});

class CollateralPositionWrapper extends React.Component {
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

CollateralPositionWrapper = BindToChainState(CollateralPositionWrapper, {keep_updating: true});

const CollateralTable = ({callOrders, account}) => {

    return (
        <table className="table">
            <thead>
            <tr>
                <th><Translate content="transaction.borrow_amount" /></th>
                <th className="column-hide-medium"><Translate content="transaction.collateral" /></th>
                <th style={{textAlign: "center"}}>
                    <div className="tooltip inline-block" data-place="top" data-tip={counterpart.translate("tooltip.coll_ratio")}>
                        <Translate content="borrow.coll_ratio" />
                    </div>
                </th>
                <th style={{textAlign: "center"}} className="column-hide-small">
                    <div className="tooltip inline-block" data-place="top" data-tip={counterpart.translate("tooltip.call_price")}>
                        <Translate content="exchange.call" />
                    </div>
                </th>
                <th></th>
            </tr>
            </thead>
            <tbody>
                { callOrders.map(id => <CollateralPositionWrapper key={id} object={id} account={account}/>) }
            </tbody>
        </table>
    );
};

export default CollateralTable;
