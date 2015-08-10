import React from "react";
import ChainComponent from "../Utility/ChainComponent"
import {FormattedNumber} from "react-intl";
import utils from "common/utils";
import {PropTypes} from "react";
import {Link} from "react-router";
import {ObjectIdType} from "./CustomTypes.js";

/**
 *  Given an amount and an asset, render it with proper precision
 *
 *  Expected Properties:
 *     asset:  asset id, which will be fetched from the 
 *     base:   optional asset id if this should display a price
 *     amount: the ammount of asset
 *
 */
class FormattedAsset extends ChainComponent {
    render() {
        let {amount, baseamount, decimalOffset, color} = this.props;
        let {asset, base} = this.state

        if (!asset) {
            return <span></span>;
        }
        if( 'toJS' in asset ) asset = asset.toJS()
        if( base && 'toJS' in base ) base = base.toJS()

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
                        <Link to="asset" params={{ symbol: asset.symbol }}> {asset.symbol}</Link> 
                          + "/" 
                        <Link to="asset" params={{ symbol: base.symbol }}>{base.symbol}</Link> 
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
                        <Link to="asset" params={{ symbol: asset.symbol }}> {asset.symbol} </Link>
                    </span>
            );
        }
    }
}

FormattedAsset.defaultProps = {
    amount: 0,
    base: null,
    asset: null,
    exact_amount: false,
    decimalOffset: 0,
    color: null
};

FormattedAsset.propTypes = {
    amount: PropTypes.number.isRequired,
    base: PropTypes.string,
    asset: ObjectIdType.isRequired,
    exact_amount: PropTypes.bool,
    decimalOffset: PropTypes.number,
    color: PropTypes.string
};

export default FormattedAsset;

