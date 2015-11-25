import React from "react";
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
 *     amount: the ammount of asset
 *
 */

@BindToChainState()
class FormattedAsset extends React.Component {

    static propTypes = {
        amount: PropTypes.number.isRequired,
        asset: ChainTypes.ChainAsset.isRequired,
        exact_amount: PropTypes.bool,
        decimalOffset: PropTypes.number,
        color: PropTypes.string,
        hide_asset: PropTypes.bool,
        hide_amount: PropTypes.bool,
        asPercentage: PropTypes.bool
    };

    static defaultProps = {
        decimalOffset: 0,
        hide_asset: false,
        hide_amount: false,
        asPercentage: false
    };

    render() {
        let {amount, decimalOffset, color, asset, hide_asset, hide_amount, asPercentage} = this.props;

        if( asset && asset.toJS ) asset = asset.toJS();

        let colorClass = color ? "facolor-" + color : "";

        let precision = utils.get_asset_precision(asset.precision);

        let decimals = Math.max(0, asset.precision - decimalOffset);

        if (hide_amount) {
            colorClass += " no-amount";
        }

        if (asPercentage) {
            let supply = parseInt(asset.dynamic.current_supply, 10);
            let percent = utils.format_number((amount / supply) * 100, 4);
            return (
                <span className={colorClass}>
                    {percent}%
                </span>
            )

        }

        return (
                <span className={colorClass}  >
                {!hide_amount ?
                  <FormattedNumber
                    value={this.props.exact_amount ? amount : amount / precision}
                    minimumFractionDigits={0}
                    maximumFractionDigits={decimals}
                    />
                : null}
                {hide_asset ? null : <span className="currency">{"\u00a0" + asset.symbol}</span>}
                </span>
        );
    }
}

export default FormattedAsset;

