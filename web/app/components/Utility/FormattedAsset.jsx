import React from "react";
import {PropTypes, Component} from "react";

import {FormattedNumber} from "react-intl";
import utils from "common/utils";

class FormattedAsset extends Component {
    shouldComponentUpdate(nextProps) {
        let symbol = (this.props.asset && nextProps.asset) ? nextProps.asset.symbol !== this.props.asset.symbol : true;
        return (
            nextProps.amount !== this.props.amount || 
            symbol
            );
    }

    render() {
        let {amount, asset, base, baseamount, decimalOffset} = this.props;
        
        if (!asset) {
            return <span></span>;
        }

        let precision = utils.get_asset_precision(asset.precision);

        let decimals = Math.max(0, asset.precision - decimalOffset); 

        if (base && baseamount) {
            decimals++;
            let baseprecision = utils.get_asset_precision(base.precision);
            return (
                    <span>
                        <FormattedNumber
                            value={amount / precision / (baseamount / baseprecision)}
                            minimumSignificantDigits={decimals}
                            maximumSignificantDigits={decimals}
                        /> {asset.symbol + "/" + base.symbol}
                    </span>
            );
        } else {
            return (
                    <span>
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
    decimalOffset: 0
};

FormattedAsset.propTypes = {
    amount: PropTypes.number.isRequired,
    base: PropTypes.object,
    asset: PropTypes.object.isRequired,
    exact_amount: PropTypes.bool,
    decimalOffset: PropTypes.number
};

export default FormattedAsset;

