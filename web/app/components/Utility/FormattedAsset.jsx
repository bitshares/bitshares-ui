import React from "react";
import ChainComponent from "../Utility/ChainComponent"
import {FormattedNumber} from "react-intl";
import utils from "common/utils";
import {PropTypes} from "react";
import {Link} from "react-router";
import ChainTypes from "./ChainTypes";
import BindToChainState from "./BindToChainState";

/**
 *  Given an amount and an asset, render it with proper precision
 *
 *  Expected Properties:
 *     asset:  asset id, which will be fetched from the 
 *     base:   optional asset id if this should display a price
 *     amount: the ammount of asset
 *
 */

@BindToChainState()
class FormattedAsset extends React.Component {

    static propTypes = {
        amount: PropTypes.number.isRequired,
        base: ChainTypes.ChainObject,
        asset: ChainTypes.ChainObject.isRequired,
        exact_amount: PropTypes.bool,
        decimalOffset: PropTypes.number,
        color: PropTypes.string,
        string: PropTypes.string,
        hide_asset: PropTypes.bool
    };

    static defaultProps = {
        decimalOffset: 0
    };

    render() {
        let {amount, baseamount, decimalOffset, color, asset, base} = this.props;

        if( asset.toJS ) asset = asset.toJS()
        if( base && base.toJS ) base = base.toJS()

        let colorClass = color ? "facolor-" + color : "";

        let precision = utils.get_asset_precision(asset.precision);

        let decimals = Math.max(0, asset.precision - decimalOffset);

        if (base && baseamount) {
            decimals++;
            let baseprecision = utils.get_asset_precision(base.precision);
            return (
                    <span className={colorClass}>
                        <FormattedNumber
                            value={amount / precision / (baseamount / baseprecision)}
                            minimumSignificantDigits={decimals}
                            maximumSignificantDigits={decimals}
                        />
                        {asset.symbol}
                          + "/" 
                        {base.symbol}
                    </span>
            );
        } else {
            return (
                    <span className={colorClass}>
                        <FormattedNumber 
                            value={this.props.exact_amount ? amount : amount / precision}
                            minimumFractionDigits={decimals}
                            maximumFractionDigits={decimals}
                        />
                        {this.props.hide_asset ? null : <span className="currency">{"\u00a0" + asset.symbol}</span>}
                    </span>
            );
        }
    }
}

export default FormattedAsset;

