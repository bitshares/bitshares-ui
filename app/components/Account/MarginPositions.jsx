import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import AssetName from "../Utility/AssetName";
import BorrowModal from "../Modal/BorrowModal";
import WalletApi from "api/WalletApi";
import WalletDb from "stores/WalletDb";
import Translate from "react-translate-component";
import utils from "common/utils";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import {List} from "immutable";
import {Link} from "react-router/es";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import EquivalentPrice from "../Utility/EquivalentPrice";
import Immutable from "immutable";

const alignRight = {textAlign: "right"};
const alignLeft = {textAlign: "left"};
/**
 *  Given a collateral position object (call order), displays it in a pretty way
 *
 *  Expects one property, 'object' which should be a call order id
 */

class MarginPosition extends React.Component {

    static propTypes = {
        debtAsset: ChainTypes.ChainAsset.isRequired,
        collateralAsset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        tempComponent: "tr"
    };

    static contextTypes = {
        router: React.PropTypes.object
    };

    _onUpdatePosition(e) {
        e.preventDefault();
        let ref = "cp_modal_" + this.props.object.getIn(["call_price", "quote", "asset_id"]);
        this.refs[ref].show();
    }

    _onClosePosition(e) {
        e.preventDefault();
        let tr = WalletApi.new_transaction();

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

    _onNavigate(route, e) {
        e.preventDefault();
        this.context.router.push(route);
    }

    render() {
        let {debtAsset, collateralAsset, object} = this.props;
        const co = object.toJS();
        const cr = this._getCollateralRatio();
        const d = utils.get_asset_amount(co.debt, this.props.debtAsset);

        const statusClass = this._getStatusClass();

        const assetDetailURL = `/asset/${debtAsset.get("symbol")}`;
        const marketURL = `/market/${debtAsset.get("symbol")}_${collateralAsset.get("symbol")}`;
        const assetInfoLinks = (
        <ul>
            <li>
                <a href={assetDetailURL} onClick={this._onNavigate.bind(this, assetDetailURL)}>
                    <Translate content="account.asset_details"/>
                </a>
            </li>
            <li>
                <a href={marketURL} onClick={this._onNavigate.bind(this, marketURL)}>
                    <AssetName name={debtAsset.get("symbol")} /> : <AssetName name={collateralAsset.get("symbol")} />
                </a>
            </li>
        </ul>);

        return (
            <tr className="margin-row">
                <td style={alignLeft}>
                    <Link to={`/asset/${debtAsset.get("symbol")}`}>
                        <AssetName noTip name={debtAsset.get("symbol")} />
                    </Link>
                </td>
                <td style={alignRight}>
                    <FormattedAsset
                        amount={co.debt}
                        asset={co.call_price.quote.asset_id}
                        assetInfo={assetInfoLinks}
                        hide_asset
                    />
                </td>
                <td style={alignRight} className="column-hide-medium">
                    <FormattedAsset
                        decimalOffset={5}
                        amount={co.collateral}
                        asset={co.call_price.base.asset_id}
                    />
                </td>
                <td data-place="bottom" data-tip={this._getCRTip()} className={"center-content "+ statusClass} >{utils.format_number(cr, 2)}</td>
                <td style={alignRight} >
                    <TotalBalanceValue
                        noTip
                        balances={List()}
                        debt={{[debtAsset.get("id")] : co.debt}}
                        collateral={{[collateralAsset.get("id")]: parseInt(co.collateral, 10)}}
                        hide_asset
                    />
                </td>
                <td style={alignRight} className={"column-hide-small"}>
                    <FormattedPrice
                        base_amount={co.call_price.base.amount} base_asset={co.call_price.base.asset_id}
                        quote_amount={co.call_price.quote.amount} quote_asset={co.call_price.quote.asset_id}
                        hide_symbols
                    />
                </td>
                <td style={alignRight} className={"column-hide-small"}>
                    <EquivalentPrice
                        forceDirection={false}
                        fromAsset={co.call_price.base.asset_id}
                        toAsset={co.call_price.quote.asset_id}
                        hide_symbols
                    />
                </td>
                <td className={"center-content column-hide-small"} style={alignLeft}>
                    <FormattedPrice
                        base_amount={co.call_price.base.amount} base_asset={co.call_price.base.asset_id}
                        quote_amount={co.call_price.quote.amount} quote_asset={co.call_price.quote.asset_id}
                        hide_value
                    />
                </td>
                {/* <td><AssetName name={debtAsset.get("symbol")} />/<AssetName name={collateralAsset.get("symbol")} /></td> */}

                <td>
                    <div
                        data-place="left"
                        data-tip={counterpart.translate("tooltip.update_position")}
                        style={{paddingBottom: 5}}
                    >
                        <a onClick={this._onUpdatePosition.bind(this)}>
                            <Icon name="adjust" className="icon-14px rotate90" />
                        </a>
                    </div>
                </td>
                <td>
                    <div
                        data-place="left"
                        data-tip={counterpart.translate("tooltip.close_position", {amount: d, asset: debtAsset.get("symbol")})}
                        style={{paddingBottom: 5}}
                    >
                        <a onClick={this._onClosePosition.bind(this)}>
                            <Icon name="cross-circle" className="icon-14px" />
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
MarginPosition = BindToChainState(MarginPosition, {keep_updating: true});

class MarginPositionWrapper extends React.Component {
    static propTypes = {
        object: ChainTypes.ChainObject.isRequired
    };

    render() {
        let {object} = this.props;
        let debtAsset = object.getIn(["call_price", "quote", "asset_id"]);
        let collateralAsset = object.getIn(["call_price", "base", "asset_id"]);

        return <MarginPosition debtAsset={debtAsset} collateralAsset={collateralAsset} {...this.props} />;
    }
}

MarginPositionWrapper = BindToChainState(MarginPositionWrapper, {keep_updating: true});

class MarginPositionPlaceHolder extends React.Component {

    static propTypes = {
        debtAsset: ChainTypes.ChainAsset.isRequired,
        collateralAsset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        tempComponent: "tr"
    };

    static contextTypes = {
        router: React.PropTypes.object
    };

    _onUpdatePosition(e) {
        e.preventDefault();
        let ref = "cp_modal_" + this.props.debtAsset.get("id");
        this.refs[ref].show();
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

    _onNavigate(route, e) {
        e.preventDefault();
        this.context.router.push(route);
    }

    render() {
        let {debtAsset, collateralAsset} = this.props;

        const assetDetailURL = `/asset/${debtAsset.get("symbol")}`;
        const marketURL = `/market/${debtAsset.get("symbol")}_${collateralAsset.get("symbol")}`;
        const assetInfoLinks = (
        <ul>
            <li>
                <a href={assetDetailURL} onClick={this._onNavigate.bind(this, assetDetailURL)}>
                    <Translate content="account.asset_details"/>
                </a>
            </li>
            <li>
                <a href={marketURL} onClick={this._onNavigate.bind(this, marketURL)}>
                    <AssetName name={debtAsset.get("symbol")} /> : <AssetName name={collateralAsset.get("symbol")} />
                </a>
            </li>
        </ul>);

        return (
            <tr className="margin-row">
                <td style={alignLeft}>
                    <Link to={`/asset/${debtAsset.get("symbol")}`}>
                        <AssetName noTip name={debtAsset.get("symbol")} />
                    </Link>
                </td>
                <td style={alignRight}>
                    <FormattedAsset
                        amount={0}
                        asset={debtAsset.get("id")}
                        assetInfo={assetInfoLinks}
                        hide_asset
                    />
                </td>
                <td style={alignRight} className="column-hide-medium">
                    <FormattedAsset
                        decimalOffset={5}
                        amount={0}
                        asset={collateralAsset.get("id")}
                    />
                </td>
                <td></td>
                <td style={alignRight} >

                </td>
                <td style={alignRight} className={"column-hide-small"}>

                </td>
                <td style={alignRight} className={"column-hide-small"}>

                </td>
                <td className={"center-content column-hide-small"} style={alignLeft}>

                </td>
                {/* <td><AssetName name={debtAsset.get("symbol")} />/<AssetName name={collateralAsset.get("symbol")} /></td> */}

                <td>
                    <div
                        data-place="left"
                        data-tip={counterpart.translate("tooltip.update_position")}
                        style={{paddingBottom: 5}}
                    >
                        <a onClick={this._onUpdatePosition.bind(this)}>
                            <Icon name="adjust" className="icon-14px rotate90" />
                        </a>
                    </div>
                </td>
                <td>

                    {debtAsset ? (
                        <BorrowModal
                            ref={"cp_modal_" + debtAsset.get("id")}
                            quote_asset={debtAsset.get("id")}
                            backing_asset={debtAsset.getIn(["bitasset", "options", "short_backing_asset"])}
                            account={this.props.account}
                        />) : null}
                </td>

            </tr>
        );
    }
}

MarginPositionPlaceHolder = BindToChainState(MarginPositionPlaceHolder);

class PlaceHolderWrapper extends React.Component {
    static propTypes = {
        objects: ChainTypes.ChainObjectsList,
        optionals: ChainTypes.ChainAssetsList
    };

    static defaultProps = {
        optionals: Immutable.List(["1.3.103", "1.3.113", "1.3.120", "1.3.121", "1.3.958", "1.3.1325", "1.3.1362"])
    }

    render() {
        let {objects, optionals} = this.props;
        objects = objects.filter(o => !!o);
        optionals = optionals.filter(o => !!o);
        if (!optionals.length) return null;
        objects.forEach(object => {
            if (object) {
                let index = optionals.findIndex(o => {
                    return o && o.get("id") === object.getIn(["call_price", "quote", "asset_id"]);
                });
                if (index !== -1) {
                    optionals.splice(index, 1);
                }
            }
        });

        if (!optionals.length) return null;
        let rows = optionals.map(a => {
            return <MarginPositionPlaceHolder key={a.get("id")} debtAsset={a.get("id")} collateralAsset={a.getIn(["bitasset", "options", "short_backing_asset"])} {...this.props} />;
        });

        return <tbody>{rows}</tbody>;
    }
}

PlaceHolderWrapper = BindToChainState(PlaceHolderWrapper, {keep_updating: true});

const CollateralTable = ({callOrders, account, className, children, preferredUnit}) => {

    return (
        <table className={"table " + className}>
            <thead>
            <tr>
                <th style={alignLeft}><Translate content="explorer.asset.title" /></th>
                <th style={alignRight}><Translate content="transaction.borrow_amount" /></th>
                <th style={alignRight} className="column-hide-medium"><Translate content="transaction.collateral" /></th>
                <th>
                    <div className="tooltip inline-block" data-place="top" data-tip={counterpart.translate("tooltip.coll_ratio")}>
                        <Translate content="borrow.coll_ratio" />
                    </div>
                </th>
                <th>
                    <TranslateWithLinks
                        noLink
                        string="account.total"
                        keys={[
                            {type: "asset", value: preferredUnit, arg: "asset"}
                        ]}
                    />
                </th>
                <th style={alignRight} className="column-hide-small">
                    <div className="tooltip inline-block" data-place="top" data-tip={counterpart.translate("tooltip.call_price")}>
                        <Translate content="exchange.call" />
                    </div>
                </th>
                <th style={alignRight} className="column-hide-small">
                    <Translate content="exchange.price" />
                </th>
                <th style={alignLeft}><Translate content="explorer.assets.units" /></th>
                <th><Translate content="borrow.adjust_short" /></th>
                <th><Translate content="transfer.close" /></th>
            </tr>
            </thead>
            <tbody>
                { callOrders.sort((a, b) => (a.split(".")[2] - b.split(".")[2])).map(id => <MarginPositionWrapper key={id} object={id} account={account}/>) }
            </tbody>
            <PlaceHolderWrapper account={account} objects={Immutable.List(callOrders)} />
            <tbody>
                { children }
            </tbody>
        </table>
    );
};

export default CollateralTable;
