import React from "react";
import {PropTypes, Component} from "react";

import {FormattedNumber} from "react-intl";
import utils from "common/utils";

class FormattedAsset extends Component {
    shouldComponentUpdate(nextProps) {
       return true
          /*
        let symbol = (this.props.asset && nextProps.asset) ?
            nextProps.asset.symbol !== this.props.asset.symbol : true;
        return (
            nextProps.amount !== this.props.amount || 
            symbol
            );
            */
    }

    render() {
        let {amount, asset, base, baseamount, decimalOffset, color} = this.props;
        console.log( "props: ", this.props )
        
        if (!asset) {
            return <span></span>;
        }
        if( 'toJS' in asset )
           asset = asset.toJS()

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
                        /> {asset.symbol + "/" + base.symbol}
                    </span>
            );
        } else {
            return (
                    <span className={colorClass}>
                        <FormattedNumber 
                            value={this.props.exact_amount ? amount : amount / precision}
                            minimumFractionDigits={decimals}
                            maximumFractionDigits={decimals}
                        /> {asset.symbol}
                    </span>
            );
        }
    }
}

FormattedAsset.defaultProps = {
    amount: 0,
    base: undefined,
    asset: undefined,
    exact_amount: false,
    decimalOffset: 0,
    color: null
};

FormattedAsset.propTypes = {
    amount: PropTypes.number.isRequired,
    base: PropTypes.object,
    asset: PropTypes.object.isRequired,
    exact_amount: PropTypes.bool,
    decimalOffset: PropTypes.number,
    color: PropTypes.string
};

export default FormattedAsset;

