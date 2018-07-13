import React from "react";
import utils from "common/utils";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import cnames from "classnames";
import counterpart from "counterpart";
import Translate from "react-translate-component";

class MarginPosition extends React.Component {
    static propTypes = {
        debtAsset: ChainTypes.ChainAsset.isRequired,
        collateralAsset: ChainTypes.ChainAsset.isRequired
    };

    _getFeedPrice() {
        if (!this.props) {
            return 1;
        }

        return (
            1 /
            utils.get_asset_price(
                this.props.debtAsset.getIn([
                    "bitasset",
                    "current_feed",
                    "settlement_price",
                    "quote",
                    "amount"
                ]),
                this.props.collateralAsset,
                this.props.debtAsset.getIn([
                    "bitasset",
                    "current_feed",
                    "settlement_price",
                    "base",
                    "amount"
                ]),
                this.props.debtAsset
            )
        );
    }

    _getCollateralRatio() {
        const co = this.props.object.toJS();
        const c = utils.get_asset_amount(
            co.collateral,
            this.props.collateralAsset
        );
        const d = utils.get_asset_amount(co.debt, this.props.debtAsset);
        return c / (d / this._getFeedPrice());
    }

    _getMR() {
        return (
            this.props.debtAsset.getIn([
                "bitasset",
                "current_feed",
                "maintenance_collateral_ratio"
            ]) / 1000
        );
    }

    _getStatusClass() {
        let cr = this._getCollateralRatio();
        const mr = this._getMR();

        if (isNaN(cr)) return null;
        if (cr < mr) {
            return "danger";
        } else if (cr < mr + 0.5) {
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
        let {object} = this.props;
        const co = object.toJS();
        const cr = this._getCollateralRatio();
        const d = utils.get_asset_amount(co.debt, this.props.debtAsset);

        const statusClass = this._getStatusClass();

        return (
            <li
                className={cnames("stressed-stat", this.props.className)}
                onClick={this.props.onClick}
                data-place="bottom"
                data-tip={this._getCRTip()}
            >
                <span>
                    <span className={cnames("value stat-primary", statusClass)}>
                        {utils.format_number(cr, 2)}
                    </span>
                </span>
                <div className="stat-text">
                    <Translate content="header.collateral_ratio" />
                </div>
            </li>
        );
    }
}
MarginPosition = BindToChainState(MarginPosition);

class ExchangeHeaderCollateral extends React.Component {
    static propTypes = {
        object: ChainTypes.ChainObject.isRequired
    };

    render() {
        let {object, account} = this.props;

        let debtAsset = object.getIn(["call_price", "quote", "asset_id"]);
        let collateralAsset = object.getIn(["call_price", "base", "asset_id"]);

        return (
            <MarginPosition
                debtAsset={debtAsset}
                collateralAsset={collateralAsset}
                account={account}
                {...this.props}
            />
        );
    }
}
ExchangeHeaderCollateral = BindToChainState(ExchangeHeaderCollateral);

export default ExchangeHeaderCollateral;
